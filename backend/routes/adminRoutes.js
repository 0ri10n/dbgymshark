const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware'); // Proteger la ruta

router.get('/dbs', auth, adminController.obtenerBasesDeDatos);
router.get('/tablas/:dbName', auth, adminController.obtenerTablas);

module.exports = router;