import { createElement, useMemo, useState } from "react";
import Layout from "../componentes/layout";
import "../assets/estilos/Reportes.css";
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Divider,
    Typography
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArticleIcon from "@mui/icons-material/Article";
import DownloadIcon from "@mui/icons-material/Download";
import GroupIcon from "@mui/icons-material/Group";
import SchoolIcon from "@mui/icons-material/School";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { useReportes } from "../hooks/useReportes";
import { getAuthSession } from "../auth/session";
import { useI18n } from "../i18n/I18nContext";
import { translateReportText } from "../i18n/catalogTranslations";
import { downloadReportPdf } from "../utils/reportPdf";

const MODULO_TUTORIAS = "tutorias";
const MODULO_JUSTIFICANTES = "justificantes";

const porcentaje = (valor, total) => {
    if (!total) return 0;
    return Math.round((valor / total) * 100);
};

const getRolReporte = (idRol, t) => t(`reports.titles.${idRol || "default"}`);

const getModulosDisponibles = (idRol, t) => {
    const modulos = [
        {
            id: MODULO_TUTORIAS,
            title: t("reports.modules.tutoring.title"),
            description: t("reports.modules.tutoring.description"),
            Icon: AssessmentIcon
        }
    ];

    if ([1, 2, 3].includes(idRol)) {
        modulos.push({
            id: MODULO_JUSTIFICANTES,
            title: t("reports.modules.excuses.title"),
            description: t("reports.modules.excuses.description"),
            Icon: ArticleIcon
        });
    }

    return modulos;
};

const getMetricas = (usuario, reporte, modulo, t) => {
    if (!reporte) return [];

    if (modulo === MODULO_JUSTIFICANTES) {
        return [
            { label: t("reports.metrics.excuses"), value: reporte.totalJustificantes, icon: ArticleIcon },
            { label: t("reports.metrics.pending"), value: reporte.justificantesPendientes, icon: WarningAmberIcon, tone: "warning" },
            { label: t("reports.pdf.approved"), value: reporte.justificantesAprobados, icon: TaskAltIcon },
            { label: t("reports.pdf.rejected"), value: reporte.justificantesRechazados, icon: ArticleIcon, tone: "danger" }
        ];
    }

    const metricasBase = [
        { label: t("reports.metrics.sessions"), value: reporte.totalTutorias, icon: AssessmentIcon },
        { label: t("reports.metrics.pending"), value: reporte.tutoriasPendientes, icon: WarningAmberIcon, tone: "warning" },
        { label: t("reports.metrics.completed"), value: reporte.tutoriasCompletadas, icon: TaskAltIcon }
    ];

    if (usuario.id_rol === 1)
        return [...metricasBase, { label: t("reports.metrics.activeTutors"), value: reporte.totalTutores, icon: GroupIcon }];

    if (usuario.id_rol === 3 || usuario.id_rol === 4)
        return [{ label: t("reports.metrics.students"), value: reporte.totalAlumnos, icon: SchoolIcon }, ...metricasBase];

    return [...metricasBase, { label: t("reports.editing"), value: reporte.tutoriasEnEdicion, icon: ArticleIcon }];
};

const getDatosGrafica = (reporte, modulo, t) => modulo === MODULO_JUSTIFICANTES
    ? [
        { label: t("reports.metrics.pending"), value: reporte.justificantesPendientes || 0, tone: "warning" },
        { label: t("reports.pdf.approved"), value: reporte.justificantesAprobados || 0, tone: "success" },
        { label: t("reports.pdf.rejected"), value: reporte.justificantesRechazados || 0, tone: "danger" }
    ]
    : [
        { label: t("reports.metrics.pending"), value: reporte.tutoriasPendientes || 0, tone: "warning" },
        { label: t("reports.metrics.completed"), value: reporte.tutoriasCompletadas || 0, tone: "success" },
        { label: t("reports.editing"), value: reporte.tutoriasEnEdicion || 0, tone: "info" }
    ];

