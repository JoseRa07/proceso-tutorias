import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../assets/estilos/inicio.css";
import Layout from "../componentes/layout";
import Login from "../componentes/Auth/Login";

function Index() {
    const navigate = useNavigate();

    const [showLogin, setShowLogin] = useState(false);
    const [usuario] = useState(() => {
        const usuarioStorage = localStorage.getItem("usuario");
        return usuarioStorage ? JSON.parse(usuarioStorage) : null;
    });

    useEffect(() => {
        if (usuario) {
            navigate("/Panel");
        }
    }, [navigate]);

    return (
        <Layout variant="home">
            <div className="container">
                <div className="inicio-cont">
                    <div className="cont">
                        <h1>Bienvenido al Sistema de Tutorías</h1>

                        <button
                            className="btn"
                            onClick={() => setShowLogin(true)}
                        >
                            Iniciar Sesión
                        </button>
                    </div>
                </div>
            </div>

            <Login
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
            />
        </Layout>
    );
}

export default Index;