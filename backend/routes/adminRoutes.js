const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');

// 1. OBTENER ESTRUCTURA
router.get('/dbs', auth, adminController.obtenerBasesDeDatos);
router.get('/tablas/:dbName', auth, adminController.obtenerTablas);

// 2. LEER DATOS
router.get('/datos/:dbName/:tableName', auth, adminController.obtenerDatosTabla);

// 3. OPERACIONES CRUD (Nombres exactos de tu adminController)
router.post('/crear/:dbName/:tableName', auth, adminController.crearDatoUniversal);
router.delete('/eliminar/:dbName/:tableName/:id', auth, adminController.eliminarDatoUniversal);
router.put('/editar/:dbName/:tableName/:id', auth, adminController.editarDatoUniversal);

module.exports = router;