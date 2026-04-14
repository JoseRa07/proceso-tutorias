import { useEffect, useState } from "react";
import { API_URL } from "../api";

export const useTutoria = (usuario, id, setPopup) => {

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

    const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const guardarTutoria = async () => {
        try {
            setPopup({
                open: true,
                loading: true,
                type: "info",
                titulo: "Guardando...",
                mensaje: "Por favor espera"
            });

            const payload = {
                idAlumno: form.alumnoId,
                fecha: form.fecha,
                horaIni: form.horaIni,
                horaFin: form.horaFin,
                motivo: form.motivo.join(","),
                pts: form.pts,
                acuerdos: form.acuerdos
            };

            let res;

            if (id) {
                res = await fetch(`${API_URL}/Tutoria/${id}`, {
                    method: "PUT",
                    headers: authHeaders,
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_URL}/Tutoria?idUsuario=${usuario.id_usuario}`, {
                    method: "POST",
                    headers: authHeaders,
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) throw new Error("Error al guardar");

            setPopup({
                open: true,
                loading: false,
                type: "success",
                titulo: "Éxito",
                mensaje: id ? "Tutoría actualizada" : "Tutoría creada"
            });

        } catch (error) {
            console.log(error);

            setPopup({
                open: true,
                loading: false,
                type: "error",
                titulo: "Error",
                mensaje: "No se pudo guardar"
            });
        }
    };

    const eliminarTutoria = async () => {
        const res = await fetch(`${API_URL}/Tutoria/eliminar/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error();
    };

    const aceptarTutoria = async () => {
        const res = await fetch(`${API_URL}/Tutoria/aceptar/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error();
    };

    const solicitarEdicion = async () => {
        const res = await fetch(`${API_URL}/Tutoria/solicitar-edicion/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error();
    };

    useEffect(() => {
        if (!usuario) return;

        const fetchData = async () => {

            try {
                setLoading(true);

                setPopup({
                    open: true,
                    loading: true,
                    type: "info",
                    titulo: "Cargando tutoría...",
                    mensaje: "Por favor espera"
                });

                // EDITAR
                if (id) {

                    const res = await fetch(
                        `${API_URL}/Tutoria/detalle?idSesion=${id}`,
                        { headers: authHeaders }
                    );

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

                    setAlumnos([
                        {
                            id_alumno: data.idAlumno,
                            nombre: data.nombreAlumno
                        }
                    ]);

                    const resGrupo = await fetch(
                        `${API_URL}/Grupo/${data.idUsuarioAlumno}`,
                        { headers: authHeaders }
                    );

                    const dataGrupo = await resGrupo.json();
                    setGrupo(dataGrupo);
                }

                // NUEVA
                else {

                    if (usuario.id_rol !== 2) {
                        const resAlumnos = await fetch(
                            `${API_URL}/Tutoria/alumnos?idUsuario=${usuario.id_usuario}`,
                            { headers: authHeaders }
                        );

                        const dataAlumnos = await resAlumnos.json();
                        setAlumnos(dataAlumnos || []);
                    }

                    const resGrupo = await fetch(
                        `${API_URL}/Grupo/${usuario.id_usuario}`,
                        { headers: authHeaders }
                    );

                    const dataGrupo = await resGrupo.json();
                    setGrupo(dataGrupo);
                }

                setPopup({
                    open: true,
                    loading: false,
                    type: "success",
                    titulo: "Datos cargados",
                    mensaje: "Información lista"
                });

            } catch (error) {
                console.log(error);

                setPopup({
                    open: true,
                    loading: false,
                    type: "error",
                    titulo: "Error",
                    mensaje: "No se pudo cargar la tutoría"
                });

            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [usuario, id]);

    return {
        form,
        setForm,
        alumnos,
        grupo,
        loading,
        guardarTutoria,
        eliminarTutoria,
        aceptarTutoria,
        solicitarEdicion
    };
};