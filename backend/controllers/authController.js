const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const isDevAuthBypass = () => process.env.DEV_AUTH_BYPASS === 'true';
const isDbConnected = () => mongoose.connection.readyState === 1;

const signSessionToken = ({ id, rol }) => {
    const payload = {
        usuario: {
            id,
            rol,
        },
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
};

const resolveDevUserRole = (email, password) => {
    const adminEmail = String(process.env.DEV_ADMIN_EMAIL || '').toLowerCase();
    const adminPassword = String(process.env.DEV_ADMIN_PASSWORD || '');
    const clientEmail = String(process.env.DEV_CLIENT_EMAIL || '').toLowerCase();
    const clientPassword = String(process.env.DEV_CLIENT_PASSWORD || '');

    const normalizedEmail = String(email || '').toLowerCase();

    if (!adminEmail || !adminPassword || !clientEmail || !clientPassword) {
        return null;
    }

    if (normalizedEmail === adminEmail && password === adminPassword) {
        return { role: 'admin', id: 'dev-admin' };
    }

    if (normalizedEmail === clientEmail && password === clientPassword) {
        return { role: 'cliente', id: 'dev-client' };
    }

    return null;
};

exports.registrarUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, password } = req.body;

        if (isDevAuthBypass()) {
            const role = 'cliente';
            const token = signSessionToken({ id: `dev-reg-${Date.now()}`, rol: role });
            return res.json({ token, role, nombre, apellido, email });
        }

        if (!isDbConnected()) {
            return res.status(503).json({ msg: 'Servicio de autenticacion no disponible temporalmente' });
        }

        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        usuario = new Usuario(req.body);

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);

        await usuario.save();

        const token = signSessionToken({ id: usuario.id, rol: usuario.rol });
        return res.json({ token, role: usuario.rol });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Hubo un error en el registro');
    }
};

exports.iniciarSesion = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (isDevAuthBypass()) {
            const devUser = resolveDevUserRole(email, password);

            if (!devUser) {
                return res.status(400).json({ msg: 'Credenciales invalidas para entorno de desarrollo' });
            }

            const token = signSessionToken({ id: devUser.id, rol: devUser.role });
            return res.json({ token, role: devUser.role });
        }

        if (!isDbConnected()) {
            return res.status(503).json({ msg: 'Servicio de autenticacion no disponible temporalmente' });
        }

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ msg: 'El usuario no existe' });
        }

        const passCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passCorrecto) {
            return res.status(400).json({ msg: 'Contrasena incorrecta' });
        }

        const token = signSessionToken({ id: usuario.id, rol: usuario.rol });
        return res.json({ token, role: usuario.rol });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Hubo un error en el login');
    }
};
