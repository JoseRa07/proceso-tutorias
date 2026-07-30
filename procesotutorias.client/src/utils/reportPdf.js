import { jsPDF } from "jspdf";

const COLORS = {
    navy: [18, 25, 39],
    green: [32, 168, 94],
    greenLight: [232, 247, 239],
    ink: [31, 41, 55],
    muted: [100, 116, 139],
    border: [203, 213, 225],
    stripe: [248, 250, 252],
    white: [255, 255, 255]
};

const PAGE = {
    width: 210,
    height: 297,
    margin: 14,
    contentWidth: 182,
    contentBottom: 278
};

const asText = (value, empty = "-") => {
    if (value === null || value === undefined || value === "") return empty;
    return String(value);
};

const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const setTextColor = (doc, color) => doc.setTextColor(...color);
const setFillColor = (doc, color) => doc.setFillColor(...color);
const setDrawColor = (doc, color) => doc.setDrawColor(...color);

const addContinuationHeader = (context) => {
    const { doc, title } = context;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTextColor(doc, COLORS.muted);
    doc.text(title, PAGE.margin, 11);
    setDrawColor(doc, COLORS.border);
    doc.line(PAGE.margin, 14, PAGE.width - PAGE.margin, 14);
    context.y = 21;
};

const addPage = (context) => {
    context.doc.addPage();
    addContinuationHeader(context);
};

const ensureSpace = (context, requiredHeight) => {
    if (context.y + requiredHeight <= PAGE.contentBottom) return;
    addPage(context);
};

