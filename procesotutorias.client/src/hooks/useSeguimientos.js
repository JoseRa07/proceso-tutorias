import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { readApiJson } from "../utils/apiErrors";

export const useSeguimientos = (usuario, estado = null) => {
    const { t } = useI18n();
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const token = localStorage.getItem("token");

    const request = useCallback(async (path, options = {}) => {
        const response = await fetch(`${API_URL}/Seguimiento${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        return readApiJson(response, t("followup.errors.request"));
    }, [t, token]);

    const cargarAlumnos = useCallback(async () => {
        if (![2, 3].includes(usuario?.id_rol)) return;

        try {
            setLoading(true);
            setError("");
            const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
            const data = await request(query);
            setAlumnos(Array.isArray(data) ? data : []);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [estado, request, usuario]);

    useEffect(() => {
        cargarAlumnos();
    }, [cargarAlumnos]);

    const cargarSeguimientos = useCallback(
        (idAlumno, soloActivos = false) =>
            request(`/alumno/${idAlumno}?soloActivos=${soloActivos}`),
        [request]
    );

    const cargarSesiones = useCallback(
        (idSeguimiento) => request(`/${idSeguimiento}/sesiones`),
        [request]
    );

    const cambiarEstado = useCallback(
        (idSeguimiento, nuevoEstado) => request(`/${idSeguimiento}/estado`, {
            method: "PUT",
            body: JSON.stringify({ estado: nuevoEstado })
        }),
        [request]
    );

    const obtenerAlumnosParaFiltro = useCallback(
        () => request(""),
        [request]
    );

    return {
        alumnos,
        loading,
        error,
        cargarAlumnos,
        cargarSeguimientos,
        cargarSesiones,
        cambiarEstado,
        obtenerAlumnosParaFiltro
    };
};
