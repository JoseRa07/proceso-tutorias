import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackups } from "../hooks/useBackups";
import Layout from "../componentes/layout";

export default function BackupPanel() {
    const navigate = useNavigate();

    const [usuario] = useState(() =>
        JSON.parse(localStorage.getItem("usuario"))
    );

    useEffect(() => {
        if (!usuario || Number(usuario.id_rol) !== 1) {
            navigate("/Panel", { replace: true });
        }
    }, [usuario, navigate]);

    if (!usuario || Number(usuario.id_rol) !== 1) return null;

    const {
        fullBackup,
        differentialBackup,
        restore,
        schedule,
        message,
        loading
    } = useBackups();

    const [time, setTime] = useState("");
    const [file, setFile] = useState("");

    const hours = Array.from({ length: 24 }, (_, h) =>
        h.toString().padStart(2, "0")
    );

    const minutes = Array.from({ length: 60 }, (_, m) =>
        m.toString().padStart(2, "0")
    );

    return (
        <Layout>
            <div style={{ padding: 20 }}>
                <h2>Gestión de Respaldos</h2>

                <div>
                    <h3>Manual</h3>

                    <button onClick={fullBackup} disabled={loading}>
                        Backup Completo
                    </button>

                    <button onClick={differentialBackup} disabled={loading}>
                        Backup Incremental
                    </button>
                </div>

                <hr />

                <div>
                    <h3>Restaurar Backup</h3>

                    <input
                        placeholder="C:\\Respaldos\\archivo.bak"
                        value={file}
                        onChange={(e) => setFile(e.target.value)}
                    />

                    <button onClick={() => restore(file)}>
                        Restaurar
                    </button>
                </div>

                {loading && <p>Procesando...</p>}
                {message && <p>{JSON.stringify(message)}</p>}
            </div>
        </Layout>
    );
}