import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Roles del personal: recepción atiende el día a día; administración además gestiona y elimina
export const ROLES = ['administracion', 'recepcion'];
export const PASSWORD_MIN = 8;

// Costo de bcrypt: cuántas veces se repite el cálculo (2^10). Más alto = más lento de adivinar
const RONDAS_BCRYPT = 10;

const usuarioSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        // Nunca se guarda la contraseña, solo su hash. select: false = no viaja en las consultas
        // salvo que se pida explícitamente con .select('+passwordHash') (lo hace solo el login)
        passwordHash: { type: String, required: true, select: false },
        rol: { type: String, enum: ROLES, required: true },
        // Las cuentas no se borran: se desactivan, y una cuenta inactiva no puede ingresar
        activo: { type: Boolean, default: true }
    },
    { timestamps: true } // agrega createdAt y updatedAt
);

// Por si alguna vez se trae el hash: nunca se incluye al convertir a JSON (respuestas de la API)
usuarioSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
    }
});

// Convierte la contraseña en texto en un hash para guardarlo
usuarioSchema.statics.hashearPassword = function (password) {
    return bcrypt.hash(password, RONDAS_BCRYPT);
};

// Compara la contraseña escrita con el hash guardado (requiere haber traído passwordHash)
usuarioSchema.methods.verificarPassword = function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;
