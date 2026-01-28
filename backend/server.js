console.log ("Prueba de conexión")

//------------ Conexión a la base de datos ------------//

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Conectar a la Base de Datos //
connectDB();

// Inicializar Express //
const app = express();

// Middlewares //
app.use(cors());
app.use(express.json());

//  Ruta de prueba /
app.get('/', (req, res) => {
    res.send('API funcionando correctamente. Listo para los endpoints.');
});

//  Arrancar el servidor //
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});