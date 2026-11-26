import mongoose from 'mongoose';

// Tipos de archivo aceptados para el apto físico: el certificado del médico escaneado (PDF)
// o una foto del papel sacada con el celular. Si se agrega uno, también va en frontend/src/lib/archivo.js
export const TIPOS_FICHA = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// La ficha de salud (apto físico) se guarda aparte del alumno, igual que la foto: así el listado
// de alumnos sigue siendo liviano y el archivo (que puede pesar varios MB) se baja solo si se abre.
//
// El alumno guarda aparte, en "fichaSalud", la URL y las fechas: con eso el listado puede avisar
// quién no tiene ficha o la tiene vencida sin leer ni un archivo.
const fichaSaludSchema = new mongoose.Schema({
    alumno: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', required: true, unique: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, enum: TIPOS_FICHA, required: true },
    // Nombre del archivo que eligió el personal, para mostrarlo y para descargarlo con ese nombre
    nombreArchivo: { type: String, default: '' },
    // Fecha del apto que figura en el certificado (no la de la carga): de ella depende el vencimiento
    fecha: { type: Date, required: true },
    // El apto físico vale un año: se guarda calculado para no repetir la cuenta en cada consulta
    vence: { type: Date, required: true }
});

const FichaSalud = mongoose.model('FichaSalud', fichaSaludSchema);

export default FichaSalud;
