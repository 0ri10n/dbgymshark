const mongoose = require('mongoose');
const Product = require('../models/Productos');

// 1. OBTENER productos (filtros optimizados + mapeo robusto de campos importados)
exports.obtenerProductos = async (req, res) => {
    try {
        const { talla, search, stock } = req.query;
        const match = {};

        if (search && search.trim() !== '') match.$text = { $search: search.trim() };
        if (talla && talla.trim() !== '') match.sizes_available = talla.trim();
        if (stock === 'true') match.variants = { $elemMatch: { inventory_quantity: { $gt: 0 } } };
        else if (stock === 'false') match.variants = { $not: { $elemMatch: { inventory_quantity: { $gt: 0 } } } };

        const pipeline = [
            { $match: match },
            {
                $addFields: {
                    total_stock: { $sum: '$variants.inventory_quantity' },
                    activeVariant: talla && talla.trim()
                        ? {
                            $let: {
                                vars: {
                                    matches: {
                                        $filter: {
                                            input: '$variants',
                                            as: 'v',
                                            cond: { $eq: ['$$v.size', talla.trim()] }
                                        }
                                    }
                                },
                                in: {
                                    $cond: [
                                        { $gt: [{ $size: '$$matches' }, 0] },
                                        { $arrayElemAt: ['$$matches', 0] },
                                        { $arrayElemAt: ['$variants', 0] }
                                    ]
                                }
                            }
                        }
                        : { $arrayElemAt: ['$variants', 0] }
                }
            },
            { $project: { __v: 0 } }
        ];

        const dbName = process.env.PRODUCT_DB || 'DB';
        const collectionName = process.env.PRODUCT_COLLECTION || Product.collection.collectionName || 'productos';
        const collection = mongoose.connection.client.db(dbName).collection(collectionName);
        const raw = await collection.aggregate(pipeline).toArray();

        // Mapeo de campos importados a las claves esperadas por el frontend
        const mapProduct = (p) => {
            const nombre =
                p.nombre ||
                p.title ||
                p['Product Name'] ||
                p.product_name ||
                (p.activeVariant && p.activeVariant.title);

            const precio =
                p.precio ??
                p.price ??
                p.Price ??
                (p.activeVariant && p.activeVariant.price);

            const imagenUrl =
                p.imagenUrl ||
                p.image_src ||
                p.image_principal ||
                p['Image URL'] ||
                p['Imagen URL'];

            return {
                ...p,
                nombre,
                precio,
                imagenUrl
            };
        };

        const productos = raw.map(mapProduct);

        const countsAgg = await collection.aggregate([
            { $unwind: '$variants' },
            {
                $group: {
                    _id: null,
                    totalDisponible: {
                        $sum: {
                            $cond: [
                                { $gt: ['$variants.inventory_quantity', 0] },
                                '$variants.inventory_quantity',
                                0
                            ]
                        }
                    },
                    totalAgotado: {
                        $sum: {
                            $cond: [
                                { $lte: ['$variants.inventory_quantity', 0] },
                                '$variants.inventory_quantity',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const counts = {
            totalDisponible: countsAgg[0]?.totalDisponible || 0,
            totalAgotado: Math.abs(countsAgg[0]?.totalAgotado || 0)
        };

        res.json({ productos, counts });
    } catch (error) {
        console.error('Error en obtenerProductos:', error);
        res.status(500).json({ msg: 'Hubo un error al obtener los productos' });
    }
};

// 2. CREAR un nuevo producto
exports.crearProducto = async (req, res) => {
    try {
        const producto = await Product.create(req.body);
        res.status(201).json({ msg: 'Producto creado', id: producto._id });
    } catch (error) {
        res.status(400).json({ msg: 'No se pudo crear el producto', error });
    }
};

// 3. BUSCAR producto por handle
exports.obtenerProductoPorHandle = async (req, res) => {
    try {
        const producto = await Product.findOne({ handle: req.params.handle });
        if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// 4. ACTUALIZAR producto
exports.actualizarProducto = async (req, res) => {
    try {
        const producto = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.json(producto);
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar' });
    }
};

// 5. ELIMINAR producto
exports.eliminarProducto = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar' });
    }
};
