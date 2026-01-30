const mongoose = require('mongoose');

exports.obtenerProductos = async (req, res) => {
    try {
        const { talla, search, stock } = req.query;
        let query = {};

        if (search && search.trim() !== "") {
            query.nombre = { $regex: search, $options: 'i' };
        }

        if (talla && talla.trim() !== "") {
            query.tallas = talla;
        }

        if (stock === 'true') {
            query.inventory_quantity = { $gt: 0 };
        } else if (stock === 'false') {
            query.inventory_quantity = 0;
        }
        const db = mongoose.connection.useDb('DB');

        const productos = await db.collection('productos').find(query).toArray();

        const totalDisponible = await db.collection('productos').countDocuments({ inventory_quantity: { $gt: 0 } });
        const totalAgotado = await db.collection('productos').countDocuments({ inventory_quantity: 0 });

        console.log(`Conectado a: ${db.databaseName} | Documentos encontrados: ${productos.length}`);

        res.json({
            productos,
            counts: {
                totalDisponible,
                totalAgotado
            }
        });
    } catch (error) {
        console.error("Error al consultar productos:", error);
        res.status(500).json({ msg: 'Error al obtener productos' });
    }
};