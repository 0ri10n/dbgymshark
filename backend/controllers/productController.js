const registrarVenta = async (req, res) => {
    const { id_venta, productos, total } = req.body;
    try {
        // 1. Insertar en tabla ventas
        await db.query('INSERT INTO ventas (id_compra, total) VALUES (?, ?)', [id_venta, total]);

        // 2. Descontar stock de cada producto
        const promesas = productos.map(p => 
            db.query('UPDATE productos SET stock = stock - 1 WHERE title = ?', [p.nombre])
        );
        await Promise.all(promesas);

        res.status(200).json({ message: "Venta registrada y stock actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
