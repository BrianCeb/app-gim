import mongoose from 'mongoose';

// Días de la semana con los números de JavaScript (Date.getDay()): 0 = domingo … 6 = sábado.
// Los nombres para mostrar están en frontend/src/lib/clases.js
export const DIAS_VALIDOS = [0, 1, 2, 3, 4, 5, 6];

// Hora del día como "HH:MM" en 24 horas
export const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Una clase es un turno fijo: los alumnos que vienen siempre a los mismos días y horario
// (por ejemplo "Mañana" los lunes, miércoles y viernes de 8 a 10).
//
// Sirve para registrar la asistencia con un clic: la pantalla de Asistencia muestra la lista
// de la clase que está pasando y se marca a cada alumno por su nombre, sin escribir el DNI.
const claseSchema = new mongoose.Schema(
    {
        // Único: dos clases con el mismo nombre confundirían en el mostrador
        nombre: { type: String, required: true, unique: true, trim: true },
        // Días en que se dicta, sin repetir y al menos uno
        dias: {
            type: [Number],
            required: true,
            validate: {
                validator: (dias) => dias.length > 0 && dias.every((d) => DIAS_VALIDOS.includes(d)) && new Set(dias).size === dias.length,
                message: 'Los días de la clase no son válidos.'
            }
        },
        horaInicio: { type: String, required: true, match: HORA_REGEX },
        horaFin: { type: String, required: true, match: HORA_REGEX },
        // Las clases no se borran: se desactivan, para no perder a qué clase iba cada alumno
        activa: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const Clase = mongoose.model('Clase', claseSchema);

export default Clase;
