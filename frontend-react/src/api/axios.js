import axios from 'axios';

const api = axios.create({ 
    // AGREGAMOS '/api' al final para que coincida con las rutas del servidor
    baseURL: 'https://dbgymshark.onrender.comapi' 
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers['x-auth-token'] = token;
    return config;
});

export default api;