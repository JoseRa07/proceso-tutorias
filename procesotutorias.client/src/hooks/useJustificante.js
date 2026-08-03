import { useRef, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { readApiJson } from "../utils/apiErrors";

export const useJustificante = (onSuccess) => {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const errorMessageRef = useRef("");
    const updateErrorMessage = (message) => {
        errorMessageRef.current = message;
        setErrorMessage(message);
    };

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
            updateErrorMessage("");

            const urls = archivos?.length ? await subirArchivo(archivos) : [];
            const payload = { ...data, archivos: urls };

            const res = await fetch(`${API_URL}/Justificante?idUsuario=${usuario.id_usuario}`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            await readApiJson(res, t("excuses.sendErrorTitle"));

            onSuccess?.();
            return true;
        } catch (error) {
            updateErrorMessage(error?.message || t("excuses.sendErrorTitle"));
            return false;
        } finally {
            setLoading(false);
        }
    };

    const editar = async (id, data) => {
        try {
            setLoading(true);
            updateErrorMessage("");

            const res = await fetch(`${API_URL}/Justificante/${id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            await readApiJson(res, t("excuses.updateErrorTitle"));

            onSuccess?.();
            return true;
        } catch (error) {
            updateErrorMessage(error?.message || t("excuses.updateErrorTitle"));
            return false;
        } finally {
            setLoading(false);
        }
    };

    const eliminar = async (id) => {
        try {
            setLoading(true);
            updateErrorMessage("");

            const res = await fetch(`${API_URL}/Justificante/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(null)
            });

            await readApiJson(res, t("common.requestFailed"));

            onSuccess?.();
            return true;
        } catch (error) {
            updateErrorMessage(error?.message || t("common.requestFailed"));
            return false;
        } finally {
            setLoading(false);
        }
    };

    const aceptar = async (id) => {
        try {
            setLoading(true);
            updateErrorMessage("");

            const res = await fetch(`${API_URL}/Justificante/aceptar/${id}`, {
                method: "PUT",
                headers: getAuthHeaders(null)
            });

            await readApiJson(res, t("excuses.updateErrorTitle"));

            onSuccess?.();
            return true;
        } catch (error) {
            updateErrorMessage(error?.message || t("excuses.updateErrorTitle"));
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

        return await readApiJson(res, t("common.requestFailed"));
    };

    return {
        crear,
        editar,
        eliminar,
        aceptar,
        subirArchivo,
        loading,
        errorMessage,
        getErrorMessage: () => errorMessageRef.current
    };
};
