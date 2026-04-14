import { useState } from "react";
import { useJustificante } from "../../hooks/useJustificante";
import Layout from "../../componentes/Layout";
import Alerta from "../../componentes/Alerta";

function Justificante({ data, onClose }) {
    const [usuario] = useState(() => JSON.parse(localStorage.getItem("usuario")));
    const [form, setForm] = useState({ descripcion: "", fecha: "", archivos: [] });
    const [popup, setPopup] = useState({ open: false, loading: false, type: "info", titulo: "", mensaje: "" });

    const { crear, aceptar, loading } = useJustificante(() => {
        setForm({ descripcion: "", fecha: "", archivos: [] });
        setPopup({ open: true, loading: false, type: "success", titulo: "Éxito", mensaje: "Enviado correctamente" });
        setTimeout(() => {
            if (onClose) onClose();
            window.location.reload();
        }, 1500);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPopup({ open: true, loading: true, type: "info", titulo: "Enviando...", mensaje: "Procesando archivos" });
        const formData = new FormData();
        formData.append("descripcion", form.descripcion);
        formData.append("fecha", form.fecha);
        form.archivos.forEach(file => formData.append("archivos", file));
        await crear(formData);
    };

    return (
        <Layout>
            <div className="justificante-modal">
                <form onSubmit={handleSubmit}>
                    <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
                    <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
                    {!data && <input type="file" multiple onChange={(e) => setForm({ ...form, archivos: Array.from(e.target.files) })} />}
                    <div className="acciones">
                        {!data && usuario?.id_rol === 2 && <button type="submit" disabled={loading}>Enviar</button>}
                        {data && usuario?.id_rol !== 2 && <button type="button" onClick={() => aceptar(data.id)}>Aceptar</button>}
                        <button type="button" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
            <Alerta
                open={popup.open}
                loading={popup.loading || loading}
                type={popup.type}
                titulo={popup.titulo}
                mensaje={popup.mensaje}
                onClose={() => setPopup(prev => ({ ...prev, open: false }))}
            />
        </Layout>
    );
}

export default Justificante;