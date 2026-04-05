import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Modal from "../Modal";
import "../../assets/estilos/login.css";
import { API_URL } from "../../api";

function Login({ isOpen, onClose }) {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/Auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    correo,
                    contrasena,
                }),
            });

            if (!response.ok) {
                const msg = await response.text();
                setError(msg);
                return;
            }

            const data = await response.json();

            console.log("Login exitoso");

            navigate("/panel");

            localStorage.setItem("usuario", JSON.stringify(data));

            onClose();
        } catch (err) {
            console.error(err);
            setError("Error al conectar con el servidor");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="derCont">
                <h2>BIENVENIDO</h2>
                <p id="sub">porfavor inicie sesión</p>

                <div className="formulario">
                    <form onSubmit={handleSubmit}>
                        <label>Usuario:</label>
                        <input
                            type="text"
                            placeholder="Ingresa tu correo..."
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />

                        <label>Contraseña:</label>
                        <input
                            type="password"
                            placeholder="Ingresa tu contraseña..."
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                        />

                        <button type="submit">
                            Iniciar Sesión
                        </button>
                    </form>

                    {error && <p className="error">{error}</p>}

                    <p>
                        ¿Olvidaste tu contraseña?{" "}
                        <a href="#">Recuperar contraseña</a>
                    </p>
                </div>
            </div>
        </Modal>
    );
}

export default Login;