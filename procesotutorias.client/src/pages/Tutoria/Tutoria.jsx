import { useState } from "react";
import { useTutoria } from "../../hooks/useTutoria";
import "../../assets/estilos/tutoria.css";
import Layout from "../../componentes/Layout";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import Delete from "@mui/icons-material/DeleteForeverRounded";
import Alerta from "../../componentes/Alerta";
import Aceptar from "@mui/icons-material/DownloadDoneRounded";

function Tutoria() {
    const { id } = useParams();
    const [usuario] = useState(() => JSON.parse(localStorage.getItem("usuario")));
    const [popup, setPopup] = useState({ open: false, loading: false, type: "info", titulo: "", mensaje: "" });

    const [form, setForm] = useState({
        alumnoId: "",
        nombreAlumno: "",
        fecha: "",
        horaIni: "",
        horaFin: "",
        motivo: [],
        pts: "",
        acuerdos: "",
        estado: ""
    });

    const { alumnos, grupo, guardarTutoria, eliminarTutoria } = useTutoria(usuario, id, setPopup, () => {
        window.location.reload();
    });

    const MOTIVOS = [
        { value: "REPROBACION", label: "Reprobación" },
        { value: "AUSENTISMO", label: "Ausentismo" },
        { value: "PROBLEMAS_ECONOMICOS", label: "Problemas Económicos" },
        { value: "INDISCIPLINA", label: "Indisciplina" },
        { value: "PROBLEMAS_PERSONALES", label: "Problemas personales" },
        { value: "IMPUNTUALIDAD", label: "Impuntualidad" },
        { value: "FALTA_COMPROMISO", label: "Falta de compromiso" },
        { value: "FALTA_ATENCION", label: "Falta de atención" }
    ];

    const handleMotivoChange = (value) => {
        setForm(prev => ({
            ...prev,
            motivo: prev.motivo.includes(value)
                ? prev.motivo.filter(m => m !== value)
                : [...prev.motivo, value]
        }));
    };

    const editable = !id || form?.estado?.toUpperCase() === "EDICION";

    return (
        <Layout>
            <div className="tutoria-cont">
                <div className="tutoria-body">
                    <form onSubmit={(e) => { e.preventDefault(); guardarTutoria(); }}>
                        <table>
                            <tbody>
                                <tr>
                                    <th colSpan="4">CARRERA: {grupo?.carrera_nombre || ""}</th>
                                    <th colSpan="4">GRUPO: {grupo?.nombre || ""}</th>
                                </tr>
                                <tr>
                                    <td colSpan="8">
                                        <select
                                            value={form.alumnoId}
                                            onChange={(e) => setForm({ ...form, alumnoId: e.target.value })}
                                            disabled={!!id}
                                        >
                                            <option value="">Seleccione alumno</option>
                                            {alumnos.map(a => <option key={a.id_alumno} value={a.id_alumno}>{a.nombre}</option>)}
                                        </select>
                                    </td>
                                </tr>
                                <tr className="fila-base">
                                    <td>FECHA:</td>
                                    <td><input type="date" value={form.fecha} disabled={!editable} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></td>
                                    <td>HR. INICIO:</td>
                                    <td><input type="time" value={form.horaIni} disabled={!editable} onChange={(e) => setForm({ ...form, horaIni: e.target.value })} /></td>
                                    <td>HR. SALIDA:</td>
                                    <td><input type="time" value={form.horaFin} disabled={!editable} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} /></td>
                                </tr>
                                <tr><th colSpan="8">MOTIVO:</th></tr>
                                <tr className="motivo">
                                    {MOTIVOS.map(m => (
                                        <td colSpan="2" key={m.value}>
                                            <label>
                                                <input type="checkbox" disabled={!editable} checked={form.motivo.includes(m.value)} onChange={() => handleMotivoChange(m.value)} />
                                                {m.label}
                                            </label>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <th colSpan="8">
                                        <textarea value={form.pts} disabled={!editable} onChange={(e) => setForm({ ...form, pts: e.target.value })} placeholder="Puntos relevantes" />
                                    </th>
                                </tr>
                                <tr>
                                    <th colSpan="8">
                                        <textarea value={form.acuerdos} disabled={!editable} onChange={(e) => setForm({ ...form, acuerdos: e.target.value })} placeholder="Acuerdos" />
                                    </th>
                                </tr>
                            </tbody>
                        </table>
                        <div className="acciones">
                            {editable && (
                                <Box className="accion-item" onClick={guardarTutoria}>
                                    <Aceptar /><Typography>Guardar</Typography>
                                </Box>
                            )}
                            {id && usuario.id_rol !== 2 && (
                                <Box className="accion-item" onClick={eliminarTutoria}>
                                    <Delete /><Typography>Eliminar</Typography>
                                </Box>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            <Alerta open={popup.open} loading={popup.loading} type={popup.type} titulo={popup.titulo} mensaje={popup.mensaje} onClose={() => setPopup({ ...popup, open: false })} />
        </Layout>
    );
}

export default Tutoria;