const mongoose = require('mongoose');
const axios = require('axios');
const Producto = require('../models/Producto'); 

const DEFAULT_MXN_RATE = 18.0;

// Limpia y normaliza el texto
const normalizeText = (value = '') => String(value || '').trim();

// Selecciona la imagen principal
const pickFirstImage = (product = {}) => {
    const candidates = [
        product.image_principal,
        product.imagen,
        product.image_src
    ].map(normalizeText).filter(Boolean);

    if (candidates.length > 0) {
        // Si es una lista de CSV (separada por comas), toma la primera
        return candidates[0].split(',')[0].trim();
    }
    return '';
};

// Obtiene el tipo de cambio actual
const getExchangeRate = async () => {
    try {
        const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`;
        const res = await axios.get(url, { timeout: 5000 });
        return res.data.conversion_rates.MXN || DEFAULT_MXN_RATE;
    } catch (error) {
        return DEFAULT_MXN_RATE;
    }
};

// --- CONTROLADOR PRINCIPAL ---
exports.obtenerProductos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const talla = req.query.talla || '';

        const tasaMXN = await getExchangeRate();
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (talla) {
            query.sizes_available = talla.toUpperCase();
        }

        const [productos, total] = await Promise.all([
            Producto.find(query).skip(skip).limit(limit).lean(),
            Producto.countDocuments(query)
        ]);

        const productosProcesados = productos.map(p => ({
            ...p,
            image_principal: pickFirstImage(p),
            // Cálculo de precio: $$PrecioMXN = PrecioUSD \times Tasa$$
            precioMXN: p.price_range?.min ? Number((p.price_range.min * tasaMXN).toFixed(2)) : 0,
            tallasDisponibles: p.sizes_available || []
        }));

        res.json({
            productos: productosProcesados,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al cargar el catálogo' });
    }
};

// --- HERRAMIENTA DE LIMPIEZA ---
exports.limpiarBaseDeDatos = async (req, res) => {
    try {
        const productos = await Producto.find({});
        const mapa = {};
        let eliminados = 0;

        productos.forEach(p => {
            const clave = (p.handle || p.title || '').trim().toLowerCase();
            if (!clave) return;
            if (!mapa[clave]) mapa[clave] = [];
            mapa[clave].push(p);
        });

        for (const clave in mapa) {
            const grupo = mapa[clave];
            if (grupo.length > 1) {
                const maestro = grupo[0];
                const variantes = grupo.map(item => ({
                    size: item.sizes_available?.[0] || 'Única',
                    sku: `${item.handle || 'SKU'}-${Math.random().toString(36).substring(7)}`,
                    price: item.price_range?.min || 0,
                    inventory_quantity: 10
                }));

                maestro.variants = variantes;
                await maestro.save(); 

                const ids = grupo.slice(1).map(d => d._id);
                await Producto.deleteMany({ _id: { $in: ids } });
                eliminados += ids.length;
            }
        }

        res.json({ msg: "Limpieza exitosa", eliminados });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};