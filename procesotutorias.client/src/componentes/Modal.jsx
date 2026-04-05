import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { motion as Motion, AnimatePresence } from "framer-motion";

function Modal({ isOpen, onClose, children }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: "#000",
                            zIndex: 1000
                        }}
                        onClick={onClose || undefined}
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
                            zIndex: 1001,
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
                                maxWidth: "400px",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                                position: "relative"
                            }}
                        >
                            {onClose && (
                                <IconButton
                                    onClick={onClose}
                                    sx={{
                                        position: "absolute",
                                        top: 10,
                                        right: 10
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            )}

                            {children}
                        </Motion.div>
                    </Motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default Modal;