import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyIcon from "@mui/icons-material/Key";
import SaveIcon from "@mui/icons-material/Save";

import Layout from "../../componentes/layout";
import Alerta from "../../componentes/Alerta";
import { useAdminCatalogos } from "../../hooks/useAdministracion";
import "../../assets/estilos/Administracion.css";
import { useI18n } from "../../i18n/I18nContext";
import { translateRole } from "../../i18n/catalogTranslations";
import {
    sanitizeSingleLine,
    validateEmail,
    validatePassword,
    validatePersonName,
    validatePhone,
    validatePositiveInteger,
    validateFreeText
} from "../../utils/validation";
import { getAuthSession } from "../../auth/session";

const inicial = {
    idUsuario: null,
    nombre: "",
    apellidos: "",
    correo: "",
    telefono: "",
    idRol: "",
    contrasenaInicial: ""
};

function GestionUsuarios() {
    const { locale, t } = useI18n();
    const navigate = useNavigate();
    const usuario = getAuthSession()?.user;
    const { roles, usuarios, loading, error, cargarUsuarios, requestAdmin } = useAdminCatalogos();
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
        const errores = {
            nombre: validatePersonName(form.nombre, t),
            apellidos: validatePersonName(form.apellidos, t),
            correo: validateEmail(form.correo, t),
            telefono: validatePhone(form.telefono, t),
            idRol: validatePositiveInteger(form.idRol, t),
            contrasenaInicial: !form.idUsuario ? validatePassword(form.contrasenaInicial, t) : ""
        };
        Object.keys(errores).forEach((campo) => {
            if (!errores[campo]) delete errores[campo];
        });
        setFieldErrors(errores);
        return Object.keys(errores).length === 0;
    };

    const guardar = async (event) => {
        event.preventDefault();
        if (!validar()) return;

        try {
            const payload = {
                nombre: sanitizeSingleLine(form.nombre),
                apellidos: sanitizeSingleLine(form.apellidos),
                correo: sanitizeSingleLine(form.correo).toLowerCase(),
                telefono: sanitizeSingleLine(form.telefono),
                idRol: Number(form.idRol),
                contrasenaInicial: form.contrasenaInicial
            };

            const url = form.idUsuario ? `/Usuarios/${form.idUsuario}` : "/Usuarios";
            const method = form.idUsuario ? "PUT" : "POST";
            await requestAdmin(url, { method, body: JSON.stringify(payload) });
            await cargarUsuarios({ buscar: filtro });
            limpiar();
            mostrar("success", t("administration.users.savedTitle"), t("administration.savedMessage"));
        } catch (err) {
            mostrar("error", t("administration.saveFailed"), locale === "es-MX" ? err.message : t("common.requestFailed"));
        }
    };

    const editar = (item) => {
        setForm({
            idUsuario: item.idUsuario,
            nombre: item.nombre,
            apellidos: item.apellidos,
            correo: item.correo,
            telefono: item.telefono || "",
            idRol: item.idRol,
            contrasenaInicial: ""
        });
        setFieldErrors({});
    };

    const eliminar = async (item) => {
        try {
            await requestAdmin(`/Usuarios/${item.idUsuario}`, { method: "DELETE" });
            await cargarUsuarios({ buscar: filtro });
            mostrar("success", t("administration.users.deletedTitle"), t("administration.users.deletedMessage"));
        } catch (err) {
            mostrar("warning", t("administration.deleteFailed"), locale === "es-MX" ? err.message : t("common.requestFailed"));
        }
    };

    const restablecer = async (item) => {
        const nueva = window.prompt(t("administration.users.resetPrompt", { name: `${item.nombre} ${item.apellidos}` }));
        if (!nueva) return;
        const passwordError = validatePassword(nueva, t);
        if (passwordError) {
            mostrar("error", t("administration.users.resetFailed"), passwordError);
            return;
        }

        try {
            await requestAdmin(`/Usuarios/${item.idUsuario}/contrasena`, {
                method: "PUT",
                body: JSON.stringify({ contrasenaInicial: nueva })
            });
            await cargarUsuarios({ buscar: filtro });
            mostrar("success", t("administration.users.resetTitle"), t("administration.users.resetMessage"));
        } catch (err) {
            mostrar("error", t("administration.users.resetFailed"), locale === "es-MX" ? err.message : t("common.requestFailed"));
        }
    };

    const buscar = async (event) => {
        event.preventDefault();
        const filterError = validateFreeText(filtro, t, { required: false, maxLength: 100 });
        setFieldErrors((current) => ({ ...current, filtro: filterError }));
        if (filterError) return;
        await cargarUsuarios({ buscar: sanitizeSingleLine(filtro) });
    };

    return (
        <Layout contentClassName="admin-layout-gradient">
            <div className="admin-cont">
                <div className="admin-head">
                    <Typography variant="h6" fontWeight="bold">{t("administration.users.title")}</Typography>
                    <Button startIcon={<AddIcon />} onClick={limpiar}>{t("administration.users.new")}</Button>
                </div>

                <div className="admin-grid">
                    <div className="admin-panel">
                        <form className="admin-form" onSubmit={guardar}>
                            <Typography fontWeight="bold">{form.idUsuario ? t("administration.users.update") : t("administration.users.register")}</Typography>
                            <TextField label={t("administration.users.name")} value={form.nombre} onChange={(e) => actualizarForm("nombre", e.target.value)} required error={!!fieldErrors.nombre} helperText={fieldErrors.nombre} inputProps={{ maxLength: 80, "aria-invalid": !!fieldErrors.nombre }} />
                            <TextField label={t("administration.users.lastName")} value={form.apellidos} onChange={(e) => actualizarForm("apellidos", e.target.value)} required error={!!fieldErrors.apellidos} helperText={fieldErrors.apellidos} inputProps={{ maxLength: 80, "aria-invalid": !!fieldErrors.apellidos }} />
                            <TextField label={t("administration.users.email")} type="email" value={form.correo} onChange={(e) => actualizarForm("correo", e.target.value)} required error={!!fieldErrors.correo} helperText={fieldErrors.correo} inputProps={{ maxLength: 254, "aria-invalid": !!fieldErrors.correo }} />
                            <TextField label={t("administration.users.phone")} value={form.telefono} onChange={(e) => actualizarForm("telefono", e.target.value)} error={!!fieldErrors.telefono} helperText={fieldErrors.telefono} inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 10, "aria-invalid": !!fieldErrors.telefono }} />
                            <FormControl required error={!!fieldErrors.idRol}>
                                <InputLabel>{t("administration.users.role")}</InputLabel>
                                <Select label={t("administration.users.role")} value={form.idRol} onChange={(e) => actualizarForm("idRol", e.target.value)}>
                                    {roles.map((rol) => (
                                        <MenuItem key={rol.idRol} value={rol.idRol}>{translateRole(t, rol.nombre)}</MenuItem>
                                    ))}
                                </Select>
                                {fieldErrors.idRol && <Typography color="error" fontSize={12} mt={0.5}>{fieldErrors.idRol}</Typography>}
                            </FormControl>
                            {!form.idUsuario && (
                                <TextField label={t("administration.users.initialPassword")} type="password" value={form.contrasenaInicial} onChange={(e) => actualizarForm("contrasenaInicial", e.target.value)} required error={!!fieldErrors.contrasenaInicial} helperText={fieldErrors.contrasenaInicial} inputProps={{ minLength: 6, maxLength: 72, "aria-invalid": !!fieldErrors.contrasenaInicial }} />
                            )}
                            <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ backgroundColor: "#20A85E" }}>{t("administration.users.save")}</Button>
                        </form>
                    </div>

                    <div className="admin-panel">
                        {error && <Box className="admin-empty">{error}</Box>}
                        <Box component="form" className="admin-actions" onSubmit={buscar} mb={1}>
                            <TextField size="small" label={t("common.search")} value={filtro} onChange={(e) => { setFiltro(e.target.value); setFieldErrors((current) => ({ ...current, filtro: "" })); }} error={!!fieldErrors.filtro} helperText={fieldErrors.filtro} inputProps={{ maxLength: 100, "aria-invalid": !!fieldErrors.filtro }} />
                            <Button type="submit">{t("administration.filter")}</Button>
                        </Box>

                        <div className="admin-lista">
                            {loading ? (
                                <Box className="admin-empty">{t("administration.loading")}</Box>
                            ) : usuarios.length === 0 ? (
                                <Box className="admin-empty">{t("administration.users.empty")}</Box>
                            ) : usuarios.map((item) => (
                                <Card key={item.idUsuario} className="admin-item">
                                    <CardContent sx={{ padding: "10px !important" }}>
                                        <div className="admin-row">
                                            <Box>
                                                <div className="admin-name-line">
                                                    <Typography fontWeight="bold">{item.nombre} {item.apellidos}</Typography>
                                                    <span className="admin-chip">{translateRole(t, item.rol)}</span>
                                                </div>
                                                <div className="admin-meta">
                                                    <span>{item.correo}</span>
                                                    {item.reqCambioContra && <span className="admin-chip warning">{t("administration.users.pendingChange")}</span>}
                                                </div>
                                            </Box>
                                            <Box>
                                                <Button startIcon={<EditIcon />} onClick={() => editar(item)}>{t("common.edit")}</Button>
                                                <Button startIcon={<KeyIcon />} onClick={() => restablecer(item)}>{t("administration.users.password")}</Button>
                                                <Button color="error" startIcon={<DeleteIcon />} onClick={() => eliminar(item)}>{t("common.delete")}</Button>
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

export default GestionUsuarios;
