import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { readApiJson } from "../utils/apiErrors";

export function useBackups() {
    const { locale, t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState([]);
    const [jobs, setJobs] = useState([]);

    const getAuthHeaders = useCallback((contentType = "application/json") => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        if (contentType) {
            headers["Content-Type"] = contentType;
        }

        return headers;
    }, []);

    const request = useCallback(async (path, options = {}) => {
        const res = await fetch(`${API_URL}/Backup${path}`, {
            ...options,
            headers: {
                ...getAuthHeaders(options.contentType),
                ...(options.headers || {})
            }
        });

        return readApiJson(res, t("common.requestFailed"));
    }, [getAuthHeaders, t]);

    const refresh = useCallback(async () => {
        const [filesData, jobsData] = await Promise.all([
            request("/files"),
            request("/jobs")
        ]);

        setFiles(filesData || []);
        setJobs(jobsData || []);
    }, [request]);

    useEffect(() => {
        refresh().catch((error) => setMessage(error.message));
    }, [refresh]);

    const executeAction = async (action, successMessage) => {
        try {
            setLoading(true);
            setMessage("");
            const result = await action();
            setMessage(locale === "es-MX" && result?.message ? result.message : successMessage);
            await refresh();
            return { ok: true, data: result };
        } catch (error) {
            setMessage(error.message);
            return { ok: false, error };
        } finally {
            setLoading(false);
        }
    };

    const fullBackup = () => executeAction(
        () => request("/full", { method: "POST" }),
        t("backups.fullGenerated")
    );

    const incrementalBackup = () => executeAction(
        () => request("/incremental", { method: "POST" }),
        t("backups.incrementalGenerated")
    );

    const restore = (filePath) => executeAction(
        () => request("/restore", {
            method: "POST",
            body: JSON.stringify({ filePath })
        }),
        t("backups.restored")
    );

    const schedule = (type, scheduledAt) => executeAction(
        () => request("/schedule", {
            method: "POST",
            body: JSON.stringify({ type, scheduledAt })
        }),
        t("backups.scheduledSuccess")
    );

    return {
        loading,
        message,
        files,
        jobs,
        fullBackup,
        incrementalBackup,
        restore,
        schedule,
        refresh
    };
}
