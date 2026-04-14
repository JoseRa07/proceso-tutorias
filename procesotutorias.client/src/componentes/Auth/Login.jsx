import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal";
import "../../assets/estilos/login.css";
import { API_URL } from "../../api";

function Login({ isOpen, onClose }) {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState(""); // Cambiado a 'password' para el DTO
    const [error, setError] = useState("");
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Limpiar errores previos

        try {
            // Rúbrica: Flujo completo de login
            const response = await fetch(`${API_URL}/Login`, { // Usamos el nuevo controlador
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
                const errorData = await response.json();
                setError(errorData.message || "Credenciales incorrectas");
                return;
            }

            const data = await response.json();

            // Rúbrica: Seguridad en almacenamiento del token
            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", JSON.stringify(data.user));

            console.log("Login exitoso, token guardado");

            // Rúbrica: Redirección de usuarios autenticados
            navigate("/Panel");

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
                <p id="sub">Por favor inicie sesión</p>

                <div className="formulario">
                    <form onSubmit={handleSubmit}>
                        <label>Correo Electrónico:</label>
                        <input
                            type="email"
                            placeholder="tu@correo.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />

                        <label>Contraseña:</label>
                        <input
                            type="password"
                            placeholder="Ingresa tu contraseña..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="submit">
                            Iniciar Sesión
                        </button>
                    </form>

                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

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