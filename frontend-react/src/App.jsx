import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext'; // [ARREGLO] Importamos el nuevo cerebro del carrito
import Login from './pages/Login';
import Registro from './pages/Registro';
import Catalogo from './pages/Catalogo';
import AdminPanel from './pages/AdminPanel';

// --- COMPONENTE GUARDIÃN (Solo para Admins) ---
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // Si no hay usuario o el rol no es admin, lo mandamos al catÃ¡logo de MAKIA
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider> 
      {/* [ARREGLO] El CartProvider envuelve a las rutas para que la bolsa sea global */}
      <CartProvider>
        <Router>
          <Routes>
            {/* Rutas PÃºblicas de MAKIA */}
            <Route path="/" element={<Catalogo />} />
            <Route path="/clientview/client.html" element={<Catalogo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/login.html" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/registro/registro.html" element={<Registro />} />

            {/* Rutas Protegidas: Panel Administrativo */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/adminview/admin.html"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            
            {/* Ruta para errores 404 */}
            <Route path="*" element={
              <div className="not-found-page">
                <h1 className="not-found-title">404</h1>
                <p>Lo sentimos Vania, esta pÃ¡gina no existe en el universo MAKIA.</p>
                <a href="/" className="not-found-link">Volver al inicio</a>
              </div>
            } />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
