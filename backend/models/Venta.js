const mongoose = require('mongoose');

const ProductoAdquiridoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    talla: { type: String, trim: true, default: 'N/A' },
    color: { type: String, trim: true, default: 'N/A' },
    precio: { type: Number, required: true },
    cantidad: { type: Number, default: 1 }
}, { _id: false });

const VentaSchema = new mongoose.Schema({
    numeroOrden: {
        type: String,
        unique: true,
        default: () => 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    },
    nombreCliente: {
        type: String,
        required: true,
        trim: true
    },
    productos: {
        type: [ProductoAdquiridoSchema],
        required: true,
        validate: [v => v.length > 0, 'La venta debe incluir al menos un producto']
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    fechaPedido: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Venta', VentaSchema);