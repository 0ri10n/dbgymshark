const mongoose = require('mongoose');
const Product = require('../models/Productos');
const { ObjectId } = require('mongoose').Types; // Usa el de Mongoose

// FUNCIÓN 1: Listar DBs
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

// FUNCIÓN 2: Listar Tablas 
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

// FUNCIÓN 3: Obtener Datos con paginación
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


// ELIMINAR REGISTRO UNIVERSAL
exports.eliminarDatoUniversal = async (req, res) => {
    try {
        const { dbName, tableName, id } = req.params;
        const db = mongoose.connection.client.db(dbName);
        const coleccion = db.collection(tableName);
        
        // El cambio importante es aquí:
        const resultado = await coleccion.deleteOne({ _id: new ObjectId(id) });

        if (resultado.deletedCount === 1) {
            res.json({ msg: `Registro eliminado de ${tableName}` });
        } else {
            res.status(404).json({ msg: 'No se encontró el registro' });
        }
    } catch (error) {
        console.error('Error CRUD:', error); // Aquí es donde viste el error de BSON
        res.status(500).json({ msg: 'Error de versiones en la base de datos' });
    }
};

// CREAR REGISTRO UNIVERSAL
exports.crearDatoUniversal = async (req, res) => {
    try {
        const { dbName, tableName } = req.params;
        const db = mongoose.connection.client.db(dbName);
        const coleccion = db.collection(tableName);
        
        // Inserta el cuerpo del JSON enviado desde el frontend
        const resultado = await coleccion.insertOne(req.body);
        res.status(201).json({ msg: 'Registro creado', id: resultado.insertedId });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear el registro' });
    }
};

// backend/controllers/adminController.js
exports.editarDatoUniversal = async (req, res) => {
    try {
        const { dbName, tableName, id } = req.params;
        const datosActualizados = req.body;
        delete datosActualizados._id; // Por seguridad, no intentamos cambiar el ID de MongoDB

        const db = mongoose.connection.client.db(dbName);
        const resultado = await db.collection(tableName).updateOne(
            { _id: new ObjectId(id) },
            { $set: datosActualizados }
        );

        res.json({ msg: "Actualizado correctamente", resultado });
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar" });
    }
};


const Usuario = require('../models/Usuario');
const Venta = require('../models/Venta');


exports.obtenerUsuariosPanel = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password').sort({ registro: -1 });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ msg: 'Error al cargar usuarios' });
    }
};

// Editar Usuario
exports.actualizarUsuarioPanel = async (req, res) => {
    try {
        const { nombre, apellido, email, rol } = req.body;
        
        // Buscamos al usuario por ID y actualizamos solo los datos permitidos
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            req.params.id,
            { nombre, apellido, email, rol },
            { new: true } // Devuelve el documento ya modificado
        ).select('-password'); // Ocultamos la contraseña en la respuesta

        if (!usuarioActualizado) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ msg: 'Usuario actualizado', usuario: usuarioActualizado });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ msg: 'Error al actualizar usuario' });
    }
};

// Eliminar Usuario
exports.eliminarUsuarioPanel = async (req, res) => {
    try {
        const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
        if (!usuarioEliminado) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        res.json({ msg: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ msg: 'Error al eliminar usuario' });
    }
};


exports.obtenerVentasPanel = async (req, res) => {
    try {
        const ventas = await Venta.find().sort({ fechaPedido: -1 });
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ msg: 'Error al cargar ventas' });
    }
};