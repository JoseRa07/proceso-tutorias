import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { readApiJson } from "../utils/apiErrors";

export const useReportes = (usuario) => {
    const { t } = useI18n();
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!usuario?.id_usuario) return;

        const controller = new AbortController();
        const cargarReporte = async () => {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");

            let url = "";

            if (usuario.id_rol === 1) url = `${API_URL}/Reportes/admin`;
            if (usuario.id_rol === 2) url = `${API_URL}/Reportes/alumno/${usuario.id_usuario}`;
            if (usuario.id_rol === 3) url = `${API_URL}/Reportes/tutor/${usuario.id_usuario}`;
            if (usuario.id_rol === 4) url = `${API_URL}/Reportes/maestro/${usuario.id_usuario}`;

            try {
                if (!url) throw new Error(t("reports.unavailable"));
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
                const data = await readApiJson(res, t("common.requestFailed"));
                setReporte(data);
            } catch (e) {
                if (e?.name !== "AbortError") {
                    setReporte(null);
                    setError(e?.message || t("common.requestFailed"));
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        cargarReporte();
        return () => controller.abort();
    }, [t, usuario?.id_usuario, usuario?.id_rol]);

    return { reporte, loading, error };
};
