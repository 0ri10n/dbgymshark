const jwt = require('jsonwebtoken');

// 1. Middleware de Autenticación
const auth = function (req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    try {
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        
        req.usuario = cifrado.usuario; 
        
        next(); 
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

// 2: Middleware de Autorización 
const admin = function (req, res, next) {
    // Comprobamos si el usuario existe en la request y si su rol es 'admin'
    if (req.usuario && req.usuario.rol === 'admin') {
        next(); // Si el usuario tiene permiso, la petición continúa
    } else {
        // 403 Forbidden es el código HTTP correcto cuando sabemos quién es el usuario pero no tiene permisos
        res.status(403).json({ msg: 'Acceso denegado: Privilegios de administrador requeridos' }); 
    }
};

// Exportamos ambas funciones para poder usarlas en las rutas
module.exports = { auth, admin };