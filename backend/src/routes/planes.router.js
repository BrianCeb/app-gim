import express from 'express';
import Plan, { DIAS_AVISO_DEFECTO, UNIDADES_DURACION } from '../dao/models/Plan.js';
import { requireRol } from '../middlewares/auth.js';

// En server.js se monta con requireAuth: cualquier persona con sesión puede ver los planes
// (recepción los necesita para elegir el plan del alumno y ver el precio).
// Crear y editar es solo para administración: se controla acá, ruta por ruta.

const router = express.Router();

// Aviso "por vencer" por defecto según la unidad: 3 días para planes de meses, 1 para planes de días
const AVISO_POR_UNIDAD = { meses: DIAS_AVISO_DEFECTO, dias: 1 };

/* ===============================
   🧰 AYUDANTES
================================= */

// true si el valor es un número entero mayor o igual que el mínimo
function esEnteroDesde(valor, minimo) {
    return Number.isInteger(valor) && valor >= minimo;
}

// Valida los datos de un plan (comunes al alta y a la edición).
// Devuelve { datos } listos para guardar, o { error } con un mensaje para el usuario
function validarDatos(body) {
    const nombre = String(body?.nombre ?? '').trim();
    const cantidad = Number(body?.duracion?.cantidad);
    const unidad = String(body?.duracion?.unidad ?? '');
    const precio = Number(body?.precio);

    if (!nombre) {
        return { error: 'El nombre del plan es obligatorio.' };
    }
    if (!UNIDADES_DURACION.includes(unidad)) {
        return { error: 'La duración tiene que ser en meses o en días.' };
    }
    if (!esEnteroDesde(cantidad, 1)) {
        return { error: 'La duración tiene que ser un número entero mayor que 0.' };
    }
    // body.precio vacío daría Number('') = 0: se exige que venga algo
    if (body?.precio === undefined || body?.precio === '' || !esEnteroDesde(precio, 0)) {
        return { error: 'El precio tiene que ser un número entero en pesos (0 o más).' };
    }

    // Si no se indica, se usa el aviso por defecto de la unidad
    const sinAviso = body?.diasAviso === undefined || body?.diasAviso === '';
    const diasAviso = sinAviso ? AVISO_POR_UNIDAD[unidad] : Number(body.diasAviso);
    if (!esEnteroDesde(diasAviso, 0)) {
        return { error: 'Los días de aviso tienen que ser un número entero (0 o más).' };
    }
    // En un plan de días, avisar con tanta anticipación como dura el plan no tiene sentido:
    // el alumno estaría "por vencer" desde el día que paga
    if (unidad === 'dias' && diasAviso >= cantidad) {
        return { error: 'Los días de aviso tienen que ser menos que la duración del plan.' };
    }

    return { datos: { nombre, duracion: { cantidad, unidad }, precio, diasAviso } };
}

function responderError(res, error, mensaje) {
    // 11000 = índice único de Mongo: otro plan ya tiene ese nombre
    if (error.code === 11000) {
        return res.status(409).json({ error: 'Ya existe un plan con ese nombre.' });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'ID de plan inválido.' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Datos del plan inválidos.' });
    }
    console.error(mensaje, error);
    return res.status(500).json({ error: mensaje });
}

// Busca otro plan con el mismo nombre sin importar mayúsculas ("mensual" = "Mensual").
// El índice único de Mongo distingue mayúsculas, por eso se controla también acá
async function existeOtroConNombre(nombre, idExcluido = null) {
    const escapado = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filtro = { nombre: new RegExp(`^${escapado}$`, 'i') };
    if (idExcluido) filtro._id = { $ne: idExcluido };
    return Boolean(await Plan.exists(filtro));
}

/* ===============================
   📋 LISTAR LOS PLANES
   Primero los activos, después por nombre. Se devuelven también los inactivos:
   hay alumnos que todavía pueden tenerlos y hay que poder mostrarlos.
================================= */
router.get('/', async (req, res) => {
    try {
        const planes = await Plan.find().sort({ activo: -1, nombre: 1 });
        res.json(planes);
    } catch (error) {
        responderError(res, error, 'Error al obtener los planes');
    }
});

/* ===============================
   ➕ CREAR UN PLAN (solo administración)
================================= */
router.post('/', requireRol('administracion'), async (req, res) => {
    try {
        const { datos, error } = validarDatos(req.body);
        if (error) return res.status(400).json({ error });

        if (await existeOtroConNombre(datos.nombre)) {
            return res.status(409).json({ error: 'Ya existe un plan con ese nombre.' });
        }

        const plan = await Plan.create(datos);
        res.status(201).json(plan);
    } catch (error) {
        responderError(res, error, 'Error al crear el plan');
    }
});

/* ===============================
   ✏️ EDITAR UN PLAN (solo administración)
   No hay DELETE: un plan que ya no se ofrece se desactiva (activo: false).
   Cambiar duración o precio no toca a los alumnos: el plan nuevo se aplica desde su próximo pago.
================================= */
router.put('/:id', requireRol('administracion'), async (req, res) => {
    try {
        const { datos, error } = validarDatos(req.body);
        if (error) return res.status(400).json({ error });

        // Se exige un booleano de verdad: "false" como texto no debe contar como verdadero
        if (typeof req.body.activo !== 'boolean') {
            return res.status(400).json({ error: 'El estado del plan (activo) es obligatorio.' });
        }

        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });

        if (await existeOtroConNombre(datos.nombre, plan._id)) {
            return res.status(409).json({ error: 'Ya existe un plan con ese nombre.' });
        }

        Object.assign(plan, datos, { activo: req.body.activo });
        await plan.save();
        res.json(plan);
    } catch (error) {
        responderError(res, error, 'Error al editar el plan');
    }
});

export default router;
