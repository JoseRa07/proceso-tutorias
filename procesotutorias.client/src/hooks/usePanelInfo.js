// AQUI SE HACEN LAS LLAMADAS AL API PARA LA VISTA DE PANEL/INICIO(YA LOGEADO)

import { useEffect, useState } from "react";
import { API_URL } from "../api";

export const usePanelInfo = (usuario) => {
    const [grupo, setGrupo] = useState(null);
    const [tutorias, setTutorias] = useState([]);
    const [tutoriasAsignadas, setTutoriasAsignadas] = useState([]);

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
            if (!response.ok) {
                throw new Error(`Error ${response.status} al consultar ${url}`);
            }
            return response.json();
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
                console.error(grupoResult.reason);
            }

            if (pendientesResult.status === "fulfilled") {
                setTutoriasAsignadas(getTutorias(pendientesResult.value));
            } else {
                setTutoriasAsignadas([]);
                console.error(pendientesResult.reason);
            }

            if (completadasResult.status === "fulfilled") {
                setTutorias(getTutorias(completadasResult.value));
            } else {
                setTutorias([]);
                console.error(completadasResult.reason);
            }
        };

        cargarPanel();

        return () => controller.abort();

    }, [usuario]);

    return { grupo, tutorias, tutoriasAsignadas };
};
