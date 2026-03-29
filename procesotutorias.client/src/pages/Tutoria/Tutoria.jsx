import "../../assets/estilos/layout.css";
import "../../assets/estilos/tutoria.css";

import utnLogo from "../../assets/imagenes/UTN.png";

function Tutoria() {
    return (
        <>
            <header>
                <img src={utnLogo} alt="UTN" />
                <h1>Universidad Tecnológica de Nayarit</h1>

                <nav className="menu">
                    <ul>
                        <li>
                            <a href="/">Inicio</a>
                        </li>
                        <li>
                            <a href="/tutoria">Tutoría</a>
                        </li>
                    </ul>
                </nav>
            </header>

            <div className="container">
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

            <footer>
                <div className="footer-cont">
                    <div className="footerC">
                        <h3>Contacto</h3>
                        <p>
                            Dirección: Carretera Tepic-Compostela Km 9, C.P. 63173, Nayarit,
                            México.
                        </p>
                        <p>Teléfono: (311) 211 9400</p>
                        <p>Email: contacto@utnay.edu.mx</p>
                    </div>

                    <div className="footerC">
                        <h3>Redes Sociales</h3>
                        <a href="#">Facebook</a>
                        <a href="#">Twitter</a>
                        <a href="#">Instagram</a>
                    </div>
                </div>

                <div className="footerF">
                    <p>© 2023 Universidad Tecnológica de Nayarit</p>
                </div>
            </footer>
        </>
    );
}

export default Tutoria;