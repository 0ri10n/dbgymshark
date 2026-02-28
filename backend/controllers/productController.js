const Producto = require('../models/Productos');
const Usuario = require('../models/Usuario'); // Asegúrate de que el nombre coincida con tu archivo
const Venta = require('../models/Venta');     // Asegúrate de que el nombre coincida con tu archivo
const axios = require('axios');

// --- UTILIDAD: OBTENER TASA DE CAMBIO ---
const getExchangeRate = async () => {
    try {
        const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`;
        const res = await axios.get(url, { timeout: 5000 });
        return res.data.conversion_rates.MXN || 18.5;
    } catch (error) {
        return 18.5;
    }
};

// --- OBTENER PRODUCTOS (CATÁLOGO Y PANEL) ---
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
            pagination: { 
                page, 
                pages: Math.ceil(total / limit), 
                total 
            } 
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener productos' });
    }
};

// --- OBTENER DATOS DEL PANEL (USUARIOS Y VENTAS) ---
// Este endpoint responde a la ruta: /api/admin/panel/:vista
exports.obtenerDatosPanel = async (req, res) => {
    try {
        const { vista } = req.params; // Captura 'usuarios' o 'ventas' desde la URL
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        let filtro = {};
        const regex = { $regex: search, $options: 'i' };

        // Definimos el filtro según la vista seleccionada
        if (vista === 'usuarios') {
            if (search) {
                filtro = {
                    $or: [
                        { nombre: regex },
                        { apellido: regex },
                        { email: regex }
                    ]
                };
            }
            
            const [usuarios, total] = await Promise.all([
                Usuario.find(filtro).select('-password').skip((page - 1) * limit).limit(limit).lean(),
                Usuario.countDocuments(filtro)
            ]);

            return res.json({
                usuarios,
                pagination: { page, pages: Math.ceil(total / limit), total }
            });

        } else if (vista === 'ventas') {
            if (search) {
                filtro = {
                    $or: [
                        { numeroOrden: regex },
                        { "usuario.nombre": regex }
                    ]
                };
            }

            const [ventas, total] = await Promise.all([
                Venta.find(filtro).skip((page - 1) * limit).limit(limit).lean(),
                Venta.countDocuments(filtro)
            ]);

            return res.json({
                ventas,
                pagination: { page, pages: Math.ceil(total / limit), total }
            });
        }

        res.status(400).json({ msg: 'Vista no válida' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener datos del panel' });
    }
};

// --- CREAR PRODUCTO ---
exports.crearProducto = async (req, res) => {
    try {
        const nuevoProducto = new Producto(req.body);
        await nuevoProducto.save();
        res.json({ msg: "Producto creado correctamente", producto: nuevoProducto });
    } catch (error) {
        res.status(400).json({ msg: "Error al crear producto", error: error.message });
    }
};

// --- ACTUALIZAR PRODUCTO ---
exports.actualizarProducto = async (req, res) => {
    try {
        const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ msg: "Producto actualizado", producto });
    } catch (error) {
        res.status(400).json({ msg: "Error al actualizar" });
    }
};

// --- ELIMINAR PRODUCTO ---
exports.eliminarProducto = async (req, res) => {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.json({ msg: "Producto eliminado" });
    } catch (error) {
        res.status(400).json({ msg: "Error al eliminar" });
    }
};