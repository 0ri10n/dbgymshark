const Venta = require('../models/Venta');

exports.crearVenta = async (req, res) => {
    try {
        const { nombreCliente, productos, total } = req.body;

        // Validación básica
        if (!nombreCliente || !productos || productos.length === 0) {
            return res.status(400).json({ msg: "Faltan datos obligatorios para la venta." });
        }

        const nuevaVenta = new Venta({
            nombreCliente,
            productos,
            total,
            fechaPedido: new Date()
        });

        await nuevaVenta.save();
        res.status(201).json({ msg: "Venta registrada con éxito", venta: nuevaVenta });
    } catch (error) {
        console.error("Error al guardar venta:", error);
        res.status(500).send("Error interno del servidor al procesar la venta.");
    }
};