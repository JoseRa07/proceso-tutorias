import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../componentes/layout";
import "../../assets/estilos/Tutorias.css";
import Alerta from "../../componentes/Alerta";

import {
    Box,
    Typography,
    Card,
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

function Tutorias() {

    const navigate = useNavigate();

    // usuario desde local storage
    const [usuario] = useState(() => {
        const u = localStorage.getItem("usuario");
        return u ? JSON.parse(u) : null;
    });

    useEffect(() => {
        if (!usuario) {
            navigate("/");
            return;
        }

        // SOLO alumno o tutor
        const rolesPermitidos = [2, 3];

        if (!rolesPermitidos.includes(usuario.id_rol)) {
            navigate("/panel");
        }

    }, [usuario, navigate]);

    // abrir modal de filtros
    const [openFiltro, setOpenFiltro] = useState(false);

    // filtros temporales
    const [estadoTemp, setEstadoTemp] = useState(null);
    const [alumnoTemp, setAlumnoTemp] = useState("");

    // filtros aplicados
    const [estado, setEstado] = useState(null);
    const [alumnoId, setAlumnoId] = useState("");

    // alerta global
    const [popup, setPopup] = useState({
        open: false,
        loading: false,
        type: "info",
        titulo: "",
        mensaje: ""
    });

    // peticion de tutorias
    const { tutorias, loading, alumnos } = useTutorias(
        usuario,
        estado,
        alumnoId,
        setPopup
    );

    // seguridad si no hay usuario
    if (!usuario) {
        navigate("/");
        return null;
    }

    // clase segun estado de tutoria
    const getClaseEstado = (estado) => {
        switch (estado) {
            case "PENDIENTE": return "tutoria-pendiente";
            case "COMPLETADA": return "tutoria-completada";
            case "EDICION": return "tutoria-edicion";
            default: return "";
        }
    };

    return (
        <Layout>

            {/* contenedor general */}
            <div className="tutorias-cont">

                {/* header principal */}
                <div className="tutorias-head">
                    <Typography variant="h6" fontWeight="bold">
                        {usuario.id_rol === 2 ? "Historial de tutorías" : "Gestión de tutorías"}
                    </Typography>

                    {/* boton nueva tutoria (solo admin/tutor) */}
                    {usuario.id_rol !== 2 && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography>Nueva tutoría</Typography>

                            <IconButton
                                className="btn-add"
                                onClick={() => navigate("/Tutoria")}
                            >
                                <AddIcon />
                            </IconButton>
                        </Box>
                    )}
                </div>

                {/* cuerpo principal */}
                <div className="tutorias-body">

                    {/* boton de filtros */}
                    <Box className="tutorias-filtros">
                        <Typography>Filtrar</Typography>
                        <IconButton onClick={() => setOpenFiltro(true)}>
                            <FilterListIcon />
                        </IconButton>
                    </Box>

                    {/* lista de tutorias */}
                    <div className="tutorias-lista">

                        {loading ? (
                            // loading
                            <Box>Cargando...</Box>
                        ) : !Array.isArray(tutorias) || tutorias.length === 0 ? (
                            // sin datos
                            <Box>No hay tutorías</Box>
                        ) : (
                            tutorias.map((t) => (
                                    <Card key={t.idSesion} className={`tutoria-item ${getClaseEstado(t.estado)}`}>

                                    <CardContent className="tutorias-c" sx={{ padding: "0px !important" }}>

                                            <div className="tutoria-row">

                                                {/* izquierda */}
                                                <div className="tutoria-izq">
                                                    <strong>{t.motivo}</strong>
                                                </div>

                                                {/* derecha */}
                                                <div className="tutoria-der">
                                                    <span>{t.fecha}</span>
                                                    <span>{t.horaIni} - {t.horaFin}</span>
                                                </div>

                                                {/* accion */}
                                                <div className="tutoria-ctrl">
                                                    <IconButton onClick={() => navigate(`/Tutoria/${t.idSesion}`)}>
                                                        <Arrow />
                                                    </IconButton>
                                                </div>

                                            </div>
                                        </CardContent>
                                    </Card>
                            ))
                        )}

                    </div>
                </div>

                {/* modal de filtros */}
                <Modal open={openFiltro} onClose={() => setOpenFiltro(false)}>
                    <Box className="modal-filtro">

                        {/* titulo modal */}
                        <Typography variant="h6" mb={2}>
                            Filtrar tutorías
                        </Typography>

                        {/* filtro estado */}
                        <Typography mb={1}>Estado</Typography>

                        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {[
                                { label: "Todas", value: null },
                                { label: "Pendientes", value: "PENDIENTE" },
                                { label: "Edición", value: "EDICION" },
                                { label: "Completadas", value: "COMPLETADA" }
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

                        {/* filtro alumno (solo tutor/admin) */}
                        {usuario.id_rol !== 2 && (
                            <>
                                <Typography mb={1}>Alumno</Typography>

                                <FormControl fullWidth size="small">
                                    <InputLabel>Seleccionar alumno</InputLabel>
                                    <Select
                                        value={alumnoTemp}
                                        label="Seleccionar alumno"
                                        onChange={(e) => setAlumnoTemp(e.target.value)}
                                    >
                                        <MenuItem value="">Todos</MenuItem>

                                        {alumnos.map((a) => (
                                            <MenuItem key={a.id_alumno} value={a.id_alumno}>
                                                {a.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        )}

                        {/* aplicar filtros */}
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
                            Aplicar filtros
                        </Button>

                    </Box>
                </Modal>

            </div>

            {/* alerta global */}
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