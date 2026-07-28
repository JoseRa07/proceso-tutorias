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

        const errors = {
            correo: validateEmail(correo, t, { institutional: true }),
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
                    correo: sanitizeSingleLine(correo).toLowerCase(),
                    password: password,
                }),
            });

            if (!response.ok) {
                await response.json().catch(() => null);
                setError(t("auth.invalidCredentials"));
                return;
            }

            const data = await response.json();
            storeAuthSession(data);

            navigate("/Panel");
            onClose();
        } catch (err) {
            console.error(err);
            setError(t("auth.connectionError"));
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
                        <input
                            type="email"
                            placeholder="ejemplo@utnay.edu.mx"
                            value={correo}
                            onChange={(e) => {
                                setCorreo(e.target.value);
                                setFieldErrors((current) => ({ ...current, correo: "" }));
                            }}
                            required
                            maxLength={254}
                            aria-invalid={!!fieldErrors.correo}
                            className={fieldErrors.correo ? "input-error" : ""}
                        />
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

                    <p>
                        {t("auth.forgotPassword")}{" "}
                        <a href="#">{t("auth.recoverPassword")}</a>
                    </p>
                </div>
            </div>
        </Modal>
    );
}

export default Login;
