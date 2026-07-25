import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import SaveIcon from "@mui/icons-material/Save";

import Layout from "../../componentes/layout";
import Alerta from "../../componentes/Alerta";
import { useAdminCatalogos, useAdminTutores } from "../../hooks/useAdministracion";
import "../../assets/estilos/Administracion.css";
import { useI18n } from "../../i18n/I18nContext";

const hoy = new Date().toISOString().split("T")[0];

const inicial = {
    idMaestro: null,
    idUsuario: "",
    codEmpleado: "",
    vigencia: hoy,
    activarComoTutor: true
};

function GestionTutores() {
    const { formatDate, locale, t } = useI18n();
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const { candidatosTutor, cargarCandidatosTutor } = useAdminCatalogos();
    const { tutores, loading, error, cargarTutores, requestAdmin } = useAdminTutores();
    const [form, setForm] = useState(inicial);
    const [filtro, setFiltro] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [popup, setPopup] = useState({ open: false, loading: false, type: "info", titulo: "", mensaje: "" });

    const mostrar = useCallback((type, titulo, mensaje) => {
        setPopup({ open: true, loading: false, type, titulo, mensaje });
    }, []);

    useEffect(() => {
        if (!usuario) navigate("/");
        if (usuario && usuario.id_rol !== 1) navigate("/Panel");
    }, [usuario, navigate]);

    const actualizarForm = (campo, valor) => {
        setForm({ ...form, [campo]: valor });
        setFieldErrors({ ...fieldErrors, [campo]: "" });
    };

    const limpiar = () => {
        setForm(inicial);
        setFieldErrors({});
    };

    const validar = () => {
        const errores = {};
        if (!form.idMaestro && !form.idUsuario) errores.idUsuario = t("administration.tutors.userRequired");
        if (!form.codEmpleado.trim()) errores.codEmpleado = t("administration.tutors.codeRequired");
        if (!form.vigencia) errores.vigencia = t("administration.tutors.dateRequired");
        setFieldErrors(errores);
        return Object.keys(errores).length === 0;
    };

    const guardar = async (event) => {
        event.preventDefault();
        if (!validar()) return;

        try {
            if (form.idMaestro) {
                await requestAdmin(`/Tutores/${form.idMaestro}`, {
                    method: "PUT",
                    body: JSON.stringify({ codEmpleado: form.codEmpleado, vigencia: form.vigencia })
                });
            } else {
                await requestAdmin("/Tutores", {
                    method: "POST",
                    body: JSON.stringify({
                        idUsuario: Number(form.idUsuario),
                        codEmpleado: form.codEmpleado,
                        vigencia: form.vigencia,
                        activarComoTutor: form.activarComoTutor
                    })
                });
            }

            await Promise.all([cargarTutores(filtro), cargarCandidatosTutor()]);
            limpiar();
            mostrar("success", t("administration.tutors.savedTitle"), t("administration.tutors.savedMessage"));
        } catch (err) {
            mostrar("error", t("administration.saveFailed"), locale === "es-MX" ? err.message : t("common.requestFailed"));
        }
    };

    const editar = (item) => {
        setForm({
            idMaestro: item.idMaestro,
            idUsuario: item.idUsuario,
            codEmpleado: item.codEmpleado,
            vigencia: item.vigencia,
            activarComoTutor: item.esTutor
        });
        setFieldErrors({});
    };

    const activar = async (item) => {
        try {
            await requestAdmin(`/Tutores/${item.idMaestro}/activar`, { method: "PUT" });
            await cargarTutores(filtro);
            mostrar("success", t("administration.tutors.activatedTitle"), t("administration.tutors.activatedMessage"));
        } catch (err) {
            mostrar("error", t("administration.tutors.activateFailed"), locale === "es-MX" ? err.message : t("common.requestFailed"));
        }
    };

    const desactivar = async (item) => {
        try {
            await requestAdmin(`/Tutores/${item.idTutor}/desactivar`, { method: "PUT" });
            await cargarTutores(filtro);
            mostrar("success", t("administration.tutors.deactivatedTitle"), t("administration.tutors.deactivatedMessage"));
        } catch (err) {
            mostrar("warning", t("administration.tutors.deactivateFailed"), locale === "es-MX" ? err.message : t("common.requestFailed"));
        }
    };

    const buscar = async (event) => {
        event.preventDefault();
        await cargarTutores(filtro);
    };

    return (
        <Layout contentClassName="admin-layout-gradient">
            <div className="admin-cont">
                <div className="admin-head">
                    <Typography variant="h6" fontWeight="bold">{t("administration.tutors.title")}</Typography>
                    <Button startIcon={<AddIcon />} onClick={limpiar}>{t("administration.tutors.new")}</Button>
                </div>

                <div className="admin-grid">
                    <div className="admin-panel">
                        <form className="admin-form" onSubmit={guardar}>
                            <Typography fontWeight="bold">{form.idMaestro ? t("administration.tutors.update") : t("administration.tutors.register")}</Typography>
                            {!form.idMaestro && (
                                <FormControl required error={!!fieldErrors.idUsuario}>
                                    <InputLabel>{t("administration.tutors.user")}</InputLabel>
                                    <Select label={t("administration.tutors.user")} value={form.idUsuario} onChange={(e) => actualizarForm("idUsuario", e.target.value)}>
                                        {candidatosTutor.map((item) => (
                                            <MenuItem key={item.idUsuario} value={item.idUsuario}>
                                                {item.nombreCompleto} - {item.correo}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {fieldErrors.idUsuario && <Typography color="error" fontSize={12} mt={0.5}>{fieldErrors.idUsuario}</Typography>}
                                </FormControl>
                            )}
                            <TextField label={t("administration.tutors.employeeCode")} value={form.codEmpleado} onChange={(e) => actualizarForm("codEmpleado", e.target.value)} required error={!!fieldErrors.codEmpleado} helperText={fieldErrors.codEmpleado} />
                            <TextField label={t("administration.tutors.validUntil")} type="date" value={form.vigencia} onChange={(e) => actualizarForm("vigencia", e.target.value)} required error={!!fieldErrors.vigencia} helperText={fieldErrors.vigencia} InputLabelProps={{ shrink: true }} />
                            {!form.idMaestro && (
                                <FormControlLabel
                                    control={<Checkbox checked={form.activarComoTutor} onChange={(e) => actualizarForm("activarComoTutor", e.target.checked)} />}
                                    label={t("administration.tutors.enableTutor")}
                                />
                            )}
                            <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ backgroundColor: "#20A85E" }}>{t("administration.tutors.save")}</Button>
                        </form>
                    </div>

                    <div className="admin-panel">
                        {error && <Box className="admin-empty">{error}</Box>}
                        <Box component="form" className="admin-actions" onSubmit={buscar} mb={1}>
                            <TextField size="small" label={t("common.search")} value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                            <Button type="submit">{t("administration.filter")}</Button>
                        </Box>

                        <div className="admin-lista">
                            {loading ? (
                                <Box className="admin-empty">{t("administration.loading")}</Box>
                            ) : tutores.length === 0 ? (
                                <Box className="admin-empty">{t("administration.tutors.empty")}</Box>
                            ) : tutores.map((item) => (
                                <Card key={item.idMaestro} className={`admin-item ${item.esTutor ? "" : "inactivo"}`}>
                                    <CardContent sx={{ padding: "10px !important" }}>
                                        <div className="admin-row">
                                            <Box>
                                                <Typography fontWeight="bold">{item.nombreCompleto}</Typography>
                                                <div className="admin-meta">
                                                    <span>{item.correo}</span>
                                                    <span>{item.codEmpleado}</span>
                                                    <span>{t("administration.tutors.validUntil")}: {formatDate(item.vigencia)}</span>
                                                    <span className={`admin-chip ${item.esTutor ? "" : "warning"}`}>{item.esTutor ? t("administration.tutors.tutor") : t("administration.tutors.teacher")}</span>
                                                    <span>{t("administration.tutors.groups")}: {item.totalGrupos}</span>
                                                    <span>{t("administration.tutors.sessions")}: {item.totalTutorias}</span>
                                                </div>
                                            </Box>
                                            <Box>
                                                <Button startIcon={<EditIcon />} onClick={() => editar(item)}>{t("common.edit")}</Button>
                                                {item.esTutor ? (
                                                    <Button color="warning" startIcon={<PersonOffIcon />} onClick={() => desactivar(item)}>{t("administration.tutors.deactivate")}</Button>
                                                ) : (
                                                    <Button startIcon={<PersonAddAlt1Icon />} onClick={() => activar(item)}>{t("administration.tutors.activate")}</Button>
                                                )}
                                            </Box>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Alerta open={popup.open} loading={popup.loading} type={popup.type} titulo={popup.titulo} mensaje={popup.mensaje} onClose={() => setPopup({ ...popup, open: false })} />
        </Layout>
    );
}

export default GestionTutores;
