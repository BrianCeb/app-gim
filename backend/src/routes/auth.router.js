import express from 'express';
import bcrypt from 'bcryptjs';
import Usuario from '../dao/models/Usuario.js';
import { NOMBRE_COOKIE, firmarToken, opcionesCookie } from '../config/auth.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

const ERROR_CREDENCIALES = 'Email o contraseña incorrectos.';

// Hash de relleno: si el email no existe igual se compara una contraseña, así la respuesta
// tarda lo mismo y no se puede averiguar qué emails están registrados midiendo el tiempo
const HASH_RELLENO = bcrypt.hashSync('relleno-para-igualar-tiempos', 10);

/* ===============================
   🔑 LOGIN
   Si email y contraseña coinciden, guarda el token en una cookie httpOnly
   y devuelve los datos del usuario (sin el hash).
================================= */
router.post('/login', async (req, res) => {
    try {
        // String(...) evita que manden un objeto (por ejemplo { "$ne": null }) en vez de texto
        const email = String(req.body?.email ?? '').trim().toLowerCase();
        const password = String(req.body?.password ?? '');

        if (!email || !password) {
            return res.status(400).json({ error: 'Ingresá tu email y tu contraseña.' });
        }

        // passwordHash tiene select: false en el modelo; acá es el único lugar donde se pide
        const usuario = await Usuario.findOne({ email }).select('+passwordHash');
        const coincide = usuario
            ? await usuario.verificarPassword(password)
            : await bcrypt.compare(password, HASH_RELLENO);

        // Mismo mensaje si no existe el email o si la contraseña está mal: no se da pistas
        if (!usuario || !coincide) {
            return res.status(401).json({ error: ERROR_CREDENCIALES });
        }

        // Solo se avisa que está desactivada a quien conoce la contraseña correcta
        if (!usuario.activo) {
            return res.status(403).json({ error: 'Tu cuenta está desactivada. Hablá con administración.' });
        }

        res.cookie(NOMBRE_COOKIE, firmarToken(usuario), opcionesCookie());
        res.json(usuario);
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

/* ===============================
   🚪 LOGOUT
   Borra la cookie. No requiere sesión: salir siempre tiene que funcionar.
================================= */
router.post('/logout', (req, res) => {
    res.clearCookie(NOMBRE_COOKIE, opcionesCookie());
    res.json({ mensaje: 'Sesión cerrada' });
});

/* ===============================
   🙋 QUIÉN SOY
   El frontend lo consulta al abrir la página para saber si ya hay una sesión,
   porque la cookie httpOnly no se puede leer desde JavaScript.
================================= */
router.get('/yo', requireAuth, (req, res) => {
    res.json(req.usuario);
});

export default router;
