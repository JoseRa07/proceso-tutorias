import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Layout from "../../componentes/layout";
import "../../assets/estilos/Tutorias.css";
import Alerta from "../../componentes/Alerta";

import {
    Box,
    Typography,
    Card,
    CardActionArea,
    CardContent,
    Button,
    IconButton,
    Modal,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterAltRounded";
import Arrow from "@mui/icons-material/ArrowForwardIosRounded";

import { useTutorias } from "../../hooks/useTutorias";
import Tutoria from "./Tutoria";
import { useI18n } from "../../i18n/I18nContext";

function Tutorias() {
    const navigate = useNavigate();
    const location = useLocation();
    const { formatDate, t } = useI18n();

    const [usuario] = useState(() => {
        const u = localStorage.getItem("usuario");
        return u ? JSON.parse(u) : null;
    });
    const solicitudInicial = usuario?.id_rol === 3
        ? location.state?.crearTutoria || null
        : null;
    const idTutoriaInicial = Number(location.state?.abrirTutoriaId);
    const detalleInicial = Number.isInteger(idTutoriaInicial) && idTutoriaInicial > 0
        ? idTutoriaInicial
        : null;

    const [openFiltro, setOpenFiltro] = useState(false);
    const [openTutoria, setOpenTutoria] = useState(
        () => Boolean(solicitudInicial || detalleInicial)
    );
    const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState(detalleInicial);
    const [tutoriaInicial, setTutoriaInicial] = useState(solicitudInicial);
    const [refreshKey, setRefreshKey] = useState(0);

    const [estadoTemp, setEstadoTemp] = useState(null);
    const [alumnoTemp, setAlumnoTemp] = useState("");
    const [estado, setEstado] = useState(null);
    const [alumnoId, setAlumnoId] = useState("");

    const [popup, setPopup] = useState({
        open: false,
        loading: false,
        type: "info",
        titulo: "",
        mensaje: ""
    });

    useEffect(() => {
        if (!usuario) {
            navigate("/");
            return;
        }

        const rolesPermitidos = [2, 3];

        if (!rolesPermitidos.includes(usuario.id_rol)) {
            navigate("/panel");
        }
    }, [usuario, navigate]);

    useEffect(() => {
        if (!solicitudInicial && !detalleInicial) return;
        navigate(location.pathname, { replace: true, state: null });
    }, [detalleInicial, location.pathname, navigate, solicitudInicial]);

    const { tutorias, loading, alumnos } = useTutorias(
        usuario,
        estado,
        alumnoId,
        setPopup,
        refreshKey
    );

    if (!usuario) {
        navigate("/");
        return null;
    }

    const getClaseEstado = (estadoTutoria) => {
        switch (estadoTutoria) {
            case "PENDIENTE": return "tutoria-pendiente";
            case "COMPLETADA": return "tutoria-completada";
            case "EDICION": return "tutoria-edicion";
            default: return "";
        }
    };

    const abrirTutoria = (idSesion = null) => {
        setTutoriaSeleccionada(idSesion);
        setTutoriaInicial(null);
        setOpenTutoria(true);
    };

    const cerrarTutoria = () => {
        setOpenTutoria(false);
        setTutoriaSeleccionada(null);
        setTutoriaInicial(null);
    };

    const completarTutoria = (notification) => {
        cerrarTutoria();
        setRefreshKey(prev => prev + 1);

        if (notification) {
            setPopup({
                open: true,
                loading: false,
                type: notification.type,
                titulo: notification.titulo,
                mensaje: notification.mensaje
            });
        }
    };

    return (
        <Layout contentClassName="tutorias-layout-gradient">
            <div className="tutorias-cont">
                <div className="tutorias-head">
                    <Box>
                        <Typography component="span" className="tutorias-eyebrow">
                            {t("tutoring.eyebrow")}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" className="tutorias-title">
                            {usuario.id_rol === 2 ? t("tutoring.historyTitle") : t("tutoring.managementTitle")}
                        </Typography>
                        <Typography className="tutorias-desc">
                            {t("tutoring.description")}
                        </Typography>
                    </Box>

                    {usuario.id_rol !== 2 && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography>{t("tutoring.new")}</Typography>

                            <IconButton
                                className="btn-add"
                                onClick={() => abrirTutoria()}
                                aria-label={t("tutoring.new")}
                            >
                                <AddIcon />
                            </IconButton>
                        </Box>
                    )}
                </div>

                <div className="tutorias-body">
                    <Box className="tutorias-filtros">
                        <Typography>{t("common.filter")}</Typography>
                        <IconButton onClick={() => setOpenFiltro(true)} aria-label={t("tutoring.filterTitle")}>
                            <FilterListIcon />
                        </IconButton>
                    </Box>

                    <div className="tutorias-lista">
                        {loading ? (
                            <Box>{t("common.loading")}</Box>
                        ) : !Array.isArray(tutorias) || tutorias.length === 0 ? (
                            <Box>{t("tutoring.empty")}</Box>
                        ) : (
                            tutorias.map((tutoria) => (
                                <Card key={tutoria.idSesion} className={`tutoria-item ${getClaseEstado(tutoria.estado)}`}>
                                    <CardActionArea
                                        className="tutoria-card-action"
                                        onClick={() => abrirTutoria(tutoria.idSesion)}
                                        aria-label={`${t("tutoring.open")}: ${tutoria.motivo}`}
                                    >
                                        <CardContent className="tutorias-c" sx={{ padding: "0px !important" }}>
                                            <div className="tutoria-row">
                                                <div className="tutoria-izq">
                                                    <strong>{tutoria.motivo}</strong>
                                                    {tutoria.nombreAlumno && (
                                                        <Typography variant="body2" className="tutoria-alumno">
                                                            {t("common.student")}: {tutoria.nombreAlumno}
                                                        </Typography>
                                                    )}
                                                </div>

                                                <div className="tutoria-der">
                                                    <span>{formatDate(tutoria.fecha)}</span>
                                                    <span>{tutoria.horaIni} - {tutoria.horaFin}</span>
                                                </div>

                                                <div className="tutoria-ctrl" aria-hidden="true">
                                                    <Arrow />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                <Modal open={openFiltro} onClose={() => setOpenFiltro(false)}>
                    <Box className="modal-filtro">
                        <Typography variant="h6" mb={2}>
                            {t("tutoring.filterTitle")}
                        </Typography>

                        <Typography mb={1}>{t("common.status")}</Typography>

                        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {[
                                { label: t("tutoring.states.all"), value: null },
                                { label: t("tutoring.states.pending"), value: "PENDIENTE" },
                                { label: t("tutoring.states.editing"), value: "EDICION" },
                                { label: t("tutoring.states.completed"), value: "COMPLETADA" }
                            ].map((op) => (
                                <Box
                                    key={op.label}
                                    onClick={() => setEstadoTemp(op.value)}
                                    sx={{
                                        padding: "6px 14px",
                                        borderRadius: "20px",
                                        border: estadoTemp === op.value ? "1px solid #20b96d" : "1px solid #121927",
                                        cursor: "pointer",
                                        backgroundColor: estadoTemp === op.value ? "#22d47b" : "#fff",
                                        color: estadoTemp === op.value ? "#fff" : "#121927"
                                    }}
                                >
                                    {op.label}
                                </Box>
                            ))}
                        </Box>

                        {usuario.id_rol !== 2 && (
                            <>
                                <Typography mb={1}>{t("common.student")}</Typography>

                                <FormControl fullWidth size="small">
                                    <InputLabel>{t("tutoring.selectStudent")}</InputLabel>
                                    <Select
                                        value={alumnoTemp}
                                        label={t("tutoring.selectStudent")}
                                        onChange={(e) => setAlumnoTemp(e.target.value)}
                                    >
                                        <MenuItem value="">{t("common.all")}</MenuItem>

                                        {alumnos.map((a) => (
                                            <MenuItem key={a.id_alumno} value={a.id_alumno}>
                                                {a.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, backgroundColor: "#22d47b" }}
                            onClick={() => {
                                setEstado(estadoTemp);
                                setAlumnoId(alumnoTemp);
                                setOpenFiltro(false);
                            }}
                        >
                            {t("common.applyFilters")}
                        </Button>
                    </Box>
                </Modal>

                <Modal open={openTutoria} onClose={cerrarTutoria}>
                    <Box className="modal-tutoria">
                        <Tutoria
                            modal
                            id={tutoriaSeleccionada}
                            initialAlumnoId={tutoriaInicial?.alumnoId}
                            initialSeguimientoId={tutoriaInicial?.seguimientoId}
                            initialSeguimientoTitulo={tutoriaInicial?.seguimientoTitulo}
                            onClose={cerrarTutoria}
                            onSaved={completarTutoria}
                        />
                    </Box>
                </Modal>
            </div>

            <Alerta
                open={popup.open}
                loading={popup.loading}
                type={popup.type}
                titulo={popup.titulo}
                mensaje={popup.mensaje}
                onClose={() => setPopup(prev => ({ ...prev, open: false }))}
            />
        </Layout>
    );
}

export default Tutorias;
