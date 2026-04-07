import { useState } from "react";

import "../assets/estilos/layout.css";
import utnLogo from "../assets/imagenes/UTN.png";
import utlogo_deg from "../assets/imagenes/utlogo_degradado.png";

function Layout({ children, variant = "default" }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const isAuthenticated = !!usuario;

    return (
        <>
            <header className={variant === "home" ? "header-home" : "header-default"}>
                <div className="logo-cont">
                    <img src={utnLogo} alt="UTN" />
                    <label id="UTlabel">Universidad Tecnológica de Nayarit</label>
                </div>

                <button
                    className="menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    ☰
                </button>

                <nav className={`menu ${menuOpen ? "open" : ""}`}>
                    <ul>

                        {isAuthenticated && (
                            <>
                                <li><a href="/Panel">Inicio</a></li>
                                <li><a href="/tutoria">Tutoría</a></li>
                            </>
                        )}

                        {!isAuthenticated && (
                            <>
                                <li><a href="/">Inicio</a></li>
                            </>
                        )}

                        <li><a href="/Acerca-de">Acerca de</a></li>

                        {isAuthenticated && (
                            <li>
                                <button className="CerrarSesion-btn"
                                    onClick={() => {
                                        localStorage.removeItem("usuario");
                                        window.location.href = "/";
                                    }}
                                >
                                    Cerrar sesión
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>
            </header>

            {children}

            <footer>
                <div className="footer-cont">
                    <div className="footerC">
                        <img id="utlogo_deg" src={utlogo_deg} alt="UTN_logo" />
                    </div>

                    <div className="footerC">
                        <h3>Contacto</h3>
                        <p>
                            Dirección: Carretera Tepic-Compostela Km 9, C.P. 63173, Nayarit,
                            México.
                        </p>
                        <p>Teléfono: (311) 211 9800</p>
                        <p>Email: contacto@utnay.edu.mx</p>
                    </div>

                    <div className="footerC">
                        <h3>Enlaces</h3>
                        <a href="https://www.facebook.com/UTNAY/" target="_blank" rel="noreferrer">
                            Facebook
                        </a>
                        <a href="https://utnay.edu.mx/" target="_blank" rel="noreferrer">
                            Sitio oficial
                        </a>
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

export default Layout;