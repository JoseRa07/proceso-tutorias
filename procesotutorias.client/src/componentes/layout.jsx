import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import "../assets/estilos/layout.css";
import utnLogo from "../assets/imagenes/UTN.png";
import utlogoDeg from "../assets/imagenes/utlogo_degradado.png";

import DropUpIcon from "@mui/icons-material/ArrowDropUp";
import DropDownIcon from "@mui/icons-material/ArrowDropDown";
import LanguageIcon from "@mui/icons-material/Language";
import { useI18n } from "../i18n/I18nContext";
import { useAuthSession } from "../auth/session";
import { logout } from "../auth/authFetch";
import CambiarContra from "./Auth/CambiarContra";
import Alerta from "./Alerta";

function Layout({ children, variant = "default", contentClassName = "" }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [showCambiarPass, setShowCambiarPass] = useState(false);
    const [showPasswordNotice, setShowPasswordNotice] = useState(false);
    const navigate = useNavigate();
    const { locale, setLocale, supportedLocales, t } = useI18n();
    const session = useAuthSession();
    const usuario = session?.user;
    const isAuthenticated = !!usuario;
    const rol = usuario?.id_rol;

    const esAdmin = rol === 1;
    const esAlumno = rol === 2;
    const esTutor = rol === 3;

    useEffect(() => {
        if (!usuario?.req_cambio_contra) return;

        const noticeTimer = window.setTimeout(() => {
            setShowPasswordNotice(true);
        }, 0);
        const modalTimer = window.setTimeout(() => {
            setShowPasswordNotice(false);
            setShowCambiarPass(true);
        }, 5000);

        return () => {
            window.clearTimeout(noticeTimer);
            window.clearTimeout(modalTimer);
        };
    }, [usuario?.req_cambio_contra]);

    const cerrarMenu = () => setMenuOpen(false);

    const toggleSubmenu = (menu) => {
        setOpenSubmenu(openSubmenu === menu ? null : menu);
    };

    const cerrarSesion = async () => {
        cerrarMenu();
        await logout();
        navigate("/");
    };

    const abrirCambioContrasena = () => {
        setOpenSubmenu(null);
        setShowPasswordNotice(false);
        setShowCambiarPass(true);
        cerrarMenu();
    };

    const cambiarIdioma = (nextLocale) => {
        setLocale(nextLocale);
        setOpenSubmenu(null);
        cerrarMenu();
    };

    return (
        <>
            <header className={variant === "home" ? "header-home" : "header-default"}>
                <div className="logo-cont">
                    <img src={utnLogo} alt="UTN" />
                    <label id="UTlabel">{t("common.university")}</label>
                </div>

                <button
                    className="menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={t("navigation.openMenu")}
                >
                    ☰
                </button>

                <nav className={`menu ${menuOpen ? "open" : ""}`}>
                    <ul>
                        {isAuthenticated && (
                            <>
                                <li><NavLink to="/Panel" onClick={cerrarMenu}>{t("navigation.panel")}</NavLink></li>

                                {(esAlumno || esTutor) && (
                                    <li className={`tiene-submenu ${openSubmenu === "tutorias" ? "activo" : ""}`}>
                                        <span
                                            onClick={() => toggleSubmenu("tutorias")}
                                            aria-expanded={openSubmenu === "tutorias"}
                                            aria-controls="submenu-tutorias"
                                        >
                                            {t("navigation.tutoring")} {openSubmenu === "tutorias" ? <DropUpIcon /> : <DropDownIcon />}
                                        </span>
                                        <ul className="submenu" id="submenu-tutorias">
                                            <li>
                                                <NavLink to="/Tutorias" onClick={cerrarMenu}>
                                                    {esTutor ? t("navigation.manageTutoring") : t("navigation.tutoringHistory")}
                                                </NavLink>
                                            </li>
                                            <li><NavLink to="/Justificantes" onClick={cerrarMenu}>{t("navigation.excuses")}</NavLink></li>
                                            {esTutor && (
                                                <li>
                                                    <NavLink to="/Seguimientos" onClick={cerrarMenu}>
                                                        {t("navigation.followup")}
                                                    </NavLink>
                                                </li>
                                            )}
                                        </ul>
                                    </li>
                                )}

                                {esAdmin && (
                                    <li className={`tiene-submenu ${openSubmenu === "admin" ? "activo" : ""}`}>
                                        <span
                                            onClick={() => toggleSubmenu("admin")}
                                            aria-expanded={openSubmenu === "admin"}
                                            aria-controls="submenu-admin"
                                        >
                                            {t("navigation.administration")} {openSubmenu === "admin" ? <DropUpIcon /> : <DropDownIcon />}
                                        </span>
                                        <ul className="submenu" id="submenu-admin">
                                            <li><NavLink to="/Gestion-de-tutores" onClick={cerrarMenu}>{t("navigation.tutorAdministration")}</NavLink></li>
                                            <li><NavLink to="/Roles" onClick={cerrarMenu}>{t("navigation.roleManagement")}</NavLink></li>
                                            <li><NavLink to="/Usuarios" onClick={cerrarMenu}>{t("navigation.userManagement")}</NavLink></li>
                                            <li><NavLink to="/Respaldo" onClick={cerrarMenu}>{t("navigation.backups")}</NavLink></li>
                                        </ul>
                                    </li>
                                )}

                                <li className={`tiene-submenu ${openSubmenu === "perfil" ? "activo" : ""}`}>
                                    <span
                                        onClick={() => toggleSubmenu("perfil")}
                                        aria-expanded={openSubmenu === "perfil"}
                                        aria-controls="submenu-perfil"
                                    >
                                        {t("navigation.profile")} {openSubmenu === "perfil" ? <DropUpIcon /> : <DropDownIcon />}
                                    </span>

                                    <ul className="submenu" id="submenu-perfil">
                                        <li>
                                            <button
                                                type="button"
                                                className="CerrarSesion-btn"
                                                onClick={abrirCambioContrasena}
                                            >
                                                {t("auth.changePassword")}
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                type="button"
                                                className="CerrarSesion-btn"
                                                onClick={cerrarSesion}
                                            >
                                                {t("navigation.signOut")}
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        )}

                        {!isAuthenticated && (
                            <li><NavLink to="/" onClick={cerrarMenu}>{t("navigation.home")}</NavLink></li>
                        )}

                        <li><NavLink to="/Acerca-de" onClick={cerrarMenu}>{t("navigation.about")}</NavLink></li>
                        <li className={`tiene-submenu idioma-menu ${openSubmenu === "idioma" ? "activo" : ""}`}>
                            <button
                                type="button"
                                className="language-trigger"
                                onClick={() => toggleSubmenu("idioma")}
                                aria-expanded={openSubmenu === "idioma"}
                                aria-controls="submenu-idioma"
                                aria-label={t("navigation.languageMenu")}
                            >
                                <LanguageIcon />
                                <span>{locale}</span>
                                {openSubmenu === "idioma" ? <DropUpIcon className="language-caret" /> : <DropDownIcon className="language-caret" />}
                            </button>
                            <ul
                                className="submenu language-submenu"
                                id="submenu-idioma"
                                aria-label={t("navigation.languageMenu")}
                            >
                                {supportedLocales.map((option) => (
                                    <li key={option}>
                                        <button
                                            type="button"
                                            className={`language-option ${locale === option ? "selected" : ""}`}
                                            onClick={() => cambiarIdioma(option)}
                                            aria-current={locale === option ? "true" : undefined}
                                        >
                                            <span>{option}</span>
                                            <small>{t(`navigation.languages.${option}`)}</small>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    </ul>
                </nav>
            </header>

            <div className={variant === "home" ? contentClassName : `main-content ${contentClassName}`.trim()}>
                {children}
            </div>

            <footer>
                <div className="footer-cont">
                    <div className="footerC">
                        <img id="utlogo_deg" src={utlogoDeg} alt="UTN_logo" />
                    </div>

                    <div className="footerC">
                        <h3>{t("navigation.footer.contact")}</h3>
                        <p>
                            {t("navigation.footer.address")}
                        </p>
                        <p>{t("navigation.footer.phone")}</p>
                        <p>{t("navigation.footer.email")}</p>
                    </div>

                    <div className="footerC">
                        <h3>{t("navigation.footer.links")}</h3>
                        <a href="https://www.facebook.com/UTNAY/" target="_blank" rel="noreferrer">
                            Facebook
                        </a>
                        <a href="https://utnay.edu.mx/" target="_blank" rel="noreferrer">
                            {t("navigation.footer.officialSite")}
                        </a>
                    </div>
                </div>

                <div className="footerF">
                    <p>{t("navigation.footer.rights")}</p>
                </div>
            </footer>

            <CambiarContra
                isOpen={showCambiarPass}
                obligatorio={Boolean(usuario?.req_cambio_contra)}
                onClose={() => setShowCambiarPass(false)}
            />

            <Alerta
                open={showPasswordNotice}
                loading={false}
                type="info"
                titulo={t("auth.changeRequiredTitle")}
                mensaje={t("auth.changeRequiredMessage")}
                onClose={() => {
                    setShowPasswordNotice(false);
                    setShowCambiarPass(true);
                }}
            />
        </>
    );
}

export default Layout;
