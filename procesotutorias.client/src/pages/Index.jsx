import "../assets/estilos/layout.css";
import "../assets/estilos/inicio.css";
import "../assets/estilos/login.css";

import utnLogo from "../assets/imagenes/UTN.png";

function Index() {
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
                <div className="inicio-cont">
                    <div className="cont">
                        <h1>Bienvenido al Sistema de Tutorías</h1>
                        <div>
                            <a href="/login" className="btn">
                                Iniciar Sesión
                            </a>
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

export default Index;