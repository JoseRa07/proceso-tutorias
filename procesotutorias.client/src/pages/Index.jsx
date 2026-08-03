import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../assets/estilos/inicio.css";
import Layout from "../componentes/layout";
import Login from "../componentes/Auth/Login";
import { useI18n } from "../i18n/I18nContext";

function Index() {
    const navigate = useNavigate();
    const { t } = useI18n();

    const [showLogin, setShowLogin] = useState(false);
    const [usuario] = useState(() => {
        const usuarioStorage = localStorage.getItem("usuario");
        return usuarioStorage ? JSON.parse(usuarioStorage) : null;
    });

    useEffect(() => {
        if (usuario) {
            navigate("/Panel");
        }
    }, [navigate, usuario]);

    return (
        <Layout variant="home">
            <div className="container">
                <div className="inicio-cont">
                    <div className="cont">
                        <h1>{t("auth.welcomeHome")}</h1>

                        <button
                            className="btn"
                            onClick={() => setShowLogin(true)}
                        >
                            {t("auth.signIn")}
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
