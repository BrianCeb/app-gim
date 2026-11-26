import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const alumnoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    dni: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    fechaPago: { type: Date, required: true },
    fechaVencimiento: { type: Date, required: true },
    // Plan de cuota: define cuánto dura cada pago y el precio. Es obligatorio al dar de alta
    // (lo controla alumnos.router.js); acá no se marca required para que los alumnos cargados
    // antes de la HU 11 se puedan seguir guardando hasta correr la migración de planes
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', index: true },
    fotoUrl: { type: String, default: '' },
    // Ficha de salud (apto físico): el archivo vive en la colección FichaSalud. Acá queda solo
    // el resumen, para que el listado avise quién no la tiene o la tiene vencida sin bajar archivos.
    // url vacía = el alumno todavía no entregó el apto (los cargados antes quedan así).
    fichaSalud: {
        url: { type: String, default: '' },
        fecha: { type: Date, default: null },
        vence: { type: Date, default: null }
    }
});

alumnoSchema.plugin(mongoosePaginate);

const Alumno = mongoose.model('Alumno', alumnoSchema);
export default Alumno;
