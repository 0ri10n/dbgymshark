const mongoose = require('mongoose');

const UsuarioSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String, 
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true 
    },
    
    rol: {
        type: String,
        default: 'cliente',
        enum: ['cliente', 'admin']
    },

    registro: {
        type: Date,
        default: Date.now 
    }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);