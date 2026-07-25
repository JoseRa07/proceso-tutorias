import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useTutoria } from "../../hooks/useTutoria";

import "../../assets/estilos/tutoria.css";
import Layout from "../../componentes/layout";

import {
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";

import Delete from "@mui/icons-material/DeleteForeverRounded";
import CloseIcon from "@mui/icons-material/Close";
import Alerta from "../../componentes/Alerta";
import Aceptar from "@mui/icons-material/DownloadDoneRounded";
import Edicion from "@mui/icons-material/PreviewRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import { useI18n } from "../../i18n/I18nContext";

const MOTIVO_VALUES = [
    "REPROBACION",
    "AUSENTISMO",
    "PROBLEMAS_ECONOMICOS",
    "INDISCIPLINA",
    "PROBLEMAS_PERSONALES",
    "IMPUNTUALIDAD",
    "FALTA_COMPROMISO",
    "FALTA_ATENCION"
];

function Tutoria({
    modal = false,
    id: idProp,
    onClose,
    onSaved,
    initialAlumnoId = "",
    initialSeguimientoId = "",
    initialSeguimientoTitulo = "",
    hideClose = false,
    showActions = true,
    showFollowupControls = true
}) {
    const navigate = useNavigate();
    const params = useParams();
    const id = idProp ?? params.id;
    const { t } = useI18n();
    const motivos = MOTIVO_VALUES.map((value) => ({
        value,
        label: t(`tutoring.reasons.${value}`)
    }));

    const [popup, setPopup] = useState({
        open: false,
        loading: false,
        type: "info",
        titulo: "",
        mensaje: ""
    });

    const [usuario] = useState(() => {
        const u = localStorage.getItem("usuario");
        return u ? JSON.parse(u) : null;
    });

    useEffect(() => {
        if (modal) return;

        if (!usuario) {
            navigate("/");
            return;
        }

        const rolesPermitidos = [2, 3];

        if (!rolesPermitidos.includes(usuario.id_rol)) {
            navigate("/panel");
        }
    }, [usuario, navigate, modal]);

    const {
        form,
        setForm,
        alumnos,
        grupo,
        loading,
        loadingSeguimientos,
        seguimientos,
        guardarTutoria,
        guardarVinculacion,
        eliminarTutoria,
        aceptarTutoria,
        solicitarEdicion
    } = useTutoria(
        usuario,
        id,
        setPopup,
        onSaved,
        initialAlumnoId,
        initialSeguimientoId,
        initialSeguimientoTitulo
    );

    const handleMotivoChange = (value) => {
        if (form.motivo.includes(value)) {
            setForm({
                ...form,
                motivo: form.motivo.filter(m => m !== value)
            });
            return;
        }

        setForm({
            ...form,
            motivo: [...form.motivo, value]
        });
    };

    const validarCampos = () => {
        if (!form.alumnoId || !form.fecha || !form.horaIni || !form.horaFin) {
            setPopup({
                open: true,
                loading: false,
                type: "warning",
                titulo: t("common.requiredFieldsTitle"),
                mensaje: t("common.requiredFieldsMessage")
            });
            return false;
        }

        const requiereTitulo = form.seguimientoActivo &&
            (!form.seguimientoId || form.seguimientoId === "__nuevo__") &&
            !form.seguimientoTitulo.trim();

        if (requiereTitulo) {
            setPopup({
                open: true,
                loading: false,
                type: "warning",
                titulo: t("followup.form.requiredTitle"),
                mensaje: t("followup.form.requiredMessage")
            });
            return false;
        }

        return true;
    };

    const validarYGuardar = (event) => {
        event.preventDefault();
        if (!validarCampos()) return;
        guardarTutoria();
    };

    const validarYGuardarVinculacion = () => {
        const requiereTitulo = form.seguimientoActivo &&
            (!form.seguimientoId || form.seguimientoId === "__nuevo__") &&
            !form.seguimientoTitulo.trim();

        if (requiereTitulo) {
            setPopup({
                open: true,
                loading: false,
                type: "warning",
                titulo: t("followup.form.requiredTitle"),
                mensaje: t("followup.form.requiredMessage")
            });
            return;
        }

        guardarVinculacion();
    };

    const editable = !id || form?.estado?.toUpperCase() === "EDICION";

    const contenido = (
        <div className={modal ? "tutoria-cont tutoria-cont-modal" : "tutoria-cont"}>
            <div className="tutoria-titlebar">
                <Typography variant="h6" fontWeight="bold">
                    {id ? t("tutoring.editTitle") : t("tutoring.new")}
                </Typography>

                {modal && !hideClose && (
                    <IconButton onClick={onClose} aria-label={t("tutoring.close")}>
                        <CloseIcon />
                    </IconButton>
                )}
            </div>

            <div className="tutoria-body">
                {loading ? (
                    <Box className="tutoria-loading">
                        <CircularProgress />
                        <Typography>{t("tutoring.loading")}</Typography>
                    </Box>
                ) : (
                    <form onSubmit={validarYGuardar}>
                        <table>
                            <tbody>
                                <tr>
                                    <td colSpan="8">
                                        <h1>
                                            {t("common.university").toUpperCase()}
                                            <br />
                                            {t("tutoring.documentTitle")}
                                        </h1>
                                    </td>
                                </tr>

                                <tr>
                                    <th colSpan="4">{t("tutoring.program")}: {grupo?.carrera_nombre || ""}</th>
                                    <th colSpan="4">{t("tutoring.group")}: {grupo?.nombre || ""}</th>
                                </tr>

                                <tr>
                                    <td colSpan="8">
                                        <select
                                            value={form.alumnoId}
                                            disabled={!!id}
                                            onChange={(e) => setForm({
                                                ...form,
                                                alumnoId: e.target.value,
                                                seguimientoActivo: false,
                                                seguimientoId: "",
                                                seguimientoTitulo: "",
                                                seguimientoDescripcion: ""
                                            })}
                                        >
                                            <option value="">{t("tutoring.selectStudent")}</option>
                                            {alumnos.map(a => (
                                                <option key={a.id_alumno} value={a.id_alumno}>
                                                    {a.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>

                                <tr className="fila-base">
                                    <td>{t("tutoring.date")}:</td>
                                    <td>
                                        <input
                                            type="date"
                                            value={form.fecha}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                        />
                                    </td>

                                    <td>{t("tutoring.startTime")}:</td>
                                    <td colSpan="2">
                                        <input
                                            type="time"
                                            value={form.horaIni}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, horaIni: e.target.value })}
                                        />
                                    </td>

                                    <td>{t("tutoring.endTime")}:</td>
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
                                        {t("tutoring.date")}:
                                        <input
                                            type="date"
                                            value={form.fecha}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                        />
                                    </td>

                                    <td colSpan="3">
                                        {t("tutoring.startTime")}:
                                        <input
                                            type="time"
                                            value={form.horaIni}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, horaIni: e.target.value })}
                                        />
                                    </td>

                                    <td colSpan="3">
                                        {t("tutoring.endTime")}:
                                        <input
                                            type="time"
                                            value={form.horaFin}
                                            disabled={!editable}
                                            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                                        />
                                    </td>
                                </tr>

                                <tr>
                                    <th colSpan="8">{t("tutoring.reason")}:</th>
                                </tr>

                                <tr className="motivo">
                                    {motivos.slice(0, 4).map(m => (
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
                                    {motivos.slice(4).map(m => (
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
                                            placeholder={t("tutoring.relevantPoints")}
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
                                            placeholder={t("tutoring.commitments")}
                                            disabled={!editable}
                                            value={form.acuerdos}
                                            onChange={(e) => setForm({ ...form, acuerdos: e.target.value })}
                                            required
                                        />
                                    </th>
                                </tr>

                                <tr className="firmas">
                                    <td colSpan="4">
                                        <div className="firma">{t("tutoring.tutorSignature")}</div>
                                    </td>
                                    <td colSpan="4">
                                        <div className="firma">{t("tutoring.studentSignature")}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {usuario.id_rol === 3 && showFollowupControls && (
                            <Box className="tutoria-followup">
                                <Box className="tutoria-followup-heading">
                                    <Box className="tutoria-followup-icon" aria-hidden="true">
                                        <TrackChangesRoundedIcon />
                                    </Box>
                                    <Box>
                                        <Typography fontWeight="bold">
                                            {t("followup.form.sectionTitle")}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t("followup.form.sectionDescription")}
                                        </Typography>
                                    </Box>
                                </Box>

                                <FormControlLabel
                                    control={(
                                        <Checkbox
                                            checked={form.seguimientoActivo}
                                            onChange={(event) => setForm({
                                                ...form,
                                                seguimientoActivo: event.target.checked,
                                                seguimientoId: event.target.checked
                                                    ? (form.seguimientoId || "__nuevo__")
                                                    : "",
                                                seguimientoTitulo: event.target.checked
                                                    ? form.seguimientoTitulo
                                                    : "",
                                                seguimientoDescripcion: event.target.checked
                                                    ? form.seguimientoDescripcion
                                                    : ""
                                            })}
                                        />
                                    )}
                                    label={t("followup.form.enable")}
                                />

                                {form.seguimientoActivo && (
                                    <Box className="tutoria-followup-fields">
                                        <FormControl fullWidth size="small">
                                            <InputLabel>{t("followup.form.selectLabel")}</InputLabel>
                                            <Select
                                                value={form.seguimientoId || "__nuevo__"}
                                                label={t("followup.form.selectLabel")}
                                                disabled={loadingSeguimientos || !form.alumnoId}
                                                onChange={(event) => {
                                                    const selectedId = event.target.value;
                                                    const selected = seguimientos.find(
                                                        (item) => item.idSeguimiento === Number(selectedId)
                                                    );
                                                    setForm({
                                                        ...form,
                                                        seguimientoId: selectedId,
                                                        seguimientoTitulo: selected?.titulo || "",
                                                        seguimientoDescripcion: selected?.descripcion || ""
                                                    });
                                                }}
                                            >
                                                <MenuItem value="__nuevo__">
                                                    {t("followup.form.newOption")}
                                                </MenuItem>
                                                {seguimientos
                                                    .filter((item) =>
                                                        item.estado === "ACTIVO" ||
                                                        item.idSeguimiento === Number(form.seguimientoId)
                                                    )
                                                    .map((item) => (
                                                        <MenuItem key={item.idSeguimiento} value={item.idSeguimiento}>
                                                            {item.titulo}
                                                        </MenuItem>
                                                    ))}
                                            </Select>
                                        </FormControl>

                                        {loadingSeguimientos && (
                                            <Typography variant="caption" color="text.secondary">
                                                {t("followup.form.loadingOptions")}
                                            </Typography>
                                        )}

                                        {!loadingSeguimientos &&
                                            form.alumnoId &&
                                            seguimientos.filter((item) => item.estado === "ACTIVO").length === 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {t("followup.form.noActiveOptions")}
                                                </Typography>
                                            )}

                                        {(!form.seguimientoId || form.seguimientoId === "__nuevo__") ? (
                                            <>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label={t("followup.form.titleLabel")}
                                                    placeholder={t("followup.form.titlePlaceholder")}
                                                    value={form.seguimientoTitulo}
                                                    inputProps={{ maxLength: 150 }}
                                                    onChange={(event) => setForm({
                                                        ...form,
                                                        seguimientoTitulo: event.target.value
                                                    })}
                                                />
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    minRows={2}
                                                    label={t("followup.form.descriptionLabel")}
                                                    placeholder={t("followup.form.descriptionPlaceholder")}
                                                    value={form.seguimientoDescripcion}
                                                    inputProps={{ maxLength: 500 }}
                                                    onChange={(event) => setForm({
                                                        ...form,
                                                        seguimientoDescripcion: event.target.value
                                                    })}
                                                />
                                            </>
                                        ) : (
                                            <Chip
                                                className="tutoria-followup-current"
                                                label={t("followup.form.current", {
                                                    title: form.seguimientoTitulo
                                                })}
                                            />
                                        )}
                                    </Box>
                                )}

                                {id && !editable && (
                                    <Button
                                        variant="contained"
                                        className="tutoria-followup-save"
                                        onClick={validarYGuardarVinculacion}
                                    >
                                        {t("followup.form.saveLink")}
                                    </Button>
                                )}
                            </Box>
                        )}

                        {showActions && (
                        <div className="acciones">
                            {usuario.id_rol === 3 && (!id || editable) && (
                                <Box className="accion-item" onClick={validarYGuardar}>
                                    <Aceptar />
                                    <Typography>{t("tutoring.apply")}</Typography>
                                </Box>
                            )}

                            {id && usuario.id_rol === 2 && (
                                <Box className="accion-item" onClick={aceptarTutoria}>
                                    <Aceptar />
                                    <Typography>{t("tutoring.accept")}</Typography>
                                </Box>
                            )}

                            {id && (
                                <Box className="accion-item" onClick={solicitarEdicion}>
                                    <Edicion />
                                    <Typography>{t("tutoring.requestEdit")}</Typography>
                                </Box>
                            )}

                            {id && usuario.id_rol !== 2 && (
                                <Box className="accion-item" onClick={eliminarTutoria}>
                                    <Delete />
                                    <Typography>{t("tutoring.remove")}</Typography>
                                </Box>
                            )}
                        </div>
                        )}
                    </form>
                )}
            </div>

            <Alerta
                open={popup.open}
                loading={popup.loading}
                type={popup.type}
                titulo={popup.titulo}
                mensaje={popup.mensaje}
                onClose={() => setPopup(prev => ({ ...prev, open: false }))}
            />
        </div>
    );

    if (modal) return contenido;

    return (
        <Layout>
            {contenido}
        </Layout>
    );
}

export default Tutoria;
