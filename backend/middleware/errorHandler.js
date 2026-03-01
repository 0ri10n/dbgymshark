const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.error(`[ERROR] ${err.stack}`);

    if (err.name === 'CastError') {
        const message = `Recurso no encontrado. El ID ${err.value} no es válido.`;
        return res.status(404).json({ exito: false, mensaje: message });
    }

    if (err.code === 11000) {
        const message = 'Valor duplicado detectado. Ya existe un registro con ese dato.';
        return res.status(400).json({ exito: false, mensaje: message });
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return res.status(400).json({ exito: false, mensaje: message });
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        const message = 'No autorizado. Tu sesión es inválida o ha expirado.';
        return res.status(401).json({ exito: false, mensaje: message });
    }

    res.status(error.statusCode || 500).json({
        exito: false,
        mensaje: error.message || 'Error interno del servidor. Intente más tarde.',
        detalle: process.env.NODE_ENV === 'production' ? null : err.message 
    });
};

module.exports = errorHandler;