using System.Globalization;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;

namespace ProcesoTutorias.Server.Validation;

public static partial class InputSanitizer
{
    [GeneratedRegex(@"^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex PersonNameRegex();

    [GeneratedRegex(@"^[\p{L}\p{M}\p{N}_\-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex IdentifierRegex();

    [GeneratedRegex(@"^[\p{L}\p{M}]+(?:[ _\-][\p{L}\p{M}]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex RoleNameRegex();

    [GeneratedRegex(@"(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])")]
    private static partial Regex EmojiRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();

    public static string NormalizeSingleLine(string? value)
    {
        return WhitespaceRegex()
            .Replace((value ?? string.Empty).Normalize(NormalizationForm.FormC), " ")
            .Trim();
    }

    public static string NormalizeMultiline(string? value)
    {
        return (value ?? string.Empty)
            .Normalize(NormalizationForm.FormC)
            .Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Trim();
    }

    public static bool HasUnsafeText(string value)
    {
        return EmojiRegex().IsMatch(value) ||
               value.Any(character => char.IsControl(character) && character is not '\n' and not '\t') ||
               value.Contains("../", StringComparison.Ordinal) ||
               value.Contains(@"..\", StringComparison.Ordinal) ||
               value.Contains("//", StringComparison.Ordinal) ||
               value.Contains(@"\\", StringComparison.Ordinal);
    }

    public static string? ValidatePersonName(string? value, string fieldName, int maxLength = 80)
    {
        string text = NormalizeSingleLine(value);
        if (text.Length == 0)
            return $"[CAMPO_REQUERIDO] {fieldName} es obligatorio.";
        if (text.Length > maxLength)
            return $"[CAMPO_LONGITUD] {fieldName} admite como máximo {maxLength} caracteres.";
        if (HasUnsafeText(text) || !PersonNameRegex().IsMatch(text))
            return $"[CAMPO_NOMBRE_INVALIDO] {fieldName} solo admite letras, espacios, apóstrofes y guiones; no admite emojis ni diagonales.";
        return null;
    }

    public static string? ValidateIdentifier(
        string? value,
        string fieldName,
        int maxLength = 40,
        bool roleName = false)
    {
        string text = NormalizeSingleLine(value);
        if (text.Length == 0)
            return $"[CAMPO_REQUERIDO] {fieldName} es obligatorio.";
        if (text.Length > maxLength)
            return $"[CAMPO_LONGITUD] {fieldName} admite como máximo {maxLength} caracteres.";
        Regex pattern = roleName ? RoleNameRegex() : IdentifierRegex();
        if (HasUnsafeText(text) || !pattern.IsMatch(text))
            return $"[CAMPO_IDENTIFICADOR_INVALIDO] {fieldName} contiene caracteres no permitidos.";
        return null;
    }

    public static string? ValidateEmail(string? value)
    {
        string text = NormalizeSingleLine(value).ToLowerInvariant();
        if (text.Length == 0)
            return "[USUARIO_CORREO_REQUERIDO] El correo es obligatorio.";
        if (text.Length > 254 || HasUnsafeText(text) || text.Contains('/') || text.Contains('\\'))
            return "[USUARIO_CORREO_INVALIDO] El correo no tiene un formato válido.";

        try
        {
            var address = new MailAddress(text);
            return address.Address.Equals(text, StringComparison.OrdinalIgnoreCase)
                ? null
                : "[USUARIO_CORREO_INVALIDO] El correo no tiene un formato válido.";
        }
        catch (FormatException)
        {
            return "[USUARIO_CORREO_INVALIDO] El correo no tiene un formato válido.";
        }
    }

    public static string? ValidatePhone(string? value)
    {
        string text = NormalizeSingleLine(value);
        if (text.Length == 0)
            return null;
        return text.Length == 10 && text.All(char.IsAsciiDigit)
            ? null
            : "[USUARIO_TELEFONO_INVALIDO] El teléfono debe contener exactamente 10 dígitos, sin signos ni valores negativos.";
    }

    public static string? ValidatePassword(string? value, int minLength = 6, int maxLength = 72)
    {
        if (string.IsNullOrEmpty(value) || value.All(char.IsWhiteSpace))
            return "[USUARIO_CONTRASENA_REQUERIDA] La contraseña es obligatoria.";
        if (value.Length < minLength || value.Length > maxLength)
            return $"[USUARIO_CONTRASENA_INVALIDA] La contraseña debe tener entre {minLength} y {maxLength} caracteres.";
        if (EmojiRegex().IsMatch(value) || value.Any(char.IsControl))
            return "[USUARIO_CONTRASENA_CARACTERES] La contraseña no admite emojis ni caracteres de control.";
        return null;
    }

    public static string? ValidateFreeText(
        string? value,
        string fieldName,
        int maxLength,
        bool required = true)
    {
        string text = NormalizeMultiline(value);
        if (text.Length == 0)
            return required ? $"[CAMPO_REQUERIDO] {fieldName} es obligatorio." : null;
        if (text.Length > maxLength)
            return $"[CAMPO_LONGITUD] {fieldName} admite como máximo {maxLength} caracteres.";
        if (HasUnsafeText(text))
            return $"[CAMPO_CARACTERES_INVALIDOS] {fieldName} no admite emojis, caracteres de control ni secuencias de ruta.";
        return null;
    }

    public static bool IsPositiveId(int value) => value > 0;

    public static bool TryParseTime(string? value, out TimeOnly time)
    {
        return TimeOnly.TryParseExact(
            value,
            "HH:mm",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out time);
    }
}
