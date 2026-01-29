const Product = require ('../models/Productos');

// 1. OBTENER todos los productos (READ)
exports.obtenerProductos = async (req, res) => {
    try {
        const productos = await Product.find().limit(20); // Limitamos a 20 para no saturar
        res.json(productos);
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al obtener los productos' });
    }
};

// 2. CREAR un nuevo producto (CREATE)
exports.crearProducto = async (req, res) => {
    try {
        const nuevoProducto = new Product(req.body);
        await nuevoProducto.save();
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(400).json({ msg: 'No se pudo crear el producto', error });
    }
};

// 3. BUSCAR producto por su Handle (URL)
exports.obtenerProductoPorHandle = async (req, res) => {
    try {
        const producto = await Product.findOne({ handle: req.params.handle });
        if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// 4. ACTUALIZAR un producto (UPDATE)
exports.actualizarProducto = async (req, res) => {
    try {
        const producto = await Product.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true } // Para que devuelva el producto ya editado
        );
        res.json(producto);
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar' });
    }
};

// 5. ELIMINAR un producto (DELETE)
exports.eliminarProducto = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar' });
    }
};