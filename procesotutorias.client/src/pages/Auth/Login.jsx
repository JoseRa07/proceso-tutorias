import "../../assets/estilos/layout.css";
import "../../assets/estilos/login.css";

import utnLogo from "../../assets/imagenes/UTN.png";

function Login() {
    return (
        <>
            <header>
                <img src={utnLogo} alt="UTN" />
                <h1>Universidad Tecnológica de Nayarit</h1>

                <nav className="menu">
                    <ul>
                        <li>
                            <a href="/">Inicio</a>
                        </li>
                        <li>
                            <a href="/tutoria">Tutoría</a>
                        </li>
                    </ul>
                </nav>
            </header>

            <div className="container">
                <div className="inicioDeSesion">
                    <div className="imgI"></div>

                    <div className="derCont">
                        <h1>BIENVENIDO DE NUEVO</h1>

                        <div className="formulario">
                            <form>
                                <label>Usuario:</label>
                                <input
                                    type="text"
                                    id="usuario"
                                    name="usuario"
                                    placeholder="Ingresa tu usuario..."
                                    required
                                />

                                <label>Contraseña:</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Ingresa tu contraseña..."
                                    required
                                />

                                <button className="btn" type="submit">
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

            <footer>
                <div className="footer-cont">
                    <div className="footerC">
                        <h3>Contacto</h3>
                        <p>
                            Dirección: Carretera Tepic-Compostela Km 9, C.P. 63173, Nayarit,
                            México.
                        </p>
                        <p>Teléfono: (311) 211 9400</p>
                        <p>Email: contacto@utnay.edu.mx</p>
                    </div>

                    <div className="footerC">
                        <h3>Redes Sociales</h3>
                        <a href="#" target="_blank" rel="noreferrer">
                            Facebook
                        </a>
                        <a href="#" target="_blank" rel="noreferrer">
                            Twitter
                        </a>
                        <a href="#" target="_blank" rel="noreferrer">
                            Instagram
                        </a>
                    </div>

                    <div className="footerC">
                        <h3>Enlaces Rápidos</h3>
                    </div>
                </div>

                <div className="footerF">
                    <p>
                        © 2023 Universidad Tecnológica de Nayarit. Todos los derechos
                        reservados.
                    </p>
                </div>
            </footer>
        </>
    );
}

export default Login;