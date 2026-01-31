const mongoose = require('mongoose');
const Product = require('../models/Productos');

// 1. OBTENER productos (Filtros para Tienda + Lista para Admin)
exports.obtenerProductos = async (req, res) => { // Asegúrate que diga 'async'
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
        
        // El await debe estar DENTRO de la función async
        const productosBrutos = await db.collection('productos').find(query).toArray();

        // Mapeo para compatibilidad con client.js
        const productos = productosBrutos.map(p => ({
            ...p,
            nombre: p.nombre || p.title,
            precio: p.precio || p.price,
            imagenUrl: p.imagenUrl || p.image_src
        }));

        const totalDisponible = await db.collection('productos').countDocuments({ inventory_quantity: { $gt: 0 } });
        const totalAgotado = await db.collection('productos').countDocuments({ inventory_quantity: 0 });

        res.json({
            productos,
            counts: { totalDisponible, totalAgotado }
        });
    } catch (error) {
        console.error("Error en obtenerProductos:", error);
        res.status(500).json({ msg: 'Hubo un error al obtener los productos' });
    }
};

// 2. CREAR un nuevo producto (CREATE)
exports.crearProducto = async (req, res) => {
    try {
        const db = mongoose.connection.useDb('DB');
        const resultado = await db.collection('productos').insertOne(req.body);
        res.status(201).json({ msg: 'Producto creado', id: resultado.insertedId });
    } catch (error) {
        res.status(400).json({ msg: 'No se pudo crear el producto', error });
    }
};

// 3. BUSCAR producto por su Handle (URL)
exports.obtenerProductoPorHandle = async (req, res) => {
    try {
        const db = mongoose.connection.useDb('DB');
        const producto = await db.collection('productos').findOne({ handle: req.params.handle });
        if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// 4. ACTUALIZAR un producto (UPDATE)
exports.actualizarProducto = async (req, res) => {
    try {
        const { ObjectId } = require('mongoose').Types;
        const db = mongoose.connection.useDb('DB');
        const datosActualizados = req.body;
        delete datosActualizados._id; // Seguridad

        const producto = await db.collection('productos').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) }, 
            { $set: datosActualizados }, 
            { returnDocument: 'after' }
        );
        res.json(producto);
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar' });
    }
};

// 5. ELIMINAR un producto (DELETE)
exports.eliminarProducto = async (req, res) => {
    try {
        const { ObjectId } = require('mongoose').Types;
        const db = mongoose.connection.useDb('DB');
        await db.collection('productos').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ msg: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar' });
    }
};