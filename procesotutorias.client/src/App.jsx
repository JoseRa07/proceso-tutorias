import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Tutoria from "./pages/Tutoria/Tutoria";
import Panel from "./pages/Panel";
import Acerca from "./pages/Acerca";
import GestionTutores from "./pages/Administracion/GestionTutores";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tutoria" element={<Tutoria />} />
                <Route path="/Panel" element={<Panel />} />
                <Route path="/Acerca-de" element={<Acerca />} />
                <Route path="/Gestion-de-tutores" element={<GestionTutores />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;