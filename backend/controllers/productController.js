const mongoose = require('mongoose');
const axios = require('axios');
const Producto = require('../models/Productos');
const mockProducts = require('../data/mockProducts');

const DEFAULT_MXN_RATE = Number(process.env.DEV_MXN_RATE || 17.2);

const normalizeSize = (value = '') => value.trim().toUpperCase();
const normalizeText = (value = '') => String(value || '').trim();

const pickFirstImage = (product = {}) => {
    const directCandidates = [
        product.image_principal,
        product.imagen,
        product.imagenUrl,
    ]
        .map(normalizeText)
        .filter(Boolean);

    if (directCandidates.length > 0) {
        return directCandidates[0];
    }

    const rawImageSrc = normalizeText(product.image_src);
    if (!rawImageSrc) return '';

    const fromCsvList = rawImageSrc
        .split(',')
        .map((item) => item.trim())
        .find(Boolean);

    return fromCsvList || '';
};

const shouldUseMockData = () => {
    const forceMock = process.env.USE_MOCK_DATA === 'true';
    const dbConnected = mongoose.connection.readyState === 1;
    return forceMock || !dbConnected;
};

const buildPaginatedResponse = (sourceProducts, page, limit, tasaMXN) => {
    const totalProductos = sourceProducts.length;
    const paginasTotales = Math.max(Math.ceil(totalProductos / limit), 1);
    const pagina = Math.min(Math.max(page, 1), paginasTotales);
    const skip = (pagina - 1) * limit;
    const productos = sourceProducts.slice(skip, skip + limit);

    const productosProcesados = productos.map((producto) => {
        const prodObj = { ...producto };
        prodObj.image_principal = pickFirstImage(prodObj);

        if (typeof prodObj.price === 'number') {
            prodObj.precioMXN = Number((prodObj.price * tasaMXN).toFixed(2));
        }

        if (Array.isArray(prodObj.variants) && prodObj.variants.length > 0) {
            prodObj.tallasDisponibles = [...new Set(prodObj.variants.map((v) => v.size).filter(Boolean))];
        } else {
            prodObj.tallasDisponibles = prodObj.sizes_available || [];
        }

        return prodObj;
    });

    return {
        productos: productosProcesados,
        paginasTotales,
        pagination: {
            page: pagina,
            pages: paginasTotales,
            total: totalProductos,
        },
    };
};

const getExchangeRate = async () => {
    if (process.env.USE_STATIC_EXCHANGE_RATE === 'true') {
        return DEFAULT_MXN_RATE;
    }

    try {
        const urlAPI = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`;
        const respuesta = await axios.get(urlAPI, { timeout: 7000 });
        return Number(respuesta.data?.conversion_rates?.MXN) || DEFAULT_MXN_RATE;
    } catch (error) {
        console.warn('No se pudo obtener tasa MXN de API externa. Usando tasa local de respaldo.');
        return DEFAULT_MXN_RATE;
    }
};

const applyMockFilters = (products, search, talla, stock) => {
    let filtered = [...products];

    if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter((p) => {
            const haystack = `${p.title || ''} ${p.product_type || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
            return haystack.includes(query);
        });
    }

    if (talla) {
        const targetSize = normalizeSize(talla);
        filtered = filtered.filter((p) => {
            const productSizes = (p.sizes_available || []).map(normalizeSize);
            const variantSizes = (p.variants || []).map((v) => normalizeSize(v.size || ''));
            return productSizes.includes(targetSize) || variantSizes.includes(targetSize);
        });
    }

    if (stock === 'true') {
        filtered = filtered.filter((p) => (p.variants || []).some((v) => Number(v.inventory_quantity) > 0));
    }

    if (stock === 'false') {
        filtered = filtered.filter((p) => (p.variants || []).every((v) => Number(v.inventory_quantity) <= 0));
    }

    return filtered;
};

exports.obtenerProductos = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const search = (req.query.search || '').trim();
        const talla = (req.query.talla || '').trim();
        const stock = (req.query.stock || '').trim();

        const tasaMXN = await getExchangeRate();

        if (shouldUseMockData()) {
            const filtered = applyMockFilters(mockProducts, search, talla, stock);
            return res.json(buildPaginatedResponse(filtered, page, limit, tasaMXN));
        }

        const skip = (page - 1) * limit;
        const productos = await Producto.find().skip(skip).limit(limit);
        const totalProductos = await Producto.countDocuments();
        const paginasTotales = Math.max(Math.ceil(totalProductos / limit), 1);

        const productosProcesados = productos.map((producto) => {
            const prodObj = producto.toObject();
            prodObj.image_principal = pickFirstImage(prodObj);

            if (typeof prodObj.price === 'number') {
                prodObj.precioMXN = Number((prodObj.price * tasaMXN).toFixed(2));
            }

            if (Array.isArray(prodObj.variants) && prodObj.variants.length > 0) {
                prodObj.tallasDisponibles = [...new Set(prodObj.variants.map((v) => v.size).filter(Boolean))];
            } else {
                prodObj.tallasDisponibles = prodObj.sizes_available || [];
            }

            return prodObj;
        });

        res.json({
            productos: productosProcesados,
            paginasTotales,
            pagination: {
                page,
                pages: paginasTotales,
                total: totalProductos,
            },
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ msg: 'Hubo un error al cargar el catalogo' });
    }
};
