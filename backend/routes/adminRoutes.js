const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Eliminamos la importación de productController ya que la limpieza
// ahora se hace directamente desde los Playgrounds de VS Code.

// Agregamos las llaves { } para extraer exactamente las funciones
const { auth, admin } = require('../middleware/authMiddleware');

// --- Rutas de Administración ---

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

router.get('/panel/usuarios', auth, admin, adminController.obtenerUsuariosPanel);
router.post('/panel/usuarios', auth, admin, adminController.crearUsuarioPanel);
router.put('/panel/usuarios/:id', auth, admin, adminController.actualizarUsuarioPanel);
router.delete('/panel/usuarios/:id', auth, admin, adminController.eliminarUsuarioPanel);


router.get('/panel/ventas', auth, admin, adminController.obtenerVentasPanel);