/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        const role = localStorage.getItem('role');
        return role ? { role } : null;
    });

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
        } else {
            delete axios.defaults.headers.common['x-auth-token'];
        }
    }, [token]);

    const login = (newToken, newRole) => {
        setToken(newToken);
        setUser({ role: newRole });
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newRole);
        axios.defaults.headers.common['x-auth-token'] = newToken;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        delete axios.defaults.headers.common['x-auth-token'];
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
    return context;
};