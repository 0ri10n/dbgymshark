const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// 1. Configuración de Entorno
// Buscamos el archivo .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Conectar a la Base de Datos
connectDB();

const app = express();

// 3. Middlewares Globales
app.use(cors());
app.use(express.json());

// 4. Servir archivos estáticos del Frontend
// Esto permite que el navegador encuentre los CSS y JS dentro de las subcarpetas de 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// 5. Importar Rutas de la API
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 6. Usar Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/admin', adminRoutes);

// ---------------------------------------------------------
// 7. Rutas para servir los archivos HTML del FRONTEND
// ---------------------------------------------------------

// Página principal: Login
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/login/login.html'));
});

// Página de Registro
app.get('/registro', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/registro/registro.html'));
});

// Vista de Administrador
app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/adminview/admin.html'));
});

// Vista de Cliente
app.get('/client', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/clientview/client.html'));
});

// 8. Arrancar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log('Servidor corriendo en el puerto ${PORT}');
});