require('dotenv').config();

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

// 4. Importar Rutas
const authRoutes = require('./routes/authRoutes'); 
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 5. Usar Rutas de la API
app.use('/api/auth', authRoutes); 
app.use('/api/productos', productRoutes);
app.use('/api/admin', adminRoutes);

// --- RUTAS DEL FRONTEND ---

// 1. Ruta raíz: Primero definimos que al entrar a "/" cargue el login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login/login.html'));
});

// 2. Otras rutas específicas
app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/clientview/client.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/adminview/admin.html'));
});

// 3. ARCHIVOS ESTÁTICOS: Al final para que no interfiera con las rutas anteriores
app.use(express.static(path.join(__dirname, '../frontend')));

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