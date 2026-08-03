import { useState } from "react";

import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Modal,
    Select,
    Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Arrow from "@mui/icons-material/ArrowForwardIosRounded";
import FilterListIcon from "@mui/icons-material/FilterAltRounded";

import "../../assets/estilos/Tutorias.css";
import Alerta from "../../componentes/Alerta";
import Layout from "../../componentes/layout";
import { useJustificantes } from "../../hooks/useJustificantes";
import JustificanteModal from "./Justificante";
import { useI18n } from "../../i18n/I18nContext";

const getClaseEstado = (estado) => {
    switch (estado) {
        case "PENDIENTE":
            return "tutoria-pendiente";
        case "ACEPTADO":
            return "tutoria-completada";
        case "RECHAZADO":
            return "tutoria-cancelada";
        default:
            return "";
    }
};

function Justificantes() {
    const { formatDate, t } = useI18n();
    const opcionesEstado = [
        { label: t("excuses.states.all"), value: null },
        { label: t("excuses.states.review"), value: "PENDIENTE" },
        { label: t("excuses.states.approved"), value: "ACEPTADO" }
    ];
    const [usuario] = useState(() => {
        const u = localStorage.getItem("usuario");
        return u ? JSON.parse(u) : null;
    });

    const [openFiltro, setOpenFiltro] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selected, setSelected] = useState(null);
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

    const { justificantes, loading, alumnos } = useJustificantes(
        usuario,
        estado,
        alumnoId,
        setPopup,
        refreshKey
    );

    const idRol = Number(usuario?.id_rol);

    const abrirNuevo = () => {
        setSelected(null);
        setOpenModal(true);
    };

    const abrirDetalle = (justificante) => {
        setSelected(justificante);
        setOpenModal(true);
    };

    const cerrarModal = () => {
        setOpenModal(false);
        setSelected(null);
    };

    const refrescar = () => {
        setRefreshKey((prev) => prev + 1);
    };

    if (!usuario) {
        return (
            <Layout contentClassName="tutorias-layout-gradient">
                <div className="tutorias-cont">
                    <div className="tutorias-body">
                        <Typography>{t("common.sessionMissing")}</Typography>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout contentClassName="tutorias-layout-gradient">
            <div className="tutorias-cont">
                <div className="tutorias-head">
                    <Box>
                        <Typography className="tutorias-eyebrow">
                            {idRol === 2 ? t("excuses.studentEyebrow") : t("excuses.trackingEyebrow")}
                        </Typography>
                        <Typography variant="h5" fontWeight={800} className="tutorias-title">
                            {idRol === 2 ? t("excuses.historyTitle") : t("excuses.managementTitle")}
                        </Typography>
                        <Typography className="tutorias-desc">
                            {idRol === 2
                                ? t("excuses.studentDescription")
                                : t("excuses.staffDescription")}
                        </Typography>
                    </Box>

                    {idRol === 2 && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography>{t("excuses.new")}</Typography>
                            <IconButton className="btn-add" onClick={abrirNuevo} aria-label={t("excuses.new")}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                    )}
                </div>

                <div className="tutorias-body">
                    <Box className="tutorias-filtros">
                        <Typography>{t("common.filter")}</Typography>
                        <IconButton onClick={() => setOpenFiltro(true)} aria-label={t("excuses.filterTitle")}>
                            <FilterListIcon />
                        </IconButton>
                    </Box>

                    <div className="tutorias-lista">
                        {loading ? (
                            <Box>{t("common.loading")}</Box>
                        ) : !Array.isArray(justificantes) || justificantes.length === 0 ? (
                            <Box>{t("excuses.empty")}</Box>
                        ) : (
                            justificantes.map((j) => (
                                <Card key={j.idJustificante} className={`tutoria-item ${getClaseEstado(j.estado)}`}>
                                    <CardActionArea
                                        className="tutoria-card-action"
                                        onClick={() => abrirDetalle(j)}
                                        aria-label={`${t("excuses.open")}: ${j.descripcion}`}
                                    >
                                        <CardContent className="tutorias-c" sx={{ padding: "0px !important" }}>
                                            <div className="tutoria-row">
                                                <div className="tutoria-izq">
                                                    <strong>{j.descripcion}</strong>
                                                    {j.nombreAlumno && (
                                                        <Typography variant="body2" className="tutoria-alumno">
                                                            {t("common.student")}: {j.nombreAlumno}
                                                        </Typography>
                                                    )}
                                                </div>

                                                <div className="tutoria-der">
                                                    <span>{formatDate(j.fecha)}</span>
                                                    <Chip
                                                        size="small"
                                                        label={j.estado === "PENDIENTE"
                                                            ? t("excuses.states.review")
                                                            : t(`common.statusLabels.${j.estado}`)}
                                                        color={j.estado === "ACEPTADO" ? "success" : "warning"}
                                                        variant="outlined"
                                                    />
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
                            {t("excuses.filterTitle")}
                        </Typography>

                        <Typography mb={1}>{t("common.status")}</Typography>

                        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {opcionesEstado.map((op) => (
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

                        {idRol !== 2 && (
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
            </div>

            <Alerta
                open={popup.open}
                loading={popup.loading}
                type={popup.type}
                titulo={popup.titulo}
                mensaje={popup.mensaje}
                onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
            />

            <JustificanteModal
                key={selected?.idJustificante || "nuevo"}
                open={openModal}
                onClose={cerrarModal}
                onSaved={refrescar}
                usuario={usuario}
                data={selected}
            />
        </Layout>
    );
}

export default Justificantes;
