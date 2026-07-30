import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../componentes/layout";
import "../assets/estilos/Panel.css";

import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip
} from "@mui/material";
import { motion as Motion } from "framer-motion";

import SchoolIcon from "@mui/icons-material/School";
import SettingsIcon from "@mui/icons-material/Settings";
import TimelineIcon from "@mui/icons-material/Timeline";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import FilePresentIcon from "@mui/icons-material/FilePresent";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupsIcon from "@mui/icons-material/Groups";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";

import { usePanelInfo } from "../hooks/usePanelInfo";
import { saludo } from "../utils/PanelUtils";
import { useI18n } from "../i18n/I18nContext";
import { translateRole } from "../i18n/catalogTranslations";

const cardAnimada = {
    oculto: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
};

function Panel() {
    const { formatDate, t } = useI18n();

    const navigate = useNavigate();

    const [usuario] = useState(() => {
        const usuarioStorage = localStorage.getItem("usuario");
        return usuarioStorage ? JSON.parse(usuarioStorage) : null;
    });

    const { grupo, tutorias, tutoriasAsignadas } = usePanelInfo(usuario);
    const nombreUsuario = usuario?.nombre || t("panel.user");
    const rolNombre = usuario?.rol ? translateRole(t, usuario.rol) : t("panel.activeAccount");
    const tutoriasCompletadas = tutorias.filter((tutoria) => tutoria.estado === "COMPLETADA");
    const abrirDetalleTutoria = (idSesion) => {
        navigate("/Tutorias", { state: { abrirTutoriaId: idSesion } });
    };

    const rutasRol = {
        1: [
            { nombre: t("panel.routes.tutors"), ruta: "/Gestion-de-tutores", icon: ManageAccountsIcon },
            { nombre: t("panel.routes.roles"), ruta: "/Roles", icon: SettingsIcon },
            { nombre: t("panel.routes.users"), ruta: "/Usuarios", icon: ManageAccountsIcon },
            { nombre: t("panel.routes.reports"), ruta: "/Reportes", icon: FilePresentIcon },
            { nombre: t("panel.routes.backups"), ruta: "/Respaldo", icon: FilePresentIcon }
        ],
        2: [
            { nombre: t("panel.routes.viewTutoring"), ruta: "/Tutorias", icon: SchoolIcon },
            { nombre: t("panel.routes.excuses"), ruta: "/Justificantes", icon: FilePresentIcon },
            { nombre: t("panel.routes.reports"), ruta: "/Reportes", icon: FilePresentIcon }
        ],
        3: [
            { nombre: t("panel.routes.tutoring"), ruta: "/Tutorias", icon: TimelineIcon },
            { nombre: t("panel.routes.excuses"), ruta: "/Justificantes", icon: FilePresentIcon },
            { nombre: t("panel.routes.followup"), ruta: "/Seguimientos", icon: TrackChangesRoundedIcon },
            { nombre: t("panel.routes.reports"), ruta: "/Reportes", icon: FilePresentIcon }
        ],
        4: [
            { nombre: t("panel.routes.reports"), ruta: "/Reportes", icon: FilePresentIcon }
        ]
    };

    useEffect(() => {
        if (!usuario) {
            navigate("/");
        }
    }, [usuario, navigate]);

    return (
        <Layout contentClassName="panel-layout-gradient">
            <div className="panel-container">

                <div className="panel-grid">

                    <Motion.div
                        className="panel-main"
                        initial="oculto"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: { staggerChildren: 0.08 }
                            }
                        }}
                    >

                        <Motion.section className="panel-hero" variants={cardAnimada}>
                            <Box className="panel-header">
                                <Box>
                                    <Typography component="span" className="panel-eyebrow">
                                        {rolNombre}
                                    </Typography>
                                    <Typography variant="h4" className="TextoN panel-title" fontWeight="bold">
                                        {saludo(t)}, {nombreUsuario}
                                    </Typography>
                                    <Typography className="panel-desc">
                                        {t("panel.description")}
                                    </Typography>
                                </Box>

                                {usuario.id_rol !== 1 && usuario.id_rol !== 4 && (
                                    <Box className="panel-group-pill">
                                        <GroupsIcon />
                                        <span>{grupo ? `${grupo.carrera}-${grupo.nombre}` : t("panel.noGroup")}</span>
                                    </Box>
                                )}
                            </Box>
                        </Motion.section>

                        {usuario.id_rol == 4 && (
                            <Motion.section className="panel-wait-card" variants={cardAnimada}>
                                <EventAvailableIcon />
                                <Box>
                                    <Typography fontWeight="bold">{t("panel.assignmentPending")}</Typography>
                                    <Typography>
                                        {t("panel.assignmentPendingDescription")}
                                    </Typography>
                                </Box>
                            </Motion.section>
                        )}

                        <Motion.div className="quick-actions" variants={cardAnimada}>
                            {(rutasRol[usuario.id_rol] || []).map((item, index) => {
                                const Icono = item.icon;

                                return (
                                    <Motion.div
                                        key={index}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Card
                                            className="quick-card"
                                            onClick={() => navigate(item.ruta)}
                                            tabIndex={0}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") navigate(item.ruta);
                                            }}
                                        >
                                            <CardContent className="quick-card-content">
                                                <Box className="quick-icon-box">
                                                    <Icono className="quick-icon" />
                                                </Box>

                                                <Typography className="TextoN quick-text" fontWeight="bold" variant="body2">
                                                    {item.nombre}
                                                </Typography>

                                                <ArrowForwardIcon className="quick-arrow" />
                                            </CardContent>
                                        </Card>
                                    </Motion.div>
                                );
                            })}
                        </Motion.div>

                        {usuario.id_rol !== 1 && usuario.id_rol !== 4 && (
                        <>
                            <Motion.div variants={cardAnimada}>
                            <Card className="panel-section-card">
                                <CardContent className="TutoriasAsig">
                                    <Box className="panel-section-head">
                                        <Box>
                                            <Typography className="subtitulo" fontWeight="bold" variant="subtitle1">
                                                {usuario.id_rol === 2 ? t("panel.assigned") : t("panel.pending")}
                                            </Typography>
                                            <Typography className="panel-section-sub">
                                                {t("panel.attentionNeeded")}
                                            </Typography>
                                        </Box>
                                        <Chip label={tutoriasAsignadas.length} className="panel-count-chip warning" />
                                    </Box>

                                    <Box sx={{ p: 1, mt: 1 }}>
                                        {tutoriasAsignadas.length === 0 ? (
                                            <Box className="panel-empty">{t("panel.noAssigned")}</Box>
                                        ) : (
                                            tutoriasAsignadas.map((tutoria) => (
                                                <Box
                                                    key={tutoria.idSesion}
                                                    className="tutoria-item"
                                                    onClick={() => abrirDetalleTutoria(tutoria.idSesion)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                            backgroundColor: "#f5f5f5"
                                                        }
                                                    }}>
                                                    <div className="tutoria-iz">
                                                        <strong>{tutoria.motivo}</strong>
                                                    </div>

                                                    <div className="tutoria-der">
                                                        <span>{formatDate(tutoria.fecha)}</span>
                                                    </div>
                                                </Box>
                                            ))
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                            </Motion.div>

                            <Motion.div variants={cardAnimada}>
                            <Card className="panel-section-card">
                                <CardContent>
                                    <Box className="panel-section-head">
                                        <Box>
                                            <Typography className="subtitulo" fontWeight="bold" variant="subtitle1">
                                                {t("panel.recentCompleted")}
                                            </Typography>
                                            <Typography className="panel-section-sub">
                                                {t("panel.recentCompletedDescription")}
                                            </Typography>
                                        </Box>

                                        <Button size="small" variant="contained" sx={{
                                            backgroundColor: "#20A85E",
                                            "&:hover": {
                                                backgroundColor: "#1B5E20"
                                            }
                                            }}
                                            onClick={() => navigate("/Tutorias")}>
                                            {t("panel.viewHistory")}
                                        </Button>
                                    </Box>

                                    <Box className="tutorias-recientes-list">
                                        {tutoriasCompletadas.length === 0 ? (
                                            <Box className="panel-empty">{t("panel.noTutoring")}</Box>
                                        ) : (
                                            tutoriasCompletadas.map((tutoria) => (
                                                <Box
                                                    key={tutoria.idSesion}
                                                    className="tutoria-item"
                                                    onClick={() => abrirDetalleTutoria(tutoria.idSesion)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                            backgroundColor: "#f5f5f5"
                                                        }
                                                    }}>
                                                    <div className="tutoria-iz">
                                                        <strong>{tutoria.motivo}</strong>
                                                    </div>

                                                    <div className="tutoria-der-col">
                                                        <span>{formatDate(tutoria.fecha)}</span>
                                                        <span>{tutoria.horaIni} - {tutoria.horaFin}</span>
                                                    </div>
                                                </Box>
                                            ))
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                            </Motion.div>
                        </>
                        )}
                    </Motion.div>
                </div>
            </div>

        </Layout>
    );
}

export default Panel;
