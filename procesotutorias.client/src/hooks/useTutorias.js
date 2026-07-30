import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";

export const useTutorias = (usuario, estado, alumnoId, setPopup, refreshKey = 0) => {
    const { t } = useI18n();

    const [tutorias, setTutorias] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(false);

    const alreadyLoadedKey = `tutorias_loaded_${usuario?.id_usuario}`;

    useEffect(() => {
        if (!usuario) return;

        const token = localStorage.getItem("token");

        const fetchData = async () => {

            const startTime = Date.now();

            try {
                setLoading(true);

                const alreadyLoaded = sessionStorage.getItem(alreadyLoadedKey);

                if (!alreadyLoaded || estado || alumnoId) {
                    setPopup({
                        open: true,
                        loading: true,
                        type: "info",
                        titulo: t("tutoring.loadingInfoTitle"),
                        mensaje: t("tutoring.loadingInfoMessage")
                    });
                }

                let url = `${API_URL}/Tutoria?idUsuario=${usuario.id_usuario}&idRol=${usuario.id_rol}`;

                if (estado) url += `&estado=${estado}`;
                if (alumnoId) url += `&idAlumno=${alumnoId}`;

                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await res.json();

                const lista = Array.isArray(data)
                    ? data
                    : data?.data || [];

                setTutorias(lista);

                if (usuario.id_rol !== 2) {
                    const resAlumnos = await fetch(
                        `${API_URL}/Tutoria/alumnos?idUsuario=${usuario.id_usuario}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    const dataAlumnos = await resAlumnos.json();
                    setAlumnos(dataAlumnos || []);
                }

                sessionStorage.setItem(alreadyLoadedKey, "true");

                const elapsed = Date.now() - startTime;
                const delay = Math.max(1000 - elapsed, 0);

                if (!alreadyLoaded || estado || alumnoId) {
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

                console.log(error);
                setTutorias([]);

                setTimeout(() => {
                    setPopup({
                        open: true,
                        loading: false,
                        type: "error",
                        titulo: t("tutoring.fetchErrorTitle"),
                        mensaje: t("tutoring.fetchErrorMessage")
                    });
                }, 1000);

            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [usuario, estado, alumnoId, refreshKey, alreadyLoadedKey, setPopup, t]);

    return { tutorias, loading, alumnos };
};
