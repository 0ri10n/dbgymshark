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

// --- SERVIR ARCHIVOS ESTÁTICOS ---
// Usamos path.join para evitar errores de barras diagonales entre Windows y Linux
app.use(express.static(path.join(__dirname, '../frontend')));

// 4. Importar Rutas
const authRoutes = require('./routes/authRoutes'); 
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 5. Usar Rutas de la API
app.use('/api/auth', authRoutes); 
app.use('/api/productos', productRoutes);
app.use('/api/admin', adminRoutes);

// --- RUTAS DEL FRONTEND ---

// Ruta raíz: Envía al login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login/login.html'));
});

// Ruta de la tienda (Cliente)
app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/clientview/client.html'));
});

// Ruta del Panel de Administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/adminview/admin.html'));
});

// --- MANEJO DE ERRORES 404 (Opcional pero recomendado) ---
// Si alguien busca una ruta que no existe, le mandamos al login o una página 404
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// 6. Arrancar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`Frontend servido desde: ${path.join(__dirname, '../frontend')}`);
});