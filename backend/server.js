const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load base env first
const rootEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
}

// In development, override with .env.development when present
const isDevelopment = process.env.NODE_ENV === 'development';
const devEnvPath = path.resolve(__dirname, '../.env.development');
if (isDevelopment && fs.existsSync(devEnvPath)) {
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

// API routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/admin', adminRoutes);

// Frontend selection
const frontendTarget = (process.env.FRONTEND_TARGET || 'react').toLowerCase();
const reactDistPath = path.resolve(__dirname, '../frontend-react/dist');
const legacyFrontendPath = path.resolve(__dirname, '../frontend');
const reactIndexPath = path.join(reactDistPath, 'index.html');
const shouldServeReact = frontendTarget === 'react' && fs.existsSync(reactIndexPath);

if (shouldServeReact) {
    app.use(express.static(reactDistPath));

    // Legacy frontend available under /legacy for compatibility
    app.use('/legacy', express.static(legacyFrontendPath));

    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(reactIndexPath);
    });

    console.log(`Frontend target: React (${reactDistPath})`);
} else {
    app.get('/', (req, res) => {
        res.sendFile(path.join(legacyFrontendPath, 'login/login.html'));
    });

    app.get('/store', (req, res) => {
        res.sendFile(path.join(legacyFrontendPath, 'clientview/client.html'));
    });

    app.get('/admin', (req, res) => {
        res.sendFile(path.join(legacyFrontendPath, 'adminview/admin.html'));
    });

    app.use(express.static(legacyFrontendPath));

    app.use((req, res) => {
        res.status(404).send('Pagina no encontrada');
    });

    console.warn('Frontend target: Legacy HTML/CSS/JS');
    if (frontendTarget === 'react') {
        console.warn(`React build not found at ${reactIndexPath}. Run: npm run build:frontend`);
    }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    if (isDevelopment) {
        console.log('Entorno: development');
    }
});
