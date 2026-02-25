const mongoose = require('mongoose');

// 1. Sub-esquema para definir cómo se guarda cada producto en el carrito
const ProductoAdquiridoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    talla: { type: String, trim: true, default: 'N/A' },
    color: { type: String, trim: true, default: 'N/A' },
    precio: { type: Number, required: true },
    cantidad: { type: Number, default: 1 }
}, { _id: false }); // _id: false evita que MongoDB le cree un ID innecesario a cada línea del carrito

// 2. Esquema principal de la Venta
const VentaSchema = new mongoose.Schema({
    numeroOrden: {
        type: String,
        unique: true,
        // Genera automáticamente un folio único, ej: "ORD-K9F2A1"
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