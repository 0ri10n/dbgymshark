const mongoose = require('mongoose');
const axios = require('axios');
// CORRECCIÓN: Nombre exacto de tu archivo en models
const Producto = require('../models/Productos'); 

const DEFAULT_MXN_RATE = 18.0;

const getExchangeRate = async () => {
    try {
        const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`;
        const res = await axios.get(url, { timeout: 5000 });
        return res.data.conversion_rates.MXN || DEFAULT_MXN_RATE;
    } catch (error) {
        return DEFAULT_MXN_RATE;
    }
};

exports.obtenerProductos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = (req.query.search || '').trim();
        const tasaMXN = await getExchangeRate();

        let query = {};
        if (search) query.title = { $regex: search, $options: 'i' };

        const [productos, total] = await Promise.all([
            Producto.find(query).skip((page - 1) * limit).limit(limit).lean(),
            Producto.countDocuments(query)
        ]);

        const respuesta = productos.map(p => ({
            ...p,
            precioMXN: p.price_range?.min ? Number((p.price_range.min * tasaMXN).toFixed(2)) : 0
        }));

        res.json({ productos: respuesta, pagination: { page, pages: Math.ceil(total / limit), total } });
    } catch (error) {
        res.status(500).json({ msg: 'Error en catálogo' });
    }
};

exports.limpiarBaseDeDatos = async (req, res) => {
    try {
        const productos = await Producto.find({});
        const mapa = {};
        let eliminados = 0;

        productos.forEach(p => {
            const clave = (p.handle || p.title || '').trim().toLowerCase();
            if (clave) {
                if (!mapa[clave]) mapa[clave] = [];
                mapa[clave].push(p);
            }
        });

        for (const clave in mapa) {
            const grupo = mapa[clave];
            if (grupo.length > 1) {
                const maestro = grupo[0];
                // Fusionamos todas las tallas en variantes del primer producto
                maestro.variants = grupo.map(item => ({
                    size: item.sizes_available?.[0] || 'Única',
                    sku: `${item.handle || 'SKU'}-${Math.random().toString(36).substring(7)}`,
                    price: item.price_range?.min || 0,
                    inventory_quantity: 10
                }));

                await maestro.save(); 
                const idsBorrar = grupo.slice(1).map(d => d._id);
                await Producto.deleteMany({ _id: { $in: idsBorrar } });
                eliminados += idsBorrar.length;
            }
        }
        res.json({ msg: "Limpieza completada", eliminados });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};