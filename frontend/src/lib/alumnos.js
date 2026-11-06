export const normalizarDni = (valor) => String(valor ?? '').replace(/[.\s]/g, '');

export const nombreCompleto = (alumno) => `${alumno.nombre} ${alumno.apellido}`;

// Texto sin tildes y en minúsculas, para buscar "Pérez" escribiendo "perez"
export const textoBuscable = (texto) =>
    String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Mismas reglas que el backend, para avisar antes de enviar
export function validarAlumno(datos) {
    const errores = {};
    if (!datos.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
    if (!datos.apellido.trim()) errores.apellido = 'Ingresá el apellido.';

    const dni = normalizarDni(datos.dni);
    if (!dni) errores.dni = 'Ingresá el DNI.';
    else if (!/^\d{6,9}$/.test(dni)) errores.dni = 'Solo números, entre 6 y 9 dígitos.';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) errores.email = 'Ingresá un email válido.';
    if (!datos.fechaPago) errores.fechaPago = 'Elegí la fecha de pago.';
    return errores;
}
