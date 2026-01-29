const mongoose = require('mongoose');

// Obtener todas las bases de datos vinculadas
exports.obtenerBasesDeDatos = async (req, res) => {
    try {
        const admin = mongoose.connection.getSiblingDB('admin');
        const dbs = await admin.adminCommand({ listDatabases: 1 });
        res.json(dbs.databases.map(db => db.name));
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener bases de datos' });
    }
};

// Obtener tablas de la DB
exports.obtenerTablas = async (req, res) => {
    try {
        const dbName = req.params.dbName;
        const db = mongoose.connection.useDb(dbName);
        const collections = await db.db.listCollections().toArray();
        res.json(collections.map(col => col.name));
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener tablas' });
    }
};