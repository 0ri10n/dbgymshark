const Producto = require('../models/Productos');
const axios = require('axios');

exports.obtenerProductos = async (req, res) => {
    try {
        // 1. Paginación Dinámica
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 21;
        const skip = (page - 1) * limit;

        const productos = await Producto.find().skip(skip).limit(limit);
        const totalProductos = await Producto.countDocuments();
        const paginasTotales = Math.ceil(totalProductos / limit);

        // 2. Consultamos la API de ExchangeRate
        const urlAPI = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`;
        const respuesta = await axios.get(urlAPI);
        const tasaMXN = respuesta.data.conversion_rates.MXN;

        // 3. Inyectamos el precio MXN y ARREGLAMOS LAS TALLAS
        const productosProcesados = productos.map(producto => {
            const prodObj = producto.toObject(); 
            
            // A. Conversión de moneda
            if(prodObj.price) {
                prodObj.precioMXN = Number((prodObj.price * tasaMXN).toFixed(2));
            }

            // B. Tallas: Extraemos el "size" de cada variante y creamos un arreglo limpio
            if (prodObj.variants && prodObj.variants.length > 0) {
                 prodObj.tallasDisponibles = [...new Set(prodObj.variants.map(v => v.size).filter(Boolean))];
            } else {
                 prodObj.tallasDisponibles = prodObj.sizes_available || [];
            }
            
            return prodObj;
        });

        // 4. Enviamos al frontend
        res.json({
            productos: productosProcesados,
            paginasTotales
        });

    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ msg: "Hubo un error al cargar el catálogo" });
    }
};