import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import { AnimatePresence, motion as Motion } from "framer-motion";

import Tutoria from "../Tutoria/Tutoria";
import { useI18n } from "../../i18n/I18nContext";

const STATUS_OPTIONS = ["ACTIVO", "FINALIZADO", "CANCELADO"];

function SeguimientoModal({
    open,
    alumno,
    onClose,
    onRefresh,
    cargarSeguimientos,
    cargarSesiones,
    cambiarEstado
}) {
    const navigate = useNavigate();
    const { formatDate, t } = useI18n();
    const [seguimientos, setSeguimientos] = useState([]);
    const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState(null);
    const [sesiones, setSesiones] = useState([]);
    const [indiceSesion, setIndiceSesion] = useState(0);
    const [direction, setDirection] = useState(1);
    const [loading, setLoading] = useState(false);
    const [savingState, setSavingState] = useState(false);
    const [error, setError] = useState("");

    const statusLabel = (status) => {
        switch (status) {
            case "ACTIVO": return t("followup.states.active");
            case "FINALIZADO": return t("followup.states.finished");
            case "CANCELADO": return t("followup.states.cancelled");
            default: return status;
        }
    };

    const cargarLista = async () => {
        if (!alumno) return;

        try {
            setLoading(true);
            setError("");
            const data = await cargarSeguimientos(alumno.idAlumno);
            setSeguimientos(Array.isArray(data) ? data : []);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open || !alumno) return;
        setSeguimientoSeleccionado(null);
        setSesiones([]);
        setIndiceSesion(0);
        cargarLista();
        // cargarLista only uses the current modal inputs and must run when it opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, alumno]);

    const abrirSeguimiento = async (seguimiento) => {
        try {
            setLoading(true);
            setError("");
            const data = await cargarSesiones(seguimiento.idSeguimiento);
            setSesiones(Array.isArray(data) ? data : []);
            setSeguimientoSeleccionado(seguimiento);
            setIndiceSesion(0);
            setDirection(1);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    const cambiarSesion = (nextIndex) => {
        setDirection(nextIndex > indiceSesion ? 1 : -1);
        setIndiceSesion(nextIndex);
    };

    const actualizarEstado = async (event) => {
        const estado = event.target.value;
        if (!seguimientoSeleccionado) return;

        try {
            setSavingState(true);
            setError("");
            await cambiarEstado(seguimientoSeleccionado.idSeguimiento, estado);
            setSeguimientoSeleccionado((current) => ({ ...current, estado }));
            setSeguimientos((current) =>
                current.map((item) =>
                    item.idSeguimiento === seguimientoSeleccionado.idSeguimiento
                        ? { ...item, estado }
                        : item
                )
            );
            onRefresh();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSavingState(false);
        }
    };

    const agregarTutoria = () => {
        if (!seguimientoSeleccionado || seguimientoSeleccionado.estado !== "ACTIVO") return;

        navigate("/Tutorias", {
            state: {
                crearTutoria: {
                    alumnoId: alumno.idAlumno,
                    seguimientoId: seguimientoSeleccionado.idSeguimiento,
                    seguimientoTitulo: seguimientoSeleccionado.titulo
                }
            }
        });
    };

    const sesionActual = sesiones[indiceSesion];
    const sessionCounter = useMemo(() => {
        if (!sesionActual) return t("followup.noSessionsCounter");
        return t("followup.sessionCounter", {
            current: indiceSesion + 1,
            total: sesiones.length
        });
    }, [indiceSesion, sesiones.length, sesionActual, t]);

    return (
        <Modal open={open} onClose={onClose} aria-labelledby="seguimiento-modal-title">
            <Box className="seguimiento-modal">
                <header className="seguimiento-modal-header">
                    <Box display="flex" alignItems="center" gap={1} minWidth={0}>
                        {seguimientoSeleccionado && (
                            <IconButton
                                onClick={() => {
                                    setSeguimientoSeleccionado(null);
                                    setSesiones([]);
                                    setError("");
                                }}
                                aria-label={t("followup.backToFollowups")}
                            >
                                <ArrowBackRoundedIcon />
                            </IconButton>
                        )}
                        <Box minWidth={0}>
                            <Typography id="seguimiento-modal-title" variant="h6" fontWeight="bold" noWrap>
                                {seguimientoSeleccionado
                                    ? seguimientoSeleccionado.titulo
                                    : t("followup.studentModalTitle", { name: alumno?.nombreAlumno || "" })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {seguimientoSeleccionado
                                    ? sessionCounter
                                    : t("followup.studentModalDescription")}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} aria-label={t("common.close")}>
                        <CloseRoundedIcon />
                    </IconButton>
                </header>

                {error && (
                    <Box className="seguimiento-modal-error" role="alert">
                        {error}
                    </Box>
                )}

                <AnimatePresence mode="wait">
                    {!seguimientoSeleccionado ? (
                        <Motion.div
                            key="followup-list"
                            className="seguimiento-modal-body"
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.22 }}
                        >
                            {loading ? (
                                <Box className="seguimientos-feedback">
                                    <CircularProgress size={32} />
                                    <Typography>{t("followup.loadingFollowups")}</Typography>
                                </Box>
                            ) : seguimientos.length === 0 ? (
                                <Box className="seguimientos-empty compact">
                                    <EventNoteRoundedIcon />
                                    <Typography fontWeight="bold">{t("followup.noStudentFollowups")}</Typography>
                                </Box>
                            ) : (
                                <Box className="seguimiento-case-grid">
                                    {seguimientos.map((seguimiento) => (
                                        <Card
                                            key={seguimiento.idSeguimiento}
                                            className={`seguimiento-case-card status-${seguimiento.estado.toLowerCase()}`}
                                        >
                                            <CardActionArea onClick={() => abrirSeguimiento(seguimiento)}>
                                                <CardContent className="seguimiento-case-content">
                                                    <Box display="flex" justifyContent="space-between" gap={1}>
                                                        <Typography variant="h6" fontWeight="bold">
                                                            {seguimiento.titulo}
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            label={statusLabel(seguimiento.estado)}
                                                            className={`seguimiento-status status-${seguimiento.estado.toLowerCase()}`}
                                                        />
                                                    </Box>
                                                    {seguimiento.descripcion && (
                                                        <Typography color="text.secondary" className="seguimiento-case-description">
                                                            {seguimiento.descripcion}
                                                        </Typography>
                                                    )}
                                                    <Box className="seguimiento-case-footer">
                                                        <Typography variant="body2">
                                                            {t("followup.sessionsCount", {
                                                                count: seguimiento.totalTutorias
                                                            })}
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            {t("followup.lastSession", {
                                                                date: formatDate(seguimiento.ultimaTutoria)
                                                            })}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    ))}
                                </Box>
                            )}
                        </Motion.div>
                    ) : (
                        <Motion.div
                            key="followup-detail"
                            className="seguimiento-detail"
                            initial={{ opacity: 0, x: 28 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 28 }}
                            transition={{ duration: 0.22 }}
                        >
                            <Box className="seguimiento-detail-toolbar">
                                <Typography color="text.secondary">
                                    {seguimientoSeleccionado.descripcion || t("followup.noDescription")}
                                </Typography>
                                <FormControl size="small" className="seguimiento-state-control">
                                    <InputLabel>{t("common.status")}</InputLabel>
                                    <Select
                                        value={seguimientoSeleccionado.estado}
                                        label={t("common.status")}
                                        onChange={actualizarEstado}
                                        disabled={savingState}
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {statusLabel(status)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box className="seguimiento-session-viewer">
                                {loading ? (
                                    <Box className="seguimientos-feedback">
                                        <CircularProgress size={32} />
                                        <Typography>{t("followup.loadingSessions")}</Typography>
                                    </Box>
                                ) : !sesionActual ? (
                                    <Box className="seguimientos-empty compact">
                                        <EventNoteRoundedIcon />
                                        <Typography fontWeight="bold">{t("followup.noSessions")}</Typography>
                                        <Typography>{t("followup.noSessionsDescription")}</Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <IconButton
                                            className="seguimiento-session-arrow previous"
                                            disabled={indiceSesion === 0}
                                            onClick={() => cambiarSesion(indiceSesion - 1)}
                                            aria-label={t("followup.previousSession")}
                                        >
                                            <ArrowBackIosNewRoundedIcon />
                                        </IconButton>
                                        <AnimatePresence mode="wait" custom={direction}>
                                            <Motion.div
                                                key={sesionActual.idSesion}
                                                className="seguimiento-session-content"
                                                custom={direction}
                                                initial={(customDirection) => ({
                                                    opacity: 0,
                                                    x: customDirection * 42
                                                })}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={(customDirection) => ({
                                                    opacity: 0,
                                                    x: customDirection * -42
                                                })}
                                                transition={{ duration: 0.24 }}
                                            >
                                                <Tutoria
                                                    modal
                                                    id={sesionActual.idSesion}
                                                    hideClose
                                                    showActions={false}
                                                    showFollowupControls={false}
                                                />
                                            </Motion.div>
                                        </AnimatePresence>
                                        <IconButton
                                            className="seguimiento-session-arrow next"
                                            disabled={indiceSesion >= sesiones.length - 1}
                                            onClick={() => cambiarSesion(indiceSesion + 1)}
                                            aria-label={t("followup.nextSession")}
                                        >
                                            <ArrowForwardIosRoundedIcon />
                                        </IconButton>
                                    </>
                                )}
                            </Box>

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<AddRoundedIcon />}
                                className="seguimiento-add-session"
                                disabled={seguimientoSeleccionado.estado !== "ACTIVO"}
                                onClick={agregarTutoria}
                            >
                                {seguimientoSeleccionado.estado === "ACTIVO"
                                    ? t("followup.addSession")
                                    : t("followup.reopenToAdd")}
                            </Button>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </Box>
        </Modal>
    );
}

export default SeguimientoModal;
