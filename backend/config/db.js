const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'DB',
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 10000,
            retryWrites: true,
            maxPoolSize: 10,
        });

        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        const allowStartWithoutDb = process.env.ALLOW_START_WITHOUT_DB === 'true';
        console.error(`Error de conexion MongoDB: ${error.message}`);

        if (allowStartWithoutDb) {
            console.warn('Continuando sin MongoDB por configuracion de desarrollo (ALLOW_START_WITHOUT_DB=true).');
            return null;
        }

        process.exit(1);
    }
};

module.exports = connectDB;
