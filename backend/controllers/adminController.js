const mongoose = require('mongoose');
const Product = require('../models/Productos');
const Usuario = require('../models/Usuario');
const Venta = require('../models/Venta');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongoose').Types;

// --- FUNCIÓN 1: Listar DBs ---
exports.obtenerBasesDeDatos = async (req, res) => {
    try {
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        const nombres = dbs.databases
            .map(db => db.name)
            .filter(n => n !== 'admin' && n !== 'local' && n !== 'config');
        res.json(nombres);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener DBs' });
    }
};

// --- FUNCIÓN 2: Listar Tablas ---
exports.obtenerTablas = async (req, res) => {
    try {
        const { dbName } = req.params;
        const db = mongoose.connection.client.db(dbName);
        const collections = await db.listCollections().toArray();
        res.json(collections.map(c => c.name));
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener tablas' });
    }
};

// --- FUNCIÓN 3: Obtener Datos Genéricos con Paginación ---
exports.obtenerDatosTabla = async (req, res) => {
    try {
        const { dbName, tableName } = req.params;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
        const skip = (page - 1) * limit;

        const db = mongoose.connection.client.db(dbName);
        const collection = db.collection(tableName);

        const [datos, totalDocs] = await Promise.all([
            collection.find({}).skip(skip).limit(limit).toArray(),
            collection.countDocuments({})
        ]);

        const totalPages = Math.max(Math.ceil(totalDocs / limit), 1);

        res.json({ data: datos, totalDocs, totalPages, page, limit });
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener datos' });
    }
};

// --- OBTENER USUARIOS PANEL (Corregido para Frontend) ---
exports.obtenerUsuariosPanel = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let filtro = {};
        if (search) {
            filtro = {
                $or: [
                    { nombre: { $regex: search, $options: 'i' } },
                    { apellido: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const [usuarios, total] = await Promise.all([
            Usuario.find(filtro).select('-password').sort({ registro: -1 }).skip(skip).limit(limit).lean(),
            Usuario.countDocuments(filtro)
        ]);

        res.json({
            usuarios,
            pagination: { page, pages: Math.ceil(total / limit), total }
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error al cargar usuarios' });
    }
};

// --- OBTENER VENTAS PANEL (Corregido para Frontend) ---
exports.obtenerVentasPanel = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let filtro = {};
        if (search) {
            filtro = {
                $or: [
                    { numeroOrden: { $regex: search, $options: 'i' } },
                    { "usuario.nombre": { $regex: search, $options: 'i' } }
                ]
            };
        }

        const [ventas, total] = await Promise.all([
            Venta.find(filtro).sort({ fecha: -1 }).skip(skip).limit(limit).lean(),
            Venta.countDocuments(filtro)
        ]);

        res.json({
            ventas,
            pagination: { page, pages: Math.ceil(total / limit), total }
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error al cargar ventas' });
    }
};

// --- OPERACIONES CRUD USUARIOS ---
exports.crearUsuarioPanel = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol, direccion } = req.body;
        if (!nombre || !email || !password) return res.status(400).json({ msg: 'Faltan campos obligatorios' });
        
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);
        
        const nuevoUsuario = new Usuario({ nombre, apellido, email, password: passwordEncriptada, rol, direccion });
        await nuevoUsuario.save();
        res.status(201).json({ msg: 'Usuario creado', usuario: nuevoUsuario });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear usuario' });
    }
};

exports.actualizarUsuarioPanel = async (req, res) => {
    try {
        const { nombre, apellido, email, rol, direccion, password } = req.body;
        const datosAActualizar = { nombre, apellido, email, rol, direccion };

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            datosAActualizar.password = await bcrypt.hash(password, salt);
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(req.params.id, datosAActualizar, { new: true }).select('-password');
        res.json({ msg: 'Usuario actualizado', usuario: usuarioActualizado });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar' });
    }
};

exports.eliminarUsuarioPanel = async (req, res) => {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar' });
    }
};

// --- OPERACIONES UNIVERSALES ---
exports.eliminarDatoUniversal = async (req, res) => {
    try {
        const { dbName, tableName, id } = req.params;
        const db = mongoose.connection.client.db(dbName);
        const resultado = await db.collection(tableName).deleteOne({ _id: new ObjectId(id) });
        res.json({ msg: 'Registro eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar registro' });
    }
};

exports.crearDatoUniversal = async (req, res) => {
    try {
        const { dbName, tableName } = req.params;
        const db = mongoose.connection.client.db(dbName);
        const resultado = await db.collection(tableName).insertOne(req.body);
        res.status(201).json({ msg: 'Registro creado', id: resultado.insertedId });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear' });
    }
};

exports.editarDatoUniversal = async (req, res) => {
    try {
        const { dbName, tableName, id } = req.params;
        const datosActualizados = { ...req.body };
        delete datosActualizados._id;

        const db = mongoose.connection.client.db(dbName);
        await db.collection(tableName).updateOne({ _id: new ObjectId(id) }, { $set: datosActualizados });
        res.json({ msg: "Actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar" });
    }
};