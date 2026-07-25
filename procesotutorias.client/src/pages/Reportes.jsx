import { useMemo } from "react";
import Layout from "../componentes/layout";
import "../assets/estilos/Reportes.css";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    Typography
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DownloadIcon from "@mui/icons-material/Download";
import GroupIcon from "@mui/icons-material/Group";
import SchoolIcon from "@mui/icons-material/School";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArticleIcon from "@mui/icons-material/Article";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import html2pdf from "html2pdf.js";

import { useReportes } from "../hooks/useReportes";
import { useI18n } from "../i18n/I18nContext";
import { translateReportText } from "../i18n/catalogTranslations";

const porcentaje = (valor, total) => {
    if (!total) return 0;
    return Math.round((valor / total) * 100);
};

const getRolReporte = (idRol, t) => t(`reports.titles.${idRol || "default"}`);

const getMetricas = (usuario, reporte, t) => {
    if (!reporte) return [];

    if (usuario.id_rol === 1) {
        return [
            { label: t("reports.metrics.users"), value: reporte.totalUsuarios, icon: GroupIcon },
            { label: t("reports.metrics.students"), value: reporte.totalAlumnos, icon: SchoolIcon },
            { label: t("reports.metrics.sessions"), value: reporte.totalTutorias, icon: AssessmentIcon },
            { label: t("reports.metrics.pending"), value: reporte.tutoriasPendientes, icon: WarningAmberIcon, tone: "warning" },
            { label: t("reports.metrics.excuses"), value: reporte.totalJustificantes, icon: ArticleIcon },
            { label: t("reports.metrics.activeTutors"), value: reporte.totalTutores, icon: TaskAltIcon }
        ];
    }

    if (usuario.id_rol === 2) {
        return [
            { label: t("reports.metrics.sessions"), value: reporte.totalTutorias, icon: AssessmentIcon },
            { label: t("reports.metrics.completed"), value: reporte.tutoriasCompletadas, icon: TaskAltIcon },
            { label: t("reports.metrics.pending"), value: reporte.tutoriasPendientes, icon: WarningAmberIcon, tone: "warning" },
            { label: t("reports.metrics.excuses"), value: reporte.totalJustificantes, icon: ArticleIcon }
        ];
    }

    if (usuario.id_rol === 3) {
        return [
            { label: t("reports.metrics.students"), value: reporte.totalAlumnos, icon: GroupIcon },
            { label: t("reports.metrics.sessions"), value: reporte.totalTutorias, icon: AssessmentIcon },
            { label: t("reports.metrics.pending"), value: reporte.tutoriasPendientes, icon: WarningAmberIcon, tone: "warning" },
            { label: t("reports.metrics.excuses"), value: reporte.totalJustificantes, icon: ArticleIcon }
        ];
    }

    return [
        { label: t("reports.metrics.groups"), value: reporte.totalGrupos, icon: GroupIcon },
        { label: t("reports.metrics.students"), value: reporte.totalAlumnos, icon: SchoolIcon },
        { label: t("reports.metrics.sessions"), value: reporte.totalTutorias, icon: AssessmentIcon },
        { label: t("reports.metrics.pending"), value: reporte.tutoriasPendientes, icon: WarningAmberIcon, tone: "warning" }
    ];
};

