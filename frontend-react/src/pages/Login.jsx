import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LightRays from '../components/LightRays';
import './Login.css'; // Mueve tu login.css aquí

const Login = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="login-page">
      <div className={`brand-background ${showForm ? 'hidden' : ''}`}>
        <h1 className="brand-title">MAKIA</h1>
        <p className="brand-subtitle">te acompañamos mientras te ejercitas</p>
        <button className="btn-main-action" onClick={() => setShowForm(true)}>
          COMENZAR ENTRENAMIENTO
        </button>
      </div>

      <div id="login-wrapper" className={`login-wrapper ${!showForm ? 'hidden' : ''}`}>
        <div className="login-container">
            <div className="user-icon-container"><i className="fas fa-user"></i></div>
            <form id="loginForm">
                <input type="email" placeholder="ID o Email" required />
                <input type="password" placeholder="Contraseña" required />
                <button type="submit" className="btn-login">Iniciar Sesión</button>
            </form>
            {/* Usamos Link para navegación dinámica */}
            <Link to="/registro" className="link-register">Registrarse</Link>
        </div>
      </div>
      <LightRays />
    </div>
  );
};

export default Login;