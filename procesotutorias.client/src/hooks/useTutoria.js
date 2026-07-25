import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";

const formInicial = {
    alumnoId: "",
    nombreAlumno: "",
    fecha: "",
    horaIni: "",
    horaFin: "",
    motivo: [],
    pts: "",
    acuerdos: "",
    estado: "",
    seguimientoActivo: false,
    seguimientoId: "",
    seguimientoTitulo: "",
    seguimientoDescripcion: ""
};

export const useTutoria = (
    usuario,
    id,
    setPopup,
    onSuccess,
    initialAlumnoId = "",
    initialSeguimientoId = "",
    initialSeguimientoTitulo = ""
) => {
    const { t } = useI18n();
    const [form, setForm] = useState(formInicial);
    const [alumnos, setAlumnos] = useState([]);
    const [grupo, setGrupo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingSeguimientos, setLoadingSeguimientos] = useState(false);
    const [seguimientos, setSeguimientos] = useState([]);
    const token = localStorage.getItem("token");

    const fetchData = useCallback(async () => {
        if (!usuario) return;
        const authHeaders = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        try {
            setLoading(true);

            if (id) {
                const res = await fetch(`${API_URL}/Tutoria/detalle?idSesion=${id}`, { headers: authHeaders });
                const data = await res.json();

                setForm({
                    alumnoId: data.idAlumno,
                    nombreAlumno: data.nombreAlumno,
                    fecha: data.fecha,
                    horaIni: data.horaIni,
                    horaFin: data.horaFin,
                    motivo: data.motivo ? data.motivo.split(",") : [],
                    pts: data.ptsRelevantes || "",
                    acuerdos: data.compromisos || "",
                    estado: data.estado,
                    seguimientoActivo: !!data.idSeguimiento,
                    seguimientoId: data.idSeguimiento || "",
                    seguimientoTitulo: data.tituloSeguimiento || "",
                    seguimientoDescripcion: ""
                });

                const resGrupo = await fetch(`${API_URL}/Grupo/${data.idUsuarioAlumno}`, { headers: authHeaders });
                setGrupo(await resGrupo.json());
                setAlumnos([{ id_alumno: data.idAlumno, nombre: data.nombreAlumno }]);
                return;
            }

            setForm({
                ...formInicial,
                alumnoId: initialAlumnoId || "",
                seguimientoActivo: !!initialSeguimientoId,
                seguimientoId: initialSeguimientoId || "",
                seguimientoTitulo: initialSeguimientoTitulo || "",
                seguimientoDescripcion: ""
            });
            const resGrupo = await fetch(`${API_URL}/Grupo/${usuario.id_usuario}`, { headers: authHeaders });
            setGrupo(await resGrupo.json());

            if (usuario.id_rol !== 2) {
                const resAlumnos = await fetch(`${API_URL}/Tutoria/alumnos?idUsuario=${usuario.id_usuario}`, { headers: authHeaders });
                const lista = await resAlumnos.json();
                setAlumnos(lista || []);
            }
        } catch {
            setPopup({
                open: true,
                loading: false,
                type: "error",
                titulo: t("common.error"),
                mensaje: t("tutoring.loadError")
            });
        } finally {
            setLoading(false);
        }
    }, [
        usuario,
        id,
        token,
        setPopup,
        t,
        initialAlumnoId,
        initialSeguimientoId,
        initialSeguimientoTitulo
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const cargarSeguimientos = async () => {
            if (usuario?.id_rol !== 3 || !form.alumnoId) {
                setSeguimientos([]);
                return;
            }

            try {
                setLoadingSeguimientos(true);
                const response = await fetch(
                    `${API_URL}/Seguimiento/alumno/${form.alumnoId}?soloActivos=${!id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (!response.ok) throw new Error();
                const data = await response.json();
                setSeguimientos(Array.isArray(data) ? data : []);
            } catch {
                setSeguimientos([]);
            } finally {
                setLoadingSeguimientos(false);
            }
        };

        cargarSeguimientos();
    }, [form.alumnoId, id, token, usuario]);

    const completarOperacion = (titulo, mensaje) => {
        setPopup({ open: true, loading: false, type: "success", titulo, mensaje });
        if (onSuccess) onSuccess({ type: "success", titulo, mensaje });
    };

    const vincularSeguimiento = async (idSesion) => {
        const body = form.seguimientoActivo
            ? {
                idSeguimiento: form.seguimientoId && form.seguimientoId !== "__nuevo__"
                    ? Number(form.seguimientoId)
                    : null,
                titulo: form.seguimientoTitulo,
                descripcion: form.seguimientoDescripcion,
                quitar: false
            }
            : { quitar: true };

        const response = await fetch(`${API_URL}/Seguimiento/vincular-sesion/${idSesion}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error();
        return response.json();
    };

    const guardarTutoria = async () => {
        try {
            setPopup({ open: true, loading: true, type: "info", titulo: t("tutoring.saving"), mensaje: t("tutoring.wait") });

            const res = await fetch(`${API_URL}/Tutoria${id ? `/${id}` : `?idUsuario=${usuario.id_usuario}`}`, {
                method: id ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idAlumno: form.alumnoId,
                    fecha: form.fecha,
                    horaIni: form.horaIni,
                    horaFin: form.horaFin,
                    motivo: form.motivo.join(","),
                    pts: form.pts,
                    acuerdos: form.acuerdos
                })
            });

            if (!res.ok) throw new Error();
            const responseData = await res.json();

            const sessionId = id || responseData.idSesion;
            if (usuario.id_rol === 3 && (id || form.seguimientoActivo)) {
                try {
                    await vincularSeguimiento(sessionId);
                } catch {
                    setPopup({
                        open: true,
                        loading: false,
                        type: "warning",
                        titulo: t("followup.form.partialTitle"),
                        mensaje: t("followup.form.partialMessage")
                    });
                    if (onSuccess) {
                        onSuccess({
                            type: "warning",
                            titulo: t("followup.form.partialTitle"),
                            mensaje: t("followup.form.partialMessage")
                        });
                    }
                    return;
                }
            }

            completarOperacion(t("tutoring.savedTitle"), t("tutoring.savedMessage"));
        } catch {
            setPopup({ open: true, loading: false, type: "error", titulo: t("common.error"), mensaje: t("tutoring.saveError") });
        }
    };

    const guardarVinculacion = async () => {
        try {
            setPopup({
                open: true,
                loading: true,
                type: "info",
                titulo: t("tutoring.saving"),
                mensaje: t("tutoring.wait")
            });

            await vincularSeguimiento(id);
            completarOperacion(
                t("followup.form.savedTitle"),
                form.seguimientoActivo
                    ? t("followup.form.savedMessage")
                    : t("followup.form.removedMessage")
            );
        } catch {
            setPopup({
                open: true,
                loading: false,
                type: "error",
                titulo: t("common.error"),
                mensaje: t("followup.form.saveError")
            });
        }
    };

    const eliminarTutoria = async () => {
        try {
            const res = await fetch(`${API_URL}/Tutoria/eliminar/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error();
            completarOperacion(t("tutoring.deletedTitle"), t("tutoring.deletedMessage"));
        } catch {
            setPopup({ open: true, loading: false, type: "error", titulo: t("common.error"), mensaje: t("tutoring.deleteError") });
        }
    };

    const aceptarTutoria = async () => {
        try {
            const res = await fetch(`${API_URL}/Tutoria/aceptar/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error();
            completarOperacion(t("tutoring.acceptedTitle"), t("tutoring.acceptedMessage"));
        } catch {
            setPopup({ open: true, loading: false, type: "error", titulo: t("common.error"), mensaje: t("tutoring.acceptError") });
        }
    };

    const solicitarEdicion = async () => {
        try {
            const res = await fetch(`${API_URL}/Tutoria/solicitar-edicion/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error();
            completarOperacion(t("tutoring.editRequestedTitle"), t("tutoring.editRequestedMessage"));
        } catch {
            setPopup({ open: true, loading: false, type: "error", titulo: t("common.error"), mensaje: t("tutoring.editRequestError") });
        }
    };

    return {
        form,
        setForm,
        alumnos,
        grupo,
        loading,
        loadingSeguimientos,
        seguimientos,
        guardarTutoria,
        guardarVinculacion,
        eliminarTutoria,
        aceptarTutoria,
        solicitarEdicion
    };
};
