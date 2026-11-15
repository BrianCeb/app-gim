import express from 'express';
import Usuario, { PASSWORD_MIN, ROLES } from '../dao/models/Usuario.js';

// Todas estas rutas son solo para administración: el permiso se pone al montarlas en server.js
// (requireAuth + requireRol), así ninguna ruta nueva puede quedar desprotegida por olvido.

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROL_ADMIN = 'administracion';

/* ===============================
   🧰 AYUDANTES
================================= */

// Valida nombre, email y rol (comunes al alta y a la edición).
// Devuelve { datos } listos para guardar, o { error } con un mensaje para el usuario
function validarDatos(body) {
    const nombre = String(body?.nombre ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const rol = String(body?.rol ?? '');

    if (!nombre || !email || !rol) {
        return { error: 'Nombre, email y rol son obligatorios.' };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { error: 'El email no es válido.' };
    }
    if (!ROLES.includes(rol)) {
        return { error: 'El rol no es válido.' };
    }
    return { datos: { nombre, email, rol } };
}

// Devuelve un mensaje de error si la contraseña no sirve, o null si está bien
function validarPassword(password) {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
        return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
    }
    return null;
}

function responderError(res, error, mensaje) {
    // 11000 = índice único de Mongo: otra cuenta ya tiene ese email
    if (error.code === 11000) {
        return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'ID de cuenta inválido.' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Datos de la cuenta inválidos.' });
    }
    console.error(mensaje, error);
    return res.status(500).json({ error: mensaje });
}

/* ===============================
   📋 LISTAR EL PERSONAL
   Primero las cuentas activas, después por nombre. El hash nunca viaja (select: false en el modelo).
================================= */
router.get('/', async (req, res) => {
    try {
        const usuarios = await Usuario.find().sort({ activo: -1, nombre: 1 });
        res.json(usuarios);
    } catch (error) {
        responderError(res, error, 'Error al obtener el personal');
    }
});

/* ===============================
   ➕ CREAR UNA CUENTA
   La contraseña la elige administración y se la pasa a la persona (no hay recuperación por email).
================================= */
router.post('/', async (req, res) => {
    try {
        const { datos, error } = validarDatos(req.body);
        if (error) return res.status(400).json({ error });

        const errorPassword = validarPassword(req.body?.password);
        if (errorPassword) return res.status(400).json({ error: errorPassword });

        const existente = await Usuario.findOne({ email: datos.email });
        if (existente) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
        }

        const usuario = await Usuario.create({
            ...datos,
            passwordHash: await Usuario.hashearPassword(req.body.password)
        });
        res.status(201).json(usuario);
    } catch (error) {
        responderError(res, error, 'Error al crear la cuenta');
    }
});

/* ===============================
   ✏️ EDITAR UNA CUENTA (nombre, email, rol y activo)
   Reglas:
   - Nadie puede cambiar su propio rol ni desactivar su propia cuenta (evita quedarse afuera sin querer).
   - Siempre tiene que quedar al menos un administrador activo.
================================= */
router.put('/:id', async (req, res) => {
    try {
        const { datos, error } = validarDatos(req.body);
        if (error) return res.status(400).json({ error });

        // Se exige un booleano de verdad: "false" como texto no debe contar como verdadero
        if (typeof req.body.activo !== 'boolean') {
            return res.status(400).json({ error: 'El estado de la cuenta (activo) es obligatorio.' });
        }
        const activo = req.body.activo;

        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Cuenta no encontrada' });

        const esLaPropia = String(usuario._id) === String(req.usuario._id);
        if (esLaPropia && (datos.rol !== usuario.rol || !activo)) {
            return res.status(400).json({ error: 'No podés cambiar tu propio rol ni desactivar tu cuenta.' });
        }

        // Si hoy es un administrador activo y el cambio le saca esa condición,
        // tiene que existir otro administrador activo
        const dejaDeSerAdminActivo =
            usuario.rol === ROL_ADMIN && usuario.activo && (datos.rol !== ROL_ADMIN || !activo);
        if (dejaDeSerAdminActivo) {
            const otrosAdmins = await Usuario.countDocuments({
                _id: { $ne: usuario._id },
                rol: ROL_ADMIN,
                activo: true
            });
            if (otrosAdmins === 0) {
                return res.status(409).json({ error: 'Tiene que quedar al menos un administrador activo.' });
            }
        }

        // Si cambia el email, que no lo tenga otra cuenta
        if (datos.email !== usuario.email) {
            const existente = await Usuario.findOne({ email: datos.email, _id: { $ne: usuario._id } });
            if (existente) {
                return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
            }
        }

        // Los cambios tienen efecto en el momento: requireAuth relee la cuenta en cada pedido
        Object.assign(usuario, datos, { activo });
        await usuario.save();
        res.json(usuario);
    } catch (error) {
        responderError(res, error, 'Error al editar la cuenta');
    }
});

/* ===============================
   🔑 CAMBIAR LA CONTRASEÑA
   La pone administración (también la propia). Ruta aparte para que editar los datos
   nunca toque la contraseña por accidente.
================================= */
router.put('/:id/password', async (req, res) => {
    try {
        const errorPassword = validarPassword(req.body?.password);
        if (errorPassword) return res.status(400).json({ error: errorPassword });

        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Cuenta no encontrada' });

        usuario.passwordHash = await Usuario.hashearPassword(req.body.password);
        await usuario.save();
        res.json({ mensaje: 'Contraseña actualizada' });
    } catch (error) {
        responderError(res, error, 'Error al cambiar la contraseña');
    }
});

export default router;
