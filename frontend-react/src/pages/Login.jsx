import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LightRays from '../components/LightRays';
import './Login.css'; // Asegúrate de mover tu CSS aquí

const Login = () => {
    // Estado para controlar qué sección se muestra
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleShowLogin = () => setIsLoginVisible(true);
    const togglePassword = () => setShowPassword(!showPassword);

    const handleSubmit = (e) => {
        e.preventDefault();
        // PAUSA PARA KEVIN: Aquí se conectará la lógica del JWT
        console.log("Datos enviados al backend de Kevin e Isaac...");
    };

    return (
        <div className="login-page-wrapper">
            {/* Fondo Animado Reutilizable */}
            <LightRays />

            {/* Sección de Marca Inicial */}
            {!isLoginVisible && (
                <div className="brand-background">
                    <h1 className="brand-title">MAKIA</h1>
                    <p className="brand-subtitle">te acompañamos mientras te ejercitas</p>
                    <button 
                        onClick={handleShowLogin} 
                        className="btn-main-action"
                    >
                        COMENZAR ENTRENAMIENTO
                    </button>
                </div>
            )}

            {/* Formulario de Login (Visible mediante estado) */}
            <div className={`login-wrapper ${!isLoginVisible ? 'hidden' : ''}`}>
                <div className="login-container">
                    <div className="user-icon-container">
                        <i className="fas fa-user"></i>
                    </div>

                    <form id="loginForm" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <i className="fas fa-envelope"></i>
                            <input type="email" placeholder="ID o Email" required />
                        </div>

                        <div className="input-group" style={{ position: 'relative' }}>
                            <i className="fas fa-lock"></i>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="input-pass-padding" 
                                placeholder="Contraseña" 
                                required 
                            />
                            <i 
                                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                                onClick={togglePassword}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>

                        <a href="#" className="forgot-pass">Restablecer Contraseña</a>
                        <button type="submit" className="btn-login">Iniciar Sesión</button>
                    </form>

                    {/* Ruta dinámica al Registro */}
                    <Link to="/registro" className="link-register">Registrarse</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;