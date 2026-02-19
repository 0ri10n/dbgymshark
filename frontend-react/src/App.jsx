import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Pilar para el trabajo de Kevin
import Login from './pages/Login';
import Registro from './pages/Registro';
import Catalogo from './pages/Catalogo';
import AdminPanel from './pages/AdminPanel'; // Necesaria para el rol de Isaac

function App() {
  return (
    /* 1. Envolvemos todo en el AuthProvider para gestionar sesiones globalmente */
    <AuthProvider> 
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Catalogo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* 2. Ruta de Administración: Kevin e Isaac trabajarán aquí después */}
          <Route path="/admin" element={<AdminPanel />} />
          
          {/* 3. Ruta para errores (Opcional pero recomendado para Abdiel/QA) */}
          <Route path="*" element={<div>404 - Página no encontrada</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;