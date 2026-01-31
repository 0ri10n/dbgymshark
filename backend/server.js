const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// 1. Configuración de Entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Conectar a la Base de Datos
connectDB();

const app = express();

// 3. Middlewares Globales
app.use(cors());
app.use(express.json());

// 4. Servir archivos estáticos del frontend (VITAL para el CSS/JS)
app.use(express.static(path.join(__dirname, '../frontend')));

// 5. Importar y Usar Rutas de la API
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 6. RUTAS PARA CARGAR TUS PÁGINAS HTML
// Esta es la ruta principal: https://dbgymshark.onrender.com/
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/login/login.html'));
});

// Ruta para la página de administrador
app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/adminview/admin.html'));
});

// Ruta para la página de registro
app.get('/registro', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/registro/registro.html'));
});

// 7. Arrancar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
