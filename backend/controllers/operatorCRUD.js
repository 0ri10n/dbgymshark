const mongoose = require('mongoose');
const Producto = require('../models/Productos');
const Venta = require('../models/Venta');
const mapProducto = (p) => ({
  ...p,
  nombre: p.nombre || p.title || p.product_name,
  precio: p.precio ?? p.price ?? p.Price,
  imagenUrl: p.imagenUrl || p.image_src || p.image_principal || p['Image URL'],
});


exports.obtenerProductos = async (req, res) => {
  try {
    const { talla, search, stock, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [];

    
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { title: regex },
            { nombre: regex },
            { product_name: regex },
            { handle: regex },
            { vendor: regex },
            { tags: regex },
          ],
        },
      });
    }


    pipeline.push({
      $group: {
        _id: { $ifNull: ['$handle', '$title'] },
        handle: { $first: '$handle' },
        title: { $first: '$title' },
        nombre: { $first: '$nombre' },
        price: { $first: '$price' },
        precio: { $first: '$precio' },
        image_src: { $first: '$image_src' },
        imagenUrl: { $first: '$imagenUrl' },
        image_principal: { $first: '$image_principal' },
        vendor: { $first: '$vendor' },
        tags: { $first: '$tags' },
        variantes: {
          $push: {
            talla: '$variant_title',
            sku: '$sku',
            id: '$_id',
            inventory: '$inventory_quantity',
          },
        },
        tallas_disponibles: { $addToSet: '$variant_title' },
        totalInventory: { $sum: '$inventory_quantity' },
      },
    });


    const postMatch = {};
    if (talla && talla.trim()) postMatch.tallas_disponibles = talla.trim();
    if (stock === 'true') postMatch.totalInventory = { $gt: 0 };
    if (stock === 'false') postMatch.totalInventory = { $lte: 0 };
    if (Object.keys(postMatch).length) pipeline.push({ $match: postMatch });

  
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limitNum }],
      },
    });


    const agg = await Producto.aggregate(pipeline);
    
    const facet = agg[0] || { metadata: [], data: [] };
    const total = facet.metadata[0]?.total || 0;
    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const productos = facet.data.map(mapProducto);

    res.json({
      productos,
      pagination: {
        page: pageNum,
        pages,
        total,
      },
    });
  } catch (error) {
    console.error('Error en obtenerProductos (pipeline):', error);
    res.status(500).json({ msg: 'Hubo un error al obtener los productos' });
  }
};

exports.crearProducto = async (req, res) => {
  try {
    let { handle, title } = req.body;

    // Si por alguna razón no llega el handle, el backend lo rescata creándolo
    if (!handle && title) {
        handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        req.body.handle = handle;
    }

    if (!handle) {
      return res.status(400).json({ msg: 'El título es obligatorio para generar el producto.' });
    }


    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();

    res.status(201).json({ msg: 'Producto creado exitosamente', id: nuevoProducto._id });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(400).json({ msg: 'No se pudo crear el producto', error: error.message });
  }
};


exports.obtenerProductoPorHandle = async (req, res) => {
  try {
    const collection = getCollection();
    const handle = req.params.handle;

    const doc = await collection
      .aggregate([
        { $match: { handle } },
        {
          $group: {
            _id: '$handle',
            handle: { $first: '$handle' },
            title: { $first: '$title' },
            nombre: { $first: '$nombre' },
            price: { $first: '$price' },
            precio: { $first: '$precio' },
            image_src: { $first: '$image_src' },
            imagenUrl: { $first: '$imagenUrl' },
            image_principal: { $first: '$image_principal' },
            vendor: { $first: '$vendor' },
            tags: { $first: '$tags' },
            variantes: {
              $push: {
                talla: '$variant_title',
                sku: '$sku',
                id: '$_id',
                inventory: '$inventory_quantity',
              },
            },
            tallas_disponibles: { $addToSet: '$variant_title' },
            totalInventory: { $sum: '$inventory_quantity' },
          },
        },
        { $limit: 1 },
      ])
      .toArray();

    if (!doc.length) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.json(mapProducto(doc[0]));
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};


exports.actualizarProducto = async (req, res) => {
  try {
    const datosActualizados = { ...req.body };
    delete datosActualizados._id;

    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    Object.assign(producto, datosActualizados);
    
    await producto.save(); 

    res.json({ msg: 'Producto actualizado correctamente', producto });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ msg: 'Error al actualizar', error: error.message });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    // Usamos directamente el modelo de Mongoose
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);

    if (!productoEliminado) {
      return res.status(404).json({ msg: 'Producto no encontrado o ya fue eliminado' });
    }

    res.json({ msg: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ msg: 'Error al eliminar', error: error.message });
  }
};

exports.registrarVenta = async (req, res) => {
    try {
        // 1. Recibimos los datos exactos que manda tu Catalogo.jsx
        const { usuario, productos, total } = req.body;

        // 2. Traducimos el carrito al formato de nuestro Modelo Venta.js
        const productosFormateados = productos.map(item => ({
            nombre: item.titulo,
            talla: item.talla || 'N/A',
            color: item.color || 'N/A',
            precio: item.precioUnitario,
            cantidad: item.cantidad
        }));

        // 3. Armamos el paquete final
        const nuevaVenta = new Venta({
            nombreCliente: usuario,
            productos: productosFormateados,
            total: total
        });

        // 4. Guardamos en la base de datos
        await nuevaVenta.save();
        
        // 5. Respondemos al frontend que todo salió perfecto
        res.status(201).json({ msg: 'Venta registrada con éxito', orden: nuevaVenta.numeroOrden });

    } catch (error) {
        console.error("Error al procesar la venta:", error);
        res.status(500).json({ mensaje: 'Error interno al registrar la venta', detalle: error.message });
    }
};
