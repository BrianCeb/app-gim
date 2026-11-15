// Crea el primer administrador con los datos de ADMIN_NOMBRE, ADMIN_EMAIL y ADMIN_PASSWORD.
// Uso: npm run seed:admin  (desde backend/, o con --prefix backend desde la raíz)
// Si ya existe un usuario con ese email, no lo modifica: se puede correr varias veces sin riesgo.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Usuario, { PASSWORD_MIN } from '../src/dao/models/Usuario.js';

// El .env está en backend/, sin importar desde qué carpeta se ejecute el script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida las variables y devuelve los datos, o un mensaje de error (nunca se muestra la contraseña)
function leerDatos() {
    const nombre = String(process.env.ADMIN_NOMBRE ?? '').trim();
    const email = String(process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD ?? '');

    if (!nombre || !email || !password) {
        return { error: 'Faltan ADMIN_NOMBRE, ADMIN_EMAIL o ADMIN_PASSWORD en el .env.' };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { error: 'ADMIN_EMAIL no es un email válido.' };
    }
    if (password.length < PASSWORD_MIN) {
        return { error: `ADMIN_PASSWORD debe tener al menos ${PASSWORD_MIN} caracteres.` };
    }
    return { datos: { nombre, email, password } };
}

async function crearAdmin() {
    const { datos, error } = leerDatos();
    if (error) throw new Error(error);

    await connectDB();

    const existente = await Usuario.findOne({ email: datos.email });
    if (existente) {
        console.log(`ℹ️ Ya existe un usuario con el email ${datos.email} (rol: ${existente.rol}). No se modificó nada.`);
        return;
    }

    await Usuario.create({
        nombre: datos.nombre,
        email: datos.email,
        passwordHash: await Usuario.hashearPassword(datos.password),
        rol: 'administracion'
    });
    console.log(`✅ Administrador creado: ${datos.nombre} <${datos.email}>`);
}

try {
    await crearAdmin();
} catch (error) {
    console.error('❌ No se pudo crear el administrador:', error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
