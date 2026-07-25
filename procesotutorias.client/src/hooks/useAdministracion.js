import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";

const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const obtenerMensajeError = async (response, fallbackMessage) => {
    const texto = await response.text();

    if (!texto) return fallbackMessage;

    try {
        const data = JSON.parse(texto);
        return data.message || data.mensaje || texto;
    } catch {
        return texto;
    }
};

const requestAdmin = async (url, options = {}, fallbackMessage) => {
    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        throw new Error(await obtenerMensajeError(response, fallbackMessage));
    }

    if (response.status === 204) return null;

    const texto = await response.text();
    return texto ? JSON.parse(texto) : null;
};

export const useAdminCatalogos = () => {
    const { t } = useI18n();
    const [roles, setRoles] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [candidatosTutor, setCandidatosTutor] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const localizedRequestAdmin = useCallback(
        (url, options = {}) => requestAdmin(url, options, t("common.requestFailed")),
        [t]
    );

    const cargarRoles = useCallback(async () => {
        const data = await localizedRequestAdmin("/Roles");
        setRoles(data || []);
        return data || [];
    }, [localizedRequestAdmin]);

    const cargarUsuarios = useCallback(async (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.buscar) params.set("buscar", filtros.buscar);
        if (filtros.idRol) params.set("idRol", filtros.idRol);

        const query = params.toString();
        const data = await localizedRequestAdmin(`/Usuarios${query ? `?${query}` : ""}`);
        setUsuarios(data || []);
        return data || [];
    }, [localizedRequestAdmin]);

    const cargarCandidatosTutor = useCallback(async () => {
        const data = await localizedRequestAdmin("/Tutores/usuarios-candidatos");
        setCandidatosTutor(data || []);
        return data || [];
    }, [localizedRequestAdmin]);

    const cargarCatalogos = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            await Promise.all([cargarRoles(), cargarUsuarios(), cargarCandidatosTutor()]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [cargarRoles, cargarUsuarios, cargarCandidatosTutor]);

    useEffect(() => {
        cargarCatalogos();
    }, [cargarCatalogos]);

    return {
        roles,
        usuarios,
        candidatosTutor,
        loading,
        error,
        cargarRoles,
        cargarUsuarios,
        cargarCandidatosTutor,
        cargarCatalogos,
        requestAdmin: localizedRequestAdmin
    };
};

export const useAdminTutores = () => {
    const { t } = useI18n();
    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const localizedRequestAdmin = useCallback(
        (url, options = {}) => requestAdmin(url, options, t("common.requestFailed")),
        [t]
    );

    const cargarTutores = useCallback(async (buscar = "") => {
        try {
            setLoading(true);
            setError("");
            const params = new URLSearchParams();
            if (buscar) params.set("buscar", buscar);

            const query = params.toString();
            const data = await localizedRequestAdmin(`/Tutores${query ? `?${query}` : ""}`);
            setTutores(data || []);
            return data || [];
        } catch (err) {
            setError(err.message);
            setTutores([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [localizedRequestAdmin]);

    useEffect(() => {
        cargarTutores();
    }, [cargarTutores]);

    return { tutores, loading, error, cargarTutores, requestAdmin: localizedRequestAdmin };
};
