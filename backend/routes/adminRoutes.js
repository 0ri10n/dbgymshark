const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, admin } = require('../middleware/authMiddleware');

// --- Rutas de Administración de Bases de Datos ---
router.get('/dbs', auth, admin, adminController.obtenerBasesDeDatos);
router.get('/tablas/:dbName', auth, admin, adminController.obtenerTablas);
router.get('/datos/:dbName/:tableName', auth, admin, adminController.obtenerDatosTabla);

// --- Operaciones CRUD Universales ---
router.post('/crear/:dbName/:tableName', auth, admin, adminController.crearDatoUniversal);
router.delete('/eliminar/:dbName/:tableName/:id', auth, admin, adminController.eliminarDatoUniversal);
router.put('/editar/:dbName/:tableName/:id', auth, admin, adminController.editarDatoUniversal);

// --- PANEL DE CONTROL: Usuarios ---
router.get('/panel/usuarios', auth, admin, adminController.obtenerUsuariosPanel);
router.post('/panel/usuarios', auth, admin, adminController.crearUsuarioPanel);
router.put('/panel/usuarios/:id', auth, admin, adminController.actualizarUsuarioPanel);
router.delete('/panel/usuarios/:id', auth, admin, adminController.eliminarUsuarioPanel);

// --- PANEL DE CONTROL: Ventas ---
// Solo el administrador puede ver el historial de ventas
router.get('/panel/ventas', auth, admin, adminController.obtenerVentasPanel);

// CUALQUIER USUARIO LOGUEADO (Cliente o Admin) puede crear una venta
// Se quita el middleware 'admin' de esta ruta para evitar el error 403 al comprar
router.post('/panel/ventas', auth, adminController.crearVentaPanel);

// EL EXPORT SIEMPRE VA AL FINAL
module.exports = router;