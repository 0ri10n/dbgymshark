import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LightRays from '../components/LightRays';
import './Registro.css'; // Mueve tu registro.css a esta carpeta

const Registro = () => {
    const navigate = useNavigate();
    
    // Estado para capturar los datos del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Función para manejar los cambios en los inputs
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // PAUSA PARA ABDEL/KEVIN: Validaciones de seguridad aquí
        if (formData.password !== formData.confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }
        console.log("Datos listos para enviar al backend:", formData);
        // Por ahora, simulamos éxito y volvemos al login
        // navigate('/login'); 
    };

    return (
        <div className="registro-page-wrapper">
            {/* Reutilizamos el fondo que ya configuraste */}
            <LightRays />

            <div className="registro-container">
                <h2>REGISTRAR CUENTA</h2>
                <div className="divider"></div>

                <form id="registroForm" onSubmit={handleSubmit}>
                    
                    <label htmlFor="nombre">Nombre/s</label>
                    <div className="input-box">
                        <input 
                            type="text" 
                            id="nombre" 
                            placeholder="Ingrese Nombre/s Aquí" 
                            value={formData.nombre}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <label htmlFor="apellido">Apellido/s</label>
                    <div className="input-box">
                        <input 
                            type="text" 
                            id="apellido" 
                            placeholder="Ingrese Apellido/s Aquí" 
                            value={formData.apellido}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <label htmlFor="email">Correo Electrónico:</label>
                    <div className="input-box">
                        <input 
                            type="email" 
                            id="email" 
                            placeholder="Ejemplo@correo.com" 
                            value={formData.email}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <label htmlFor="password">Contraseña:</label>
                    <div className="input-box">
                        <input 
                            type="password" 
                            id="password" 
                            placeholder="Ingrese contraseña segura" 
                            value={formData.password}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="input-box">
                        <input 
                            type="password" 
                            id="confirmPassword" 
                            placeholder="Ingresa nuevamente contraseña" 
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="botones-container">
                        {/* Navegación dinámica sin recargar la página */}
                        <Link to="/login" className="btn-cancelar">Cancelar</Link>
                        
                        <button type="submit" className="btn-listo">Listo</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Registro;