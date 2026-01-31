const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// 1. Configuración de Entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Conectar a la Base de Datos
connectDB();

// 3. Inicializar Express
const app = express();

// 4. Middlewares Globales
app.use(cors());
app.use(express.json());

// --- NUEVO: Servir archivos estáticos ---
// Esto permite que se carguen tus CSS, JS e imágenes de la carpeta frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 5. Importar Rutas
const authRoutes = require('./routes/authRoutes'); 
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 6. Usar Rutas de la API
app.use('/api/auth', authRoutes); 
app.use('/api/productos', productRoutes);
app.use('/api/admin', adminRoutes);

// --- CORRECCIÓN: Rutas para el Frontend ---
// Esta ruta sustituye a la "Ruta de prueba" antigua
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/login/login.html'));
});

// Ruta para entrar directo a admin (https://dbgymshark.onrender.com/admin)
app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/adminview/admin.html'));
});

// 8. Arrancar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
