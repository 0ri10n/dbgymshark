const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log para el desarrollador (solo lo ves tú en la terminal)
    console.error(`[ERROR] ${err.stack}`);

    // 1. Error de Mongoose: ID mal formado (CastError)
    if (err.name === 'CastError') {
        const message = `Recurso no encontrado. El ID ${err.value} no es válido.`;
        return res.status(404).json({ exito: false, mensaje: message });
    }

    // 2. Error de Mongoose: Dato duplicado (ej. Email ya registrado)
    if (err.code === 11000) {
        const message = 'Valor duplicado detectado. Ya existe un registro con ese dato.';
        return res.status(400).json({ exito: false, mensaje: message });
    }

    // 3. Error de Mongoose: Faltan campos obligatorios (ValidationError)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return res.status(400).json({ exito: false, mensaje: message });
    }

    // 4. Error de Seguridad: Token JWT inválido o expirado
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        const message = 'No autorizado. Tu sesión es inválida o ha expirado.';
        return res.status(401).json({ exito: false, mensaje: message });
    }

    // 5. Error Genérico del Servidor (Cualquier cosa que no atrapamos arriba)
    res.status(error.statusCode || 500).json({
        exito: false,
        mensaje: error.message || 'Error interno del servidor. Intente más tarde.',
        // Solo mandamos el error técnico si NO estamos en producción
        detalle: process.env.NODE_ENV === 'production' ? null : err.message 
    });
};

module.exports = errorHandler;