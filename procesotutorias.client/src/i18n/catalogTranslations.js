const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const translateRole = (t, role) => {
    if (!role) return role;
    const key = normalize(role);
    const translated = t(`common.roles.${key}`);
    return translated === `common.roles.${key}` ? role : translated;
};

const reportTextKeys = {
    "Revisar tutorías pendientes para evitar rezagos de seguimiento.": "studentPending",
    "Dar seguimiento a justificantes pendientes de revisión.": "studentExcuses",
    "Solicitar o programar una tutoría inicial para contar con seguimiento académico.": "studentInitial",
    "Priorizar tutorías pendientes para mejorar el cierre de seguimiento académico.": "adminPending",
    "Detectar grupos sin tutorías registradas y programar seguimiento inicial.": "adminNoSessions",
    "Revisar justificantes pendientes para evitar acumulación administrativa.": "adminExcuses",
    "Atender alumnos con tutorías pendientes para cerrar acuerdos oportunamente.": "tutorPending",
    "Programar tutorías iniciales para alumnos sin seguimiento registrado.": "tutorInitial",
    "Revisar justificantes pendientes del grupo para identificar posibles ausencias recurrentes.": "tutorExcuses",
    "Solicitar asignación como tutor si requiere dar seguimiento académico a un grupo.": "teacherAssignment",
    "Cerrar tutorías pendientes para mejorar la trazabilidad del grupo.": "teacherPending",
    "El usuario está asignado como tutor": "teacherAssigned",
    "No asignado como tutor en el periodo actual": "teacherUnassigned"
};

export const translateReportText = (t, text) => {
    const key = reportTextKeys[text];
    return key ? t(`reports.recommendationsMap.${key}`) : text;
};
