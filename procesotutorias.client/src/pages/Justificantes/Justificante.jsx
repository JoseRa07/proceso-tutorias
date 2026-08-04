import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Divider,
    Modal,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

import Alerta from "../../componentes/Alerta";
import { useJustificante } from "../../hooks/useJustificante";
import { useI18n } from "../../i18n/I18nContext";
import { API_URL } from "../../api";
import {
    getLocalDateValue,
    sanitizeMultiline,
    validateDate,
    validateFreeText
} from "../../utils/validation";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_COUNT = 10;
const ALLOWED_FILE_PATTERN = /\.(jpe?g|png|webp|pdf)$/i;

function Justificante({ open, usuario, data, onClose, onSaved }) {
    const { t } = useI18n();
    const [form, setForm] = useState({
        descripcion: data?.descripcion || "",
        fecha: data?.fecha || "",
        archivos: []
    });
    const [errores, setErrores] = useState({});
    const [popup, setPopup] = useState({
        open: false,
        loading: false,
        type: "info",
        titulo: "",
        mensaje: ""
    });

    const { crear, aceptar, loading, getErrorMessage } = useJustificante(() => {
        onSaved?.();
    });

    const abrirArchivo = async (archivo) => {
        const nombre = archivo?.split("/").pop();
        if (!nombre) return;

        const nuevaVentana = window.open("", "_blank");
        if (nuevaVentana) nuevaVentana.opener = null;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_URL}/Justificante/archivo/${encodeURIComponent(nombre)}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            );
            if (response.status === 404) {
                nuevaVentana?.close();
                setPopup({
                    open: true,
                    loading: false,
                    type: "error",
                    titulo: t("excuses.fileNotFoundTitle"),
                    mensaje: t("excuses.fileNotFoundMessage")
                });
                return;
            }
            if (!response.ok) throw new Error(t("common.requestFailed"));

            const objectUrl = URL.createObjectURL(await response.blob());
            if (nuevaVentana) {
                nuevaVentana.location.href = objectUrl;
            } else {
                const enlace = document.createElement("a");
                enlace.href = objectUrl;
                enlace.target = "_blank";
                enlace.rel = "noreferrer";
                enlace.click();
            }
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        } catch {
            nuevaVentana?.close();
            setPopup({
                open: true,
                loading: false,
                type: "error",
                titulo: t("common.error"),
                mensaje: t("common.requestFailed")
            });
        }
    };

    const validarArchivos = (files) => {
        if (files.length > MAX_FILE_COUNT) {
            return {
                titulo: t("excuses.filesLimitTitle"),
                mensaje: t("excuses.filesLimitMessage")
            };
        }

        if (files.some((file) => file.size <= 0 || file.size > MAX_FILE_SIZE)) {
            return {
                titulo: t("excuses.fileSizeTitle"),
                mensaje: t("excuses.fileSizeMessage")
            };
        }

        if (files.some((file) => !ALLOWED_FILE_PATTERN.test(file.name))) {
            return {
                titulo: t("excuses.fileTypeTitle"),
                mensaje: t("excuses.fileTypeMessage")
            };
        }

        return null;
    };

    const handleFilesChange = (event) => {
        const files = Array.from(event.target.files || []);
        const error = validarArchivos(files);

        if (error) {
            event.target.value = "";
            setForm((prev) => ({ ...prev, archivos: [] }));
            setPopup({
                open: true,
                loading: false,
                type: "error",
                titulo: error.titulo,
                mensaje: error.mensaje
            });
            return;
        }

        setForm((prev) => ({ ...prev, archivos: files }));
    };

    const validar = () => {
        const nuevosErrores = {
            descripcion: validateFreeText(form.descripcion, t, { maxLength: 1000 }),
            fecha: validateDate(form.fecha, t, { max: getLocalDateValue() })
        };
        Object.keys(nuevosErrores).forEach((campo) => {
            if (!nuevosErrores[campo]) delete nuevosErrores[campo];
        });

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validar()) return;

        const errorArchivos = validarArchivos(form.archivos);
        if (errorArchivos) {
            setPopup({
                open: true,
                loading: false,
                type: "error",
                titulo: errorArchivos.titulo,
                mensaje: errorArchivos.mensaje
            });
            return;
        }

        setPopup({
            open: true,
            loading: true,
            type: "info",
            titulo: t("excuses.sending"),
            mensaje: t("common.processing")
        });

        const ok = await crear(
            usuario,
            {
                descripcion: sanitizeMultiline(form.descripcion),
                fecha: form.fecha
            },
            form.archivos
        );

        setPopup({
            open: true,
            loading: false,
            type: ok ? "success" : "error",
            titulo: ok ? t("excuses.sentTitle") : t("excuses.sendErrorTitle"),
            mensaje: ok
                ? t("excuses.sentMessage")
                : getErrorMessage() || t("common.tryAgain")
        });

        if (ok) {
            setTimeout(() => {
                setForm({ descripcion: "", fecha: "", archivos: [] });
                onClose?.();
            }, 700);
        }
    };

    const handleAceptar = async () => {
        const idJustificante = data?.idJustificante;
        if (!idJustificante) return;

        setPopup({
            open: true,
            loading: true,
            type: "info",
            titulo: t("excuses.updating"),
            mensaje: t("excuses.savingReview")
        });

        const ok = await aceptar(idJustificante);

        setPopup({
            open: true,
            loading: false,
            type: ok ? "success" : "error",
            titulo: ok ? t("excuses.acceptedTitle") : t("excuses.updateErrorTitle"),
            mensaje: ok
                ? t("excuses.acceptedMessage")
                : getErrorMessage() || t("common.tryAgain")
        });

        if (ok) {
            setTimeout(() => onClose?.(), 700);
        }
    };

    const archivos = data?.archivos || [];
    const esAlumno = Number(usuario?.id_rol) === 2;
    const esNuevo = !data;

    return (
        <>
            <Modal open={Boolean(open)} onClose={onClose}>
                <Box className="justificante-modal-card">
                    <Box className="justificante-modal-head">
                        <Box>
                            <Typography className="tutorias-eyebrow">
                                {t("navigation.excuses")}
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                                {esNuevo ? t("excuses.new") : t("excuses.detailsTitle")}
                            </Typography>
                            <Typography color="text.secondary" mt={0.5}>
                                {esNuevo
                                    ? t("excuses.newDescription")
                                    : t("excuses.detailsDescription")}
                            </Typography>
                        </Box>

                        {!esNuevo && (
                            <Chip
                                color={data?.estado === "ACEPTADO" ? "success" : "warning"}
                                label={!data?.estado
                                    ? t("common.noStatus")
                                    : data.estado === "PENDIENTE"
                                        ? t("excuses.states.review")
                                        : t(`common.statusLabels.${data.estado}`)}
                            />
                        )}
                    </Box>

                    <Divider />

                    <Box component="form" className="justificante-form" onSubmit={handleSubmit}>
                        {!esNuevo && data?.nombreAlumno && (
                            <TextField
                                label={t("common.student")}
                                value={data.nombreAlumno}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />
                        )}

                        <TextField
                            label={t("excuses.description")}
                            value={form.descripcion}
                            onChange={(e) => {
                                setForm((prev) => ({ ...prev, descripcion: e.target.value }));
                                setErrores((prev) => ({ ...prev, descripcion: "" }));
                            }}
                            multiline
                            minRows={4}
                            fullWidth
                            required
                            disabled={!esNuevo}
                            error={Boolean(errores.descripcion)}
                            helperText={errores.descripcion}
                            inputProps={{ maxLength: 1000, "aria-invalid": Boolean(errores.descripcion) }}
                        />

                        <TextField
                            label={t("excuses.date")}
                            type="date"
                            value={form.fecha}
                            onChange={(e) => {
                                setForm((prev) => ({ ...prev, fecha: e.target.value }));
                                setErrores((prev) => ({ ...prev, fecha: "" }));
                            }}
                            fullWidth
                            required
                            disabled={!esNuevo}
                            error={Boolean(errores.fecha)}
                            helperText={errores.fecha}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ max: getLocalDateValue(), "aria-invalid": Boolean(errores.fecha) }}
                        />

                        {esNuevo && esAlumno && (
                            <Box className="justificante-upload">
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUploadRoundedIcon />}
                                    disabled={loading}
                                >
                                    {t("excuses.upload")}
                                    <input
                                        hidden
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        onChange={handleFilesChange}
                                    />
                                </Button>

                                <Typography variant="body2" color="text.secondary">
                                    {form.archivos.length
                                        ? t("excuses.filesSelected", { count: form.archivos.length })
                                        : t("excuses.uploadHint")}
                                </Typography>
                            </Box>
                        )}

                        {!esNuevo && archivos.length > 0 && (
                            <Stack spacing={1}>
                                <Typography fontWeight={700}>{t("excuses.evidence")}</Typography>
                                {archivos.map((archivo) => (
                                    <Button
                                        key={archivo}
                                        type="button"
                                        onClick={() => abrirArchivo(archivo)}
                                        variant="outlined"
                                        startIcon={<InsertDriveFileRoundedIcon />}
                                        className="justificante-file-link"
                                    >
                                        {t("excuses.viewFile")}
                                    </Button>
                                ))}
                            </Stack>
                        )}

                        <Box className="justificante-actions">
                            <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
                                {t("common.cancel")}
                            </Button>

                            {esNuevo && esAlumno && (
                                <Button type="submit" variant="contained" disabled={loading}>
                                    {t("excuses.send")}
                                </Button>
                            )}

                            {!esNuevo && !esAlumno && data?.estado === "PENDIENTE" && (
                                <Button
                                    type="button"
                                    variant="contained"
                                    disabled={loading}
                                    startIcon={<CheckCircleRoundedIcon />}
                                    onClick={handleAceptar}
                                >
                                    {t("excuses.accept")}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Modal>

            <Alerta
                open={popup.open}
                loading={popup.loading || loading}
                type={popup.type}
                titulo={popup.titulo}
                mensaje={popup.mensaje}
                onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
            />
        </>
    );
}

export default Justificante;