const getRecomendaciones = (reporte, modulo, t) => {
    const recomendaciones = [];

    if (modulo === MODULO_JUSTIFICANTES) {
        const total = reporte.totalJustificantes || 0;
        const pendientes = reporte.justificantesPendientes || 0;
        const rechazados = reporte.justificantesRechazados || 0;

        if (!total) recomendaciones.push(t("reports.decisions.excusesNoData"));
        if (pendientes) recomendaciones.push(t("reports.decisions.excusesPending", { count: pendientes }));
        if (rechazados) recomendaciones.push(t("reports.decisions.excusesRejected", { count: rechazados }));
        if (total && !pendientes) recomendaciones.push(t("reports.decisions.excusesUpToDate"));
        return recomendaciones;
    }

    const total = reporte.totalTutorias || 0;
    const pendientes = reporte.tutoriasPendientes || 0;
    const edicion = reporte.tutoriasEnEdicion || 0;
    const completadas = reporte.tutoriasCompletadas || 0;

    if (!total) recomendaciones.push(t("reports.decisions.tutoringNoData"));
    if (pendientes) recomendaciones.push(t("reports.decisions.tutoringPending", { count: pendientes }));
    if (edicion) recomendaciones.push(t("reports.decisions.tutoringEditing", { count: edicion }));
    if (total && !pendientes && !edicion)
        recomendaciones.push(t("reports.decisions.tutoringUpToDate", { percent: porcentaje(completadas, total) }));

    return recomendaciones;
};

