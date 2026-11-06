import mongoose from 'mongoose';

// Las fotos se guardan aparte del alumno para que el listado de alumnos siga siendo liviano
const fotoSchema = new mongoose.Schema({
    alumno: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', required: true, unique: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true }
});

const Foto = mongoose.model('Foto', fotoSchema);

export default Foto;
