// Qué puede hacer cada rol, en un solo lugar: lo usan el menú, las rutas y los botones.
// Es solo para la interfaz (no mostrar lo que no corresponde). La seguridad real está en el
// backend (requireRol): aunque alguien fuerce la pantalla, la API igual responde 403.

export const ROLES = {
    ADMINISTRACION: 'administracion',
    RECEPCION: 'recepcion'
};

export const ETIQUETA_ROL = {
    administracion: 'Administración',
    recepcion: 'Recepción'
};

// Acciones restringidas y qué roles pueden hacerlas. Lo que no figura acá lo pueden hacer todos.
const PERMISOS = {
    estadisticas: [ROLES.ADMINISTRACION],
    eliminarAlumno: [ROLES.ADMINISTRACION],
    personal: [ROLES.ADMINISTRACION],
    // Crear y editar planes de cuota (verlos y elegirlos lo hacen todos)
    planes: [ROLES.ADMINISTRACION],
    // Crear y editar clases o turnos (verlas y pasar asistencia lo hacen todos)
    clases: [ROLES.ADMINISTRACION],
    // Anular un pago (HU 12): ver el historial lo hacen todos
    anularPago: [ROLES.ADMINISTRACION]
};

// puede(usuario, 'estadisticas') → true / false. Sin permiso indicado: alcanza con haber iniciado sesión
export function puede(usuario, permiso) {
    if (!usuario) return false;
    if (!permiso) return true;
    return PERMISOS[permiso]?.includes(usuario.rol) ?? false;
}
