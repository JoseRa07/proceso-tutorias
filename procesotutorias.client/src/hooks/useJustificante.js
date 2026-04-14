import { useState } from "react";
import { API_URL } from "../api";

export const useJustificante = (onSuccess) => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const crear = async (usuario, data, archivos) => {
        try {
            setLoading(true);
            let urls = [];
            if (archivos && archivos.length > 0) {
                urls = await subirArchivo(archivos);
            }

            const payload = { ...data, archivos: urls };

            const res = await fetch(`${API_URL}/Justificante?idUsuario=${usuario.id_usuario}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error();
            if (onSuccess) onSuccess();
            return true;
        } catch {
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
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (onSuccess) onSuccess();
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
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (onSuccess) onSuccess();
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
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (onSuccess) onSuccess();
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
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        if (!res.ok) throw new Error();
        return await res.json();
    };

    const BASE_URL = "http://localhost:5016";
    return { crear, editar, eliminar, aceptar, subirArchivo, loading, BASE_URL };
};