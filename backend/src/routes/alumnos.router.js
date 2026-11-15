import express from 'express';
import mongoose from 'mongoose';
import Alumno from '../dao/models/Alumno.js';
import Foto from '../dao/models/Foto.js';
import Plan from '../dao/models/Plan.js';
import { calcularVencimiento, sumarDuracion } from '../utils/vencimiento.js';
import { requireRol } from '../middlewares/auth.js';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOTO_REGEX = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const FOTO_MAX_BYTES = 600 * 1024;

/* ===============================
   🧰 AYUDANTES
================================= */

// Convierte "YYYY-MM-DD" en una fecha a medianoche UTC (null si no es válida).
// Guardar siempre a medianoche UTC evita que la fecha "salte" un día por la zona horaria.
function parsearFecha(valor) {
    if (!valor) return null;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return null;
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

// Campos del plan que viajan junto con cada alumno (para mostrar nombre, precio y estado de pago)
const CAMPOS_PLAN = 'nombre duracion precio diasAviso activo';

// Completa el plan del alumno (o de una lista de alumnos) con sus datos, en lugar de solo el _id
function conPlan(consulta) {
    return consulta.populate('plan', CAMPOS_PLAN);
}

// Busca el plan elegido. Devuelve { plan } o { error }.
// Un plan inactivo ya no se ofrece: solo se acepta si es el que el alumno ya tenía (planActualId)
async function buscarPlan(planId, planActualId = null) {
    if (!planId) return { error: 'Elegí un plan de cuota.' };
    const plan = mongoose.isValidObjectId(planId) ? await Plan.findById(planId) : null;
    if (!plan) return { error: 'El plan elegido no existe.' };
    const esElActual = planActualId && String(planActualId) === String(plan._id);
    if (!plan.activo && !esElActual) {
        return { error: `El plan "${plan.nombre}" ya no está activo. Elegí otro.` };
    }
    return { plan };
}

// Fecha de hoy en Argentina, a medianoche UTC (mismo formato en que se guardan las fechas de pago)
function hoyEnArgentina() {
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
    return parsearFecha(hoy);
}

// Avisa por Socket.io a las pantallas abiertas que los alumnos cambiaron, para que recarguen la lista
function avisarCambio(req) {
    req.app.get('io')?.emit('alumnos:cambio');
}

// Acepta "12.345.678" o "12 345 678" y lo guarda como "12345678"
function normalizarDni(valor) {
    return String(valor ?? '').replace(/[.\s]/g, '');
}

// Valida el body y devuelve { datos } listos para guardar, o { error } con un mensaje para el usuario
function validarAlumno(body) {
    const nombre = String(body.nombre ?? '').trim();
    const apellido = String(body.apellido ?? '').trim();
    const dni = normalizarDni(body.dni);
    const email = String(body.email ?? '').trim().toLowerCase();

    if (!nombre || !apellido || !dni) {
        return { error: 'Nombre, apellido y DNI son obligatorios.' };
    }
    if (!/^\d{6,9}$/.test(dni)) {
        return { error: 'El DNI debe tener entre 6 y 9 números, sin puntos.' };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { error: 'El email no es válido.' };
    }

    const fechaPago = parsearFecha(body.fechaPago);
    if (!fechaPago) {
        return { error: 'La fecha de pago es obligatoria y debe ser válida.' };
    }

    // El vencimiento no se calcula acá: depende del plan (y, al editar, de si cambió la fecha de pago)
    return { datos: { nombre, apellido, dni, email, fechaPago } };
}

function responderError(res, error, mensaje) {
    // 11000 = índice único de Mongo: otro alumno ya tiene ese DNI
    if (error.code === 11000) {
        return res.status(409).json({ error: 'El DNI ya está registrado.' });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'ID de alumno inválido.' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Datos del alumno inválidos.' });
    }
    console.error(mensaje, error);
    return res.status(500).json({ error: mensaje });
}

/* ===============================
   📌 CREAR NUEVO ALUMNO
================================= */
router.post('/', async (req, res) => {
    try {
        const { datos, error } = validarAlumno(req.body);
        if (error) return res.status(400).json({ error });

        // Verificar si ya existe un alumno con el mismo DNI
        const alumnoExistente = await Alumno.findOne({ dni: datos.dni });
        if (alumnoExistente) {
            return res.status(409).json({ error: 'El DNI ya está registrado.' });
        }

        // El plan es obligatorio en el alta y tiene que estar activo
        const { plan, error: errorPlan } = await buscarPlan(req.body.plan);
        if (errorPlan) return res.status(400).json({ error: errorPlan });

        // Alta: no hay vencimiento anterior, el período cuenta desde la fecha de pago
        const nuevoAlumno = await Alumno.create({
            ...datos,
            plan: plan._id,
            fechaVencimiento: calcularVencimiento({ fechaPago: datos.fechaPago, duracion: plan.duracion })
        });
        await nuevoAlumno.populate('plan', CAMPOS_PLAN);
        avisarCambio(req);
        res.status(201).json(nuevoAlumno);
    } catch (error) {
        responderError(res, error, 'Error al crear alumno');
    }
});

/* ===============================
   📌 OBTENER TODOS LOS ALUMNOS
================================= */
router.get('/', async (req, res) => {
    try {
        const alumnos = await conPlan(Alumno.find().sort({ apellido: 1, nombre: 1 }));
        res.json(alumnos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener alumnos' });
    }
});

/* ===============================
   📌 BUSCAR ALUMNO POR DNI
================================= */
router.get('/dni/:dni', async (req, res) => {
    try {
        const alumno = await conPlan(Alumno.findOne({ dni: normalizarDni(req.params.dni) }));
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
        res.json(alumno);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar alumno' });
    }
});

/* ===============================
   📌 ELIMINAR ALUMNO POR ID (solo administración)
   requireAuth ya se aplicó en server.js para todo /api/alumnos
================================= */
router.delete('/:id', requireRol('administracion'), async (req, res) => {
    try {
        const alumnoEliminado = await Alumno.findByIdAndDelete(req.params.id);
        if (!alumnoEliminado)
            return res.status(404).json({ error: 'Alumno no encontrado' });
        await Foto.deleteOne({ alumno: alumnoEliminado._id });
        avisarCambio(req);
        res.json({ mensaje: 'Alumno eliminado correctamente' });
    } catch (error) {
        responderError(res, error, 'Error al eliminar alumno');
    }
});

/* ===============================
   📌 EDITAR ALUMNO (PUT)
   - Cambiar el plan NO cambia el vencimiento actual: el plan nuevo se aplica desde el próximo pago.
   - Si se corrige la fecha de pago, el vencimiento se recalcula desde esa fecha con el plan del alumno.
================================= */
router.put('/:id', async (req, res) => {
    try {
        const { datos, error } = validarAlumno(req.body);
        if (error) return res.status(400).json({ error });

        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

        // El DNI no puede pertenecer a otro alumno
        const otroConDni = await Alumno.findOne({ dni: datos.dni, _id: { $ne: alumno._id } });
        if (otroConDni) {
            return res.status(409).json({ error: 'El DNI ya está registrado.' });
        }

        // Si no se envía plan, queda el que tenía. Puede conservar un plan inactivo, pero no pasarse a uno
        const { plan, error: errorPlan } = await buscarPlan(req.body.plan ?? alumno.plan, alumno.plan);
        if (errorPlan) return res.status(400).json({ error: errorPlan });

        const cambioFechaPago = datos.fechaPago.getTime() !== alumno.fechaPago.getTime();
        Object.assign(alumno, datos, { plan: plan._id });
        if (cambioFechaPago) {
            alumno.fechaVencimiento = sumarDuracion(datos.fechaPago, plan.duracion);
        }
        await alumno.save();
        await alumno.populate('plan', CAMPOS_PLAN);

        avisarCambio(req);
        res.status(200).json(alumno);
    } catch (error) {
        responderError(res, error, 'Error al actualizar alumno');
    }
});

/* ===============================
   📌 REGISTRAR PAGO (renovar cuota)
   - Usa la fecha enviada o, si no hay, la de hoy en Argentina.
   - Se puede elegir otro plan al pagar (body.plan): este pago ya usa el plan nuevo.
   - Pago adelantado: el período se suma al vencimiento actual. Pago tarde: cuenta desde el día del pago.
   - Al pagar, el plan tiene que estar activo (un plan desactivado ya no se cobra).
================================= */
router.post('/:id/pago', async (req, res) => {
    try {
        const fechaPago = req.body?.fechaPago ? parsearFecha(req.body.fechaPago) : hoyEnArgentina();
        if (!fechaPago) {
            return res.status(400).json({ error: 'La fecha de pago no es válida.' });
        }

        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

        const { plan, error: errorPlan } = await buscarPlan(req.body?.plan ?? alumno.plan);
        if (errorPlan) return res.status(400).json({ error: errorPlan });

        alumno.fechaVencimiento = calcularVencimiento({
            fechaPago,
            duracion: plan.duracion,
            vencimientoActual: alumno.fechaVencimiento
        });
        alumno.fechaPago = fechaPago;
        alumno.plan = plan._id;
        await alumno.save();
        await alumno.populate('plan', CAMPOS_PLAN);

        avisarCambio(req);
        res.json(alumno);
    } catch (error) {
        responderError(res, error, 'Error al registrar el pago');
    }
});

/* ===============================
   📷 FOTO DEL ALUMNO
   El frontend la achica antes de enviarla como data URL en base64.
================================= */
router.get('/:id/foto', async (req, res) => {
    try {
        const foto = await Foto.findOne({ alumno: req.params.id });
        if (!foto) return res.status(404).json({ error: 'El alumno no tiene foto' });

        // La URL lleva ?v=..., que cambia con cada foto nueva, así que se puede cachear mucho tiempo.
        // private: solo la guarda el navegador de quien inició sesión, nunca un caché compartido
        res.set('Cache-Control', 'private, max-age=31536000, immutable');
        res.type(foto.contentType).send(foto.data);
    } catch (error) {
        responderError(res, error, 'Error al obtener la foto');
    }
});

router.put('/:id/foto', async (req, res) => {
    try {
        const coincide = FOTO_REGEX.exec(String(req.body?.imagen ?? ''));
        if (!coincide) {
            return res.status(400).json({ error: 'La foto debe ser una imagen JPG, PNG o WEBP.' });
        }

        const data = Buffer.from(coincide[2], 'base64');
        if (data.length > FOTO_MAX_BYTES) {
            return res.status(413).json({ error: 'La foto es demasiado grande.' });
        }

        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

        await Foto.findOneAndUpdate(
            { alumno: alumno._id },
            { data, contentType: coincide[1] },
            { upsert: true }
        );
        alumno.fotoUrl = `/api/alumnos/${alumno._id}/foto?v=${Date.now()}`;
        await alumno.save();
        await alumno.populate('plan', CAMPOS_PLAN);

        avisarCambio(req);
        res.json(alumno);
    } catch (error) {
        responderError(res, error, 'Error al guardar la foto');
    }
});

router.delete('/:id/foto', async (req, res) => {
    try {
        const alumno = await conPlan(Alumno.findByIdAndUpdate(req.params.id, { fotoUrl: '' }, { new: true }));
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

        await Foto.deleteOne({ alumno: alumno._id });
        avisarCambio(req);
        res.json(alumno);
    } catch (error) {
        responderError(res, error, 'Error al eliminar la foto');
    }
});

export default router;
