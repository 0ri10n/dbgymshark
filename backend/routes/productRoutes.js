const express = require('express');
const router = express.Router();

// 1. Importamos los controladores
const operatorCRUD = require('../controllers/operatorCRUD');
// Importamos productController que es donde pusimos la lógica de la API Externa (Axios)
const productController = require('../controllers/productController'); 

// 2. Importamos tus candados de seguridad desde tu middleware
const { auth, admin } = require('../middleware/authMiddleware');

// Rutas para /api/productos

// RUTA PÚBLICA: Catálogo con precios en MXN 
router.get('/', productController.obtenerProductos);

// RUTA PÚBLICA: Ver un solo producto
router.get('/:handle', operatorCRUD.obtenerProductoPorHandle);

// RUTAS PROTEGIDAS: Solo un 'admin' logueado puede crear, actualizar o borrar
router.post('/', auth, admin, operatorCRUD.crearProducto);
router.put('/:id', auth, admin, operatorCRUD.actualizarProducto);
router.delete('/:id', auth, admin, operatorCRUD.eliminarProducto);

// Ruta de ventas
router.post('/ventas', operatorCRUD.registrarVenta);

module.exports = router;