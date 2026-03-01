const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, admin } = require('../middleware/authMiddleware');

router.get('/dbs', auth, admin, adminController.obtenerBasesDeDatos);
router.get('/tablas/:dbName', auth, admin, adminController.obtenerTablas);
router.get('/datos/:dbName/:tableName', auth, admin, adminController.obtenerDatosTabla);

router.post('/crear/:dbName/:tableName', auth, admin, adminController.crearDatoUniversal);
router.delete('/eliminar/:dbName/:tableName/:id', auth, admin, adminController.eliminarDatoUniversal);
router.put('/editar/:dbName/:tableName/:id', auth, admin, adminController.editarDatoUniversal);

router.get('/panel/usuarios', auth, admin, adminController.obtenerUsuariosPanel);
router.post('/panel/usuarios', auth, admin, adminController.crearUsuarioPanel);
router.put('/panel/usuarios/:id', auth, admin, adminController.actualizarUsuarioPanel);
router.delete('/panel/usuarios/:id', auth, admin, adminController.eliminarUsuarioPanel);

router.get('/panel/ventas', auth, admin, adminController.obtenerVentasPanel);

// Permite a cualquier usuario logueado crear una venta (sin requerir rol admin)
router.post('/panel/ventas', auth, adminController.crearVentaPanel);

module.exports = router;