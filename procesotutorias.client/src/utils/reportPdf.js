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

const formatDateValue = (value, locale, empty) => {
    if (!value) return empty;
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime())
        ? asText(value, empty)
        : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
};

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

const addHorizontalBarChart = (context, title, rows, emptyMessage) => {
    const chartRows = (rows || []).filter((row) => row?.label).slice(0, 8);
    const rowHeight = 11;
    ensureSpace(context, 8 + (chartRows.length ? chartRows.length * rowHeight + 5 : 12));
    addSectionTitle(context, title);

    if (!chartRows.length) {
        setTextColor(context.doc, COLORS.muted);
        context.doc.setFont("helvetica", "italic");
        context.doc.setFontSize(8.2);
        context.doc.text(emptyMessage, PAGE.margin, context.y + 4);
        context.y += 10;
        return;
    }

    const { doc } = context;
    const labelWidth = 60;
    const barWidth = 99;
    const barX = PAGE.margin + labelWidth;
    const maximum = Math.max(1, ...chartRows.map((row) => asNumber(row.value)));

    chartRows.forEach((row) => {
        const value = asNumber(row.value);
        const width = value > 0 ? Math.max(2, (value / maximum) * barWidth) : 0;
        const label = doc.splitTextToSize(asText(row.label), labelWidth - 4)[0];

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        setTextColor(doc, COLORS.ink);
        doc.text(label, PAGE.margin, context.y + 5.5);

        setFillColor(doc, COLORS.stripe);
        doc.roundedRect(barX, context.y + 1.6, barWidth, 5.2, 1.2, 1.2, "F");
        if (width > 0) {
            setFillColor(doc, row.color || COLORS.green);
            doc.roundedRect(barX, context.y + 1.6, width, 5.2, 1.2, 1.2, "F");
        }

        doc.setFont("helvetica", "bold");
        doc.text(String(value), PAGE.width - PAGE.margin, context.y + 5.5, { align: "right" });
        context.y += rowHeight;
    });

    context.y += 4;
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
    addHorizontalBarChart(
        context,
        t("reports.charts.tutoringTitle"),
        [
            { label: t("reports.metrics.completed"), value: report.tutoriasCompletadas, color: COLORS.green },
            { label: t("reports.metrics.pending"), value: report.tutoriasPendientes, color: [228, 148, 32] },
            { label: t("reports.editing"), value: report.tutoriasEnEdicion, color: [79, 124, 172] }
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
    addHorizontalBarChart(
        context,
        t("reports.charts.excusesTitle"),
        [
            { label: t("reports.pdf.approved"), value: report.justificantesAprobados, color: COLORS.green },
            { label: t("reports.metrics.pending"), value: report.justificantesPendientes, color: [228, 148, 32] },
            { label: t("reports.pdf.rejected"), value: report.justificantesRechazados, color: [201, 75, 69] }
        ],
        t("reports.noData")
    );
};

const addOverview = (context, user, report, locale, t, translateText) => {
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
            { metric: t("reports.lastSession"), value: formatDateValue(report.ultimaTutoria, locale, t("common.noRecord")) },
            { metric: t("reports.nextSession"), value: formatDateValue(report.proximaTutoria, locale, t("common.noRecord")) }
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

const addAdminTables = (context, report, module, t) => {
    addSectionTitle(context, t("reports.groupsAttention"));
    const isExcuses = module === "justificantes";
    const groupColumns = isExcuses
        ? [
            { key: "grupo", label: t("reports.pdf.group"), width: 40 },
            { key: "carrera", label: t("reports.pdf.program"), width: 28 },
            { key: "totalAlumnos", label: t("reports.metrics.students"), width: 30, align: "right" },
            { key: "totalJustificantes", label: t("reports.metrics.excuses"), width: 42, align: "right" },
            { key: "justificantesPendientes", label: t("reports.metrics.pending"), width: 42, align: "right" }
        ]
        : [
            { key: "grupo", label: t("reports.pdf.group"), width: 43 },
            { key: "carrera", label: t("reports.pdf.program"), width: 35 },
            { key: "totalAlumnos", label: t("reports.metrics.students"), width: 32, align: "right" },
            { key: "totalTutorias", label: t("reports.metrics.sessions"), width: 36, align: "right" },
            { key: "tutoriasPendientes", label: t("reports.metrics.pending"), width: 36, align: "right" }
        ];
    addTable(context, groupColumns, report.grupos, t("reports.noData"));
    addHorizontalBarChart(
        context,
        isExcuses
            ? t("reports.charts.groupExcuseCoverageTitle")
            : t("reports.groupsAttention"),
        (report.grupos || []).map((group) => ({
            label: group.carrera ? `${group.grupo} - ${group.carrera}` : group.grupo,
            value: isExcuses ? group.justificantesPendientes : group.tutoriasPendientes
        })),
        t("reports.noData")
    );

    if (!isExcuses) {
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
        addHorizontalBarChart(
            context,
            t("reports.tutorWorkload"),
            (report.tutores || []).map((tutor) => ({
                label: tutor.nombreTutor,
                value: tutor.tutoriasPendientes
            })),
            t("reports.noData")
        );
    }
};

const addTutorTables = (context, report, module, t) => {
    if (module === "justificantes") {
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
        addHorizontalBarChart(
            context,
            t("reports.charts.studentExcuseCoverageTitle"),
            (report.justificantes || []).map((student) => ({
                label: student.nombre || student.matricula,
                value: student.pendientes
            })),
            t("reports.noData")
        );
        return;
    }

    addSectionTitle(context, t("reports.priorityStudents"));
    addTable(
        context,
        [
            { key: "matricula", label: t("reports.studentId"), width: 34 },
            { key: "nombre", label: t("reports.pdf.name"), width: 60 },
            { key: "totalTutorias", label: t("reports.metrics.sessions"), width: 30, align: "right" },
            { key: "tutoriasPendientes", label: t("reports.metrics.pending"), width: 29, align: "right" },
            { key: "tutoriasCompletadas", label: t("reports.metrics.completed"), width: 29, align: "right" }
        ],
        report.alumnos,
        t("reports.noData")
    );
    addHorizontalBarChart(
        context,
        t("reports.charts.studentCoverageTitle"),
        (report.alumnos || []).map((student) => ({
            label: student.nombre || student.matricula,
            value: student.tutoriasPendientes
        })),
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
    module = "tutorias",
    recommendations,
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
    const moduleTitle = module === "justificantes"
        ? t("reports.modules.excuses.title")
        : t("reports.modules.tutoring.title");
    const title = `${t(`reports.titles.${user.id_rol || "default"}`)} - ${moduleTitle}`;
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
    addOverview(context, user, report, locale, t, translateText);
    if (module === "justificantes") addExcuseStatus(context, report, t);
    else addTutoringStatus(context, report, t);

    if (user.id_rol === 1) addAdminTables(context, report, module, t);
    if (user.id_rol === 3) addTutorTables(context, report, module, t);

    addRecommendations(context, recommendations ?? report.recomendaciones, t, translateText);
    addFooters(context, t);
    return doc;
};

export const downloadReportPdf = (options) => {
    const doc = buildReportPdf(options);
    const fileName = options.module === "justificantes"
        ? options.t("reports.fileNames.excuses")
        : options.t("reports.fileNames.tutoring");
    doc.save(fileName);
};
