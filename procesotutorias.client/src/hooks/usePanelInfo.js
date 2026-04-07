// AQUI SE HACEN LAS LLAMADAS AL API PARA LA VISTA DE PANEL/INICIO(YA LOGEADO)

import { useEffect, useState } from "react";
import { API_URL } from "../api";

export const usePanelInfo = (usuario) => {
    const [grupo, setGrupo] = useState(null);
    const [tutorias, setTutorias] = useState([]);
    const [tutoriasAsignadas, setTutoriasAsignadas] = useState([]);

    useEffect(() => {
        if (!usuario) return;

        if (usuario.id_rol === 2 || usuario.id_rol === 3) {
            // CONSULTA DE GRUPO DEL USUARIO PARA MOSTRAR COMO SIGLASCARRERA-GRUPO
            fetch(`${API_URL}/Grupo/${usuario.id_usuario}`)
                .then(res => res.json())
                .then(setGrupo)
                .catch(console.error);

            // CONSULTA DE TUTORIAS RECIENTES CAMBIA DEPENDIENDO SI ES TUTOR O ALUMNO
            fetch(`${API_URL}/Tutoria?idUsuario=${usuario.id_usuario}&idRol=${usuario.id_rol}`)
                .then(res => res.json())
                .then(data => setTutorias(data.data))
                .catch(console.error);

            // CONSULTA DE TUTORIAS ASIGNADAS IGUAL CAMBIA DEPENDIENDO SI ES TUTOR O ALUMNO
            fetch(`${API_URL}/Tutoria?idUsuario=${usuario.id_usuario}&idRol=${usuario.id_rol}&estado=PENDIENTE`)
                .then(res => res.json())
                .then(data => setTutoriasAsignadas(data.data))
                .catch(console.error);
        }

    }, [usuario]);

    return { grupo, tutorias, tutoriasAsignadas };
};