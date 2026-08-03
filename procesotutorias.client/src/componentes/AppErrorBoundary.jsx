import { Component } from "react";

class AppErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        if (import.meta.env.DEV) {
            console.error("Error de interfaz capturado", error, info);
        }
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        const english = navigator.language?.toLowerCase().startsWith("en");
        return (
            <main className="app-error-boundary" role="alert">
                <section>
                    <p>{english ? "Tutoring System" : "Sistema de Tutorías"}</p>
                    <h1>{english ? "This screen could not be displayed" : "No fue posible mostrar esta pantalla"}</h1>
                    <span>
                        {english
                            ? "Your data was not modified. Reload the application and try again."
                            : "Tus datos no fueron modificados. Recarga la aplicación e inténtalo nuevamente."}
                    </span>
                    <button type="button" onClick={() => window.location.reload()}>
                        {english ? "Reload" : "Recargar"}
                    </button>
                </section>
            </main>
        );
    }
}

export default AppErrorBoundary;
