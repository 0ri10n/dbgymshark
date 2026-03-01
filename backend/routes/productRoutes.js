const express = require('express');
const router = express.Router();

const operatorCRUD = require('../controllers/operatorCRUD');
const productController = require('../controllers/productController'); 

const { auth, admin } = require('../middleware/authMiddleware');
const { validarProducto } = require('../middleware/validarDatos');

router.get('/', productController.obtenerProductos);
router.get('/:handle', operatorCRUD.obtenerProductoPorHandle);

router.post('/', auth, admin, validarProducto, operatorCRUD.crearProducto);
router.put('/:id', auth, admin, validarProducto, operatorCRUD.actualizarProducto);
router.delete('/:id', auth, admin, operatorCRUD.eliminarProducto);

router.post('/ventas', auth, operatorCRUD.registrarVenta);

module.exports = router;