function ListaDecision({ titulo, items }) {
    const { t } = useI18n();
    if (!items?.length) {
        return (
            <Card className="reporte-card">
                <CardContent>
                    <Typography fontWeight="bold">{titulo}</Typography>
                    <Box className="reporte-empty">{t("reports.noData")}</Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="reporte-card">
            <CardContent>
                <Typography fontWeight="bold">{titulo}</Typography>
                <div className="reporte-lista">
                    {items.map((item, index) => (
                        <div className="reporte-list-row" key={`${titulo}-${index}`}>
                            <div>
                                <Typography fontWeight="bold">{item.nombre || item.nombreTutor || item.grupo || item.matricula}</Typography>
                                <Typography className="reporte-muted">
                                    {item.matricula && item.nombre ? item.matricula : t("reports.trackingIndicator")}
                                </Typography>
                            </div>
                            <div className="reporte-list-values">
                                {typeof item.totalAlumnos === "number" && <Chip label={`${t("reports.metrics.students")}: ${item.totalAlumnos}`} size="small" />}
                                {typeof item.totalTutorias === "number" && <Chip label={`${t("reports.metrics.sessions")}: ${item.totalTutorias}`} size="small" />}
                                {typeof item.tutoriasPendientes === "number" && <Chip label={`${t("reports.metrics.pending")}: ${item.tutoriasPendientes}`} size="small" className="reporte-chip-warning" />}
                                {typeof item.totalJustificantes === "number" && <Chip label={`${t("reports.metrics.excuses")}: ${item.totalJustificantes}`} size="small" />}
                                {typeof item.pendientes === "number" && <Chip label={`${t("reports.pendingExcusesShort")}: ${item.pendientes}`} size="small" className="reporte-chip-warning" />}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function Reportes() {
    const { formatDate, t } = useI18n();
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const { reporte, loading } = useReportes(usuario);

    const metricas = useMemo(() => getMetricas(usuario || {}, reporte, t), [usuario, reporte, t]);
    const avanceTutorias = porcentaje(reporte?.tutoriasCompletadas || 0, reporte?.totalTutorias || 0);

    const generarPDF = () => {
        const elemento = document.getElementById("reporte-pdf");

        html2pdf()
            .set({
                margin: 10,
                filename: t("reports.fileName"),
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
            })
            .from(elemento)
            .save();
    };

    if (loading) {
        return (
            <Layout contentClassName="reportes-layout-gradient">
                <Box className="reportes-cont">
                    <Box className="reportes-loading">{t("reports.loading")}</Box>
                </Box>
            </Layout>
        );
    }

    if (!reporte) {
        return (
            <Layout contentClassName="reportes-layout-gradient">
                <Box className="reportes-cont">
                    <Box className="reportes-empty-page">{t("reports.unavailable")}</Box>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout contentClassName="reportes-layout-gradient">
            <Box className="reportes-cont">
                <section className="reportes-head">
                    <Box>
                        <Typography component="span" className="reportes-eyebrow">
                            {t("reports.eyebrow")}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" className="reportes-title">
                            {getRolReporte(usuario.id_rol, t)}
                        </Typography>
                        <Typography className="reportes-desc">
                            {t("reports.description")}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={generarPDF}
                        sx={{ backgroundColor: "#20A85E", fontWeight: "bold" }}
                    >
                        {t("reports.export")}
                    </Button>
                </section>

                <Box id="reporte-pdf" className="reportes-pdf">
                    <Box className="reportes-pdf-header">
                        <Typography fontWeight="bold">{t("common.university").toUpperCase()}</Typography>
                        <Typography>{getRolReporte(usuario.id_rol, t)}</Typography>
                        <Divider sx={{ mt: 1 }} />
                    </Box>

                    <div className="reportes-metricas">
                        {metricas.map((metrica) => {
                            const Icono = metrica.icon;
                            return (
                                <Card key={metrica.label} className={`reporte-metric-card ${metrica.tone === "warning" ? "warning" : ""}`}>
                                    <CardContent>
                                        <Box className="reporte-metric-icon">
                                            <Icono />
                                        </Box>
                                        <Typography className="reporte-muted">{metrica.label}</Typography>
                                        <Typography variant="h4" fontWeight="bold">{metrica.value ?? 0}</Typography>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="reportes-main-grid">
                        <Card className="reporte-card">
                            <CardContent>
                                <Typography fontWeight="bold">{t("reports.progress")}</Typography>
                                <Typography className="reporte-muted">
                                    {t("reports.progressDescription")}
                                </Typography>
                                <Box className="reporte-progress">
                                    <LinearProgress variant="determinate" value={avanceTutorias} />
                                    <Typography fontWeight="bold">{avanceTutorias}%</Typography>
                                </Box>
                                <div className="reporte-status-grid">
                                    <span>{t("reports.metrics.pending")}: {reporte.tutoriasPendientes || 0}</span>
                                    <span>{t("reports.metrics.completed")}: {reporte.tutoriasCompletadas || 0}</span>
                                    <span>{t("reports.editing")}: {reporte.tutoriasEnEdicion || 0}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="reporte-card">
                            <CardContent>
                                <Box className="reporte-card-title">
                                    <TipsAndUpdatesIcon />
                                    <Typography fontWeight="bold">{t("reports.recommendations")}</Typography>
                                </Box>
                                {reporte.recomendaciones?.length ? (
                                    <ul className="reporte-recomendaciones">
                                        {reporte.recomendaciones.map((item, index) => (
                                            <li key={index}>{translateReportText(t, item)}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <Box className="reporte-empty">{t("reports.noCriticalAlerts")}</Box>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {usuario.id_rol === 2 && (
                        <Card className="reporte-card">
                            <CardContent>
                                <Typography fontWeight="bold">{reporte.nombre}</Typography>
                                <Typography className="reporte-muted">{t("reports.studentId")}: {reporte.matricula}</Typography>
                                <Typography className="reporte-muted">{t("reports.lastSession")}: {reporte.ultimaTutoria ? formatDate(reporte.ultimaTutoria) : t("common.noRecord")}</Typography>
                                <Typography className="reporte-muted">
                                    {t("reports.pendingExcuses")}: {reporte.justificantesPendientes || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    {usuario.id_rol === 1 && (
                        <div className="reportes-main-grid">
                            <ListaDecision titulo={t("reports.groupsAttention")} items={reporte.grupos} />
                            <ListaDecision titulo={t("reports.tutorWorkload")} items={reporte.tutores} />
                        </div>
                    )}

                    {usuario.id_rol === 3 && (
                        <div className="reportes-main-grid">
                            <ListaDecision titulo={t("reports.priorityStudents")} items={reporte.alumnos} />
                            <ListaDecision titulo={t("reports.excusesByStudent")} items={reporte.justificantes} />
                        </div>
                    )}

                    {usuario.id_rol === 4 && (
                        <Card className="reporte-card">
                            <CardContent>
                                <Typography fontWeight="bold">{reporte.nombre}</Typography>
                                <Typography className="reporte-muted">{translateReportText(t, reporte.mensaje)}</Typography>
                                <Typography className="reporte-muted">
                                    {t("reports.teacherDescription")}
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Box>
        </Layout>
    );
}

export default Reportes;
