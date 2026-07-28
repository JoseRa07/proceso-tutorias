import { useState } from "react";
import Modal from "../Modal";
import { API_URL } from "../../api";
import { useI18n } from "../../i18n/I18nContext";
import { validatePassword } from "../../utils/validation";
import { storeAuthSession } from "../../auth/authFetch";

function CambiarContra({ isOpen, obligatorio, onClose }) {
    const [contrasenaActual, setContrasenaActual] = useState("");
    const [nuevaContra, setNuevaContra] = useState("");
    const [confirmarContra, setConfirmarContra] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const { locale, t } = useI18n();

    const resetAndClose = () => {
        setContrasenaActual("");
        setNuevaContra("");
        setConfirmarContra("");
        setError("");
        setFieldErrors({});
        onClose?.();
    };

    if (!isOpen) return null;

    const usuario = JSON.parse(localStorage.getItem("usuario"));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const errors = {
            contrasenaActual: !obligatorio && !contrasenaActual
                ? t("common.validation.required")
                : "",
            nuevaContra: validatePassword(nuevaContra, t),
            confirmarContra: validatePassword(confirmarContra, t)
        };
        if (!errors.confirmarContra && nuevaContra !== confirmarContra) {
            errors.confirmarContra = t("common.validation.passwordMatch");
        }
        Object.keys(errors).forEach((field) => {
            if (!errors[field]) delete errors[field];
        });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/Login/cambiar-contra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    idUsuario: usuario.id_usuario,
                    contrasenaActual: obligatorio ? null : contrasenaActual,
                    nuevaContra,
                    confirmarContra,
                }),
            });

            if (!response.ok) {
                const result = await response.json().catch(() => null);
                if (result?.message?.startsWith("[CONTRASENA_ACTUAL_INCORRECTA]")) {
                    setError(t("auth.currentPasswordIncorrect"));
                } else {
                    setError(locale === "es-MX" && result?.message
                        ? result.message
                        : t("common.requestFailed"));
                }
                return;
            }

            const data = await response.json();
            if (!storeAuthSession(data)) {
                setError(t("common.requestFailed"));
                return;
            }

            setNuevaContra("");
            setConfirmarContra("");
            setError("");

            resetAndClose();

        } catch (err) {
            console.error(err);
            setError(t("auth.connectionError"));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={obligatorio ? null : resetAndClose}>
            <div className="derCont">
                <h2>{t("auth.changePassword")}</h2>

                <div className="formulario">
                    <form onSubmit={handleSubmit}>
                        {!obligatorio && (
                            <>
                                <label>{t("auth.currentPassword")}:</label>
                                <input
                                    type="password"
                                    value={contrasenaActual}
                                    onChange={(e) => {
                                        setContrasenaActual(e.target.value);
                                        setFieldErrors((current) => ({
                                            ...current,
                                            contrasenaActual: ""
                                        }));
                                    }}
                                    required
                                    maxLength={72}
                                    autoComplete="current-password"
                                    aria-invalid={!!fieldErrors.contrasenaActual}
                                    className={fieldErrors.contrasenaActual ? "input-error" : ""}
                                />
                                {fieldErrors.contrasenaActual && (
                                    <small className="field-error">
                                        {fieldErrors.contrasenaActual}
                                    </small>
                                )}
                            </>
                        )}

                        <label>{t("auth.newPassword")}:</label>
                        <input
                            type="password"
                            value={nuevaContra}
                            onChange={(e) => {
                                setNuevaContra(e.target.value);
                                setFieldErrors((current) => ({ ...current, nuevaContra: "" }));
                            }}
                            required
                            minLength={6}
                            maxLength={72}
                            autoComplete="new-password"
                            aria-invalid={!!fieldErrors.nuevaContra}
                            className={fieldErrors.nuevaContra ? "input-error" : ""}
                        />
                        {fieldErrors.nuevaContra && <small className="field-error">{fieldErrors.nuevaContra}</small>}

                        <label>{t("auth.confirmPassword")}:</label>
                        <input
                            type="password"
                            value={confirmarContra}
                            onChange={(e) => {
                                setConfirmarContra(e.target.value);
                                setFieldErrors((current) => ({ ...current, confirmarContra: "" }));
                            }}
                            required
                            minLength={6}
                            maxLength={72}
                            autoComplete="new-password"
                            aria-invalid={!!fieldErrors.confirmarContra}
                            className={fieldErrors.confirmarContra ? "input-error" : ""}
                        />
                        {fieldErrors.confirmarContra && <small className="field-error">{fieldErrors.confirmarContra}</small>}

                        <button type="submit">{t("auth.confirm")}</button>
                    </form>

                    {error && <p className="error">{error}</p>}
                </div>
            </div>
        </Modal>
    );
}

export default CambiarContra;
