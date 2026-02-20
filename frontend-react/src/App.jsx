import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Catalogo from './pages/Catalogo';
import AdminPanel from './pages/AdminPanel';

// --- COMPONENTE GUARDIÁN (Solo para Admins) ---
const ProtectedRoute = ({ children }) => {
  // Eliminamos 'loading' porque la inicialización ahora es instantánea
  const { user } = useAuth();

  // Si no hay usuario o el rol no es admin, lo mandamos al catálogo
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider> 
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Catalogo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Ruta Protegida: Solo el equipo con rol de admin puede entrar */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta para errores 404 */}
          <Route path="*" element={<div style={{padding: "20px"}}>404 - Página no encontrada en MAKIA</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;