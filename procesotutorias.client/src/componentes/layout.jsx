import { useState } from "react";

import "../assets/estilos/layout.css";
import utnLogo from "../assets/imagenes/UTN.png";
import utlogo_deg from "../assets/imagenes/utlogo_degradado.png";

import DropUpIcon from '@mui/icons-material/ArrowDropUp';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
function Layout({ children, variant = "default" }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const isAuthenticated = !!usuario;

    const [openSubmenu, setOpenSubmenu] = useState(null);

    const toggleSubmenu = (menu) => {
        setOpenSubmenu(openSubmenu === menu ? null : menu);
    };

    const rol = usuario?.id_rol;

    const esAdmin = rol === 1;
    const esAlumno = rol === 2;
    const esTutor = rol === 3;

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
                                <li><a href="/Panel">Panel</a></li>

                                {(esAlumno || esTutor) && (
                                    <li className={`tiene-submenu ${openSubmenu === "tutorias" ? "activo" : ""}`}>
                                        <span onClick={() => toggleSubmenu("tutorias")}>
                                            Tutorías {openSubmenu === "tutorias" ? <DropUpIcon /> : <DropDownIcon />}
                                        </span>
                                        <ul className="submenu">

                                            {(esAlumno || esTutor) && (
                                                <li>
                                                    <a href="/Tutorias">
                                                        {esTutor ? "Gestión de tutorías" : "Historial de tutorías"}
                                                    </a>
                                                </li>
                                            )}

                                            {esTutor && (
                                                <li><a href="/Seguimiento">Seguimiento</a></li>
                                            )}

                                            {(esAlumno || esTutor) && (
                                                <li><a href="/Justificantes">Justificantes</a></li>
                                            )}

                                        </ul>
                                    </li>
                                )}

                                {esAdmin && (
                                    <li className={`tiene-submenu ${openSubmenu === "admin" ? "activo" : ""}`}>
                                        <span onClick={() => toggleSubmenu("admin")}>
                                            Administración {openSubmenu === "admin" ? <DropUpIcon /> : <DropDownIcon />}
                                        </span>
                                        <ul className="submenu">
                                            <li><a href="/Asignacion">Asignación de tutores</a></li>
                                            <li><a href="/Roles">Gestión de roles</a></li>
                                            <li><a href="/Usuarios">Gestión de usuarios</a></li>
                                            <li><a href="/Respaldos">Respaldos</a></li>
                                        </ul>
                                    </li>
                                )}

                                <li className={`tiene-submenu ${openSubmenu === "perfil" ? "activo" : ""}`}>
                                    <span onClick={() => toggleSubmenu("perfil")}>
                                        Perfil {openSubmenu === "perfil" ? <DropUpIcon /> : <DropDownIcon />}
                                    </span>

                                    <ul className="submenu">
                                        <li><a href="/Perfil">Configuración de cuenta</a></li>

                                        <li>
                                            <button
                                                className="CerrarSesion-btn"
                                                onClick={() => {
                                                    localStorage.removeItem("usuario");
                                                    window.location.href = "/";
                                                }}
                                            >
                                                Cerrar sesión
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        )}

                        {!isAuthenticated && (
                            <>
                                <li><a href="/">Inicio</a></li>
                            </>
                        )}

                        <li><a href="/Acerca-de">Acerca de</a></li>
                    </ul>
                </nav>
            </header>

            <div className={variant === "home" ? "" : "main-content"}>
                {children}
            </div>

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