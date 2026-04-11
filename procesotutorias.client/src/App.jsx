import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Tutoria from "./pages/Tutoria/Tutoria";
import Panel from "./pages/Panel";
import Acerca from "./pages/Acerca";
import GestionTutores from "./pages/Administracion/GestionTutores";
import Tutorias from "./pages/Tutoria/Tutorias";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/Panel" element={<Panel />} />
                <Route path="/Acerca-de" element={<Acerca />} />
                <Route path="/Gestion-de-tutores" element={<GestionTutores />} />
                <Route path="/Tutorias" element={<Tutorias />} />
                <Route path="/Tutoria/:id" element={<Tutoria />} />
                <Route path="/Tutoria" element={<Tutoria />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;