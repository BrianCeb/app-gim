import mongoose from 'mongoose';

const ingresoSchema = new mongoose.Schema({
    dni: { type: String, required: true },
    fecha: { type: Date, required: true }
});

const Ingreso = mongoose.model('Ingreso', ingresoSchema);

export default Ingreso;
