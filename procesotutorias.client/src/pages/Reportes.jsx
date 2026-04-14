import Layout from "../componentes/layout";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableContainer,
    Paper
} from "@mui/material";
import html2pdf from "html2pdf.js";

import { useReportes } from "../hooks/useReportes";

function Reportes() {

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const { reporte, loading } = useReportes(usuario);

    const generarPDF = () => {
        const elemento = document.getElementById("reporte-pdf");

        html2pdf()
            .set({
                margin: 10,
                filename: "reporte.pdf",
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
            })
            .from(elemento)
            .save();
    };

    if (loading) return <p>Cargando...</p>;
    if (!reporte) return <p>Sin datos</p>;

    return (
        <Layout>
            <Box p={3} sx={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>

                {/* HEADER PDF */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" fontWeight="bold">
                        Reportes del sistema
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={generarPDF}
                        sx={{
                            backgroundColor: "#20A85E",
                            fontWeight: "bold",
                            borderRadius: 2
                        }}
                    >
                        Exportar PDF
                    </Button>
                </Box>

                {/* CONTENIDO PDF */}
                <Box
                    id="reporte-pdf"
                    sx={{
                        backgroundColor: "#fff",
                        p: 3,
                        borderRadius: 2
                    }}
                >

                    {/* ENCABEZADO UNIVERSIDAD */}
                    <Box textAlign="center" mb={3}>
                        <Typography fontWeight="bold" fontSize={18}>
                            UNIVERSIDAD TECNOLÓGICA DE NAYARIT
                        </Typography>
                        <Typography fontWeight="bold" fontSize={16}>
                            REPORTE
                        </Typography>
                        <Divider sx={{ mt: 1 }} />
                    </Box>

                    {/* ================= ALUMNO ================= */}
                    {usuario.id_rol === 2 && (
                        <Card variant="outlined">
                            <CardContent>

                                <TableContainer component={Paper} elevation={0}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><b>Nombre</b></TableCell>
                                                <TableCell>{reporte.nombre}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Matrícula</b></TableCell>
                                                <TableCell>{reporte.matricula}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Total Tutorías</b></TableCell>
                                                <TableCell>{reporte.totalTutorias}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Justificantes</b></TableCell>
                                                <TableCell>{reporte.totalJustificantes}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                            </CardContent>
                        </Card>
                    )}

                    {/* ================= TUTOR ================= */}
                    {usuario.id_rol === 3 && (
                        <Card variant="outlined">
                            <CardContent>

                                <TableContainer component={Paper} elevation={0}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><b>Nombre Tutor</b></TableCell>
                                                <TableCell>{reporte.nombreTutor}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Grupo</b></TableCell>
                                                <TableCell>{reporte.grupo}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Divider sx={{ my: 2 }} />

                                <Typography fontWeight="bold">Justificantes</Typography>

                                <Table size="small">
                                    <TableBody>
                                        {reporte.justificantes?.map((j, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{j.matricula}</TableCell>
                                                <TableCell>{j.total}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <Typography fontWeight="bold">Tutorías</Typography>
                                <Table size="small">
                                    <TableBody>
                                        {reporte.alumnos?.map((a, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{a.matricula}</TableCell>
                                                <TableCell>{a.totalTutorias}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                            </CardContent>
                        </Card>
                    )}

                    {/* ================= ADMIN ================= */}
                    {usuario.id_rol === 1 && (
                        <Card variant="outlined">
                            <CardContent>

                                <TableContainer component={Paper} elevation={0}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><b>Total Usuarios</b></TableCell>
                                                <TableCell>{reporte.totalUsuarios}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Total Tutorías</b></TableCell>
                                                <TableCell>{reporte.totalTutorias}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Total Justificantes</b></TableCell>
                                                <TableCell>{reporte.totalJustificantes}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                            </CardContent>
                        </Card>
                    )}

                    {/* ================= MAESTRO ================= */}
                    {usuario.id_rol === 4 && (
                        <Card variant="outlined">
                            <CardContent>

                                <TableContainer component={Paper} elevation={0}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><b>Nombre</b></TableCell>
                                                <TableCell>{reporte.nombre}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Mensaje</b></TableCell>
                                                <TableCell>{reporte.mensaje}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Total Tutorías</b></TableCell>
                                                <TableCell>{reporte.totalTutorias}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><b>Total Grupos</b></TableCell>
                                                <TableCell>{reporte.totalGrupos}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                            </CardContent>
                        </Card>
                    )}

                </Box>
            </Box>
        </Layout>
    );
}

export default Reportes;