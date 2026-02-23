const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// --- UTILIDADES DE AUTH ---
const isDevAuthBypass = () => process.env.DEV_AUTH_BYPASS === 'true';
const isDbConnected = () => mongoose.connection.readyState === 1;

const signSessionToken = ({ id, rol }) => {
    const payload = { usuario: { id, rol } };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
};

const resolveDevUserRole = (email, password) => {
    const adminEmail = String(process.env.DEV_ADMIN_EMAIL || '').toLowerCase();
    const adminPassword = String(process.env.DEV_ADMIN_PASSWORD || '');
    const clientEmail = String(process.env.DEV_CLIENT_EMAIL || '').toLowerCase();
    const clientPassword = String(process.env.DEV_CLIENT_PASSWORD || '');
    const normalizedEmail = String(email || '').toLowerCase();

    if (normalizedEmail === adminEmail && password === adminPassword) return { role: 'admin', id: 'dev-admin' };
    if (normalizedEmail === clientEmail && password === clientPassword) return { role: 'cliente', id: 'dev-client' };
    return null;
};

// --- CONTROLADORES DE AUTH ---
exports.registrarUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, password } = req.body;
        if (isDevAuthBypass()) {
            const token = signSessionToken({ id: `dev-reg-${Date.now()}`, rol: 'cliente' });
            return res.json({ token, role: 'cliente', nombre, apellido, email });
        }
        let usuario = await Usuario.findOne({ email });
        if (usuario) return res.status(400).json({ msg: 'El usuario ya existe' });
        
        usuario = new Usuario(req.body);
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);
        await usuario.save();

        const token = signSessionToken({ id: usuario.id, rol: usuario.rol });
        return res.json({ token, role: usuario.rol });
    } catch (error) {
        res.status(500).send('Error en registro');
    }
};

exports.iniciarSesion = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (isDevAuthBypass()) {
            const devUser = resolveDevUserRole(email, password);
            if (!devUser) return res.status(400).json({ msg: 'Credenciales inválidas (Dev)' });
            const token = signSessionToken({ id: devUser.id, rol: devUser.role });
            return res.json({ token, role: devUser.role });
        }
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(400).json({ msg: 'El usuario no existe' });
        
        const passCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passCorrecto) return res.status(400).json({ msg: 'Contraseña incorrecta' });

        const token = signSessionToken({ id: usuario.id, rol: usuario.rol });
        return res.json({ token, role: usuario.rol });
    } catch (error) {
        res.status(500).send('Error en login');
    }
};

// --- CONTROLADORES ADMINISTRATIVOS (Requeridos por adminRoutes.js) ---

exports.obtenerBasesDeDatos = async (req, res) => {
    try {
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        res.json(dbs.databases);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener bases de datos' });
    }
};

exports.obtenerTablas = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.json(collections.map(c => c.name));
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener tablas' });
    }
};

exports.obtenerDatosTabla = async (req, res) => {
    try {
        const { tableName } = req.params;
        const datos = await mongoose.connection.db.collection(tableName).find().toArray();
        res.json(datos);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener datos' });
    }
};

// Funciones CRUD Universales para MAKIA
exports.crearDatoUniversal = async (req, res) => {
    try {
        const { tableName } = req.params;
        const nuevoDato = await mongoose.connection.db.collection(tableName).insertOne(req.body);
        res.json(nuevoDato);
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear' });
    }
};

exports.eliminarDatoUniversal = async (req, res) => {
    try {
        const { tableName, id } = req.params;
        await mongoose.connection.db.collection(tableName).deleteOne({ _id: new mongoose.Types.ObjectId(id) });
        res.json({ msg: 'Eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar' });
    }
};

exports.editarDatoUniversal = async (req, res) => {
    try {
        const { tableName, id } = req.params;
        await mongoose.connection.db.collection(tableName).updateOne(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: req.body }
        );
        res.json({ msg: 'Editado con éxito' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al editar' });
    }
};