function SelectorModulo({ modulos, reporte, onSelect }) {
    const { t } = useI18n();

    return (
        <section className="reportes-selector" aria-labelledby="reportes-selector-title">
            <Box className="reportes-selector-copy">
                <Typography component="span" className="reportes-eyebrow">
                    {t("reports.eyebrow")}
                </Typography>
                <Typography id="reportes-selector-title" variant="h5" fontWeight="bold" className="reportes-title">
                    {t("reports.selectModule")}
                </Typography>
                <Typography className="reportes-desc">
                    {t("reports.selectModuleDescription")}
                </Typography>
            </Box>

            <div className="reportes-module-grid">
                {modulos.map(({ id, title, description, Icon: Icono }) => {
                    const total = id === MODULO_TUTORIAS
                        ? reporte.totalTutorias || 0
                        : reporte.totalJustificantes || 0;
                    const pendientes = id === MODULO_TUTORIAS
                        ? reporte.tutoriasPendientes || 0
                        : reporte.justificantesPendientes || 0;

                    return (
                        <Card key={id} className="reporte-module-card">
                            <CardActionArea onClick={() => onSelect(id)}>
                                <CardContent>
                                    <Box className="reporte-module-icon">{createElement(Icono)}</Box>
                                    <Typography variant="h6" fontWeight="bold">{title}</Typography>
                                    <Typography className="reporte-muted">{description}</Typography>
                                    <div className="reporte-module-summary">
                                        <Chip label={`${t("reports.pdf.total")}: ${total}`} size="small" />
                                        <Chip
                                            label={`${t("reports.metrics.pending")}: ${pendientes}`}
                                            size="small"
                                            className={pendientes ? "reporte-chip-warning" : ""}
                                        />
                                    </div>
                                    <Typography className="reporte-module-action">
                                        {t("reports.viewReport")}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}

function GraficaEstados({ data, total, title, description }) {
    const { t } = useI18n();
    const base = Math.max(total || 0, data.reduce((sum, item) => sum + item.value, 0));
    const colores = {
        warning: "#e49420",
        success: "#20A85E",
        info: "#4f7cac",
        danger: "#c94b45"
    };
    const resultadoSegmentos = data.reduce((resultado, item) => {
        const siguiente = resultado.acumulado + (base ? (item.value / base) * 100 : 0);
        return {
            acumulado: siguiente,
            valores: [
                ...resultado.valores,
                `${colores[item.tone]} ${resultado.acumulado}% ${siguiente}%`
            ]
        };
    }, { acumulado: 0, valores: [] });
    const segmentos = resultadoSegmentos.acumulado < 100
        ? [...resultadoSegmentos.valores, `#edf0f2 ${resultadoSegmentos.acumulado}% 100%`]
        : resultadoSegmentos.valores;
    const donutStyle = { background: `conic-gradient(${segmentos.join(", ")})` };

    return (
        <Card className="reporte-card reporte-chart-card">
            <CardContent>
                <Typography fontWeight="bold">{title}</Typography>
                <Typography className="reporte-muted">{description}</Typography>

                {base === 0 ? (
                    <Box className="reporte-empty">{t("reports.noData")}</Box>
                ) : (
                    <div className="reporte-donut-layout" role="img" aria-label={title}>
                        <div className="reporte-donut" style={donutStyle}>
                            <div className="reporte-donut-center">
                                <strong>{base}</strong>
                                <span>{t("reports.pdf.total")}</span>
                            </div>
                        </div>
                        <div className="reporte-donut-legend">
                            {data.map((item) => (
                                <div className="reporte-donut-legend-row" key={item.label}>
                                    <span className={`reporte-donut-swatch ${item.tone}`} />
                                    <span>{item.label}</span>
                                    <strong>{item.value} ({porcentaje(item.value, base)}%)</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function GraficaComparativa({ titulo, descripcion, items }) {
    const { t } = useI18n();
    const maximoPendientes = Math.max(1, ...(items || []).map((item) => item.tutoriasPendientes || 0));

    return (
        <Card className="reporte-card reporte-comparison-card">
            <CardContent>
                <Typography fontWeight="bold">{titulo}</Typography>
                <Typography className="reporte-muted">{descripcion}</Typography>
                {!items?.length ? (
                    <Box className="reporte-empty">{t("reports.noData")}</Box>
                ) : (
                    <div className="reporte-comparison-chart" role="img" aria-label={titulo}>
                        {items.map((item, index) => {
                            const nombre = item.nombreTutor || (item.carrera
                                ? `${item.grupo} · ${item.carrera}`
                                : item.grupo) || `${index + 1}`;
                            const pendientes = item.tutoriasPendientes || 0;
                            const ancho = porcentaje(pendientes, maximoPendientes);
                            return (
                                <div className="reporte-comparison-row" key={`${nombre}-${index}`}>
                                    <div className="reporte-comparison-label">
                                        <strong>{nombre}</strong>
                                        <span>{t("reports.metrics.pending")}: {pendientes}</span>
                                    </div>
                                    <div className="reporte-comparison-track">
                                        <div className="reporte-comparison-bar" style={{ width: `${ancho}%` }} />
                                    </div>
                                    <div className="reporte-comparison-meta">
                                        <span>{t("reports.metrics.students")}: {item.totalAlumnos || 0}</span>
                                        <span>{t("reports.metrics.sessions")}: {item.totalTutorias || 0}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function GraficaResolucion({ reporte, modulo }) {
    const { t } = useI18n();
    const total = modulo === MODULO_TUTORIAS
        ? reporte.totalTutorias || 0
        : reporte.totalJustificantes || 0;
    const segmentos = modulo === MODULO_TUTORIAS
        ? [
            { label: t("reports.metrics.completed"), value: reporte.tutoriasCompletadas || 0, tone: "success" },
            { label: t("reports.metrics.pending"), value: reporte.tutoriasPendientes || 0, tone: "warning" },
            { label: t("reports.editing"), value: reporte.tutoriasEnEdicion || 0, tone: "info" }
        ]
        : [
            { label: t("reports.pdf.approved"), value: reporte.justificantesAprobados || 0, tone: "success" },
            { label: t("reports.metrics.pending"), value: reporte.justificantesPendientes || 0, tone: "warning" },
            { label: t("reports.pdf.rejected"), value: reporte.justificantesRechazados || 0, tone: "danger" }
        ];
    const resueltos = modulo === MODULO_TUTORIAS
        ? reporte.tutoriasCompletadas || 0
        : (reporte.justificantesAprobados || 0) + (reporte.justificantesRechazados || 0);
    const tasa = porcentaje(resueltos, total);

    return (
        <Card className="reporte-card reporte-resolution-card">
            <CardContent>
                <Typography fontWeight="bold">{t("reports.resolutionRate")}</Typography>
                <Typography className="reporte-muted">
                    {modulo === MODULO_TUTORIAS
                        ? t("reports.charts.tutoringResolutionDescription")
                        : t("reports.charts.excusesResolutionDescription")}
                </Typography>

                {total === 0 ? (
                    <Box className="reporte-empty">{t("reports.noData")}</Box>
                ) : (
                    <div className="reporte-resolution-body" role="img" aria-label={t("reports.resolutionRate")}>
                        <div className="reporte-resolution-kpi">
                            <strong>{tasa}%</strong>
                            <span>{t("reports.resolved")}: {resueltos} / {total}</span>
                        </div>
                        <div className="reporte-stacked-track resolution">
                            {segmentos.map((segmento) => (
                                <span
                                    key={segmento.label}
                                    className={`reporte-stacked-segment ${segmento.tone}`}
                                    style={{ width: `${porcentaje(segmento.value, total)}%` }}
                                    title={`${segmento.label}: ${segmento.value}`}
                                />
                            ))}
                        </div>
                        <div className="reporte-chart-legend">
                            {segmentos.map((segmento) => (
                                <span key={segmento.label}>
                                    <i className={segmento.tone} />
                                    {segmento.label}: <strong>{segmento.value}</strong>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function GraficaDesgloseAlcance({ usuario, reporte, modulo }) {
    const { t } = useI18n();
    if (![1, 3].includes(usuario.id_rol)) return null;

    const esAdmin = usuario.id_rol === 1;
    const items = esAdmin
        ? reporte.grupos || []
        : modulo === MODULO_TUTORIAS
            ? reporte.alumnos || []
            : reporte.justificantes || [];
    const titulo = modulo === MODULO_TUTORIAS
        ? esAdmin
            ? t("reports.charts.groupCoverageTitle")
            : t("reports.charts.studentCoverageTitle")
        : esAdmin
            ? t("reports.charts.groupExcuseCoverageTitle")
            : t("reports.charts.studentExcuseCoverageTitle");
    const descripcion = modulo === MODULO_TUTORIAS
        ? esAdmin
            ? t("reports.charts.groupCoverageDescription")
            : t("reports.charts.studentCoverageDescription")
        : esAdmin
            ? t("reports.charts.groupExcuseCoverageDescription")
            : t("reports.charts.studentExcuseCoverageDescription");
    const segmentos = modulo === MODULO_TUTORIAS
        ? [
            { label: t("reports.metrics.completed"), tone: "success", value: (item) => item.tutoriasCompletadas || 0 },
            { label: t("reports.metrics.pending"), tone: "warning", value: (item) => item.tutoriasPendientes || 0 },
            { label: t("reports.editing"), tone: "info", value: (item) => item.tutoriasEnEdicion || 0 }
        ]
        : [
            {
                label: t("reports.pdf.approved"),
                tone: "success",
                value: (item) => esAdmin ? item.justificantesAprobados || 0 : item.aprobados || 0
            },
            {
                label: t("reports.metrics.pending"),
                tone: "warning",
                value: (item) => esAdmin ? item.justificantesPendientes || 0 : item.pendientes || 0
            },
            {
                label: t("reports.pdf.rejected"),
                tone: "danger",
                value: (item) => esAdmin ? item.justificantesRechazados || 0 : item.rechazados || 0
            }
        ];
    const totalItem = (item) => segmentos.reduce((total, segmento) => total + segmento.value(item), 0);
    const maximo = Math.max(1, ...items.map(totalItem));

    return (
        <Card className="reporte-card reporte-scope-chart-card">
            <CardContent>
                <Typography fontWeight="bold">{titulo}</Typography>
                <Typography className="reporte-muted">{descripcion}</Typography>
                {!items.length ? (
                    <Box className="reporte-empty">{t("reports.noData")}</Box>
                ) : (
                    <>
                        <div className="reporte-chart-legend scope">
                            {segmentos.map((segmento) => (
                                <span key={segmento.label}><i className={segmento.tone} />{segmento.label}</span>
                            ))}
                        </div>
                        <div className="reporte-stacked-chart" role="img" aria-label={titulo}>
                            {items.map((item, index) => {
                                const nombre = item.nombre || (item.carrera
                                    ? `${item.grupo} · ${item.carrera}`
                                    : item.grupo) || item.matricula || `${index + 1}`;
                                const total = totalItem(item);
                                return (
                                    <div className="reporte-stacked-row" key={`${nombre}-${index}`}>
                                        <div className="reporte-stacked-label">
                                            <strong>{nombre}</strong>
                                            <span>{t("reports.pdf.total")}: {total}</span>
                                        </div>
                                        <div className="reporte-stacked-track">
                                            {segmentos.map((segmento) => {
                                                const value = segmento.value(item);
                                                return (
                                                    <span
                                                        key={segmento.label}
                                                        className={`reporte-stacked-segment ${segmento.tone}`}
                                                        style={{ width: `${porcentaje(value, maximo)}%` }}
                                                        title={`${segmento.label}: ${value}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div className="reporte-stacked-values">
                                            {segmentos.map((segmento) => (
                                                <span key={segmento.label}>{segmento.label}: {segmento.value(item)}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function ListaDecision({ titulo, items, modulo }) {
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
                        <div className="reporte-list-row" key={`${titulo}-${item.matricula || item.grupo || item.nombreTutor || index}`}>
                            <div>
                                <Typography fontWeight="bold">{item.nombre || item.nombreTutor || item.grupo || item.matricula}</Typography>
                                {item.matricula && item.nombre && <Typography className="reporte-muted">{item.matricula}</Typography>}
                            </div>
                            <div className="reporte-list-values">
                                {typeof item.totalAlumnos === "number" && <Chip label={`${t("reports.metrics.students")}: ${item.totalAlumnos}`} size="small" />}
                                {modulo === MODULO_TUTORIAS && typeof item.totalTutorias === "number" && <Chip label={`${t("reports.metrics.sessions")}: ${item.totalTutorias}`} size="small" />}
                                {modulo === MODULO_TUTORIAS && typeof item.tutoriasPendientes === "number" && <Chip label={`${t("reports.metrics.pending")}: ${item.tutoriasPendientes}`} size="small" className={item.tutoriasPendientes ? "reporte-chip-warning" : ""} />}
                                {modulo === MODULO_JUSTIFICANTES && typeof item.totalJustificantes === "number" && <Chip label={`${t("reports.metrics.excuses")}: ${item.totalJustificantes}`} size="small" />}
                                {modulo === MODULO_JUSTIFICANTES && typeof item.total === "number" && <Chip label={`${t("reports.pdf.total")}: ${item.total}`} size="small" />}
                                {modulo === MODULO_JUSTIFICANTES && typeof item.pendientes === "number" && <Chip label={`${t("reports.metrics.pending")}: ${item.pendientes}`} size="small" className={item.pendientes ? "reporte-chip-warning" : ""} />}
                                {modulo === MODULO_JUSTIFICANTES && typeof item.aprobados === "number" && <Chip label={`${t("reports.pdf.approved")}: ${item.aprobados}`} size="small" color="success" variant="outlined" />}
                                {modulo === MODULO_JUSTIFICANTES && typeof item.rechazados === "number" && <Chip label={`${t("reports.pdf.rejected")}: ${item.rechazados}`} size="small" variant="outlined" />}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function Reportes() {
    const { formatDate, locale, t } = useI18n();
    const usuario = getAuthSession()?.user;
    const { reporte, loading, error } = useReportes(usuario);
    const [moduloSeleccionado, setModuloSeleccionado] = useState(null);

    const modulos = useMemo(
        () => getModulosDisponibles(usuario?.id_rol, t),
        [usuario?.id_rol, t]
    );
    const metricas = useMemo(
        () => getMetricas(usuario || {}, reporte, moduloSeleccionado, t),
        [usuario, reporte, moduloSeleccionado, t]
    );
    const datosGrafica = useMemo(
        () => reporte && moduloSeleccionado ? getDatosGrafica(reporte, moduloSeleccionado, t) : [],
        [reporte, moduloSeleccionado, t]
    );
    const recomendaciones = useMemo(
        () => reporte && moduloSeleccionado ? getRecomendaciones(reporte, moduloSeleccionado, t) : [],
        [reporte, moduloSeleccionado, t]
    );

    if (loading) {
        return <Layout contentClassName="reportes-layout-gradient"><Box className="reportes-cont"><Box className="reportes-loading">{t("reports.loading")}</Box></Box></Layout>;
    }

    if (!reporte) {
        return <Layout contentClassName="reportes-layout-gradient"><Box className="reportes-cont"><Box className="reportes-empty-page" role="alert">{error || t("reports.unavailable")}</Box></Box></Layout>;
    }

    if (!moduloSeleccionado) {
        return (
            <Layout contentClassName="reportes-layout-gradient">
                <Box className="reportes-cont">
                    <SelectorModulo modulos={modulos} reporte={reporte} onSelect={setModuloSeleccionado} />
                </Box>
            </Layout>
        );
    }

    const modulo = modulos.find((item) => item.id === moduloSeleccionado) || modulos[0];
    const totalModulo = moduloSeleccionado === MODULO_TUTORIAS ? reporte.totalTutorias : reporte.totalJustificantes;
    const graficaTitulo = moduloSeleccionado === MODULO_TUTORIAS
        ? t("reports.charts.tutoringTitle")
        : t("reports.charts.excusesTitle");
    const graficaDescripcion = moduloSeleccionado === MODULO_TUTORIAS
        ? t("reports.charts.tutoringDescription")
        : t("reports.charts.excusesDescription");

    const generarPDF = () => downloadReportPdf({
        user: usuario,
        report: reporte,
        module: moduloSeleccionado,
        recommendations: recomendaciones,
        locale,
        t,
        translateText: (text) => translateReportText(t, text)
    });

    return (
        <Layout contentClassName="reportes-layout-gradient">
            <Box className="reportes-cont">
                <section className="reportes-head">
                    <Box>
                        <Button startIcon={<ArrowBackIcon />} onClick={() => setModuloSeleccionado(null)} className="reportes-back-button">
                            {t("reports.changeModule")}
                        </Button>
                        <Typography component="span" className="reportes-eyebrow">{getRolReporte(usuario.id_rol, t)}</Typography>
                        <Typography variant="h5" fontWeight="bold" className="reportes-title">{modulo.title}</Typography>
                        <Typography className="reportes-desc">{modulo.description}</Typography>
                    </Box>

                    <Box className="reportes-head-actions">
                        {modulos.length > 1 && (
                            <Button
                                variant="outlined"
                                startIcon={<SwapHorizIcon />}
                                onClick={() => setModuloSeleccionado(
                                    moduloSeleccionado === MODULO_TUTORIAS ? MODULO_JUSTIFICANTES : MODULO_TUTORIAS
                                )}
                            >
                                {t("reports.switchTo", {
                                    module: modulos.find((item) => item.id !== moduloSeleccionado)?.title || ""
                                })}
                            </Button>
                        )}
                        <Button variant="contained" startIcon={<DownloadIcon />} onClick={generarPDF} className="reportes-export-button">
                            {t("reports.export")}
                        </Button>
                    </Box>
                </section>

                <Box className="reportes-pdf">
                    <Box className="reportes-pdf-header">
                        <Typography fontWeight="bold">{t("common.university").toUpperCase()}</Typography>
                        <Typography>{modulo.title}</Typography>
                        <Divider sx={{ mt: 1 }} />
                    </Box>

                    <div className="reportes-metricas">
                        {metricas.map((metrica) => {
                            const Icono = metrica.icon;
                            return (
                                <Card key={metrica.label} className={`reporte-metric-card ${metrica.tone || ""}`}>
                                    <CardContent>
                                        <Box className="reporte-metric-icon"><Icono /></Box>
                                        <Typography className="reporte-muted">{metrica.label}</Typography>
                                        <Typography variant="h4" fontWeight="bold">{metrica.value ?? 0}</Typography>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="reportes-main-grid">
                        <GraficaEstados data={datosGrafica} total={totalModulo} title={graficaTitulo} description={graficaDescripcion} />
                        <Card className="reporte-card">
                            <CardContent>
                                <Box className="reporte-card-title">
                                    <TipsAndUpdatesIcon />
                                    <Typography fontWeight="bold">{t("reports.recommendations")}</Typography>
                                </Box>
                                <ul className="reporte-recomendaciones">
                                    {recomendaciones.map((item, index) => <li key={index}>{item}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="reportes-analytics-grid">
                        <GraficaResolucion reporte={reporte} modulo={moduloSeleccionado} />
                        <GraficaDesgloseAlcance usuario={usuario} reporte={reporte} modulo={moduloSeleccionado} />
                    </div>

                    {usuario.id_rol === 2 && (
                        <Card className="reporte-card">
                            <CardContent>
                                <Typography fontWeight="bold">{reporte.nombre}</Typography>
                                <Typography className="reporte-muted">{t("reports.studentId")}: {reporte.matricula}</Typography>
                                {moduloSeleccionado === MODULO_TUTORIAS && (
                                    <>
                                        <Typography className="reporte-muted">
                                            {t("reports.lastSession")}: {reporte.ultimaTutoria ? formatDate(reporte.ultimaTutoria) : t("common.noRecord")}
                                        </Typography>
                                        <Typography className="reporte-muted">
                                            {t("reports.nextSession")}: {reporte.proximaTutoria ? formatDate(reporte.proximaTutoria) : t("common.noRecord")}
                                        </Typography>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {usuario.id_rol === 1 && moduloSeleccionado === MODULO_TUTORIAS && (
                        <div className="reportes-main-grid">
                            <GraficaComparativa
                                titulo={t("reports.groupsAttention")}
                                descripcion={t("reports.charts.groupsPendingDescription")}
                                items={reporte.grupos}
                            />
                            <GraficaComparativa
                                titulo={t("reports.tutorWorkload")}
                                descripcion={t("reports.charts.tutorsPendingDescription")}
                                items={reporte.tutores}
                            />
                        </div>
                    )}

                    {usuario.id_rol === 1 && moduloSeleccionado === MODULO_JUSTIFICANTES && (
                        <ListaDecision titulo={t("reports.excusesByGroup")} items={reporte.grupos} modulo={moduloSeleccionado} />
                    )}

                    {usuario.id_rol === 3 && (
                        <ListaDecision
                            titulo={moduloSeleccionado === MODULO_TUTORIAS ? t("reports.priorityStudents") : t("reports.excusesByStudent")}
                            items={moduloSeleccionado === MODULO_TUTORIAS ? reporte.alumnos : reporte.justificantes}
                            modulo={moduloSeleccionado}
                        />
                    )}

                    {usuario.id_rol === 4 && (
                        <Card className="reporte-card">
                            <CardContent>
                                <Typography fontWeight="bold">{reporte.nombre}</Typography>
                                <Typography className="reporte-muted">{translateReportText(t, reporte.mensaje)}</Typography>
                                <Typography className="reporte-muted">{t("reports.teacherDescription")}</Typography>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Box>
        </Layout>
    );
}

export default Reportes;
