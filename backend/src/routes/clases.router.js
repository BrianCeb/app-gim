import express from 'express';
import Clase, { DIAS_VALIDOS, HORA_REGEX } from '../dao/models/Clase.js';
import Alumno from '../dao/models/Alumno.js';
import { requireRol } from '../middlewares/auth.js';

// En server.js se monta con requireAuth: cualquier persona con sesión puede ver las clases
// (recepción las necesita para pasar asistencia). Crear y editar es solo para administración,
// igual que los planes: se controla acá, ruta por ruta.

const router = express.Router();

/* ===============================
   🧰 AYUDANTES
================================= */

// Valida los datos de una clase. Devuelve { datos } listos para guardar, o { error } para el usuario
function validarDatos(body) {
    const nombre = String(body?.nombre ?? '').trim();
    const horaInicio = String(body?.horaInicio ?? '').trim();
    const horaFin = String(body?.horaFin ?? '').trim();
    const dias = Array.isArray(body?.dias) ? body.dias.map(Number) : [];

    if (!nombre) {
        return { error: 'El nombre de la clase es obligatorio.' };
    }
    if (dias.length === 0) {
        return { error: 'Elegí al menos un día de la semana.' };
    }
    if (!dias.every((d) => DIAS_VALIDOS.includes(d)) || new Set(dias).size !== dias.length) {
        return { error: 'Los días de la clase no son válidos.' };
    }
    if (!HORA_REGEX.test(horaInicio) || !HORA_REGEX.test(horaFin)) {
        return { error: 'Las horas tienen que estar en formato HH:MM.' };
    }
    // Comparar "08:00" < "10:00" como texto funciona porque siempre tienen 2 dígitos
    if (horaFin <= horaInicio) {
        return { error: 'La hora de fin tiene que ser posterior a la de inicio.' };
    }

    // Se guardan ordenados (lunes primero, domingo al final) para mostrarlos siempre igual
    const ordenados = [...dias].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
    return { datos: { nombre, dias: ordenados, horaInicio, horaFin } };
}

function responderError(res, error, mensaje) {
    // 11000 = índice único de Mongo: otra clase ya tiene ese nombre
    if (error.code === 11000) {
        return res.status(409).json({ error: 'Ya existe una clase con ese nombre.' });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'ID de clase inválido.' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Datos de la clase inválidos.' });
    }
    console.error(mensaje, error);
    return res.status(500).json({ error: mensaje });
}

// Avisa por Socket.io que las clases cambiaron, para que las pantallas abiertas recarguen
function avisarCambio(req) {
    req.app.get('io')?.emit('clases:cambio');
}

// Busca otra clase con el mismo nombre sin importar mayúsculas ("mañana" = "Mañana")
async function existeOtraConNombre(nombre, idExcluido = null) {
    const escapado = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filtro = { nombre: new RegExp(`^${escapado}$`, 'i') };
    if (idExcluido) filtro._id = { $ne: idExcluido };
    return Boolean(await Clase.exists(filtro));
}

/* ===============================
   📋 LISTAR LAS CLASES
   Primero las activas, después por hora de inicio y nombre. Se devuelven también las
   desactivadas: puede haber alumnos anotados en ellas y hay que poder mostrarlas.
================================= */
router.get('/', async (req, res) => {
    try {
        const clases = await Clase.find().sort({ activa: -1, horaInicio: 1, nombre: 1 });
        res.json(clases);
    } catch (error) {
        responderError(res, error, 'Error al obtener las clases');
    }
});

/* ===============================
   ➕ CREAR UNA CLASE (solo administración)
================================= */
router.post('/', requireRol('administracion'), async (req, res) => {
    try {
        const { datos, error } = validarDatos(req.body);
        if (error) return res.status(400).json({ error });

        if (await existeOtraConNombre(datos.nombre)) {
            return res.status(409).json({ error: 'Ya existe una clase con ese nombre.' });
        }

        const clase = await Clase.create(datos);
        avisarCambio(req);
        res.status(201).json(clase);
    } catch (error) {
        responderError(res, error, 'Error al crear la clase');
    }
});

/* ===============================
   ✏️ EDITAR UNA CLASE (solo administración)
   No hay DELETE: una clase que ya no se dicta se desactiva. Los alumnos anotados la conservan
   (así se sabe a qué turno iban) y se los puede pasar a otra desde su ficha.
================================= */
router.put('/:id', requireRol('administracion'), async (req, res) => {
    try {
        const { datos, error } = validarDatos(req.body);
        if (error) return res.status(400).json({ error });

        // Se exige un booleano de verdad: "false" como texto no debe contar como verdadero
        if (typeof req.body.activa !== 'boolean') {
            return res.status(400).json({ error: 'El estado de la clase (activa) es obligatorio.' });
        }

        const clase = await Clase.findById(req.params.id);
        if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });

        if (await existeOtraConNombre(datos.nombre, clase._id)) {
            return res.status(409).json({ error: 'Ya existe una clase con ese nombre.' });
        }

        Object.assign(clase, datos, { activa: req.body.activa });
        await clase.save();
        avisarCambio(req);
        res.json(clase);
    } catch (error) {
        responderError(res, error, 'Error al editar la clase');
    }
});

/* ===============================
   👥 ALUMNOS DE UNA CLASE
   La lista que usa la pantalla de Asistencia para marcar con un clic.
================================= */
router.get('/:id/alumnos', async (req, res) => {
    try {
        const clase = await Clase.exists({ _id: req.params.id });
        if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });

        const alumnos = await Alumno.find({ clase: req.params.id }).sort({ apellido: 1, nombre: 1 });
        res.json(alumnos);
    } catch (error) {
        responderError(res, error, 'Error al obtener los alumnos de la clase');
    }
});

export default router;
