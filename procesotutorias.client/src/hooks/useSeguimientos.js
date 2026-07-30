import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";

const getErrorMessage = async (response, fallback) => {
    try {
        const data = await response.json();
        return data?.message || fallback;
    } catch {
        return fallback;
    }
};

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

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, t("followup.errors.request")));
        }

        if (response.status === 204) return null;
        return response.json();
    }, [t, token]);

    const cargarAlumnos = useCallback(async () => {
        if (usuario?.id_rol !== 3) return;

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
