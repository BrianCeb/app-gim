import express from 'express';
import mongoose from 'mongoose';
import Alumno from '../dao/models/Alumno.js';
import Pago from '../dao/models/Pago.js';
import { requireRol } from '../middlewares/auth.js';

// En server.js se monta con requireAuth. El historial de cada alumno se consulta en
// GET /api/alumnos/:id/pagos; acá van las operaciones sobre un pago puntual.

const router = express.Router();

/* ===============================
   🚫 ANULAR UN PAGO (solo administración, HU 12)
   - El pago no se borra: queda marcado como anulado, con fecha y quién lo anuló.
   - Solo se puede anular el último pago vigente del alumno: cada pago guarda cómo estaba el
     alumno justo antes, así que deshacerlos en orden (del último hacia atrás) siempre es correcto.
   - El alumno vuelve a la fecha de pago, al vencimiento y al plan que tenía antes de ese pago.
   - El pago del alta no se anula: no hay un estado anterior al que volver (el alumno se corrige
     desde "Editar alumno" o se elimina).
================================= */
router.post('/:id/anular', requireRol('administracion'), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'ID de pago inválido.' });
        }
        const pago = await Pago.findById(req.params.id);
        if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
        if (!pago.vigente) return res.status(409).json({ error: 'Este pago ya estaba anulado.' });

        const ultimo = await Pago.findOne({ alumno: pago.alumno, 'anulado.fecha': null }).sort({ createdAt: -1 });
        if (String(ultimo._id) !== String(pago._id)) {
            return res.status(409).json({ error: 'Solo se puede anular el último pago del alumno.' });
        }
        if (!pago.fechaPagoAnterior) {
            return res.status(409).json({ error: 'El pago del alta no se puede anular. Corregí los datos desde "Editar alumno".' });
        }

        pago.anulado = { fecha: new Date(), usuario: req.usuario._id, usuarioNombre: req.usuario.nombre };

        // Si el alumno fue eliminado, el pago igual se anula (para que no cuente en la recaudación)
        const alumno = await Alumno.findById(pago.alumno);
        if (alumno) {
            alumno.fechaPago = pago.fechaPagoAnterior;
            alumno.fechaVencimiento = pago.vencimientoAnterior;
            if (pago.planAnterior) alumno.plan = pago.planAnterior;
        }

        // Transacción: el pago anulado y el alumno restaurado se guardan juntos
        await mongoose.connection.transaction(async (session) => {
            await pago.save({ session });
            if (alumno) await alumno.save({ session });
        });

        req.app.get('io')?.emit('alumnos:cambio');
        res.json(pago);
    } catch (error) {
        console.error('Error al anular el pago', error);
        res.status(500).json({ error: 'Error al anular el pago' });
    }
});

export default router;
