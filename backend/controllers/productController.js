const mongoose = require('mongoose');
const axios = require('axios');
const Producto = require('../models/Producto'); 
const mockProducts = require('../data/mockProducts');

// 1. CONFIGURACIONES Y AYUDANTES
const DEFAULT_MXN_RATE = Number(process.env.DEV_MXN_RATE || 17.2);

const normalizeSize = (value = '') => value.trim().toUpperCase();
const normalizeText = (value = '') => String(value || '').trim();

// Selecciona la mejor imagen disponible (soporta strings o listas de CSV)
const pickFirstImage = (product = {}) => {
    const directCandidates = [
        product.image_principal,
        product.imagen,
        product.imagenUrl,
    ]
        .map(normalizeText)
        .filter(Boolean);

    if (directCandidates.length > 0) return directCandidates[0];

    const rawImageSrc = normalizeText(product.image_src);
    if (!rawImageSrc) return '';

    return rawImageSrc.split(',').map(item => item.trim()).find(Boolean) || '';
};

const shouldUseMockData = () => {
    const forceMock = process.env.USE_MOCK_DATA === 'true';
    const dbConnected = mongoose.connection.readyState === 1;
    return forceMock || !dbConnected;
};

const getExchangeRate = async () => {
    if (process.env.USE_STATIC_EXCHANGE_RATE === 'true') return DEFAULT_MXN_RATE;

    try {
        const urlAPI = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`;
        const respuesta = await axios.get(urlAPI, { timeout: 7000 });
        return Number(respuesta.data?.conversion_rates?.MXN) || DEFAULT_MXN_RATE;
    } catch (error) {
        console.warn('API de moneda falló, usando respaldo.');
        return DEFAULT_MXN_RATE;
    }
};

// 2. CONTROLADOR PRINCIPAL: OBTENER PRODUCTOS
exports.obtenerProductos = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const search = (req.query.search || '').trim();
        const talla = (req.query.talla || '').trim();
        const stock = (req.query.stock || '').trim();

        const tasaMXN = await getExchangeRate();

        // Lógica para datos de prueba (Mock)
        if (shouldUseMockData()) {
            // (Aquí iría la lógica de applyMockFilters si la necesitas)
            return res.json({ msg: "Mostrando datos de prueba" });
        }

        // --- CONSTRUCCIÓN DE QUERY PARA MONGODB ---
        let query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { product_type: { $regex: search, $options: 'i' } }
            ];
        }
        if (talla) {
            query.sizes_available = talla.toUpperCase();
        }
        if (stock === 'true') {
            query['variants.inventory_quantity'] = { $gt: 0 };
        }

        const skip = (page - 1) * limit;

        // Ejecución de consulta eficiente con .lean()
        const [productos, totalProductos] = await Promise.all([
            Producto.find(query).skip(skip).limit(limit).lean(),
            Producto.countDocuments(query)
        ]);

        const paginasTotales = Math.max(Math.ceil(totalProductos / limit), 1);

        const productosProcesados = productos.map((producto) => {
            const prodObj = { ...producto };
            prodObj.image_principal = pickFirstImage(prodObj);

            // Conversión de precio a MXN usando el rango mínimo del modelo
            if (prodObj.price_range?.min) {
                prodObj.precioMXN = Number((prodObj.price_range.min * tasaMXN).toFixed(2));
            }

            // Consolidación de tallas para el frontend
            if (Array.isArray(prodObj.variants) && prodObj.variants.length > 0) {
                prodObj.tallasDisponibles = [...new Set(prodObj.variants.map((v) => v.size).filter(Boolean))];
            } else {
                prodObj.tallasDisponibles = prodObj.sizes_available || [];
            }

            return prodObj;
        });

        res.json({
            productos: productosProcesados,
            pagination: {
                page,
                pages: paginasTotales,
                total: totalProductos,
            },
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ msg: 'Error al cargar el catálogo' });
    }
};

// 3. HERRAMIENTA DE LIMPIEZA: FUSIONAR DUPLICADOS
exports.limpiarBaseDeDatos = async (req, res) => {
    try {
        const productos = await Producto.find({});
        const mapaProductos = {};
        let eliminados = 0;

        // Agrupamos por identificador único (handle o título)
        productos.forEach(p => {
            const clave = (p.handle || p.title || '').trim().toLowerCase();
            if (!clave) return;

            if (!mapaProductos[clave]) mapaProductos[clave] = [];
            mapaProductos[clave].push(p);
        });

        for (const clave in mapaProductos) {
            const grupo = mapaProductos[clave];

            if (grupo.length > 1) {
                const maestro = grupo[0];
                const nuevasVariantes = [];

                // Convertimos cada documento repetido en una variante del maestro
                grupo.forEach(item => {
                    const talla = item.sizes_available?.[0] || 'Única';
                    nuevasVariantes.push({
                        size: talla,
                        sku: `${item.handle || 'PROD'}-${talla}-${Math.random().toString(36).substring(7)}`,
                        price: item.price_range?.min || 0,
                        inventory_quantity: 10
                    });
                });

                maestro.variants = nuevasVariantes;
                
                // Al guardar, el middleware 'refreshDerived' de tu modelo 
                // actualizará automáticamente los campos sizes_available y price_range
                await maestro.save(); 

                // Eliminamos los documentos duplicados
                const idsBorrar = grupo.slice(1).map(d => d._id);
                await Producto.deleteMany({ _id: { $in: idsBorrar } });
                eliminados += idsBorrar.length;
            }
        }

        res.json({ 
            status: "success",
            msg: "Limpieza completada con éxito", 
            productos_unicos: Object.keys(mapaProductos).length,
            duplicados_eliminados: eliminados 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};