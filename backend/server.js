const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');
//const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

// Load base env first
const rootEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
}

// In development, override with .env.development when present.
// Never auto-load local development env on Render deployments.
const isDevelopment = process.env.NODE_ENV === 'development';
const isRender = process.env.RENDER === 'true';
const devEnvPath = path.resolve(__dirname, '../.env.development');
if (isDevelopment && !isRender && fs.existsSync(devEnvPath)) {
    dotenv.config({ path: devEnvPath, override: true });
}

// Optional explicit env file override
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

// Backend setup
connectDB();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- MIDDLEWARES DE SEGURIDAD  ---
// 1. Protege las cabeceras HTTP
app.use(helmet());
// 2. Bloquea inyecciones NoSQL 
//app.use(mongoSanitize());

// --- ESCUDO ANTI-INYECCIONES NoSQL ---
app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
        const dataString = JSON.stringify(req.body);
        if (dataString.includes('"$') || dataString.includes('"$gt"')) {
            console.log("🛡️ ALERTA QA: Intento de inyección NoSQL interceptado.");
            return res.status(403).json({ exito: false, mensaje: "Ataque bloqueado." });
        }
    }
    next();
});

// API routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/admin', adminRoutes);

// Frontend (React only)
const reactDistPath = path.resolve(__dirname, '../frontend-react/dist');
const reactIndexPath = path.join(reactDistPath, 'index.html');
const shouldServeReact = fs.existsSync(reactIndexPath);

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
