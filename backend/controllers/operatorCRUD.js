const mongoose = require('mongoose');
const Producto = require('../models/Productos');

const DEFAULT_DB = process.env.PRODUCT_DB || 'DB';
const DEFAULT_COLLECTION = process.env.PRODUCT_COLLECTION || 'productos'; 

// Helpers
const getCollection = () => mongoose.connection.client.db(DEFAULT_DB).collection(DEFAULT_COLLECTION);
const mapProducto = (p) => ({
  ...p,
  nombre: p.nombre || p.title || p.product_name,
  precio: p.precio ?? p.price ?? p.Price,
  imagenUrl: p.imagenUrl || p.image_src || p.image_principal || p['Image URL'],
});

// 1. OBTENER productos con agregación (agrupa variantes y pagina)
exports.obtenerProductos = async (req, res) => {
  try {
    const collection = getCollection();
    const { talla, search, stock, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [];

    // MATCH temprano para aprovechar índices
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

    // GROUP por handle (fallback a title)
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

    // MATCH posterior (talla y stock)
    const postMatch = {};
    if (talla && talla.trim()) postMatch.tallas_disponibles = talla.trim();
    if (stock === 'true') postMatch.totalInventory = { $gt: 0 };
    if (stock === 'false') postMatch.totalInventory = { $lte: 0 };
    if (Object.keys(postMatch).length) pipeline.push({ $match: postMatch });

    // FACET para paginación
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limitNum }],
      },
    });

    const agg = await collection.aggregate(pipeline).toArray();
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
    const { handle } = req.body;

 
    if (!handle) {
      return res.status(400).json({ msg: 'El handle (URL amigable) es obligatorio.' });
    }

    const productoExistente = await Producto.findOne({ handle: handle });
    if (productoExistente) {
      return res.status(400).json({ msg: 'Ya existe un producto con este handle. Elige uno distinto.' });
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
  const { id_venta, productos, total } = req.body;

  try {
    const db = mongoose.connection.client.db('DB'); 
    const ventasCollection = db.collection('ventas');
    const productosCollection = getCollection();

    const nuevaVenta = {
      id_compra: id_venta,
      total: total,
      detalle: productos.map(p => p.nombre).join(', '),
      fecha: new Date()
    };
    
    await ventasCollection.insertOne(nuevaVenta);

    const promesasActualizacion = productos.map(p => {
      return productosCollection.updateOne(
        { 
          $or: [{ title: p.nombre }, { nombre: p.nombre }], 
          inventory_quantity: { $gt: 0 } 
        },
        { $inc: { inventory_quantity: -1 } }
      );
    });

    const resultados = await Promise.all(promesasActualizacion);
    
    const ventasFallidas = resultados.filter(r => r.modifiedCount === 0);
    
    if (ventasFallidas.length > 0) {
        console.warn(`Atención: ${ventasFallidas.length} productos no pudieron descontar stock.`);
    }

    res.status(200).json({ 
      msg: 'Venta procesada', 
      id_compra: id_venta 
    });

  } catch (error) {
    res.status(500).json({ msg: 'Error fatal en el servidor', error: error.message });
  }
};
