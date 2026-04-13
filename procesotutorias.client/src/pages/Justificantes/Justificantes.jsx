import React, { useState } from "react";

import Layout from "../../componentes/layout";
import "../../assets/estilos/Tutorias.css";
import Alerta from "../../componentes/Alerta";
import JustificanteModal from "./Justificante";

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

import { useJustificantes } from "../../hooks/useJustificantes";

function Justificantes() {

    // usuario desde local storage
    const [usuario] = useState(() => {
        const u = localStorage.getItem("usuario");
        return u ? JSON.parse(u) : null;
    });

    // abrir modal de filtros
    const [openFiltro, setOpenFiltro] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selected, setSelected] = useState(null);

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
    const { justificantes, loading, alumnos } = useJustificantes(
        usuario,
        estado,
        alumnoId,
        setPopup
    );

    // clase segun estado de tutoria
    const getClaseEstado = (estado) => {
        switch (estado) {
            case "PENDIENTE": return "tutoria-pendiente";
            case "ACEPTADO": return "tutoria-completada";
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
                        {usuario.id_rol === 2 ? "Historial de Justificantes" : "Gestión de Justificantes"}
                    </Typography>

                    {/* boton jsutificante (solo alumno) */}
                    {usuario.id_rol === 2 && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography>Nuevo justificante</Typography>

                            <IconButton
                                className="btn-add"
                                onClick={() => {
                                    setSelected(null);
                                    setOpenModal(true);
                                }}
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
                        ) : !Array.isArray(justificantes) || justificantes.length === 0 ? (
                            // sin datos
                            <Box>No hay justificantes</Box>
                        ) : (
                            justificantes.map((j) => (
                                <Card key={j.idJustificante} className={`tutoria-item ${getClaseEstado(j.estado)}`}>

                                    <CardContent className="tutorias-c" sx={{ padding: "0px !important" }}>

                                            <div className="tutoria-row">

                                                {/* izquierda */}
                                                <div className="tutoria-izq">
                                                    <strong>{j.descripcion}</strong>
                                                </div>

                                                {/* derecha */}
                                                <div className="tutoria-der">
                                                    <span>{j.fecha}</span>
                                                </div>

                                                {/* accion */}
                                                <div className="tutoria-ctrl">
                                                <IconButton onClick={() => {
                                                    setSelected(j);
                                                    setOpenModal(true);
                                                }}>
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
                            Filtrar justificantes
                        </Typography>

                        {/* filtro estado */}
                        <Typography mb={1}>Estado</Typography>

                        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {[
                                { label: "Todos", value: null },
                                { label: "En revisión", value: "PENDIENTE" },
                                { label: "Aceptado", value: "ACEPTADO" }
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

            <JustificanteModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                usuario={usuario}
                data={selected}
            />

        </Layout>
    );
}

export default Justificantes;