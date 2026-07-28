const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;
const PATH_SEQUENCE_PATTERN = /(?:\.\.[\\/]|[\\/]{2,})/;
const PERSON_NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;
const IDENTIFIER_PATTERN = /^[\p{L}\p{M}\p{N}_-]+$/u;
const ROLE_PATTERN = /^[\p{L}\p{M}]+(?:[ _-][\p{L}\p{M}]+)*$/u;
const EMAIL_PATTERN = /^[^\s@/\\]+@[^\s@/\\]+\.[^\s@/\\]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const hasControlCharacter = (value) =>
    Array.from(String(value ?? "")).some((character) => {
        const code = character.codePointAt(0);
        return code === 127 || (code < 32 && code !== 9 && code !== 10 && code !== 13);
    });

export const getLocalDateValue = (date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const sanitizeSingleLine = (value) =>
    String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();

export const sanitizeMultiline = (value) =>
    String(value ?? "").normalize("NFC").replace(/\r\n?/g, "\n").trim();

export const hasUnsafeText = (value) => {
    const text = String(value ?? "");
    return EMOJI_PATTERN.test(text) || hasControlCharacter(text) || PATH_SEQUENCE_PATTERN.test(text);
};

export const validatePersonName = (value, t, { required = true, maxLength = 80 } = {}) => {
    const text = sanitizeSingleLine(value);
    if (!text) return required ? t("common.validation.required") : "";
    if (text.length > maxLength) return t("common.validation.maxLength", { count: maxLength });
    if (hasUnsafeText(text) || !PERSON_NAME_PATTERN.test(text)) return t("common.validation.personName");
    return "";
};

export const validateEmail = (value, t, { institutional = false } = {}) => {
    const text = sanitizeSingleLine(value).toLowerCase();
    if (!text) return t("common.validation.required");
    if (text.length > 254 || hasUnsafeText(text) || !EMAIL_PATTERN.test(text)) {
        return t("common.validation.email");
    }
    if (institutional && !text.endsWith("@utnay.edu.mx")) return t("auth.institutionalEmailOnly");
    return "";
};

export const validatePhone = (value, t, { required = false } = {}) => {
    const text = sanitizeSingleLine(value);
    if (!text) return required ? t("common.validation.required") : "";
    return /^\d{10}$/.test(text) ? "" : t("common.validation.phone");
};

export const validatePassword = (value, t, { minLength = 6, maxLength = 72 } = {}) => {
    const text = String(value ?? "");
    if (!text) return t("common.validation.required");
    if (text.length < minLength) return t("common.validation.minLength", { count: minLength });
    if (text.length > maxLength) return t("common.validation.maxLength", { count: maxLength });
    if (EMOJI_PATTERN.test(text) || hasControlCharacter(text)) {
        return t("common.validation.noEmojiOrControl");
    }
    return "";
};

export const validateIdentifier = (
    value,
    t,
    { required = true, maxLength = 40, roleName = false } = {}
) => {
    const text = sanitizeSingleLine(value);
    if (!text) return required ? t("common.validation.required") : "";
    if (text.length > maxLength) return t("common.validation.maxLength", { count: maxLength });
    const pattern = roleName ? ROLE_PATTERN : IDENTIFIER_PATTERN;
    return hasUnsafeText(text) || !pattern.test(text) ? t("common.validation.identifier") : "";
};

export const validatePositiveInteger = (value, t, { required = true } = {}) => {
    if (value === "" || value === null || value === undefined) {
        return required ? t("common.validation.required") : "";
    }
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? "" : t("common.validation.positiveInteger");
};

export const validateDate = (
    value,
    t,
    { required = true, min = null, max = null } = {}
) => {
    if (!value) return required ? t("common.validation.required") : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00`))) {
        return t("common.validation.date");
    }
    if (min && value < min) return t("common.validation.dateMin");
    if (max && value > max) return t("common.validation.dateMax");
    return "";
};

export const validateTime = (value, t) =>
    TIME_PATTERN.test(String(value ?? "")) ? "" : t("common.validation.time");

export const validateTimeRange = (start, end, t) => {
    const startError = validateTime(start, t);
    const endError = validateTime(end, t);
    if (startError || endError) return { start: startError, end: endError };
    if (end <= start) return { start: "", end: t("common.validation.timeOrder") };
    return { start: "", end: "" };
};

export const validateFreeText = (
    value,
    t,
    { required = true, maxLength = 1000 } = {}
) => {
    const text = sanitizeMultiline(value);
    if (!text) return required ? t("common.validation.required") : "";
    if (text.length > maxLength) return t("common.validation.maxLength", { count: maxLength });
    return hasUnsafeText(text) ? t("common.validation.noEmojiOrControl") : "";
};

export const validateBackupPath = (value, t) => {
    const text = String(value ?? "").trim();
    if (!text) return t("common.validation.required");
    if (
        text.length > 260 ||
        EMOJI_PATTERN.test(text) ||
        hasControlCharacter(text) ||
        text.includes("/") ||
        text.includes("..") ||
        !/^C:\\Respaldos\\[^\\]+\.json$/i.test(text)
    ) {
        return t("common.validation.backupPath");
    }
    return "";
};

export const validateFutureDateTime = (value, t) => {
    if (!value) return t("common.validation.required");
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return t("common.validation.date");
    return timestamp > Date.now() ? "" : t("common.validation.futureDateTime");
};
