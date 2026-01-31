const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true, index: true },
    color: { type: String, trim: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    inventory_quantity: { type: Number, default: 0 },
    variant_id: { type: String, trim: true }
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    handle: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    vendor: { type: String, trim: true, index: true },
    tags: [{ type: String, trim: true }],
    product_type: { type: String, trim: true },
    image_principal: { type: String, trim: true },

    variants: {
      type: [VariantSchema],
      default: []
    },

    sizes_available: { type: [String], index: true },
    colors_available: { type: [String] },
    price_range: {
      min: { type: Number, index: true },
      max: { type: Number, index: true }
    }
  },
  { timestamps: true }
);

// Text index for search
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Compound index for common filters
ProductSchema.index({ vendor: 1, sizes_available: 1, 'price_range.min': 1 });

// Helper to refresh derived fields
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

  if (minPrice === Number.POSITIVE_INFINITY) {
    doc.price_range = { min: 0, max: 0 };
  } else {
    doc.price_range = { min: minPrice, max: maxPrice };
  }
}

async function assertUniqueSkus(doc, next, currentId) {
  const skus = (doc.variants || [])
    .map((v) => v.sku)
    .filter(Boolean);

  // Local duplicates
  if (skus.length !== new Set(skus).size) {
    return next(new Error('SKU duplicado dentro del producto'));
  }

  if (skus.length === 0) return next();

  const conflict = await mongoose.models.Producto.findOne({
    _id: { $ne: currentId || doc._id },
    'variants.sku': { $in: skus }
  }).lean();

  if (conflict) {
    return next(new Error('SKU duplicado en otro producto'));
  }
  return next();
}

ProductSchema.pre('save', async function (next) {
  refreshDerived(this);
  await assertUniqueSkus(this, next);
});

ProductSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() || {};
  const doc = {};

  // Merge existing update doc fields (including $set)
  if (update.$set) Object.assign(doc, update.$set);
  if (update.variants) doc.variants = update.variants;
  if (update.$set && update.$set.variants) doc.variants = update.$set.variants;

  refreshDerived(doc);

  if (!update.$set) update.$set = {};
  Object.assign(update.$set, {
    sizes_available: doc.sizes_available,
    colors_available: doc.colors_available,
    price_range: doc.price_range
  });

  this.setUpdate(update);
  const currentId = this.getQuery()?._id;
  await assertUniqueSkus({ variants: doc.variants }, next, currentId);
});

module.exports = mongoose.model('Producto', ProductSchema);
