import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Tu sistema de sesiones
import LightRays from '../components/LightRays';
import './login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // 1. ESTADOS PARA CAPTURAR CREDENCIALES
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleShowLogin = () => setIsLoginVisible(true);
    const togglePassword = () => setShowPassword(!showPassword);

    // 2. CONEXIÓN CON EL BACKEND DE KEVIN
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Kevin configuró el endpoint en Render
            const url = 'https://dbgymshark.onrender.com/api/auth';
            const respuesta = await axios.post(url, { email, password });

            // Kevin nos devuelve el token y el rol
            const { token, role } = respuesta.data;

            // Guardamos en tu contexto global
            login(token, role);

            // 3. REDIRECCIÓN INTELIGENTE POR ROL
            if (role === 'admin') {
                navigate('/admin'); // Isaac podrá trabajar aquí
            } else {
                navigate('/'); // Clientes van al catálogo
            }

        } catch (error) {
            // Abdiel: Manejo de errores de autenticación
            const msg = error.response?.data?.msg || "Error al conectar con el servidor";
            alert(msg);
        }
    };

    return (
        <div className="login-page-wrapper">
            <LightRays />

            {!isLoginVisible && (
                <div className="brand-background">
                    <h1 className="brand-title">MAKIA</h1>
                    <p className="brand-subtitle">te acompañamos mientras te ejercitas</p>
                    <button onClick={handleShowLogin} className="btn-main-action">
                        COMENZAR ENTRENAMIENTO
                    </button>
                </div>
            )}

            <div className={`login-wrapper ${!isLoginVisible ? 'hidden' : ''}`}>
                <div className="login-container">
                    <div className="user-icon-container">
                        <i className="fas fa-user"></i>
                    </div>

                    <form id="loginForm" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <i className="fas fa-envelope"></i>
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="input-group" style={{ position: 'relative' }}>
                            <i className="fas fa-lock"></i>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="input-pass-padding" 
                                placeholder="Contraseña" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                    <Link to="/registro" className="link-register">Registrarse</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;