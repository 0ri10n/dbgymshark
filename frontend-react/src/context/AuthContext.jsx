import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Creamos el contexto
const AuthContext = createContext();

// 2. Definimos el Proveedor de Autenticación
export const AuthProvider = ({ children }) => {
    // Estado global del usuario y el token
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    // Persistencia: Verificar si hay un token al cargar la app
    useEffect(() => {
        if (token) {
            // AQUÍ KEVIN: Podrías validar el token con el backend si es necesario
            // Por ahora, simulamos que el usuario está autenticado
            setUser({ role: 'admin' }); // Dato de prueba para que Isaac trabaje
        }
        setLoading(false);
    }, [token]);

    // Función de Login que usará Kevin
    const login = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken); // Guardamos para persistencia
    };

    // Función de Logout
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirigir al limpiar sesión
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Hook personalizado para usar la autenticación en cualquier componente
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};