import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal";
import "../../assets/estilos/login.css";
import { API_URL } from "../../api";
import { useI18n } from "../../i18n/I18nContext";

function Login({ isOpen, onClose }) {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { t } = useI18n();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!correo.endsWith("@utnay.edu.mx")) {
            setError(t("auth.institutionalEmailOnly"));
            return;
        }

        try {
            const response = await fetch(`${API_URL}/Login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    correo: correo,
                    password: password,
                }),
            });

            if (!response.ok) {
                await response.json().catch(() => null);
                setError(t("auth.invalidCredentials"));
                return;
            }

            const data = await response.json();

            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", JSON.stringify(data.user));

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
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />

                        <label>{t("auth.password")}:</label>
                        <input
                            type="password"
                            placeholder={t("auth.passwordPlaceholder")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

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
