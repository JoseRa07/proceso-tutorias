import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";

export const useJustificantes = (usuario, estado, alumnoId, setPopup, refreshKey = 0) => {
    const { t } = useI18n();
    const [justificantes, setJustificantes] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!usuario) return;

        const fetchData = async () => {
            const startTime = Date.now();
            const alreadyLoadedKey = `justificantes_loaded_${usuario?.id_usuario}`;
            const idRol = Number(usuario.id_rol);
            const token = localStorage.getItem("token");
            const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

            try {
                setLoading(true);

                const alreadyLoaded = sessionStorage.getItem(alreadyLoadedKey);
                const debeMostrarCarga = !alreadyLoaded || estado !== null || alumnoId !== "" || refreshKey > 0;

                if (debeMostrarCarga) {
                    setPopup({
                        open: true,
                        loading: true,
                        type: "info",
                        titulo: t("tutoring.loadingInfoTitle"),
                        mensaje: t("tutoring.loadingInfoMessage")
                    });
                }

                let url = `${API_URL}/Justificante?idUsuario=${usuario.id_usuario}&idRol=${idRol}`;

                if (estado) url += `&estado=${estado}`;
                if (alumnoId) url += `&idAlumno=${alumnoId}`;

                const res = await fetch(url, { headers: authHeaders });
                if (!res.ok) throw new Error(t("excuses.loadError"));

                const data = await res.json();
                setJustificantes(data?.data || []);

                if (idRol !== 2) {
                    const resAlumnos = await fetch(`${API_URL}/Tutoria/alumnos?idUsuario=${usuario.id_usuario}`, {
                        headers: authHeaders
                    });

                    if (!resAlumnos.ok) throw new Error(t("excuses.studentsLoadError"));

                    const dataAlumnos = await resAlumnos.json();
                    setAlumnos(dataAlumnos || []);
                } else {
                    setAlumnos([]);
                }

                sessionStorage.setItem(alreadyLoadedKey, "true");

                const elapsed = Date.now() - startTime;
                const delay = Math.max(700 - elapsed, 0);

                if (debeMostrarCarga) {
                    setTimeout(() => {
                        setPopup({
                            open: true,
                            loading: false,
                            type: "success",
                            titulo: t("tutoring.loadedTitle"),
                            mensaje: t("tutoring.loadedMessage")
                        });
                    }, delay);
                }
            } catch (error) {
                setJustificantes([]);
                setAlumnos([]);

                setTimeout(() => {
                    setPopup({
                        open: true,
                        loading: false,
                        type: "error",
                        titulo: t("tutoring.fetchErrorTitle"),
                        mensaje: t("tutoring.fetchErrorMessage")
                    });
                }, 700);

                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [usuario, estado, alumnoId, setPopup, refreshKey, t]);

    return { justificantes, loading, alumnos };
};
