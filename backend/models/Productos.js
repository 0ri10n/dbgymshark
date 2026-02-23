const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
    size: { type: String, trim: true, index: true },
    color: { type: String, trim: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    inventory_quantity: { type: Number, default: 0 },
    variant_id: { type: String, trim: true }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    handle: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    vendor: { type: String, trim: true, index: true },
    tags: [{ type: String, trim: true }],
    product_type: { type: String, trim: true },
    image_principal: { type: String, trim: true },
    variants: { type: [VariantSchema], default: [] },
    sizes_available: { type: [String], index: true },
    colors_available: { type: [String] },
    price_range: {
        min: { type: Number, index: true },
        max: { type: Number, index: true }
    }
}, { timestamps: true });

function refreshDerived(doc) {
    if (!doc || !Array.isArray(doc.variants)) return;
    const sizes = [];
    const colors = [];
    let minPrice = Number.POSITIVE_INFINITY;
    let maxPrice = 0;
    doc.variants.forEach((v) => {
        if (v.size) sizes.push(v.size);
        if (v.color) colors.push(v.color);
        if (typeof v.price === 'number') {
            if (v.price < minPrice) minPrice = v.price;
            if (v.price > maxPrice) maxPrice = v.price;
        }
    });
    doc.sizes_available = [...new Set(sizes)];
    doc.colors_available = [...new Set(colors)];
    doc.price_range = minPrice === Number.POSITIVE_INFINITY ? { min: 0, max: 0 } : { min: minPrice, max: maxPrice };
}

// CORRECCIÓN: Quitamos 'next' porque usamos async
async function assertUniqueSkus(doc, currentId) {
    const skus = (doc.variants || []).map((v) => v.sku).filter(Boolean);
    if (skus.length !== new Set(skus).size) throw new Error('SKU duplicado dentro del producto');
    if (skus.length === 0) return;
    const conflict = await mongoose.models.Producto.findOne({
        _id: { $ne: currentId || doc._id },
        'variants.sku': { $in: skus }
    }).lean();
    if (conflict) throw new Error('SKU duplicado en otro producto');
}

ProductSchema.pre('save', async function () {
    refreshDerived(this);
    await assertUniqueSkus(this);
});

ProductSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate() || {};
    const doc = update.$set || update;
    if (doc.variants) {
        refreshDerived(doc);
        const currentId = this.getQuery()?._id;
        await assertUniqueSkus(doc, currentId);
    }
});

module.exports = mongoose.model('Producto', ProductSchema);