const addDocumentHeader = (context, subtitle, generatedAt, generatedBy, t) => {
    const { doc, title } = context;
    setTextColor(doc, COLORS.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(t("common.university"), PAGE.margin, 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(title, PAGE.margin, 21);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(subtitle, PAGE.margin, 27);
    doc.text(
        `${t("reports.pdf.generatedAt")}: ${generatedAt}`,
        PAGE.margin,
        33
    );
    doc.text(
        `${t("reports.pdf.generatedBy")}: ${generatedBy}`,
        PAGE.margin,
        38
    );

    setDrawColor(doc, COLORS.border);
    doc.line(PAGE.margin, 42, PAGE.width - PAGE.margin, 42);
    context.y = 49;
};

const addSectionTitle = (context, title) => {
    ensureSpace(context, 11);
    const { doc } = context;
    setFillColor(doc, COLORS.green);
    doc.roundedRect(PAGE.margin, context.y - 3.8, 2.3, 7.5, 1, 1, "F");
    setTextColor(doc, COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, PAGE.margin + 6, context.y + 1);
    context.y += 8;
};

const resolveColumns = (columns) => {
    const assignedWidth = columns.reduce((sum, column) => sum + (column.width || 0), 0);
    const automaticColumns = columns.filter((column) => !column.width).length;
    const automaticWidth = automaticColumns
        ? (PAGE.contentWidth - assignedWidth) / automaticColumns
        : 0;

    return columns.map((column) => ({
        ...column,
        width: column.width || automaticWidth
    }));
};

const getWrappedCell = (doc, value, width) => {
    const availableWidth = Math.max(width - 4, 4);
    return doc.splitTextToSize(asText(value), availableWidth);
};

const getHeaderHeight = (doc, columns) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    const lines = columns.map((column) =>
        getWrappedCell(doc, column.label, column.width).length
    );
    return Math.max(8, Math.max(...lines) * 3.5 + 3);
};

const drawTableHeader = (context, columns, headerHeight) => {
    const { doc } = context;
    let x = PAGE.margin;

    columns.forEach((column) => {
        setFillColor(doc, COLORS.navy);
        setDrawColor(doc, COLORS.navy);
        doc.rect(x, context.y, column.width, headerHeight, "FD");

        setTextColor(doc, COLORS.white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.3);
        const lines = getWrappedCell(doc, column.label, column.width);
        doc.text(lines, x + 2, context.y + 4.2);
        x += column.width;
    });

    context.y += headerHeight;
};

const addTable = (context, columnsDefinition, rows, emptyMessage) => {
    const { doc } = context;
    const columns = resolveColumns(columnsDefinition);
    const headerHeight = getHeaderHeight(doc, columns);
    const tableRows = rows?.length
        ? rows
        : [{ __empty: emptyMessage }];

    ensureSpace(context, headerHeight + 8);
    drawTableHeader(context, columns, headerHeight);

    tableRows.forEach((row, rowIndex) => {
        if (row.__empty) {
            ensureSpace(context, 9);
            setFillColor(doc, COLORS.stripe);
            setDrawColor(doc, COLORS.border);
            doc.rect(PAGE.margin, context.y, PAGE.contentWidth, 9, "FD");
            setTextColor(doc, COLORS.muted);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8.2);
            doc.text(row.__empty, PAGE.margin + 3, context.y + 5.7);
            context.y += 9;
            return;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const cells = columns.map((column) =>
            getWrappedCell(doc, row[column.key], column.width)
        );
        const rowHeight = Math.max(
            7.5,
            Math.max(...cells.map((cell) => cell.length)) * 3.7 + 3
        );

        if (context.y + rowHeight > PAGE.contentBottom) {
            addPage(context);
            drawTableHeader(context, columns, headerHeight);
        }

        let x = PAGE.margin;
        columns.forEach((column, columnIndex) => {
            setFillColor(doc, rowIndex % 2 === 0 ? COLORS.white : COLORS.stripe);
            setDrawColor(doc, COLORS.border);
            doc.rect(x, context.y, column.width, rowHeight, "FD");

            setTextColor(doc, COLORS.ink);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            const align = column.align || "left";
            const textX = align === "right"
                ? x + column.width - 2
                : x + 2;
            doc.text(cells[columnIndex], textX, context.y + 4.5, { align });
            x += column.width;
        });
        context.y += rowHeight;
    });

    context.y += 6;
};

const addRecommendations = (context, recommendations, t, translateText) => {
    addSectionTitle(context, t("reports.recommendations"));
    const items = recommendations?.length
        ? recommendations.map((item, index) => ({
            order: index + 1,
            recommendation: translateText(item)
        }))
        : [{
            order: "-",
            recommendation: t("reports.noCriticalAlerts")
        }];

    addTable(
        context,
        [
            { key: "order", label: "#", width: 12, align: "right" },
            {
                key: "recommendation",
                label: t("reports.pdf.recommendation"),
                width: 170
            }
        ],
        items,
        t("reports.noData")
    );
};

const addTutoringStatus = (context, report, t) => {
    addSectionTitle(context, t("reports.pdf.tutoringStatus"));
    addTable(
        context,
        [
            { key: "metric", label: t("reports.pdf.indicator"), width: 125 },
            { key: "value", label: t("reports.pdf.value"), width: 57, align: "right" }
        ],
        [
            { metric: t("reports.metrics.sessions"), value: asNumber(report.totalTutorias) },
            { metric: t("reports.metrics.completed"), value: asNumber(report.tutoriasCompletadas) },
            { metric: t("reports.metrics.pending"), value: asNumber(report.tutoriasPendientes) },
            { metric: t("reports.editing"), value: asNumber(report.tutoriasEnEdicion) }
        ],
        t("reports.noData")
    );
};

const addExcuseStatus = (context, report, t) => {
    if (report.totalJustificantes === undefined) return;

    addSectionTitle(context, t("reports.pdf.excuseStatus"));
    addTable(
        context,
        [
            { key: "metric", label: t("reports.pdf.indicator"), width: 125 },
            { key: "value", label: t("reports.pdf.value"), width: 57, align: "right" }
        ],
        [
            { metric: t("reports.metrics.excuses"), value: asNumber(report.totalJustificantes) },
            { metric: t("reports.metrics.pending"), value: asNumber(report.justificantesPendientes) },
            { metric: t("reports.pdf.approved"), value: asNumber(report.justificantesAprobados) },
            { metric: t("reports.pdf.rejected"), value: asNumber(report.justificantesRechazados) }
        ],
        t("reports.noData")
    );
};

const addOverview = (context, user, report, t, translateText) => {
    const rowsByRole = {
        1: [
            { metric: t("reports.metrics.users"), value: asNumber(report.totalUsuarios) },
            { metric: t("reports.metrics.students"), value: asNumber(report.totalAlumnos) },
            { metric: t("reports.metrics.activeTutors"), value: asNumber(report.totalTutores) },
            { metric: t("reports.metrics.groups"), value: asNumber(report.totalGrupos) }
        ],
        2: [
            { metric: t("reports.pdf.name"), value: asText(report.nombre) },
            { metric: t("reports.studentId"), value: asText(report.matricula) },
            { metric: t("reports.lastSession"), value: asText(report.ultimaTutoria, t("common.noRecord")) }
        ],
        3: [
            { metric: t("reports.pdf.tutor"), value: asText(report.nombreTutor) },
            { metric: t("reports.pdf.group"), value: asText(report.grupo) },
            { metric: t("reports.metrics.students"), value: asNumber(report.totalAlumnos) }
        ],
        4: [
            { metric: t("reports.pdf.name"), value: asText(report.nombre) },
            { metric: t("common.status"), value: translateText(report.mensaje) },
            { metric: t("reports.metrics.groups"), value: asNumber(report.totalGrupos) },
            { metric: t("reports.metrics.students"), value: asNumber(report.totalAlumnos) }
        ]
    };

    addSectionTitle(context, t("reports.pdf.overview"));
    addTable(
        context,
        [
            { key: "metric", label: t("reports.pdf.indicator"), width: 80 },
            { key: "value", label: t("reports.pdf.value"), width: 102 }
        ],
        rowsByRole[user.id_rol] || [],
        t("reports.noData")
    );
};

const addAdminTables = (context, report, t) => {
    addSectionTitle(context, t("reports.groupsAttention"));
    addTable(
        context,
        [
            { key: "grupo", label: t("reports.pdf.group"), width: 48 },
            { key: "totalAlumnos", label: t("reports.metrics.students"), width: 30, align: "right" },
            { key: "totalTutorias", label: t("reports.metrics.sessions"), width: 34, align: "right" },
            { key: "tutoriasPendientes", label: t("reports.metrics.pending"), width: 32, align: "right" },
            { key: "totalJustificantes", label: t("reports.metrics.excuses"), width: 38, align: "right" }
        ],
        report.grupos,
        t("reports.noData")
    );

    addSectionTitle(context, t("reports.tutorWorkload"));
    addTable(
        context,
        [
            { key: "nombreTutor", label: t("reports.pdf.tutor"), width: 62 },
            { key: "totalGrupos", label: t("reports.metrics.groups"), width: 28, align: "right" },
            { key: "totalAlumnos", label: t("reports.metrics.students"), width: 30, align: "right" },
            { key: "totalTutorias", label: t("reports.metrics.sessions"), width: 32, align: "right" },
            { key: "tutoriasPendientes", label: t("reports.metrics.pending"), width: 30, align: "right" }
        ],
        report.tutores,
        t("reports.noData")
    );
};

const addTutorTables = (context, report, t) => {
    addSectionTitle(context, t("reports.priorityStudents"));
    addTable(
        context,
        [
            { key: "matricula", label: t("reports.studentId"), width: 29 },
            { key: "nombre", label: t("reports.pdf.name"), width: 49 },
            { key: "totalTutorias", label: t("reports.metrics.sessions"), width: 27, align: "right" },
            { key: "tutoriasPendientes", label: t("reports.metrics.pending"), width: 26, align: "right" },
            { key: "tutoriasCompletadas", label: t("reports.metrics.completed"), width: 27, align: "right" },
            { key: "totalJustificantes", label: t("reports.metrics.excuses"), width: 24, align: "right" }
        ],
        report.alumnos,
        t("reports.noData")
    );

    addSectionTitle(context, t("reports.excusesByStudent"));
    addTable(
        context,
        [
            { key: "matricula", label: t("reports.studentId"), width: 30 },
            { key: "nombre", label: t("reports.pdf.name"), width: 58 },
            { key: "total", label: t("reports.pdf.total"), width: 24, align: "right" },
            { key: "pendientes", label: t("reports.metrics.pending"), width: 24, align: "right" },
            { key: "aprobados", label: t("reports.pdf.approved"), width: 23, align: "right" },
            { key: "rechazados", label: t("reports.pdf.rejected"), width: 23, align: "right" }
        ],
        report.justificantes,
        t("reports.noData")
    );
};

const addFooters = (context, t) => {
    const { doc } = context;
    const pages = doc.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        setDrawColor(doc, COLORS.border);
        doc.line(PAGE.margin, 284, PAGE.width - PAGE.margin, 284);
        setTextColor(doc, COLORS.muted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(t("common.university"), PAGE.margin, 289);
        doc.text(
            `${t("reports.pdf.page")} ${page} ${t("reports.pdf.of")} ${pages}`,
            PAGE.width - PAGE.margin,
            289,
            { align: "right" }
        );
    }
};

export const buildReportPdf = ({
    user,
    report,
    locale,
    t,
    translateText
}) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true,
        compress: true
    });
    const title = t(`reports.titles.${user.id_rol || "default"}`);
    const context = { doc, title, y: 0 };
    const generatedAt = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date());
    const generatedBy = user.nombre || user.correo || t("reports.pdf.systemUser");

    addDocumentHeader(
        context,
        t("reports.pdf.subtitle"),
        generatedAt,
        generatedBy,
        t
    );
    addOverview(context, user, report, t, translateText);
    addTutoringStatus(context, report, t);
    addExcuseStatus(context, report, t);

    if (user.id_rol === 1) addAdminTables(context, report, t);
    if (user.id_rol === 3) addTutorTables(context, report, t);

    addRecommendations(context, report.recomendaciones, t, translateText);
    addFooters(context, t);
    return doc;
};

export const downloadReportPdf = (options) => {
    const doc = buildReportPdf(options);
    doc.save(options.t("reports.fileName"));
};
