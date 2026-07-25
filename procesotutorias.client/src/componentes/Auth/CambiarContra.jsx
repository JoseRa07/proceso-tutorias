import { useState } from "react";
import Modal from "../Modal";
import { API_URL } from "../../api";
import { useI18n } from "../../i18n/I18nContext";

function CambiarContra({ isOpen, obligatorio, onClose }) {
    const [nuevaContra, setNuevaContra] = useState("");
    const [confirmarContra, setConfirmarContra] = useState("");
    const [error, setError] = useState("");
    const { locale, t } = useI18n();

    if (!isOpen) return null;

    const usuario = JSON.parse(localStorage.getItem("usuario"));

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/Login/cambiar-contra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    idUsuario: usuario.id_usuario,
                    nuevaContra,
                    confirmarContra,
                }),
            });

            if (!response.ok) {
                const msg = await response.text();
                setError(locale === "es-MX" && msg ? msg : t("common.requestFailed"));
                return;
            }

            const updatedUser = {
                ...usuario,
                req_cambio_contra: false
            };

            localStorage.setItem("usuario", JSON.stringify(updatedUser));

            setNuevaContra("");
            setConfirmarContra("");
            setError("");

            if (onClose) onClose();

        } catch (err) {
            console.error(err);
            setError(t("auth.connectionError"));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={obligatorio ? null : onClose}>
            <div className="derCont">
                <h2>{t("auth.changePassword")}</h2>

                <div className="formulario">
                    <form onSubmit={handleSubmit}>
                        <label>{t("auth.newPassword")}:</label>
                        <input
                            type="password"
                            value={nuevaContra}
                            onChange={(e) => setNuevaContra(e.target.value)}
                            required
                        />

                        <label>{t("auth.confirmPassword")}:</label>
                        <input
                            type="password"
                            value={confirmarContra}
                            onChange={(e) => setConfirmarContra(e.target.value)}
                            required
                        />

                        <button type="submit">{t("auth.confirm")}</button>
                    </form>

                    {error && <p className="error">{error}</p>}
                </div>
            </div>
        </Modal>
    );
}

export default CambiarContra;
