import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Catalogo from './pages/Catalogo';
import AdminPanel from './pages/AdminPanel';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider> 
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Catalogo />} />
            <Route path="/clientview/client.html" element={<Catalogo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/login.html" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/registro/registro.html" element={<Registro />} />

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
            
            <Route path="*" element={
              <div className="not-found-page">
                <h1 className="not-found-title">404</h1>
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
