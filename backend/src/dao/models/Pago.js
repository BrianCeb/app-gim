import mongoose from 'mongoose';

// Medios de pago aceptados (lista fija, HU 12). Si se agrega uno, también va en frontend/src/lib/pagos.js
export const MEDIOS_PAGO = ['efectivo', 'transferencia', 'debito', 'credito'];

// Cada pago registrado queda como un documento propio: es el historial del alumno y la base de la
// recaudación (HU 13). El alumno sigue guardando su último pago y su vencimiento para leerlos rápido.
//
// Los campos "copia" (nombre, DNI, plan, usuario) guardan cómo eran las cosas el día del pago:
// si después se elimina el alumno, se renombra el plan o cambia el precio, el pago no cambia.
const pagoSchema = new mongoose.Schema(
    {
        // index: para traer rápido el historial de un alumno
        alumno: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', required: true, index: true },
        alumnoNombre: { type: String, required: true },
        alumnoDni: { type: String, required: true },

        // Fecha del pago, a medianoche UTC como las demás fechas de pago
        fecha: { type: Date, required: true },

        plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
        planNombre: { type: String, required: true },
        // Lo que se cobró: el precio del plan ese día, en pesos enteros
        monto: { type: Number, required: true, min: 0 },
        medio: { type: String, enum: MEDIOS_PAGO, required: true },

        // Quién lo registró (cuenta del personal)
        usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
        usuarioNombre: { type: String, required: true },

        // Cómo estaba el alumno antes del pago y cómo quedó. Los "anteriores" permiten anular el pago
        // y devolverlo exactamente al estado previo. En el alta no hay estado previo: quedan vacíos.
        fechaPagoAnterior: { type: Date, default: null },
        vencimientoAnterior: { type: Date, default: null },
        vencimientoNuevo: { type: Date, required: true },

        // Un pago no se borra nunca: si fue un error, administración lo anula y queda marcado
        anulado: {
            fecha: { type: Date },
            usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
            usuarioNombre: { type: String }
        }
    },
    { timestamps: true }
);

// Un pago está vigente si no tiene fecha de anulación
pagoSchema.virtual('vigente').get(function () {
    return !this.anulado?.fecha;
});
pagoSchema.set('toJSON', { virtuals: true });

const Pago = mongoose.model('Pago', pagoSchema);

export default Pago;
