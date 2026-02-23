const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

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

module.exports = router;

router.get('/fix-db-duplicates', productController.limpiarBaseDeDatos);