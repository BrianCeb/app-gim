import express from 'express';
import Alumno from '../dao/models/Alumno.js';
import Foto from '../dao/models/Foto.js';

const router = express.Router();

const DIAS_CUOTA = 30;
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

function calcularVencimiento(fechaPago) {
    const vencimiento = new Date(fechaPago);
    vencimiento.setUTCDate(vencimiento.getUTCDate() + DIAS_CUOTA);
    return vencimiento;
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

    return {
        datos: {
            nombre,
            apellido,
            dni,
            email,
            fechaPago,
            fechaVencimiento: calcularVencimiento(fechaPago)
        }
    };
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

        const nuevoAlumno = await Alumno.create(datos);
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
        const alumnos = await Alumno.find().sort({ apellido: 1, nombre: 1 });
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
        const alumno = await Alumno.findOne({ dni: normalizarDni(req.params.dni) });
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
        res.json(alumno);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar alumno' });
    }
});

/* ===============================
   📌 ELIMINAR ALUMNO POR ID
================================= */
router.delete('/:id', async (req, res) => {
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
================================= */
router.put('/:id', async (req, res) => {
    try {
        const { datos, error } = validarAlumno(req.body);
        if (error) return res.status(400).json({ error });

        // El DNI no puede pertenecer a otro alumno
        const otroConDni = await Alumno.findOne({ dni: datos.dni, _id: { $ne: req.params.id } });
        if (otroConDni) {
            return res.status(409).json({ error: 'El DNI ya está registrado.' });
        }

        const alumnoActualizado = await Alumno.findByIdAndUpdate(req.params.id, datos, {
            new: true,
            runValidators: true
        });

        if (!alumnoActualizado)
            return res.status(404).json({ error: 'Alumno no encontrado' });

        avisarCambio(req);
        res.status(200).json(alumnoActualizado);
    } catch (error) {
        responderError(res, error, 'Error al actualizar alumno');
    }
});

/* ===============================
   📌 REGISTRAR PAGO (renovar cuota)
   Usa la fecha enviada o, si no hay, la de hoy en Argentina.
================================= */
router.post('/:id/pago', async (req, res) => {
    try {
        const fechaPago = req.body?.fechaPago ? parsearFecha(req.body.fechaPago) : hoyEnArgentina();
        if (!fechaPago) {
            return res.status(400).json({ error: 'La fecha de pago no es válida.' });
        }

        const alumno = await Alumno.findByIdAndUpdate(
            req.params.id,
            { fechaPago, fechaVencimiento: calcularVencimiento(fechaPago) },
            { new: true }
        );
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

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

        // La URL lleva ?v=..., que cambia con cada foto nueva, así que se puede cachear mucho tiempo
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
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

        avisarCambio(req);
        res.json(alumno);
    } catch (error) {
        responderError(res, error, 'Error al guardar la foto');
    }
});

router.delete('/:id/foto', async (req, res) => {
    try {
        const alumno = await Alumno.findByIdAndUpdate(req.params.id, { fotoUrl: '' }, { new: true });
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });

        await Foto.deleteOne({ alumno: alumno._id });
        avisarCambio(req);
        res.json(alumno);
    } catch (error) {
        responderError(res, error, 'Error al eliminar la foto');
    }
});

export default router;
