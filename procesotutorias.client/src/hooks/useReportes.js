import { useEffect, useState } from "react";
import { API_URL } from "../api";

export const useReportes = (usuario) => {
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!usuario?.id_usuario) return;

        const cargarReporte = async () => {
            setLoading(true);

            let url = "";

            if (usuario.id_rol === 1) url = `${API_URL}/Reportes/admin`;
            if (usuario.id_rol === 2) url = `${API_URL}/Reportes/alumno/${usuario.id_usuario}`;
            if (usuario.id_rol === 3) url = `${API_URL}/Reportes/tutor/${usuario.id_usuario}`;
            if (usuario.id_rol === 4) url = `${API_URL}/Reportes/maestro/${usuario.id_usuario}`;

            try {
                const res = await fetch(url);
                const data = await res.json();
                setReporte(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        cargarReporte();
    }, [usuario?.id_usuario, usuario?.id_rol]);

    return { reporte, loading };
};