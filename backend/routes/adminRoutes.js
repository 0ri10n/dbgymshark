const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// 1. IMPORTAMOS el controlador de productos para la limpieza
const productController = require('../controllers/productController');

// Agregamos las llaves { } para extraer exactamente las funciones
const { auth, admin } = require('../middleware/authMiddleware');

// Rutas de Administración 

// 1. OBTENER ESTRUCTURA
router.get('/dbs', auth, admin, adminController.obtenerBasesDeDatos);
router.get('/tablas/:dbName', auth, admin, adminController.obtenerTablas);

// 2. LEER DATOS
router.get('/datos/:dbName/:tableName', auth, admin, adminController.obtenerDatosTabla);

// 3. OPERACIONES CRUD 
router.post('/crear/:dbName/:tableName', auth, admin, adminController.crearDatoUniversal);
router.delete('/eliminar/:dbName/:tableName/:id', auth, admin, adminController.eliminarDatoUniversal);
router.put('/editar/:dbName/:tableName/:id', auth, admin, adminController.editarDatoUniversal);

// 2. RUTA DE LIMPIEZA (La moví arriba del export para que funcione)
// Nota: La dejamos sin 'auth' temporalmente para que puedas ejecutarla directo en el navegador
router.get('/fix-db-duplicates', productController.limpiarBaseDeDatos);

module.exports = router;