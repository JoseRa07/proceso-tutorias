import React, { useState, useEffect } from 'react';

function GestionTutores() {
    const [tutores, setTutores] = useState([]);
    // Ajustado a tu modelo: id_usuario y cod_empleado
    const [nuevoTutor, setNuevoTutor] = useState({ id_usuario: '', cod_empleado: '' });

    useEffect(() => {
        fetch('http://localhost:5016/api/Maestro')
            .then(res => res.json())
            .then(data => setTutores(data))
            .catch(err => console.error("Error al cargar:", err));
    }, []);

    const guardarTutor = async () => {
        if (!nuevoTutor.id_usuario || !nuevoTutor.cod_empleado.trim()) {
            alert("⚠️ Por favor, completa el ID de Usuario y el Código de Empleado.");
            return;
        }

        try {
            const response = await fetch('http://localhost:5016/api/Maestro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Estos nombres deben ser EXACTOS a tu archivo Maestro.cs
                    id_usuario: parseInt(nuevoTutor.id_usuario),
                    cod_empleado: nuevoTutor.cod_empleado,
                    vigencia: new Date().toISOString().split('T')[0] // Genera la fecha actual (YYYY-MM-DD)
                })
            });

            if (response.ok) {
                alert("✅ Maestro registrado con éxito.");
                window.location.reload();
            } else {
                const errorData = await response.text();
                alert("❌ Error del servidor: " + errorData);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("🚀 Error de conexión con el backend.");
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Gestión de Maestros / Tutores</h2>
            <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3>Registrar Nuevo Maestro</h3>
                <input
                    type="number"
                    placeholder="ID de Usuario (Ej. 1)"
                    style={{ padding: '8px', marginRight: '10px' }}
                    value={nuevoTutor.id_usuario}
                    onChange={(e) => setNuevoTutor({ ...nuevoTutor, id_usuario: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Código de Empleado (Ej. EMP001)"
                    style={{ padding: '8px', marginRight: '10px' }}
                    value={nuevoTutor.cod_empleado}
                    onChange={(e) => setNuevoTutor({ ...nuevoTutor, cod_empleado: e.target.value })}
                />
                <button onClick={guardarTutor} style={{ padding: '8px 20px', cursor: 'pointer' }}>
                    Guardar Maestro
                </button>
            </div>

            <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th>ID Maestro</th>
                        <th>ID Usuario</th>
                        <th>Código Empleado</th>
                        <th>Vigencia</th>
                    </tr>
                </thead>
                <tbody>
                    {tutores.map((t, i) => (
                        <tr key={i}>
                            <td>{t.id_maestro}</td>
                            <td>{t.id_usuario}</td>
                            <td>{t.cod_empleado}</td>
                            <td>{t.vigencia}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default GestionTutores;