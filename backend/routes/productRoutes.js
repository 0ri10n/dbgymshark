const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rutas para /api/productos
router.get('/', productController.obtenerProductos);
router.post('/', productController.crearProducto);
router.get('/:handle', productController.obtenerProductoPorHandle);
router.put('/:id', productController.actualizarProducto);
router.delete('/:id', productController.eliminarProducto);

module.exports = router;