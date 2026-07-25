import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    Button,
    Box,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Modal,
    Select,
    Typography
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import { motion as Motion } from "framer-motion";

import Layout from "../../componentes/layout";
import { useSeguimientos } from "../../hooks/useSeguimientos";
import { useI18n } from "../../i18n/I18nContext";
import SeguimientoModal from "./SeguimientoModal";
import "../../assets/estilos/Seguimientos.css";

const cardAnimation = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 }
};

function Seguimientos() {
    const navigate = useNavigate();
    const { formatDate, t } = useI18n();
    const [usuario] = useState(() => {
        const stored = localStorage.getItem("usuario");
        return stored ? JSON.parse(stored) : null;
    });
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
    const [openFiltro, setOpenFiltro] = useState(false);
    const [estadoFiltro, setEstadoFiltro] = useState(null);
    const [alumnoFiltro, setAlumnoFiltro] = useState("");
    const [estadoTemp, setEstadoTemp] = useState(null);
    const [alumnoTemp, setAlumnoTemp] = useState("");
    const [alumnosParaFiltro, setAlumnosParaFiltro] = useState([]);
    const [cargandoAlumnosFiltro, setCargandoAlumnosFiltro] = useState(false);
    const {
        alumnos,
        loading,
        error,
        cargarAlumnos,
        cargarSeguimientos,
        cargarSesiones,
        cambiarEstado,
        obtenerAlumnosParaFiltro
    } = useSeguimientos(usuario, estadoFiltro);

    useEffect(() => {
        if (!usuario) {
            navigate("/");
            return;
        }

        if (usuario.id_rol !== 3) {
            navigate("/Panel");
        }
    }, [navigate, usuario]);

    if (!usuario || usuario.id_rol !== 3) return null;

    const abrirFiltro = async () => {
        setEstadoTemp(estadoFiltro);
        setAlumnoTemp(alumnoFiltro);
        setOpenFiltro(true);

        if (alumnosParaFiltro.length > 0) return;

        try {
            setCargandoAlumnosFiltro(true);
            const data = await obtenerAlumnosParaFiltro();
            setAlumnosParaFiltro(Array.isArray(data) ? data : []);
        } catch {
            setAlumnosParaFiltro([]);
        } finally {
            setCargandoAlumnosFiltro(false);
        }
    };

    const alumnosVisibles = alumnoFiltro
        ? alumnos.filter((alumno) => alumno.idAlumno === Number(alumnoFiltro))
        : alumnos;

    return (
        <Layout contentClassName="seguimientos-layout-gradient">
            <main className="seguimientos-page">
                <section className="seguimientos-head">
                    <Box>
                        <Typography component="span" className="seguimientos-eyebrow">
                            {t("followup.eyebrow")}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" className="seguimientos-title">
                            {t("followup.title")}
                        </Typography>
                        <Typography className="seguimientos-description">
                            {t("followup.description")}
                        </Typography>
                    </Box>
                    <Box className="seguimientos-head-icon" aria-hidden="true">
                        <PersonSearchRoundedIcon />
                    </Box>
                </section>

                <section className="seguimientos-content">
                    <Box className="seguimientos-filters">
                        <Typography>{t("common.filter")}</Typography>
                        <IconButton onClick={abrirFiltro} aria-label={t("followup.filterTitle")}>
                            <FilterAltRoundedIcon />
                        </IconButton>
                    </Box>

                    {loading && (
                        <Box className="seguimientos-feedback">
                            <CircularProgress size={34} />
                            <Typography>{t("followup.loadingStudents")}</Typography>
                        </Box>
                    )}

                    {!loading && error && (
                        <Box className="seguimientos-feedback error" role="alert">
                            <Typography fontWeight="bold">{t("common.error")}</Typography>
                            <Typography>{error}</Typography>
                        </Box>
                    )}

                    {!loading && !error && alumnosVisibles.length === 0 && (
                        <Box className="seguimientos-empty">
                            <PersonSearchRoundedIcon />
                            <Typography variant="h6" fontWeight="bold">
                                {t("followup.emptyTitle")}
                            </Typography>
                            <Typography>{t("followup.emptyDescription")}</Typography>
                        </Box>
                    )}

                    {!loading && !error && alumnosVisibles.length > 0 && (
                        <Motion.div
                            className="seguimientos-student-grid"
                            initial="hidden"
                            animate="visible"
                            transition={{ staggerChildren: 0.06 }}
                        >
                            {alumnosVisibles.map((alumno) => (
                                <Motion.div key={alumno.idAlumno} variants={cardAnimation}>
                                    <Card className="seguimiento-student-card">
                                        <CardActionArea
                                            className="seguimiento-student-action"
                                            onClick={() => setAlumnoSeleccionado(alumno)}
                                            aria-label={t("followup.openStudent", { name: alumno.nombreAlumno })}
                                        >
                                            <CardContent className="seguimiento-student-content">
                                                <Avatar className="seguimiento-avatar">
                                                    <SchoolRoundedIcon />
                                                </Avatar>
                                                <Box className="seguimiento-student-main">
                                                    <Typography
                                                        variant="h6"
                                                        fontWeight="bold"
                                                        className="seguimiento-student-name"
                                                    >
                                                        {alumno.nombreAlumno}
                                                    </Typography>
                                                    <Typography className="seguimiento-student-meta">
                                                        {alumno.matricula} · {alumno.grupo}
                                                    </Typography>
                                                </Box>
                                                <Box className="seguimiento-student-counts">
                                                    <Chip
                                                        size="small"
                                                        className="seguimiento-active-chip"
                                                        label={t("followup.activeCount", {
                                                            count: alumno.seguimientosActivos
                                                        })}
                                                    />
                                                    <Typography variant="caption">
                                                        {t("followup.totalCount", {
                                                            count: alumno.totalSeguimientos
                                                        })}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" className="seguimiento-last-activity">
                                                    {t("followup.lastActivity", {
                                                        date: formatDate(alumno.ultimaActividad)
                                                    })}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Motion.div>
                            ))}
                        </Motion.div>
                    )}
                </section>
            </main>

            <SeguimientoModal
                open={!!alumnoSeleccionado}
                alumno={alumnoSeleccionado}
                onClose={() => setAlumnoSeleccionado(null)}
                onRefresh={cargarAlumnos}
                cargarSeguimientos={cargarSeguimientos}
                cargarSesiones={cargarSesiones}
                cambiarEstado={cambiarEstado}
            />

            <Modal open={openFiltro} onClose={() => setOpenFiltro(false)}>
                <Box className="seguimiento-filter-modal">
                    <Typography variant="h6" mb={2}>
                        {t("followup.filterTitle")}
                    </Typography>

                    <Typography mb={1}>{t("common.status")}</Typography>
                    <Box className="seguimiento-filter-state-options">
                        {[
                            { label: t("common.all"), value: null },
                            { label: t("followup.states.active"), value: "ACTIVO" },
                            { label: t("followup.states.finished"), value: "FINALIZADO" },
                            { label: t("followup.states.cancelled"), value: "CANCELADO" }
                        ].map((option) => (
                            <Button
                                key={option.label}
                                variant={estadoTemp === option.value ? "contained" : "outlined"}
                                onClick={() => setEstadoTemp(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Box>

                    <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                        <InputLabel>{t("followup.filterStudent")}</InputLabel>
                        <Select
                            value={alumnoTemp}
                            label={t("followup.filterStudent")}
                            disabled={cargandoAlumnosFiltro}
                            onChange={(event) => setAlumnoTemp(event.target.value)}
                        >
                            <MenuItem value="">{t("common.all")}</MenuItem>
                            {alumnosParaFiltro.map((alumno) => (
                                <MenuItem key={alumno.idAlumno} value={alumno.idAlumno}>
                                    {alumno.nombreAlumno}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        fullWidth
                        variant="contained"
                        className="seguimiento-filter-apply"
                        onClick={() => {
                            setEstadoFiltro(estadoTemp);
                            setAlumnoFiltro(alumnoTemp);
                            setOpenFiltro(false);
                        }}
                    >
                        {t("common.applyFilters")}
                    </Button>
                </Box>
            </Modal>
        </Layout>
    );
}

export default Seguimientos;
