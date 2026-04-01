import "../../assets/estilos/tutoria.css";
import Layout from "../../componentes/Layout";

function Tutoria() {
    return (
        <Layout>

            <div className="containerP">
                <div className="contenido">
                    <form>
                        <table>
                            <tbody>
                                <tr>
                                    <td colSpan="8">
                                        <h1>
                                            UNIVERSIDAD TÉCNICA DE NAYARIT
                                            <br />
                                            CONTROL Y SEGUIMIENTO DE TUTORÍAS INDIVIDUALES
                                        </h1>
                                    </td>
                                </tr>

                                <tr>
                                    <th colSpan="4">CARRERA: Sistemas</th>
                                    <th colSpan="4">GRUPO: TI-101</th>
                                </tr>

                                <tr>
                                    <td colSpan="8">
                                        <select className="select-alumno" required>
                                            <option value="">Seleccione un alumno</option>
                                            <option>Juan Pérez</option>
                                            <option>María López</option>
                                            <option>Carlos Ramírez</option>
                                        </select>
                                    </td>
                                </tr>

                                <tr>
                                    <td>FECHA:</td>
                                    <td>
                                        <input type="date" className="input-text" required />
                                    </td>

                                    <td colSpan="2">HR. INICIO:</td>
                                    <td>
                                        <input type="time" className="input-text" required />
                                    </td>

                                    <td>HR. SALIDA:</td>
                                    <td>
                                        <input type="time" className="input-text" required />
                                    </td>
                                </tr>

                                <tr>
                                    <th colSpan="8">MOTIVO DE LA TUTORÍA:</th>
                                </tr>

                                <tr className="motivo">
                                    <td colSpan="2">
                                        <label>
                                            <input type="checkbox" /> Reprobación
                                        </label>
                                    </td>
                                    <td colSpan="2">
                                        <label>
                                            <input type="checkbox" /> Ausentismo
                                        </label>
                                    </td>
                                    <td colSpan="2">
                                        <label>
                                            <input type="checkbox" /> Problemas Económicos
                                        </label>
                                    </td>
                                    <td colSpan="2">
                                        <label>
                                            <input type="checkbox" /> Indisciplina
                                        </label>
                                    </td>
                                </tr>

                                <tr className="motivo">
                                    <td colSpan="2">
                                        <label>
                                            <input type="checkbox" /> Problemas personales
                                        </label>
                                    </td>
                                    <td colSpan="2">
                                        <label>
                                            <input type="checkbox" /> Impuntualidad
                                        </label>
                                    </td>
                                    <td colSpan="2">
                                        <label>
                                            <input type="checkbox" /> Falta de compromiso
                                        </label>
                                    </td>
                                    <td colSpan="2">
                                        <label>
                                            <input type="checkbox" /> Falta de atención
                                        </label>
                                    </td>
                                </tr>

                                <tr>
                                    <th colSpan="8">
                                        <textarea
                                            placeholder="Puntos relevantes de la sesión"
                                            required
                                        ></textarea>
                                    </th>
                                </tr>

                                <tr>
                                    <th colSpan="8">
                                        <textarea
                                            placeholder="Compromisos y acuerdos"
                                            required
                                        ></textarea>
                                    </th>
                                </tr>

                                <tr className="firmas">
                                    <td colSpan="4">
                                        <div className="firma">Firma del tutor</div>
                                    </td>
                                    <td colSpan="4">
                                        <div className="firma">Firma del alumno</div>
                                    </td>
                                </tr>

                                <tr>
                                    <td colSpan="8">
                                        <button type="submit" className="btn-guardar">
                                            Guardar Tutoría
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </form>
                </div>
            </div>

        </Layout>
    );
}

export default Tutoria;