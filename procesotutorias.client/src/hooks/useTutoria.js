import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../api";

export const useTutoria = (usuario, id, setPopup, onSuccess) => {
    const [form, setForm] = useState({
        alumnoId: "",
        nombreAlumno: "",
        fecha: "",
        horaIni: "",
        horaFin: "",
        motivo: [],
        pts: "",
        acuerdos: "",
        estado: ""
    });
    const [alumnos, setAlumnos] = useState([]);
    const [grupo, setGrupo] = useState(null);
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const fetchData = useCallback(async () => {
        if (!usuario) return;
        const authHeaders = {
            "Authorization": `Bearer ${token}`,
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
                    estado: data.estado
                });

                const resG = await fetch(`${API_URL}/Grupo/${data.idUsuarioAlumno}`, { headers: authHeaders });
                setGrupo(await resG.json());
                setAlumnos([{ id_alumno: data.idAlumno, nombre: data.nombreAlumno }]);
            } else {
                const resG = await fetch(`${API_URL}/Grupo/${usuario.id_usuario}`, { headers: authHeaders });
                setGrupo(await resG.json());
                if (usuario.id_rol !== 2) {
                    const resA = await fetch(`${API_URL}/Tutoria/alumnos?idUsuario=${usuario.id_usuario}`, { headers: authHeaders });
                    const lista = await resA.json();
                    setAlumnos(lista || []);
                }
            }
        } catch {
            console.error();
        } finally {
            setLoading(false);
        }
    }, [usuario, id, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const guardarTutoria = async () => {
        try {
            setPopup({ open: true, loading: true, type: "info", titulo: "Guardando...", mensaje: "Espera..." });
            const res = await fetch(`${API_URL}/Tutoria${id ? `/${id}` : `?idUsuario=${usuario.id_usuario}`}`, {
                method: id ? "PUT" : "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
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
            if (res.ok && onSuccess) onSuccess();
        } catch {
            setPopup({ open: true, loading: false, type: "error", titulo: "Error", mensaje: "No se guardó" });
        }
    };

    const eliminarTutoria = async () => {
        try {
            const res = await fetch(`${API_URL}/Tutoria/eliminar/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok && onSuccess) onSuccess();
        } catch {
            console.error();
        }
    };

    return { form, setForm, alumnos, grupo, loading, guardarTutoria, eliminarTutoria };
};