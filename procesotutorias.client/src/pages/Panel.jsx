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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CambiarContra from "../componentes/Auth/CambiarContra";

function Panel() {

    const [popup, setPopup] = useState({
        open: false,
        loading: false,
        type: "info",
        titulo: "",
        mensaje: ""
    });

    const [showCambiarPass, setShowCambiarPass] = useState(false);
    const [openCalendar, setOpenCalendar] = useState(false);
    //proteccion de ruta con bandera almacenada de momento (probablemente sea con JWT nose como lo vaya a implementar el que le toque seguridad)
    const navigate = useNavigate();

    const Saludo = () => {
        const hora = new Date().getHours();

        if (hora >= 6 && hora < 12) return "Buenos días";
        if (hora >= 12 && hora < 19) return "Buenas tardes";
        return "Buenas noches";
    };

    const [usuario] = useState(() => {
        const usuarioStorage = localStorage.getItem("usuario");
        return usuarioStorage ? JSON.parse(usuarioStorage) : null;
    });

    const rutasRol = {
        //NOTA SI ALGUIEN MODIFICA ESTO SOLO PONGA 3 maximo
        1: [ // admini
            { nombre: "Gestión de tutores", ruta: "/Gestion-de-tutores" },
            { nombre: "Configuración", ruta: "/#" }
        ],
        2: [ // alumno
            { nombre: "Ver tutorías", ruta: "/tutorias" },
            { nombre: "Justificantes", ruta: "/#" },
            { nombre: "Configuración", ruta: "/#" }
        ],
        3: [ // tutor
            { nombre: "Seguimiento", ruta: "/#" },
            { nombre: "Justificantes", ruta: "/#" },
            { nombre: "Configuración", ruta: "/#" }
        ],
        4: [ // no tutor
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
                            <Typography variant="h6" className="TextoN" fontWeight="bold">
                                {Saludo() + ", " + usuario.nombre}
                            </Typography>

                            {usuario.id_rol !== 1 && ( // admin o no tutor
                                <>
                                    <IconButton
                                        className="calendar-btn"
                                        onClick={() => setOpenCalendar(!openCalendar)}
                                    >
                                        <CalendarMonthIcon />
                                    </IconButton>
                                </>
                            )}
                        </Box>

                        <div className="quick-actions">
                            {(rutasRol[usuario.id_rol] || []).map((item, index) => (
                                <Card
                                    key={index}
                                    className="quick-card"
                                    sx={{
                                        backgroundColor: "#FFFFFF",
                                        cursor: "pointer", 
                                        "&:hover": { backgroundColor: "#20bf6b" }
                                    }}
                                    onClick={() => navigate(item.ruta)}
                                >
                                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography className="TextoN" fontWeight="medium" variant="body2">
                                            {item.nombre}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {usuario.id_rol !== 1 && ( // admin o no tutor
                            <>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography className="subtitulo" fontWeight="bold" variant="subtitle1" textAlign="left">
                                    Tutorías asignadas
                                </Typography>

                                <Box sx={{ border: "1px solid #ccc", p: 1, mt: 1 }}>
                                    Aún no tienes tutorías asignadas...
                                </Box>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography className="subtitulo" fontWeight="bold" variant="subtitle1">
                                        Tutorías recientes
                                    </Typography>

                                    <Button size="small" variant="contained" sx={{
                                        backgroundColor: "#20A85E",
                                        "&:hover": {
                                            backgroundColor: "#1B5E20"
                                        }
                                    }}>
                                        ver historial
                                    </Button>
                                </Box>

                                <Box className="tutorias-recientes-list">
                                    {[1, 2, 3, 4, 5].map((item) => (
                                        <Box key={item} className="tutoria-item">
                                            tutoría
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                            </>
                        )}
                    </div>

                    {usuario.id_rol !== 1 && ( // admin o no tutor
                        <>
                    {openCalendar && (
                        <div
                            className="sidebar-overlay"
                            onClick={() => setOpenCalendar(false)}
                        />
                    )}

                    <div className={`panel-sidebar ${openCalendar ? "open" : ""}`}>

                        <IconButton
                            className="close-sidebar"
                            onClick={() => setOpenCalendar(false)}
                        >
                            <CloseIcon />
                        </IconButton>

                        <Card>
                            <CardContent>

                                <Typography variant="subtitle2" mb={2}>
                                    Calendario
                                </Typography>

                                {[1, 2, 3].map((item) => (
                                    <Box key={item} sx={{ mb: 2 }}>
                                        <Typography variant="caption">
                                            fecha
                                        </Typography>

                                        <Box sx={{ border: "1px solid #ccc", p: 1 }}>
                                            item
                                        </Box>
                                    </Box>
                                ))}

                            </CardContent>
                        </Card>

                    </div>
                        </>
                    )}
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