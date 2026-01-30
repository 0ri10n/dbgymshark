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

// 4. Middlewares Globales (IMPORTANTE: Primero estos)
app.use(cors());
app.use(express.json()); 

// 5. Importar Rutas
const authRoutes = require('./routes/authRoutes'); 
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Asegúrate que este archivo esté guardado sin errores

// 6. Usar Rutas
app.use('/api/auth', authRoutes); 
app.use('/api/productos', productRoutes);
app.use('/api/admin', adminRoutes);

// 7. Ruta de prueba
app.get('/', (req, res) => {
    res.send('API funcionando correctamente.');
});

// 8. Arrancar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
 HEAD
});


 origin/feature/auth-kevin
