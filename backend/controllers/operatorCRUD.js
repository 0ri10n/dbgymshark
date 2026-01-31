const mongoose = require('mongoose');

const DEFAULT_DB = process.env.PRODUCT_DB || 'DB';
const DEFAULT_COLLECTION = process.env.PRODUCT_COLLECTION || 'productos'; // usa el nombre real de tu colección

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

// 2. CREAR un documento (útil para importaciones)
exports.crearProducto = async (req, res) => {
  try {
    const collection = getCollection();
    const resultado = await collection.insertOne(req.body);
    res.status(201).json({ msg: 'Producto creado', id: resultado.insertedId });
  } catch (error) {
    res.status(400).json({ msg: 'No se pudo crear el producto', error });
  }
};

// 3. BUSCAR producto por handle (agrupado)
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

// 4. ACTUALIZAR (sobre documento plano)
exports.actualizarProducto = async (req, res) => {
  try {
    const { ObjectId } = require('mongoose').Types;
    const collection = getCollection();
    const datosActualizados = { ...req.body };
    delete datosActualizados._id;

    const producto = await collection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: datosActualizados },
      { returnDocument: 'after' }
    );
    res.json(producto);
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar' });
  }
};

// 5. ELIMINAR
exports.eliminarProducto = async (req, res) => {
  try {
    const { ObjectId } = require('mongoose').Types;
    const collection = getCollection();
    await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ msg: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar' });
  }
};
