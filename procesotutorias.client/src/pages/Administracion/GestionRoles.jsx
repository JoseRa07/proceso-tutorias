import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    TextField,
    Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

import Layout from "../../componentes/layout";
import Alerta from "../../componentes/Alerta";
import { useAdminCatalogos } from "../../hooks/useAdministracion";
import "../../assets/estilos/Administracion.css";
import { useI18n } from "../../i18n/I18nContext";
import { translateRole } from "../../i18n/catalogTranslations";
import { sanitizeSingleLine, validateIdentifier } from "../../utils/validation";
import { getAuthSession } from "../../auth/session";

function GestionRoles() {
    const { locale, t } = useI18n();
    const navigate = useNavigate();
    const usuario = getAuthSession()?.user;
    const { roles, loading, error, cargarRoles, requestAdmin } = useAdminCatalogos();
    const [form, setForm] = useState({ idRol: null, nombre: "" });
    const [fieldError, setFieldError] = useState("");
    const [popup, setPopup] = useState({ open: false, loading: false, type: "info", titulo: "", mensaje: "" });

    const mostrar = useCallback((type, titulo, mensaje) => {
        setPopup({ open: true, loading: false, type, titulo, mensaje });
    }, []);

    useEffect(() => {
        if (!usuario) navigate("/");
        if (usuario && usuario.id_rol !== 1) navigate("/Panel");
    }, [usuario, navigate]);

    const limpiar = () => {
        setForm({ idRol: null, nombre: "" });
        setFieldError("");
    };

    const guardar = async (event) => {
        event.preventDefault();
        const validationError = validateIdentifier(form.nombre, t, {
            maxLength: 50,
            roleName: true
        });
        if (validationError) {
            setFieldError(validationError);
            return;
        }

        try {
            const url = form.idRol ? `/Roles/${form.idRol}` : "/Roles";
            const method = form.idRol ? "PUT" : "POST";
            await requestAdmin(url, {
                method,
                body: JSON.stringify({ nombre: sanitizeSingleLine(form.nombre).toUpperCase() })
            });
            await cargarRoles();
            limpiar();
            mostrar("success", t("administration.roles.savedTitle"), t("administration.savedMessage"));
        } catch (err) {
            mostrar("error", t("administration.saveFailed"), locale === "es-MX" ? err.message : t("common.requestFailed"));
        }
    };

    const eliminar = async (rol) => {
        try {
            await requestAdmin(`/Roles/${rol.idRol}`, { method: "DELETE" });
            await cargarRoles();
            mostrar("success", t("administration.roles.deletedTitle"), t("administration.roles.deletedMessage"));
        } catch (err) {
            mostrar("warning", t("administration.deleteFailed"), locale === "es-MX" ? err.message : t("common.requestFailed"));
        }
    };

    return (
        <Layout contentClassName="admin-layout-gradient">
            <div className="admin-cont">
                <div className="admin-head">
                    <Typography variant="h6" fontWeight="bold">{t("administration.roles.title")}</Typography>
                    <Button startIcon={<AddIcon />} onClick={limpiar}>{t("administration.roles.new")}</Button>
                </div>

                <div className="admin-grid">
                    <div className="admin-panel">
                        <form className="admin-form" onSubmit={guardar}>
                            <Typography fontWeight="bold">{form.idRol ? t("administration.roles.update") : t("administration.roles.new")}</Typography>
                            <TextField
                                label={t("administration.roles.name")}
                                value={form.nombre}
                                onChange={(e) => {
                                    setForm({ ...form, nombre: e.target.value });
                                    setFieldError("");
                                }}
                                required
                                error={!!fieldError}
                                helperText={fieldError}
                                inputProps={{ maxLength: 50, "aria-invalid": !!fieldError }}
                            />
                            <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ backgroundColor: "#20A85E" }}>
                                {t("administration.roles.save")}
                            </Button>
                        </form>
                    </div>

                    <div className="admin-panel">
                        {error && <Box className="admin-empty">{error}</Box>}
                        <div className="admin-lista">
                            {loading ? (
                                <Box className="admin-empty">{t("administration.loading")}</Box>
                            ) : roles.length === 0 ? (
                                <Box className="admin-empty">{t("administration.roles.empty")}</Box>
                            ) : roles.map((rol) => (
                                <Card key={rol.idRol} className="admin-item">
                                    <CardContent sx={{ padding: "10px !important" }}>
                                        <div className="admin-row">
                                            <Box>
                                                <Typography fontWeight="bold">{translateRole(t, rol.nombre)}</Typography>
                                                <div className="admin-meta">
                                                    <span>{t("administration.roles.assignedUsers")}: {rol.totalUsuarios}</span>
                                                </div>
                                            </Box>
                                            <Box>
                                                <IconButton onClick={() => setForm({ idRol: rol.idRol, nombre: rol.nombre })} aria-label={t("administration.roles.editLabel")}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => eliminar(rol)} aria-label={t("administration.roles.deleteLabel")}>
                                                    <DeleteIcon />
                                                </IconButton>
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

export default GestionRoles;
