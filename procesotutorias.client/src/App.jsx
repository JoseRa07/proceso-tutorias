import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Tutoria from "./pages/Tutoria/Tutoria";
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

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/Panel" element={<Panel />} />
                <Route path="/Acerca-de" element={<Acerca />} />
                <Route path="/Gestion-de-tutores" element={<GestionTutores />} />
                <Route path="/Roles" element={<GestionRoles />} />
                <Route path="/Usuarios" element={<GestionUsuarios />} />
                <Route path="/Tutorias" element={<Tutorias />} />
                <Route path="/Tutoria/:id" element={<Tutoria />} />
                <Route path="/Tutoria" element={<Tutoria />} />
                <Route path="/Justificantes" element={<Justificantes />} />
                <Route path="/Reportes" element={<Reportes />} />
                <Route path="/Respaldo" element={<BackupPanel />} />
                <Route path="/Seguimientos" element={<Seguimientos />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
