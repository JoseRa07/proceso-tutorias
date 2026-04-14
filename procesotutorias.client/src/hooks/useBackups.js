import { useState } from "react";
import axios from "axios";

export const API_URL = "http://localhost:5016/api/backup";

export function useBackups() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const fullBackup = async () => {
        setLoading(true);
        const res = await axios.post(`${API_URL}/full`);
        setMessage(res.data.message);
        setLoading(false);
    };

    const differentialBackup = async () => {
        setLoading(true);
        const res = await axios.post(`${API_URL}/differential`);
        setMessage(res.data.message);
        setLoading(false);
    };

    const restore = async (filePath) => {
        setLoading(true);
        const res = await axios.post(`${API_URL}/restore`, { filePath });
        setMessage(res.data.message ?? res.data);
        setLoading(false);
    };

    const schedule = async (type, time) => {
        setLoading(true);
        const res = await axios.post(`${API_URL}/schedule`, { type, time });
        setMessage(res.data.message ?? res.data);
        setLoading(false);
    };

    return {
        loading,
        message,
        fullBackup,
        differentialBackup,
        restore,
        schedule
    };
}