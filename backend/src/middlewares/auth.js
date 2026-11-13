import Usuario from '../dao/models/Usuario.js';
import { NOMBRE_COOKIE, opcionesCookie, verificarToken } from '../config/auth.js';

/* ===============================
   🔐 requireAuth: solo deja pasar si hay una sesión válida
   Lee el token de la cookie (cookie-parser la deja en req.cookies), lo verifica y busca
   al usuario en la base. Si todo está bien, lo deja en req.usuario para las rutas siguientes.
================================= */
export async function requireAuth(req, res, next) {
    const datos = verificarToken(req.cookies?.[NOMBRE_COOKIE]);
    if (!datos) {
        return res.status(401).json({ error: 'Tenés que iniciar sesión.' });
    }

    try {
        // Se consulta la base en cada pedido (y no se confía solo en el token) para que
        // desactivar una cuenta o cambiarle el rol tenga efecto en el momento
        const usuario = await Usuario.findById(datos.sub);

        if (!usuario || !usuario.activo) {
            res.clearCookie(NOMBRE_COOKIE, opcionesCookie());
            return res.status(401).json({
                error: usuario ? 'Tu cuenta está desactivada. Hablá con administración.' : 'Tenés que iniciar sesión.'
            });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(401).json({ error: 'Tenés que iniciar sesión.' });
        }
        console.error('Error al verificar la sesión:', error);
        res.status(500).json({ error: 'Error al verificar la sesión' });
    }
}

/* ===============================
   🛂 requireRol('administracion', ...): solo deja pasar a los roles indicados
   Va siempre después de requireAuth (necesita req.usuario).
   401 = no se sabe quién es · 403 = se sabe quién es, pero no tiene permiso
================================= */
export function requireRol(...roles) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Tenés que iniciar sesión.' });
        }
        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'No tenés permiso para realizar esta acción.' });
        }
        next();
    };
}
