import { useState } from "react";
import { useBackups } from "../hooks/useBackups";

export default function BackupPanel() {
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
                <h3>Programar Backup</h3>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <select
                        value={time.split(":")[0] || ""}
                        onChange={(e) => {
                            const min = time.split(":")[1] || "00";
                            setTime(`${e.target.value}:${min}`);
                        }}
                    >
                        <option value="">Hora</option>
                        {hours.map((h) => (
                            <option key={h} value={h}>
                                {h}
                            </option>
                        ))}
                    </select>

                    <select
                        value={time.split(":")[1] || ""}
                        onChange={(e) => {
                            const hr = time.split(":")[0] || "00";
                            setTime(`${hr}:${e.target.value}`);
                        }}
                    >
                        <option value="">Minuto</option>
                        {minutes.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginTop: 10 }}>
                    <button onClick={() => schedule("FULL", time)}>
                        Programar FULL
                    </button>

                    <button onClick={() => schedule("DIFFERENTIAL", time)}>
                        Programar Incremental
                    </button>
                </div>
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
    );
}