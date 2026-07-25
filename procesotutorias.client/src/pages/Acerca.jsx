import {
    Box,
    Card,
    CardContent,
    Chip,
    Typography
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import FilePresentIcon from "@mui/icons-material/FilePresent";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { motion as Motion } from "framer-motion";

import Layout from "../componentes/layout";
import "../assets/estilos/Acerca.css";
import { useI18n } from "../i18n/I18nContext";

const moduleIcons = [AssignmentTurnedInIcon, FilePresentIcon, GroupsIcon, BarChartIcon];

const itemAnimado = {
    oculto: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 }
};

function Acerca() {
    const { t } = useI18n();
    const university = t("common.university");
    const modulos = t("about.modules").map(([titulo, texto], index) => ({
        titulo,
        texto,
        icono: moduleIcons[index]
    }));

    return (
        <Layout>
            <main className="acerca-cont">
                <Motion.section
                    className="acerca-hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                >
                    <div className="acerca-hero-info">
                        <Typography component="span" className="acerca-eyebrow">
                            {t("about.eyebrow")}
                        </Typography>

                        <Typography component="h1" variant="h4" fontWeight="bold" className="acerca-title">
                            {t("about.title")}
                        </Typography>

                        <Typography className="acerca-desc">
                            {t("about.description", { university })}
                        </Typography>
                    </div>

                    <div className="acerca-hero-card">
                        <TrackChangesIcon />
                        <Typography fontWeight="bold">{t("about.purposeTitle")}</Typography>
                        <Typography>
                            {t("about.purposeDescription")}
                        </Typography>
                    </div>
                </Motion.section>

                <Motion.section
                    className="acerca-grid"
                    initial="oculto"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: { staggerChildren: 0.08 }
                        }
                    }}
                >
                    {modulos.map((modulo) => {
                        const Icono = modulo.icono;

                        return (
                            <Motion.div key={modulo.titulo} variants={itemAnimado}>
                                <Card className="acerca-card">
                                    <CardContent>
                                        <Box className="acerca-icon">
                                            <Icono />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            {modulo.titulo}
                                        </Typography>
                                        <Typography className="acerca-card-text">
                                            {modulo.texto}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Motion.div>
                        );
                    })}
                </Motion.section>

                <section className="acerca-panel">
                    <div>
                        <Typography variant="h6" fontWeight="bold" className="acerca-panel-title">
                            {t("about.communityTitle")}
                        </Typography>
                        <Typography className="acerca-panel-text">
                            {t("about.communityDescription")}
                        </Typography>
                    </div>

                    <Box className="acerca-stack">
                        <AutoStoriesIcon />
                        {t("about.highlights").map((highlight) => (
                            <Chip key={highlight} label={highlight} className="acerca-chip" />
                        ))}
                    </Box>
                </section>
            </main>
        </Layout>
    );
}

export default Acerca;
