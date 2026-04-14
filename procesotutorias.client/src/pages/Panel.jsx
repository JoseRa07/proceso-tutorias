import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../componentes/layout";
import "../assets/estilos/Panel.css";
import Alerta from "../componentes/Alerta";

import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import FilePresentIcon from '@mui/icons-material/FilePresent';

import CambiarContra from "../componentes/Auth/CambiarContra";

// nuevos imports
import { usePanelInfo } from "../hooks/usePanelInfo";
import { saludo } from "../utils/PanelUtils";

function Panel() {

    const [popup, setPopup] = useState({
        open: false,
        loading: false,
        type: "info",
        titulo: "",
        mensaje: ""
    });

    const [showCambiarPass, setShowCambiarPass] = useState(false);

    const navigate = useNavigate();

    const [usuario] = useState(() => {
        const usuarioStorage = localStorage.getItem("usuario");
        return usuarioStorage ? JSON.parse(usuarioStorage) : null;
    });

    // hook con datos
    const { grupo, tutorias, tutoriasAsignadas } = usePanelInfo(usuario);

    const rutasRol = {
        1: [
            { nombre: "Gestión de tutores", ruta: "/Gestion-de-tutores", icon: ManageAccountsIcon },
            { nombre: "Configuración", ruta: "/#", icon: SettingsIcon },
            { nombre: "Reportes", ruta: "/Reportes", icon: FilePresentIcon },
            { nombre: "Respaldo", ruta: "/Respaldo", icon: FilePresentIcon }
        ],
        2: [
            { nombre: "Ver tutorías", ruta: "/Tutorias", icon: SchoolIcon },
            { nombre: "Justificantes", ruta: "/Justificantes", icon: FilePresentIcon },
            { nombre: "Configuración", ruta: "/#", icon: SettingsIcon },
            { nombre: "Reportes", ruta: "/Reportes", icon: FilePresentIcon }
        ],
        3: [
            { nombre: "Seguimiento", ruta: "/#", icon: TimelineIcon },
            { nombre: "Justificantes", ruta: "/Justificantes", icon: FilePresentIcon },
            { nombre: "Configuración", ruta: "/#", icon: SettingsIcon },
            { nombre: "Reportes", ruta: "/Reportes", icon: FilePresentIcon }
        ],
        4: [
            { nombre: "Reportes", ruta: "/Reportes", icon: FilePresentIcon }
        ]
    };

    useEffect(() => {
        if (!usuario) {
            navigate("/");
        }
    }, [usuario, navigate]);

    useEffect(() => {
        if (usuario?.req_cambio_contra) {

            const openTimer = setTimeout(() => {
                setPopup({
                    open: true,
                    loading: false,
                    type: "info",
                    titulo: "Cambio de contraseña requerido",
                    mensaje: "Debes cambiar tu contraseña para continuar."
                });
            }, 0);

            const closeTimer = setTimeout(() => {
                setPopup(prev => ({ ...prev, open: false }));
                setShowCambiarPass(true);
            }, 5000);

            return () => {
                clearTimeout(openTimer);
                clearTimeout(closeTimer);
            };
        }
    }, [usuario]);

    return (
        <Layout>
            <div className="panel-container">

                <div className="panel-grid">

                    <div className="panel-main">

                        <Box className="panel-header">
                            <Typography variant="h6" className="TextoN" fontWeight="bold"
                            sx={{
                                fontSize: { xs: "18px", md: "1.25rem" }
                            }}>
                                {saludo() + ", " + usuario.nombre}
                            </Typography>

                            <Box className="panel-header-right">
                                {usuario.id_rol !== 1 && usuario.id_rol !== 4 && ( // grupo del tutor/alumno
                                    <>
                                        <Typography variant="h6" alignItems="End" className="TextoN" fontWeight="bold"
                                        sx={{
                                            fontSize: { xs: "18px", md: "1.25rem" }
                                        }}>
                                            {"Grupo: " + (grupo ? `${grupo.carrera}-${grupo.nombre}` : "Sin grupo")}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {usuario.id_rol == 4 && ( // si es maestro
                            <>
                                <Box sx={{ border: "1px solid #ccc", mt: 1, minHeight: "20vh", maxWidth:"90vw",display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", p: 2}}>
                                    Te encuentras en espera de ser asignado como tutor...
                                </Box>
                            </>
                        )}

                        <div className="quick-actions">
                            {(rutasRol[usuario.id_rol] || []).map((item, index) => (
                                <Card
                                    key={index}
                                    className="quick-card"
                                    sx={{
                                        backgroundColor: "#FFFFFF",
                                        cursor: "pointer", 
                                        "&:hover": { backgroundColor: "#20bf6b" },
                                        "&:hover .quick-text": {
                                            color: "#fff"
                                        },
                                        "&:hover .quick-icon": {
                                            color: "#fff"
                                        }
                                    }}
                                    onClick={() => navigate(item.ruta)}
                                >
                                    <CardContent sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1
                                    }}
                                    >
                                        {React.cloneElement(item.icon, {
                                            className: "quick-icon",
                                            sx: { fontSize: 40, color: "#20A85E", transition: "0.2s" }
                                        })}

                                        <Typography className="TextoN quick-text" fontWeight="Bold" variant="body2">
                                            {item.nombre}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {usuario.id_rol !== 1 && usuario.id_rol !== 4 && ( // admin o no tutor
                        <>
                            <Card sx={{ mb: 2 }}>
                                <CardContent className="TutoriasAsig">
                                    <Typography className="subtitulo" fontWeight="bold" variant="subtitle1" textAlign="left">
                                        {usuario.id_rol === 2 ? "Tutorías asignadas" : "Tutorías pendientes"}
                                    </Typography>

                                    <Box sx={{ p: 1, mt: 1 }}>
                                        {tutoriasAsignadas.length === 0 ? (
                                            "No hay tutorías asignadas"
                                        ) : (
                                            tutoriasAsignadas.map((t) => (
                                                <Box
                                                    key={t.idSesion}
                                                    className="tutoria-item"
                                                    onClick={() => navigate(`/Tutoria/${t.idSesion}`)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                            backgroundColor: "#f5f5f5"
                                                        }
                                                    }}>
                                                    <div className="tutoria-iz">
                                                        <strong>{t.motivo}</strong>
                                                    </div>

                                                    <div className="tutoria-der">
                                                        <span>{t.fecha}</span>
                                                    </div>
                                                </Box>
                                            ))
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography className="subtitulo" fontWeight="bold" variant="subtitle1">
                                            Tutorías completadas recientemente
                                        </Typography>

                                        <Button size="small" variant="contained" sx={{
                                            backgroundColor: "#20A85E",
                                            "&:hover": {
                                                backgroundColor: "#1B5E20"
                                            }
                                            }}
                                            onClick={() => navigate("/Tutorias")}>
                                            ver historial
                                        </Button>
                                    </Box>

                                    <Box className="tutorias-recientes-list">
                                        {tutorias.length === 0 ? (
                                            <Box>No hay tutorías registradas</Box>
                                        ) : (
                                            tutorias
                                            .filter(t => t.estado === "COMPLETADA")
                                            .map((t) => (
                                                <Box
                                                    key={t.idSesion}
                                                    className="tutoria-item"
                                                    onClick={() => navigate(`/Tutoria/${t.idSesion}`)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                            backgroundColor: "#f5f5f5"
                                                        }
                                                    }}>
                                                    <div className="tutoria-iz">
                                                        <strong>{t.motivo}</strong>
                                                    </div>

                                                    <div className="tutoria-der-col">
                                                        <span>{t.fecha}</span>
                                                        <span>{t.horaIni} - {t.horaFin}</span>
                                                    </div>
                                                </Box>
                                            ))
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </>
                        )}
                    </div>
                </div>
            </div>

            <CambiarContra
                isOpen={showCambiarPass}
                obligatorio={usuario?.req_cambio_contra}
                onClose={() => setShowCambiarPass(false)}
            />

            <Alerta
                open={popup.open}
                loading={popup.loading}
                type={popup.type}
                titulo={popup.titulo}
                mensaje={popup.mensaje}
                onClose={() => {
                    setPopup(prev => ({ ...prev, open: false }));

                    if (usuario?.req_cambio_contra) {
                        setShowCambiarPass(true);
                    }
                }}
            />
        </Layout>
    );
}

export default Panel;