import {
    BrowserRouter,
    Navigate,
    Routes,
    Route,
    useParams
} from "react-router-dom";

import Index from "./pages/Index";
import Panel from "./pages/Panel";
import Acerca from "./pages/Acerca";
import GestionTutores from "./pages/Administracion/GestionTutores";
import GestionRoles from "./pages/Administracion/GestionRoles";
import GestionUsuarios from "./pages/Administracion/GestionUsuarios";
import Tutorias from "./pages/Tutoria/Tutorias";
import Justificantes from "./pages/Justificantes/Justificantes";
import Reportes from "./pages/Reportes";
import BackupPanel from "./pages/BackupPanel";
import Seguimientos from "./pages/Seguimiento/Seguimientos";
import { ROLES } from "./auth/session";
import {
    PublicOnlyRoute,
    RequireAuth,
    RouteFallback
} from "./componentes/Auth/RouteGuards";

function LegacyTutoriaRedirect() {
    const { id } = useParams();
    const idSesion = Number(id);
    const state = Number.isInteger(idSesion) && idSesion > 0
        ? { abrirTutoriaId: idSesion }
        : null;

    return <Navigate to="/Tutorias" replace state={state} />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicOnlyRoute />}>
                    <Route path="/" element={<Index />} />
                </Route>

                <Route path="/Acerca-de" element={<Acerca />} />

                <Route element={<RequireAuth />}>
                    <Route path="/Panel" element={<Panel />} />
                    <Route path="/Reportes" element={<Reportes />} />
                </Route>

                <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN]} />}>
                    <Route path="/Gestion-de-tutores" element={<GestionTutores />} />
                    <Route path="/Roles" element={<GestionRoles />} />
                    <Route path="/Usuarios" element={<GestionUsuarios />} />
                    <Route path="/Respaldo" element={<BackupPanel />} />
                </Route>

                <Route element={<RequireAuth allowedRoles={[ROLES.ALUMNO, ROLES.TUTOR]} />}>
                    <Route path="/Tutorias" element={<Tutorias />} />
                    <Route path="/Tutoria/:id" element={<LegacyTutoriaRedirect />} />
                    <Route path="/Tutoria" element={<Navigate to="/Tutorias" replace />} />
                    <Route path="/Justificantes" element={<Justificantes />} />
                </Route>

                <Route element={<RequireAuth allowedRoles={[ROLES.TUTOR]} />}>
                    <Route path="/Seguimientos" element={<Seguimientos />} />
                </Route>

                <Route path="*" element={<RouteFallback />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
