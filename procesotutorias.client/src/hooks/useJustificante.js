import { useState } from "react";
import { API_URL, URL_B } from "../api";
import { useI18n } from "../i18n/I18nContext";

export const useJustificante = (onSuccess) => {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);

    const getAuthHeaders = (contentType = "application/json") => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        if (contentType) {
            headers["Content-Type"] = contentType;
        }

        return headers;
    };

    const crear = async (usuario, data, archivos) => {
        try {
            if (!usuario?.id_usuario) throw new Error(t("excuses.invalidUser"));

            setLoading(true);

            const urls = archivos?.length ? await subirArchivo(archivos) : [];
            const payload = { ...data, archivos: urls };

            const res = await fetch(`${API_URL}/Justificante?idUsuario=${usuario.id_usuario}`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(t("excuses.sendErrorTitle"));

            onSuccess?.();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const editar = async (id, data) => {
        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/Justificante/${id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error(t("excuses.updateErrorTitle"));

            onSuccess?.();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const eliminar = async (id) => {
        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/Justificante/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(null)
            });

            if (!res.ok) throw new Error(t("common.requestFailed"));

            onSuccess?.();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const aceptar = async (id) => {
        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/Justificante/aceptar/${id}`, {
                method: "PUT",
                headers: getAuthHeaders(null)
            });

            if (!res.ok) throw new Error(t("excuses.updateErrorTitle"));

            onSuccess?.();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const subirArchivo = async (files) => {
        if (!files || files.length === 0) return [];

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("files", file));

        const res = await fetch(`${API_URL}/Justificante/upload`, {
            method: "POST",
            headers: getAuthHeaders(null),
            body: formData
        });

        if (!res.ok) throw new Error(t("common.requestFailed"));

        return await res.json();
    };

    return { crear, editar, eliminar, aceptar, subirArchivo, loading, BASE_URL: URL_B };
};
