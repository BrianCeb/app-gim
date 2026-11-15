import mongoose from 'mongoose';

const ingresoSchema = new mongoose.Schema({
    // Vínculo real con el alumno: el _id no cambia nunca, aunque se corrija el DNI.
    // No es required porque los ingresos anteriores a este cambio se completan con
    // scripts/vincularIngresos.js, y si un DNI ya no tenía alumno quedan sin vínculo.
    // index: para buscar rápido los ingresos de un alumno.
    alumno: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', index: true },
    // DNI que tenía el alumno el día que entró. Se conserva como dato histórico:
    // si el alumno se elimina, la pantalla igual puede mostrar "Alumno eliminado (DNI ...)"
    dni: { type: String, required: true },
    fecha: { type: Date, required: true }
});

const Ingreso = mongoose.model('Ingreso', ingresoSchema);

export default Ingreso;
