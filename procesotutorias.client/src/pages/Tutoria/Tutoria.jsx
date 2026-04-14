import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useTutoria } from "../../hooks/useTutoria";

import "../../assets/estilos/tutoria.css";
import Layout from "../../componentes/Layout";

import { Box, Typography } from "@mui/material";

import Delete from "@mui/icons-material/DeleteForeverRounded";
import Alerta from "../../componentes/Alerta";
import Aceptar from "@mui/icons-material/DownloadDoneRounded";
import Edicion from "@mui/icons-material/PreviewRounded";

function Tutoria() {

    const navigate = useNavigate();
    const { id } = useParams();

    const [popup, setPopup] = useState({
        open: false,
        loading: false,
        type: "info",
        titulo: "",
        mensaje: ""
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

    const [usuario] = useState(() => {
        const u = localStorage.getItem("usuario");
        return u ? JSON.parse(u) : null;
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

    const {
        form,
        setForm,
        alumnos,
        grupo,
        guardarTutoria,
        eliminarTutoria,
        aceptarTutoria,
        solicitarEdicion
    } = useTutoria(usuario, id, setPopup);

    const handleMotivoChange = (value) => {
        if (form.motivo.includes(value)) {
            setForm({
                ...form,
                motivo: form.motivo.filter(m => m !== value)
            });
        } else {
            setForm({
                ...form,
                motivo: [...form.motivo, value]
            });
        }
    };

    const editable = !id || form?.estado?.toUpperCase() === "EDICION";

    return (
        <Layout>
            <div className="tutoria-cont">

                <h1>{id ? "Editar tutoría" : "Nueva tutoría"}</h1>

                <div className="tutoria-body">

                    <form onSubmit={(e) => {
                        e.preventDefault();

                        if (!form.alumnoId || !form.fecha || !form.horaIni || !form.horaFin) {
                            setPopup({
                                open: true,
                                loading: false,
                                type: "warning",
                                titulo: "Campos incompletos",
                                mensaje: "Llena los datos obligatorios"
                            });
                            return;
                        }

                        guardarTutoria();
                    }}>

                        <table>
                            <tbody>

                                <tr>
                                    <td colSpan="8">
                                        <h1>
                                            UNIVERSIDAD TECNOLÓGICA DE NAYARIT
                                            <br />
                                            CONTROL Y SEGUIMIENTO DE TUTORÍAS INDIVIDUALES
                                        </h1>
                                    </td>
                                </tr>

                                <tr>
                                    <th colSpan="4">CARRERA: {grupo?.carrera_nombre || ""}</th>
                                    <th colSpan="4">GRUPO: {grupo?.nombre || ""}</th>
                                </tr>

                                <tr>
                                    <td colSpan="8">
                                        <select
                                            value={form.alumnoId}
                                            disabled={!!id}
                                            onChange={(e) => setForm({ ...form, alumnoId: e.target.value })}
                                        >
                                            <option value="">Seleccione un alumno</option>
                                            {alumnos.map(a => (
                                                <option key={a.id_alumno} value={a.id_alumno}>
                                                    {a.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>

                                <tr className="fila-base">
                                    <td>FECHA:</td>
                                    <td>
                                        <input
                                            type="date"
                                            value={form.fecha}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                        />
                                    </td>

                                    <td>HR. INICIO:</td>
                                    <td colSpan="2">
                                        <input
                                            type="time"
                                            value={form.horaIni}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, horaIni: e.target.value })}
                                        />
                                    </td>

                                    <td>HR. SALIDA:</td>
                                    <td colSpan="2">
                                        <input
                                            type="time"
                                            value={form.horaFin}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                                        />
                                    </td>
                                </tr>

                                <tr className="fila-movil">
                                    <td colSpan="2">
                                        FECHA:
                                        <input
                                            type="date"
                                            value={form.fecha}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                        />
                                    </td>

                                    <td colSpan="3">
                                        HR. INICIO:
                                        <input
                                            type="time"
                                            value={form.horaIni}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, horaIni: e.target.value })}
                                        />
                                    </td>

                                    <td colSpan="3">
                                        HR. SALIDA:
                                        <input
                                            type="time"
                                            value={form.horaFin}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                                        />
                                    </td>
                                </tr>

                                <tr>
                                    <th colSpan="8">MOTIVO DE LA TUTORÍA:</th>
                                </tr>

                                <tr className="motivo">
                                    {MOTIVOS.slice(0, 4).map(m => (
                                        <td colSpan="2" key={m.value}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    disabled={!editable}
                                                    checked={form.motivo.includes(m.value)}
                                                    onChange={() => handleMotivoChange(m.value)}
                                                />
                                                {m.label}
                                            </label>
                                        </td>
                                    ))}
                                </tr>

                                <tr className="motivo">
                                    {MOTIVOS.slice(4).map(m => (
                                        <td colSpan="2" key={m.value}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    disabled={!editable}
                                                    checked={form.motivo.includes(m.value)}
                                                    onChange={() => handleMotivoChange(m.value)}
                                                />
                                                {m.label}
                                            </label>
                                        </td>
                                    ))}
                                </tr>

                                <tr>
                                    <th colSpan="8">
                                        <textarea
                                            placeholder="Puntos relevantes de la sesión"
                                            disabled={!editable}
                                            value={form.pts}
                                            onChange={(e) => setForm({ ...form, pts: e.target.value })}
                                            required
                                        />
                                    </th>
                                </tr>

                                <tr>
                                    <th colSpan="8">
                                        <textarea
                                            placeholder="Compromisos y acuerdos"
                                            disabled={!editable}
                                            value={form.acuerdos}
                                            onChange={(e) => setForm({ ...form, acuerdos: e.target.value })}
                                            required
                                        />
                                    </th>
                                </tr>

                                <tr className="firmas">
                                    <td colSpan="4">
                                        <div className="firma">Firma del tutor</div>
                                    </td>
                                    <td colSpan="4">
                                        <div className="firma">Firma del alumno</div>
                                    </td>
                                </tr>

                            </tbody>
                        </table>

                        <div className="acciones">

                            {usuario.id_rol === 3 && (!id || editable) && (
                                <Box className="accion-item" onClick={guardarTutoria}>
                                    <Aceptar />
                                    <Typography>Aplicar tutoría</Typography>
                                </Box>
                            )}

                            {id && usuario.id_rol === 2 && (
                                <Box className="accion-item" onClick={aceptarTutoria}>
                                    <Aceptar />
                                    <Typography>Aceptar tutoría</Typography>
                                </Box>
                            )}

                            {id && (
                                <Box className="accion-item" onClick={solicitarEdicion}>
                                    <Edicion />
                                    <Typography>Solicitar edición</Typography>
                                </Box>
                            )}

                            {id && usuario.id_rol !== 2 && (
                                <Box className="accion-item" onClick={eliminarTutoria}>
                                    <Delete />
                                    <Typography>Eliminar tutoría</Typography>
                                </Box>
                            )}

                        </div>

                    </form>
                </div>
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

export default Tutoria;