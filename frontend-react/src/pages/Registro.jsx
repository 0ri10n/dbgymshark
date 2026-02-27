import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Registro.css';

const Registro = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        nombre: '', 
        apellido: '', 
        email: '', 
        password: '', 
        confirmPassword: ''
    });

    // 1. FUNCIÓN CENTRALIZADA: Mejora la legibilidad y evita errores de linter
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 2. VALIDACIÓN: Seguridad básica antes de molestar al servidor
        if (formData.password !== formData.confirmPassword) {
            return alert("Las contraseñas no coinciden");
        }

        try {
            // 3. TRUCO DE ARQUITECTA: Usamos el guion bajo (_) para indicar a ESLint 
            // que omitimos confirmPassword intencionalmente
            const { confirmPassword: _, ...datosAEnviar } = formData;

            // 4. CONEXIÓN: Usamos la URL de Render de Kevin
            const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';
            const url = `${baseURL}/auth/registro`;
            const res = await axios.post(url, datosAEnviar);
            
            // 5. LOGIN: Pasamos token y role como espera tu contexto
            login(res.data.token, res.data.role);
            
            alert("¡Cuenta creada con éxito!");
            navigate('/');
        } catch (error) {
            // Manejo de errores de Abdiel (QA)
            const msg = error.response?.data?.msg || "Error al registrar el usuario";
            alert(msg);
        }
    };

    return (
        <div className="registro-page-wrapper">
            <form onSubmit={handleSubmit} className="registro-container">
                <h2>CREAR CUENTA</h2>
                
                <input 
                    name="nombre" type="text" placeholder="Nombre" 
                    value={formData.nombre} onChange={handleChange} required 
                />
                
                <input 
                    name="apellido" type="text" placeholder="Apellido" 
                    value={formData.apellido} onChange={handleChange} required 
                />
                
                <input 
                    name="email" type="email" placeholder="Email" 
                    value={formData.email} onChange={handleChange} required 
                />
                
                <input 
                    name="password" type="password" placeholder="Contraseña" 
                    value={formData.password} onChange={handleChange} required 
                />
                
                <input 
                    name="confirmPassword" type="password" placeholder="Confirmar Contraseña" 
                    value={formData.confirmPassword} onChange={handleChange} required 
                />
                
                <button type="submit" className="btn-listo">LISTO</button>
            </form>
        </div>
    );
};

export default Registro;
