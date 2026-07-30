import {
    Button,
    Typography,
    Box,
    CircularProgress
} from "@mui/material";

import { motion as Motion, AnimatePresence } from "framer-motion";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import { useI18n } from "../i18n/I18nContext";

const getIcon = (type) => {
    switch (type) {
        case "success": return <CheckCircleIcon color="success" sx={{ fontSize: 50 }} />;
        case "error": return <ErrorIcon color="error" sx={{ fontSize: 50 }} />;
        case "warning": return <WarningIcon color="warning" sx={{ fontSize: 50 }} />;
        case "info": return <InfoIcon color="info" sx={{ fontSize: 50 }} />;
        default: return null;
    }
};

function Alerta({
    open,
    onClose,
    loading = false,
    type = "info",
    titulo,
    mensaje
}) {
    const { t } = useI18n();

    return (
        <AnimatePresence>
            {open && (
                <>
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: "#000",
                            zIndex: 1500
                        }}
                        onClick={onClose}
                    />

                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1501,
                            padding: "16px"
                        }}
                    >
                        <Motion.div
                            initial={{ scale: 0.7, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.7, y: 50 }}
                            transition={{
                                duration: 0.35,
                                scale: { type: "spring", bounce: 0.4 }
                            }}
                            style={{
                                background: "#fff",
                                padding: "30px",
                                borderRadius: "12px",
                                width: "100%",
                                maxWidth: "320px",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                            }}
                        >
                            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>

                                {loading ? (
                                    <CircularProgress />
                                ) : (
                                    getIcon(type)
                                )}

                                <Typography variant="h6" fontWeight="bold">
                                    {titulo}
                                </Typography>

                                <Typography textAlign="center">
                                    {mensaje}
                                </Typography>

                                {!loading && (
                                    <Box width="100%" display="flex" justifyContent="flex-end">
                                        <Button onClick={onClose}>{t("common.ok")}</Button>
                                    </Box>
                                )}
                            </Box>
                        </Motion.div>
                    </Motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default Alerta;
