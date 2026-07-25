// Helper para la vista de panel.

export const saludo = (t) => {
    const hora = new Date().getHours();

    if (hora >= 6 && hora < 12) return t("panel.greeting.morning");
    if (hora >= 12 && hora < 19) return t("panel.greeting.afternoon");
    return t("panel.greeting.evening");
};
