// Todas las llamadas usan rutas relativas (/api/...): frontend y backend comparten la misma URL.
// Por eso el navegador manda solo la cookie de sesión (httpOnly) en cada pedido: no hay que tocar el token.

// Función que se ejecuta cuando el servidor responde 401 (sesión vencida o cuenta desactivada).
// La registra AuthContext para cerrar la sesión en pantalla y volver al login.
let alNoAutorizado = null;
export function configurarNoAutorizado(funcion) {
    alNoAutorizado = funcion;
}

async function pedir(url, { method = 'GET', body } = {}) {
    let res;
    try {
        res = await fetch(url, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor. Revisá la conexión a internet.');
    }

    const datos = await res.json().catch(() => null);

    // En el login, 401 solo significa "email o contraseña incorrectos": no hay sesión que cerrar
    if (res.status === 401 && url !== '/api/auth/login') {
        alNoAutorizado?.(datos?.error);
    }
    if (!res.ok) {
        throw new Error(datos?.error || `Error del servidor (${res.status}).`);
    }
    return datos;
}

export const api = {
    login: (email, password) => pedir('/api/auth/login', { method: 'POST', body: { email, password } }),
    logout: () => pedir('/api/auth/logout', { method: 'POST' }),
    yo: () => pedir('/api/auth/yo'),

    alumnos: () => pedir('/api/alumnos'),
    crearAlumno: (datos) => pedir('/api/alumnos', { method: 'POST', body: datos }),
    editarAlumno: (id, datos) => pedir(`/api/alumnos/${id}`, { method: 'PUT', body: datos }),
    eliminarAlumno: (id) => pedir(`/api/alumnos/${id}`, { method: 'DELETE' }),
    registrarPago: (id, fechaPago) => pedir(`/api/alumnos/${id}/pago`, { method: 'POST', body: { fechaPago } }),
    subirFoto: (id, imagen) => pedir(`/api/alumnos/${id}/foto`, { method: 'PUT', body: { imagen } }),
    eliminarFoto: (id) => pedir(`/api/alumnos/${id}/foto`, { method: 'DELETE' }),

    ingresos: () => pedir('/api/ingresos'),
    registrarIngreso: (dni) => pedir('/api/ingresos', { method: 'POST', body: { dni } }),

    // Cuentas del personal (solo administración; con otro rol la API responde 403)
    usuarios: () => pedir('/api/usuarios'),
    crearUsuario: (datos) => pedir('/api/usuarios', { method: 'POST', body: datos }),
    editarUsuario: (id, datos) => pedir(`/api/usuarios/${id}`, { method: 'PUT', body: datos }),
    cambiarPassword: (id, password) => pedir(`/api/usuarios/${id}/password`, { method: 'PUT', body: { password } })
};
