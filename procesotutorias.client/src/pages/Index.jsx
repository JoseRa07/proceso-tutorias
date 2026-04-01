import { useState } from "react";
import "../assets/estilos/inicio.css";
import Layout from "../componentes/layout";
import Login from "../componentes/Auth/Login";

function Index() {
    const [showLogin, setShowLogin] = useState(false);

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