const Producto = require('../models/Productos');
const axios = require('axios');

exports.obtenerProductos = async (req, res) => {
    try {
        // 1. Obtenemos el catálogo desde MongoDB
        const productos = await Producto.find();

        // 2. Consultamos la API de ExchangeRate usando tu variable de entorno segura
        const urlAPI = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`;
        const respuesta = await axios.get(urlAPI);
        
        // 3. Extraemos a cuánto está el peso mexicano (MXN) hoy
        const tasaMXN = respuesta.data.conversion_rates.MXN;

        // 4. Inyectamos el precio convertido a cada producto
        const productosConPrecioMXN = productos.map(producto => {
            const prodObj = producto.toObject(); 
            
            // Calculamos el precio en pesos mexicanos
            if(prodObj.precio) {
                prodObj.precioMXN = Number((prodObj.precio * tasaMXN).toFixed(2));
            }
            
            return prodObj;
        });

        // 5. Enviamos el catálogo enriquecido a Megan (Frontend)
        res.json(productosConPrecioMXN);

    } catch (error) {
        console.error("Error al obtener productos o convertir moneda:", error);
        res.status(500).json({ msg: "Hubo un error al cargar el catálogo" });
    }
};