import mongoose from 'mongoose';

// Lanza un error si no puede conectar, así server.js no arranca "a medias" sin base de datos
export default async function connectDB() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error('❌ No se encontró la variable MONGO_URI en el archivo .env');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado correctamente a MongoDB');
}
