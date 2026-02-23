const mongoose = require('mongoose');
const axios = require('axios');
const Producto = require('../models/Productos'); 

const getExchangeRate = async () => {
    try {
        const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`;
        const res = await axios.get(url, { timeout: 5000 });
        return res.data.conversion_rates.MXN || 18.5;
    } catch (error) {
        return 18.5;
    }
};

exports.obtenerProductos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || ''; 
        const tasaMXN = await getExchangeRate();

        let filtro = {};
        if (search) {
            filtro.title = { $regex: search, $options: 'i' };
        }

        const [productos, total] = await Promise.all([
            Producto.find(filtro).skip((page - 1) * limit).limit(limit).lean(),
            Producto.countDocuments(filtro)
        ]);

        const respuesta = productos.map(p => ({
            ...p,
            precioMXN: p.price_range?.min ? Number((p.price_range.min * tasaMXN).toFixed(2)) : 0
        }));

        res.json({ 
            productos: respuesta, 
            pagination: { page, pages: Math.ceil(total / limit), total } 
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el catálogo' });
    }
};