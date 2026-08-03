import { useState } from "react";
import Modal from "../Modal";
import { API_URL } from "../../api";
import { useI18n } from "../../i18n/I18nContext";
import { validatePassword } from "../../utils/validation";
import { storeAuthSession } from "../../auth/authFetch";
import { getAuthSession } from "../../auth/session";
import { getApiErrorMessage, readApiJson } from "../../utils/apiErrors";

function CambiarContra({ isOpen, obligatorio, onClose }) {
    const [contrasenaActual, setContrasenaActual] = useState("");
    const [nuevaContra, setNuevaContra] = useState("");
    const [confirmarContra, setConfirmarContra] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const { t } = useI18n();

    const resetAndClose = () => {
        setContrasenaActual("");
        setNuevaContra("");
        setConfirmarContra("");
        setError("");
        setFieldErrors({});
        onClose?.();
    };

    if (!isOpen) return null;

    const usuario = getAuthSession()?.user;

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

        if (!usuario) {
            setError(t("common.requestFailed"));
            return;
        }

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
                const message = await getApiErrorMessage(response, t("common.requestFailed"));
                if (message.startsWith("[CONTRASENA_ACTUAL_INCORRECTA]")) {
                    setError(t("auth.currentPasswordIncorrect"));
                } else {
                    setError(message);
                }
                return;
            }

            const data = await readApiJson(response, t("common.requestFailed"));
            if (!storeAuthSession(data)) {
                setError(t("common.requestFailed"));
                return;
            }

            setNuevaContra("");
            setConfirmarContra("");
            setError("");

            resetAndClose();

        } catch (err) {
            setError(err instanceof TypeError
                ? t("auth.connectionError")
                : err.message || t("common.requestFailed"));
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
