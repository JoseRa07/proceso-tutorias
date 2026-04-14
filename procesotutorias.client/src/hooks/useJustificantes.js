import { useEffect, useState } from "react";
import { API_URL } from "../api";

export const useJustificantes = (usuario, estado, alumnoId, setPopup) => {

    const [justificantes, setJustificantes] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(false);

    const alreadyLoadedKey = `justificantes_loaded_${usuario?.id_usuario}`;

    useEffect(() => {
        if (!usuario) return;

        const fetchData = async () => {

            const startTime = Date.now();

            try {
                setLoading(true);

                const alreadyLoaded = sessionStorage.getItem(alreadyLoadedKey);

                if (!alreadyLoaded || estado !== null || alumnoId !== "") {
                    setPopup({
                        open: true,
                        loading: true,
                        type: "info",
                        titulo: "Recuperando información...",
                        mensaje: "Por favor espera"
                    });
                }

                let url = `${API_URL}/Justificante?idUsuario=${usuario.id_usuario}&idRol=${usuario.id_rol}`;

                if (estado) url += `&estado=${estado}`;
                if (alumnoId) url += `&idAlumno=${alumnoId}`;

                const res = await fetch(url);
                const data = await res.json();

                const lista = data?.data || [];

                setJustificantes(lista);

                // alumnos (solo tutor/admin)
                if (usuario.id_rol !== 2) {
                    const resAlumnos = await fetch(`${API_URL}/Tutoria/alumnos?idUsuario=${usuario.id_usuario}`);
                    const dataAlumnos = await resAlumnos.json();
                    setAlumnos(dataAlumnos || []);
                }

                sessionStorage.setItem(alreadyLoadedKey, "true");

                const elapsed = Date.now() - startTime;
                const delay = Math.max(1000 - elapsed, 0);

                if (!alreadyLoaded || estado !== null || alumnoId !== "") {
                    setTimeout(() => {
                        setPopup({
                            open: true,
                            loading: false,
                            type: "success",
                            titulo: "Información recuperada",
                            mensaje: "Datos cargados correctamente"
                        });
                    }, delay);
                }

            } catch (error) {

                setJustificantes([]);

                setTimeout(() => {
                    setPopup({
                        open: true,
                        loading: false,
                        type: "error",
                        titulo: "Ocurrió un error",
                        mensaje: "No se pudo obtener la información"
                    });
                }, 1000);

                console.log(error);

            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [usuario, estado, alumnoId]);

    return { justificantes, loading, alumnos };
};