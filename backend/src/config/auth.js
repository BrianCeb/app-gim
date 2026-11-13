import jwt from 'jsonwebtoken';

// Todo lo de la sesión en un solo lugar: lo usan las rutas de login, el middleware y Socket.io

export const NOMBRE_COOKIE = 'sesion';
const DURACION_HORAS = 12; // un turno largo de recepción
const ALGORITMO = 'HS256';
const SECRETO_EJEMPLO = 'CAMBIAR_POR_UNA_CLAVE_LARGA_Y_ALEATORIA';

// Se lee al usarse (no al importar el archivo): en server.js dotenv.config() corre
// después de los import, así que al importar process.env.JWT_SECRET todavía no existe
function obtenerSecreto() {
    const secreto = process.env.JWT_SECRET;
    if (!secreto || secreto === SECRETO_EJEMPLO || secreto.length < 32) {
        throw new Error('❌ Falta JWT_SECRET en el .env (o es el de ejemplo, o tiene menos de 32 caracteres)');
    }
    return secreto;
}

// Se llama al arrancar el servidor para que no arranque "a medias" sin poder firmar sesiones
export function verificarConfigAuth() {
    obtenerSecreto();
}

// El token guarda solo el id del usuario (sub) y su rol. Nada secreto: el JWT va firmado,
// no cifrado, así que cualquiera con el token podría leerlo, pero no modificarlo
export function firmarToken(usuario) {
    return jwt.sign({ sub: String(usuario._id), rol: usuario.rol }, obtenerSecreto(), {
        algorithm: ALGORITMO,
        expiresIn: `${DURACION_HORAS}h`
    });
}

// Devuelve el contenido del token si la firma es válida y no venció; si no, null
export function verificarToken(token) {
    if (!token) return null;
    try {
        // algorithms fijo: no se acepta un token que diga venir firmado con otro algoritmo
        return jwt.verify(token, obtenerSecreto(), { algorithms: [ALGORITMO] });
    } catch {
        return null;
    }
}

// httpOnly: el JavaScript del navegador no puede leerla (protege ante XSS).
// sameSite strict: el navegador no la manda en pedidos que vienen de otros sitios (protege ante CSRF).
// secure: en producción solo viaja por HTTPS. En local (http://localhost) tiene que ir en false.
export function opcionesCookie() {
    return {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: DURACION_HORAS * 60 * 60 * 1000 // en milisegundos, igual que el vencimiento del token
    };
}
