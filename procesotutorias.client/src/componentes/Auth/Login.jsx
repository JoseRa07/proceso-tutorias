import "../../assets/estilos/login.css";

function Login({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <button className="close-btn" onClick={onClose}>X</button>

                <div className="derCont">
                    <h2>BIENVENIDO</h2>
                    <p id="sub">porfavor inicie sesión</p>

                    <div className="formulario">
                        <form>
                            <label>Usuario:</label>
                            <input
                                type="text"
                                placeholder="Ingresa tu usuario..."
                                required
                            />

                            <label>Contraseña:</label>
                            <input
                                type="password"
                                placeholder="Ingresa tu contraseña..."
                                required
                            />

                            <button type="submit">
                                Iniciar Sesión
                            </button>
                        </form>

                        <p>
                            ¿Olvidaste tu contraseña?{" "}
                            <a href="#">Recuperar contraseña</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;