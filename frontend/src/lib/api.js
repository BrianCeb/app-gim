// Todas las llamadas usan rutas relativas (/api/...): frontend y backend comparten la misma URL.
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
    if (!res.ok) {
        throw new Error(datos?.error || `Error del servidor (${res.status}).`);
    }
    return datos;
}

export const api = {
    alumnos: () => pedir('/api/alumnos'),
    crearAlumno: (datos) => pedir('/api/alumnos', { method: 'POST', body: datos }),
    editarAlumno: (id, datos) => pedir(`/api/alumnos/${id}`, { method: 'PUT', body: datos }),
    eliminarAlumno: (id) => pedir(`/api/alumnos/${id}`, { method: 'DELETE' }),
    registrarPago: (id, fechaPago) => pedir(`/api/alumnos/${id}/pago`, { method: 'POST', body: { fechaPago } }),
    subirFoto: (id, imagen) => pedir(`/api/alumnos/${id}/foto`, { method: 'PUT', body: { imagen } }),
    eliminarFoto: (id) => pedir(`/api/alumnos/${id}/foto`, { method: 'DELETE' }),

    ingresos: () => pedir('/api/ingresos'),
    registrarIngreso: (dni) => pedir('/api/ingresos', { method: 'POST', body: { dni } })
};
