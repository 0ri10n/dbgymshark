const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    inventory_quantity: { type: Number, default: 0 }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    handle: { type: String, trim: true, index: true },
    variant_title: { type: String, trim: true }, // Columna del CSV para tallas
    vendor: { type: String, trim: true },
    product_type: { type: String, trim: true },
    image_src: { type: String }, // URL de imagen del CSV
    image_principal: { type: String },
    variants: { type: [VariantSchema], default: [] },
    sizes_available: { type: [String], index: true },
    price_range: {
        min: { type: Number, index: true },
        max: { type: Number, index: true }
    }
}, { timestamps: true });

// Función para recalcular tallas y precios automáticamente
function refreshDerived(doc) {
    if (!doc || !Array.isArray(doc.variants) || doc.variants.length === 0) return;
    
    const sizes = [...new Set(doc.variants.map(v => v.size).filter(s => s && s !== 'N/A'))];
    const prices = doc.variants.map(v => v.price).filter(p => typeof p === 'number');

    doc.sizes_available = sizes;
    if (prices.length > 0) {
        doc.price_range = {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }
}

// Hook corregido sin 'next' para evitar errores de ejecución
ProductSchema.pre('save', async function() {
    refreshDerived(this);
});

module.exports = mongoose.model('Producto', ProductSchema);