import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Login from "./componentes/Auth/Login";
import Tutoria from "./pages/Tutoria/Tutoria";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/tutoria" element={<Tutoria />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;