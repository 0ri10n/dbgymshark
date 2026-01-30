const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema({
        title: {
        type: String,
        required: true,
        trim: true
    },
    
    product_type: {
        type: String,
        required: true,
        trim: true
    },

    vendor: {
        type: String,
        trim: true
    },

    tags: [{
        type: String,
        trim: true
    }],

    handle: {
        type: String, 
        trim: true
    },

    size: {
        type: String, 
        trim: true
    },

    sku: {
        type: String,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    inventory_quantity: {
        type: Number,
        default: 0
    },
    image_src: {
        type: String, // La URL de la imagen
        trim: true
    }
}, { 
    timestamps: true // Esto crea automáticamente 'createdAt' y 'updatedAt'
});

module.exports = mongoose.model('Producto', ProductSchema);