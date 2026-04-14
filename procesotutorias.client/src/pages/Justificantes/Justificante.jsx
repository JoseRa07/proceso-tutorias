import { useState } from "react";
import {
    Box, Typography, TextField, Button
} from "@mui/material";

import { API_URL } from "../../api";
import { URL_B } from "../../api";
import Modal from "../../componentes/Modal";
import { useJustificante } from "../../hooks/useJustificante";
import "../../assets/estilos/Justificante.css";

function Justificante({ open, onClose, usuario, data }) {

    const isEdit = !!data;
    const isAlumno = usuario.id_rol === 2;

    const { crear, eliminar, aceptar } = useJustificante(() => { });

    const [form, setForm] = useState({
        descripcion: "",
        fecha: "",
        archivos: []
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        await crear(usuario, {
            descripcion: form.descripcion,
            fecha: form.fecha
        }, form.archivos);

        onClose();
    };

    return (
        <Modal key={data?.idJustificante || "nuevo"} isOpen={open} onClose={onClose}>

            <Box className="jc">

                <Typography variant="h6" mb={2}>
                    {isEdit ? "Detalle justificante" : "Nuevo justificante"}
                </Typography>

                <TextField
                    label="Descripción"
                    name="descripcion"
                    placeholder="Redactar motivo y en caso de ser más de un día, especificarlo aquí."
                    fullWidth
                    multiline
                    rows={3}
                    value={isEdit ? data.descripcion : form.descripcion}
                    onChange={handleChange}
                    disabled={isEdit}
                />

                <TextField
                    label="Fecha a justificar"
                    type="date"
                    name="fecha"
                    fullWidth
                    sx={{ mt: 2 }}
                    InputLabelProps={{ shrink: true }}
                    value={
                        isEdit
                            ? data.fecha?.split("T")[0]
                            : form.fecha
                    }
                    onChange={handleChange}
                    disabled={isEdit}
                />

                {!isEdit && (
                    <Box className="jf">
                        <label className="jf-l">
                            Elegir archivos
                            <input
                                type="file"
                                multiple
                                onChange={(e) =>
                                    setForm({ ...form, archivos: Array.from(e.target.files) })
                                }
                            />
                        </label>
                    </Box>
                )}

                {isEdit && data?.archivos?.length > 0 && (
                    <Box mt={2}>
                        <Typography variant="subtitle1" mb={1}>
                            Archivos
                        </Typography>

                        <Box className="jimgs">
                            {data.archivos.map((url, i) => {

                                return (
                                    <Box
                                        key={i}
                                        className="jimg"
                                        onClick={() => window.open(`${URL_B}${url}`, "_blank")}
                                    >
                                        <img
                                            src={`${URL_B}${url}`}
                                            alt="archivo"
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                <Box className="jbtns">

                    {!isEdit && (
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSubmit}
                            sx={{
                                backgroundColor: "#22d47b",
                                "&:hover": { backgroundColor: "#1bb869" }
                            }}
                        >
                            Guardar
                        </Button>
                    )}

                    {!isAlumno && isEdit && (
                        <>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => aceptar(data.idJustificante)}
                                sx={{
                                    backgroundColor: "#22d47b",
                                    "&:hover": { backgroundColor: "#1bb869" }
                                }}
                            >
                                Aceptar
                            </Button>

                            <Button
                                fullWidth
                                variant="contained"
                                color="error"
                                onClick={() => eliminar(data.idJustificante)}
                            >
                                Eliminar
                            </Button>
                        </>
                    )}

                </Box>

            </Box>

        </Modal>
    );
}

export default Justificante;