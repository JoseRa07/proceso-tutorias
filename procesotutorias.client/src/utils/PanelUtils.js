// HELPER PARA LA VISTA DE PANEL

// SALUDO DE BIENVENIDA BASADO EN LA HORA
export const saludo = () => {
    const hora = new Date().getHours();

    if (hora >= 6 && hora < 12) return "Buenos días";
    if (hora >= 12 && hora < 19) return "Buenas tardes";
    return "Buenas noches";
};