import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal";
import "../../assets/estilos/login.css";
import { API_URL } from "../../api";
import { useI18n } from "../../i18n/I18nContext";
import {
    sanitizeSingleLine,
    validateEmail,
    validatePassword
} from "../../utils/validation";
import { storeAuthSession } from "../../auth/authFetch";
import { getApiErrorMessage, readApiJson } from "../../utils/apiErrors";

const INSTITUTIONAL_DOMAIN = "@utnay.edu.mx";

const getLoginEmail = (value) => {
    const normalized = sanitizeSingleLine(value).toLowerCase();
    return normalized.includes("@") ? normalized : `${normalized}${INSTITUTIONAL_DOMAIN}`;
};

function Login({ isOpen, onClose }) {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();
    const { t } = useI18n();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const loginEmail = getLoginEmail(correo);

        const errors = {
            correo: validateEmail(loginEmail, t, { institutional: true }),
            password: validatePassword(password, t, { minLength: 1 })
        };
        Object.keys(errors).forEach((field) => {
            if (!errors[field]) delete errors[field];
        });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/Login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    correo: loginEmail,
                    password: password,
                }),
            });

            if (!response.ok) {
                setError(response.status === 401
                    ? t("auth.invalidCredentials")
                    : await getApiErrorMessage(response, t("common.requestFailed")));
                return;
            }

            const data = await readApiJson(response, t("common.requestFailed"));
            if (!storeAuthSession(data)) {
                setError(t("common.requestFailed"));
                return;
            }

            navigate("/Panel");
            onClose();
        } catch (err) {
            setError(err instanceof TypeError
                ? t("auth.connectionError")
                : err.message || t("common.requestFailed"));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="derCont">
                <h2>{t("auth.welcome")}</h2>
                <p id="sub">{t("auth.signInPrompt")}</p>

                <div className="formulario">
                    <form onSubmit={handleSubmit}>
                        <label>{t("auth.email")}:</label>
                        <div className={`login-email-field ${fieldErrors.correo ? "input-error" : ""}`}>
                            <input
                                type="text"
                                inputMode="email"
                                autoComplete="username"
                                placeholder="usuario"
                                value={correo}
                                onChange={(e) => {
                                    setCorreo(e.target.value);
                                    setFieldErrors((current) => ({ ...current, correo: "" }));
                                }}
                                required
                                maxLength={254}
                                aria-invalid={!!fieldErrors.correo}
                                aria-describedby={correo.includes("@") ? undefined : "login-email-domain"}
                            />
                            {!correo.includes("@") && (
                                <span id="login-email-domain">{INSTITUTIONAL_DOMAIN}</span>
                            )}
                        </div>
                        {fieldErrors.correo && <small className="field-error">{fieldErrors.correo}</small>}

                        <label>{t("auth.password")}:</label>
                        <input
                            type="password"
                            placeholder={t("auth.passwordPlaceholder")}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setFieldErrors((current) => ({ ...current, password: "" }));
                            }}
                            required
                            maxLength={72}
                            aria-invalid={!!fieldErrors.password}
                            className={fieldErrors.password ? "input-error" : ""}
                        />
                        {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}

                        <button type="submit">
                            {t("auth.signIn")}
                        </button>
                    </form>

                    {error && <p style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>{error}</p>}

                    {/*
                    Recuperacion de contrasena pendiente de implementar.
                    <p>
                        {t("auth.forgotPassword")}{" "}
                        <a href="#">{t("auth.recoverPassword")}</a>
                    </p>
                    */}
                </div>
            </div>
        </Modal>
    );
}

export default Login;
