// AQUI SE HACEN LAS LLAMADAS AL API PARA LA VISTA DE PANEL/INICIO(YA LOGEADO)

import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { readApiJson } from "../utils/apiErrors";

export const usePanelInfo = (usuario) => {
    const { t } = useI18n();
    const [grupo, setGrupo] = useState(null);
    const [tutorias, setTutorias] = useState([]);
    const [tutoriasAsignadas, setTutoriasAsignadas] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!usuario) return;

        const rolesConTutorias = [2, 3];
        if (!rolesConTutorias.includes(Number(usuario.id_rol))) return;

        const token = localStorage.getItem("token");
        const controller = new AbortController();
        const options = {
            headers: {
                Authorization: `Bearer ${token}`
            },
            signal: controller.signal
        };

        const fetchJson = async (url) => {
            const response = await fetch(url, options);
            return readApiJson(response, t("common.requestFailed"));
        };

        const buildTutoriaUrl = (estado) => {
            const params = new URLSearchParams({
                idUsuario: String(usuario.id_usuario),
                idRol: String(usuario.id_rol),
                estado,
                pagina: "1",
                tam: "5"
            });

            return `${API_URL}/Tutoria?${params.toString()}`;
        };

        const getTutorias = (payload) => {
            if (Array.isArray(payload)) return payload;
            return Array.isArray(payload?.data) ? payload.data : [];
        };

        const cargarPanel = async () => {
            setError("");
            const [grupoResult, pendientesResult, completadasResult] = await Promise.allSettled([
                fetchJson(`${API_URL}/Grupo/${usuario.id_usuario}`),
                fetchJson(buildTutoriaUrl("PENDIENTE")),
                fetchJson(buildTutoriaUrl("COMPLETADA"))
            ]);

            if (controller.signal.aborted) return;

            if (grupoResult.status === "fulfilled") {
                setGrupo(grupoResult.value);
            } else {
                setGrupo(null);
            }

            if (pendientesResult.status === "fulfilled") {
                setTutoriasAsignadas(getTutorias(pendientesResult.value));
            } else {
                setTutoriasAsignadas([]);
            }

            if (completadasResult.status === "fulfilled") {
                setTutorias(getTutorias(completadasResult.value));
            } else {
                setTutorias([]);
            }

            const firstFailure = [grupoResult, pendientesResult, completadasResult]
                .find((result) => result.status === "rejected");
            if (firstFailure?.status === "rejected") {
                setError(firstFailure.reason?.message || t("common.requestFailed"));
            }
        };

        cargarPanel();

        return () => controller.abort();

    }, [t, usuario]);

    return { grupo, tutorias, tutoriasAsignadas, error };
};
