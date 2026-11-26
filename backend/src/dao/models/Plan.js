import mongoose from 'mongoose';

// Unidades de duración: "meses" se suma por mes calendario (5/11 → 5/12);
// "dias" suma días fijos (para un plan semanal, por ejemplo 7 días)
export const UNIDADES_DURACION = ['meses', 'dias'];
export const DIAS_AVISO_DEFECTO = 3;

const planSchema = new mongoose.Schema(
    {
        // Único: dos planes con el mismo nombre confundirían en el mostrador
        nombre: { type: String, required: true, unique: true, trim: true },
        duracion: {
            cantidad: { type: Number, required: true, min: 1 },
            unidad: { type: String, enum: UNIDADES_DURACION, required: true }
        },
        // Precio vigente en pesos enteros. Lo que se cobró en cada pago se guarda aparte (HU 12),
        // así cambiar el precio no altera lo que ya se cobró
        precio: { type: Number, required: true, min: 0 },
        // Cuántos días antes del vencimiento el alumno aparece "por vencer"
        diasAviso: { type: Number, default: DIAS_AVISO_DEFECTO, min: 0 },
        // Cuántas clases por semana cubre el plan (1, 2, 3…). null = libre, sin límite.
        // No bloquea nada: si el alumno viene más veces, al registrar la asistencia se avisa
        clasesPorSemana: { type: Number, default: null, min: 1, max: 7 },
        // Los planes no se borran: se desactivan, para no perder a qué plan pertenecía cada alumno
        activo: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
