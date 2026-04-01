import { useState } from "react";

import "../assets/estilos/layout.css";
import utnLogo from "../assets/imagenes/UTN.png";
import utlogo_deg from "../assets/imagenes/utlogo_degradado.png";

function Layout({ children, variant = "default" }) {
    const [menuOpen, setMenuOpen] = useState(false);
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
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/tutoria">Tutoría</a></li>
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

export default Layout;