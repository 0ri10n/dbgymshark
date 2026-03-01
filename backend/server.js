const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');
const helmet = require('helmet');
const rootEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
}



const isDevelopment = process.env.NODE_ENV === 'development';
const isRender = process.env.RENDER === 'true';
const devEnvPath = path.resolve(__dirname, '../.env.development');
if (isDevelopment && !isRender && fs.existsSync(devEnvPath)) {
    dotenv.config({ path: devEnvPath, override: true });
}


const explicitEnvFile = process.env.ENV_FILE;
if (explicitEnvFile) {
    const explicitPath = path.resolve(__dirname, `../${explicitEnvFile}`);
    if (fs.existsSync(explicitPath)) {
        dotenv.config({ path: explicitPath, override: true });
    }
}

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const app = express();

connectDB();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Middleware personalizado para detectar y bloquear inyecciones NoSQL en el body
app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
        const dataString = JSON.stringify(req.body);
        if (dataString.includes('"$') || dataString.includes('"$gt"')) {
            console.log("ALERTA QA: Intento de inyección NoSQL interceptado.");
            return res.status(403).json({ exito: false, mensaje: "Ataque bloqueado." });
        }
    }
    next();
});

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/admin', adminRoutes);

const reactDistPath = path.resolve(__dirname, '../frontend-react/dist');
const reactIndexPath = path.join(reactDistPath, 'index.html');
const shouldServeReact = fs.existsSync(reactIndexPath);

// Sirve los archivos estáticos del frontend en producción
if (shouldServeReact) {
    app.use(express.static(reactDistPath));

    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(reactIndexPath);
    });

    console.log(`Frontend: React (${reactDistPath})`);
} else {
    console.warn(`React build not found at ${reactIndexPath}. Run: npm run build:frontend`);
    app.get(/^(?!\/api).*/, (req, res) => {
        res.status(503).send('Frontend React no compilado. Ejecuta: npm run build:frontend');
    });
}

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    if (isDevelopment) {
        console.log('Entorno: development');
    }
});
