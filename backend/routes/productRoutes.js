const express = require('express');
const router = express.Router();
const operatorCRUD = require('../controllers/operatorCRUD');

// Rutas para /api/productos
router.get('/', operatorCRUD.obtenerProductos);
router.post('/', operatorCRUD.crearProducto);
router.get('/:handle', operatorCRUD.obtenerProductoPorHandle);
router.put('/:id', operatorCRUD.actualizarProducto);
router.delete('/:id', operatorCRUD.eliminarProducto);
router.post('/ventas', operatorCRUD.registrarVenta);
module.exports = router;
