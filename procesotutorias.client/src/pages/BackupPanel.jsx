import { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import BackupRoundedIcon from "@mui/icons-material/BackupRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";

import "../assets/estilos/Administracion.css";
import "../assets/estilos/BackupPanel.css";
import Alerta from "../componentes/Alerta";
import Layout from "../componentes/layout";
import { useBackups } from "../hooks/useBackups";
import { useI18n } from "../i18n/I18nContext";

const getLocalInputDateTime = (secondsFromNow = 30) => {
    const date = new Date(Date.now() + secondsFromNow * 1000);
    const pad = (value) => value.toString().padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
};

const statusColor = (status) => {
    switch (status) {
        case "COMPLETADO":
            return "success";
        case "ERROR":
            return "error";
        case "EN_PROCESO":
            return "info";
        default:
            return "warning";
    }
};

export default function BackupPanel() {
    const { formatDate, locale, t } = useI18n();
    const {
        fullBackup,
        incrementalBackup,
        restore,
        schedule,
        refresh,
        files,
        jobs,
        message,
        loading
    } = useBackups();

    const [selectedFile, setSelectedFile] = useState("");
    const [manualFile, setManualFile] = useState("");
    const [scheduledType, setScheduledType] = useState("INCREMENTAL");
    const [scheduledAt, setScheduledAt] = useState(getLocalInputDateTime());
    const [popup, setPopup] = useState({
        open: false,
        loading: false,
        type: "info",
        titulo: "",
        mensaje: ""
    });

    const restorePath = manualFile.trim() || selectedFile;

    const stats = useMemo(() => ({
        totalFiles: files.length,
        totalJobs: jobs.length,
        pendingJobs: jobs.filter((job) => job.status === "PENDIENTE").length,
        lastFile: files[0]?.name || t("backups.noBackups")
    }), [files, jobs, t]);

    const runAction = async (title, action, successMessage = t("backups.successFallback")) => {
        setPopup({
            open: true,
            loading: true,
            type: "info",
            titulo: title,
            mensaje: t("backups.processing")
        });

        const result = await action();

        setPopup({
            open: true,
            loading: false,
            type: result.ok ? "success" : "error",
            titulo: result.ok ? t("backups.completedTitle") : t("backups.failedTitle"),
            mensaje: result.ok
                ? (locale === "es-MX" && result.data?.message ? result.data.message : successMessage)
                : result.error?.message || t("common.tryAgain")
        });
    };

    const handleRestore = () => {
        if (!restorePath) {
            setPopup({
                open: true,
                loading: false,
                type: "warning",
                titulo: t("backups.selectTitle"),
                mensaje: t("backups.selectMessage")
            });
            return;
        }

        runAction(t("backups.restoring"), () => restore(restorePath), t("backups.restored"));
    };

    const handleSchedule = () => {
        if (!scheduledAt) {
            setPopup({
                open: true,
                loading: false,
                type: "warning",
                titulo: t("backups.dateRequiredTitle"),
                mensaje: t("backups.dateRequiredMessage")
            });
            return;
        }

        runAction(t("backups.scheduling"), () => schedule(scheduledType, scheduledAt), t("backups.scheduledSuccess"));
    };

    return (
        <Layout contentClassName="admin-layout-gradient">
            <div className="admin-cont backup-cont">
                <div className="admin-head backup-head">
                    <Box>
                        <Typography className="admin-chip">{t("backups.eyebrow")}</Typography>
                        <Typography variant="h4" fontWeight={900} mt={1}>
                            {t("backups.title")}
                        </Typography>
                        <Typography color="text.secondary" mt={0.5}>
                            {t("backups.description")}
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<UpdateRoundedIcon />}
                        onClick={() => refresh()}
                        disabled={loading}
                    >
                        {t("common.update")}
                    </Button>
                </div>

                <div className="backup-stats">
                    <Card>
                        <CardContent>
                            <StorageRoundedIcon />
                            <Typography variant="h5" fontWeight={800}>{stats.totalFiles}</Typography>
                            <Typography color="text.secondary">{t("backups.available")}</Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <ScheduleRoundedIcon />
                            <Typography variant="h5" fontWeight={800}>{stats.pendingJobs}</Typography>
                            <Typography color="text.secondary">{t("backups.scheduledPending")}</Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <BackupRoundedIcon />
                            <Typography variant="body1" fontWeight={800}>{stats.lastFile}</Typography>
                            <Typography color="text.secondary">{t("backups.last")}</Typography>
                        </CardContent>
                    </Card>
                </div>

                <div className="backup-grid">
                    <Card className="backup-card">
                        <CardContent>
                            <Box className="backup-card-title">
                                <BackupRoundedIcon />
                                <Box>
                                    <Typography variant="h6" fontWeight={800}>{t("backups.manualTitle")}</Typography>
                                    <Typography color="text.secondary">
                                        {t("backups.manualDescription")}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={3}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    onClick={() => runAction(t("backups.generatingFull"), fullBackup, t("backups.fullGenerated"))}
                                >
                                    {t("backups.full")}
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    disabled={loading}
                                    onClick={() => runAction(t("backups.generatingIncremental"), incrementalBackup, t("backups.incrementalGenerated"))}
                                >
                                    {t("backups.incremental")}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card className="backup-card">
                        <CardContent>
                            <Box className="backup-card-title">
                                <ScheduleRoundedIcon />
                                <Box>
                                    <Typography variant="h6" fontWeight={800}>{t("backups.scheduleTitle")}</Typography>
                                    <Typography color="text.secondary">
                                        {t("backups.scheduleDescription")}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stack spacing={2} mt={3}>
                                <FormControl fullWidth>
                                    <InputLabel>{t("backups.type")}</InputLabel>
                                    <Select
                                        value={scheduledType}
                                        label={t("backups.type")}
                                        onChange={(e) => setScheduledType(e.target.value)}
                                    >
                                        <MenuItem value="COMPLETO">{t("backups.fullType")}</MenuItem>
                                        <MenuItem value="INCREMENTAL">{t("backups.incrementalType")}</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label={t("backups.dateTime")}
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ step: 1, "aria-invalid": !scheduledAt }}
                                />

                                <Button variant="contained" disabled={loading} onClick={handleSchedule}>
                                    {t("backups.scheduleAction")}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card className="backup-card backup-restore">
                        <CardContent>
                            <Box className="backup-card-title">
                                <RestoreRoundedIcon />
                                <Box>
                                    <Typography variant="h6" fontWeight={800}>{t("backups.restoreTitle")}</Typography>
                                    <Typography color="text.secondary">
                                        {t("backups.restoreDescription")}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stack spacing={2} mt={3}>
                                <FormControl fullWidth>
                                    <InputLabel>{t("backups.availableFile")}</InputLabel>
                                    <Select
                                        value={selectedFile}
                                        label={t("backups.availableFile")}
                                        onChange={(e) => setSelectedFile(e.target.value)}
                                    >
                                        <MenuItem value="">{t("backups.selectBackup")}</MenuItem>
                                        {files.map((file) => (
                                            <MenuItem key={file.file} value={file.file}>
                                                {file.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label={t("backups.manualPath")}
                                    placeholder="C:\\Respaldos\\SistemaTutorias_COMPLETO_20260719_120000.json"
                                    value={manualFile}
                                    onChange={(e) => setManualFile(e.target.value)}
                                    fullWidth
                                />

                                <Button color="warning" variant="contained" disabled={loading} onClick={handleRestore}>
                                    {t("backups.restoreAction")}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </div>

                <div className="backup-lists">
                    <Card className="backup-card">
                        <CardContent>
                            <Typography variant="h6" fontWeight={800}>{t("backups.filesTitle")}</Typography>
                            <Divider sx={{ my: 1.5 }} />

                            <Stack spacing={1}>
                                {files.length === 0 ? (
                                    <Typography color="text.secondary">{t("backups.noFiles")}</Typography>
                                ) : files.map((file) => (
                                    <Box className="backup-list-item" key={file.file}>
                                        <Box>
                                            <Typography fontWeight={700}>{file.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(file.createdAt)} · {formatSize(file.sizeBytes)}
                                            </Typography>
                                        </Box>
                                        <Button size="small" onClick={() => setSelectedFile(file.file)}>
                                            {t("backups.use")}
                                        </Button>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card className="backup-card">
                        <CardContent>
                            <Typography variant="h6" fontWeight={800}>{t("backups.schedulesTitle")}</Typography>
                            <Divider sx={{ my: 1.5 }} />

                            <Stack spacing={1}>
                                {jobs.length === 0 ? (
                                    <Typography color="text.secondary">{t("backups.noSchedules")}</Typography>
                                ) : jobs.map((job) => (
                                    <Box className="backup-list-item" key={job.id}>
                                        <Box>
                                            <Typography fontWeight={700}>
                                                {job.type === "COMPLETO" ? t("backups.fullType") : t("backups.incrementalType")}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {t("backups.scheduled")}: {formatDate(job.scheduledAt, { dateStyle: "medium", timeStyle: "short" })}
                                            </Typography>
                                            {job.file && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {t("backups.file")}: {job.file}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Chip label={t(`common.statusLabels.${job.status}`)} color={statusColor(job.status)} size="small" />
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </div>

                {message && (
                    <Card className="backup-card">
                        <CardContent>
                            <Typography fontWeight={700}>{t("backups.lastMessage")}</Typography>
                            <Typography color="text.secondary">{message}</Typography>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Alerta
                open={popup.open}
                loading={popup.loading}
                type={popup.type}
                titulo={popup.titulo}
                mensaje={popup.mensaje}
                onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
            />
        </Layout>
    );
}
