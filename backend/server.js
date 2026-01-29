const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

const authRoutes = require('./routes/authRoutes'); 

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Conectar a la Base de Datos //
connectDB();

// Inicializar Express //
const app = express();

// Middlewares //
app.use(cors());
app.use(express.json()); 

app.use('/api/auth', authRoutes); 

//  Ruta de prueba /
app.get('/', (req, res) => {
    res.send('API funcionando correctamente. Listo para los endpoints.');
});

//  Arrancar el servidor //
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// ... importaciones previas
const productRoutes = require('./routes/productRoutes');

// Usar las rutas
app.use('/api/productos', productRoutes);