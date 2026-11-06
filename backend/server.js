import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// 🧩 conexión a Mongo
import connectDB from './src/config/db.js';

// 🧩 rutas
import alumnosRouter from './src/routes/alumnos.router.js';
import ingresosRouter from './src/routes/ingresos.router.js';

// 🔧 configuración base
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// 🧠 Socket.io: solo AVISA que algo cambió; los datos se leen y escriben por la API REST.
// Frontend y API comparten origen, así que no hace falta CORS.
const io = new Server(httpServer);
app.set('io', io);

io.on('connection', () => {
    console.log('Cliente conectado');
});

// 🧱 middlewares (límite de 1mb para permitir fotos en base64)
app.use(express.json({ limit: '1mb' }));

// 📚 rutas
app.use('/api/alumnos', alumnosRouter);
app.use('/api/ingresos', ingresosRouter);

// ❓ rutas /api inexistentes: responder JSON, nunca HTML
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// ✅ healthcheck (lo usa el hosting para saber si el servicio está sano)
const healthcheck = (req, res) => {
    const dbConectada = mongoose.connection.readyState === 1;
    res.status(dbConectada ? 200 : 503).json({
        ok: dbConectada,
        db: dbConectada ? 'conectada' : 'desconectada',
        time: new Date().toISOString()
    });
};
app.get('/healthz', healthcheck);
app.get('/health', healthcheck);

// 🖥️ frontend compilado (React). Cualquier otra ruta GET devuelve index.html
// para que funcione refrescar en /alumnos, /ingresos, etc.
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.log('ℹ️ No hay build del frontend (frontend/dist). Solo se sirve la API.');
}

// 🚨 errores no controlados (por ejemplo, JSON mal formado en el body)
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Los datos enviados son demasiado grandes' });
    }
    console.error('Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// 🚀 arrancar: primero la base de datos, después recibir tráfico
const PORT = process.env.PORT || 3000;
try {
    await connectDB();
    httpServer.listen(PORT, '0.0.0.0', () =>
        console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`)
    );
} catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error.message);
    process.exit(1);
}
