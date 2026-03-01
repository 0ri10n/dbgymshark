const validarProducto = (req, res, next) => {
    const { title, variants } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ msg: 'Error: El nombre del producto no puede estar vacío.' });
    }

    if (variants && Array.isArray(variants) && variants.length > 0) {
        for (let i = 0; i < variants.length; i++) {
            if (variants[i].price === undefined || variants[i].price < 0) {
                return res.status(400).json({ msg: 'Error: El precio no puede ser negativo.' });
            }
            if (!variants[i].sku || variants[i].sku.trim() === '') {
                return res.status(400).json({ msg: 'Error: Cada variante debe tener un SKU válido.' });
            }
        }
    } else {
         return res.status(400).json({ msg: 'Error: El producto debe tener al menos una variante con precio y talla.' });
    }

    next();
};

module.exports = { validarProducto };
