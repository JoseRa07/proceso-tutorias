import { useState } from "react";
import { API_URL } from "../api";

export const useJustificante = (setPopup) => {

    const [loading, setLoading] = useState(false);

    const crear = async (usuario, data, archivos) => {
        try {
            setLoading(true);

            let urls = [];

            if (archivos && archivos.length > 0) {
                urls = await subirArchivo(archivos);
            }

            const payload = {
                ...data,
                archivos: urls
            };

            const res = await fetch(`${API_URL}/Justificante?idUsuario=${usuario.id_usuario}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error();

            setPopup({
                open: true,
                type: "success",
                titulo: "Justificante creado",
                mensaje: "Se guardó correctamente"
            });

            return true;

        } catch {
            setPopup({
                open: true,
                type: "error",
                titulo: "Error",
                mensaje: "No se pudo crear"
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const editar = async (id, data) => {
        try {
            setLoading(true);

            await fetch(`${API_URL}/Justificante/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            return true;

        } catch {
            return false;
        } finally {
            setLoading(false);
        }
    };

    const eliminar = async (id) => {
        try {
            setLoading(true);

            await fetch(`${API_URL}/Justificante/${id}`, {
                method: "DELETE"
            });

            return true;

        } catch {
            return false;
        } finally {
            setLoading(false);
        }
    };

    const aceptar = async (id) => {
        try {
            setLoading(true);

            await fetch(`${API_URL}/Justificante/aceptar/${id}`, {
                method: "PUT"
            });

            return true;

        } catch {
            return false;
        } finally {
            setLoading(false);
        }
    };

    const subirArchivo = async (files) => {
        if (!files || files.length === 0) return [];

        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }

        const res = await fetch(`${API_URL}/Justificante/upload`, {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error();

        return await res.json();
    };

    const BASE_URL = "http://localhost:5016";

    return { crear, editar, eliminar, aceptar, subirArchivo, loading, BASE_URL };
};