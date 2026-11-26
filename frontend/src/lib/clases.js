import { diaArgentinoISO, hoyISO } from './fechas';

// Clases (turnos): los alumnos que vienen siempre a los mismos días y horario.
// Los días usan los números de JavaScript: 0 = domingo … 6 = sábado (igual que el backend).

export const DIAS = [
    { valor: 1, nombre: 'Lunes', corto: 'Lun' },
    { valor: 2, nombre: 'Martes', corto: 'Mar' },
    { valor: 3, nombre: 'Miércoles', corto: 'Mié' },
    { valor: 4, nombre: 'Jueves', corto: 'Jue' },
    { valor: 5, nombre: 'Viernes', corto: 'Vie' },
    { valor: 6, nombre: 'Sábado', corto: 'Sáb' },
    { valor: 0, nombre: 'Domingo', corto: 'Dom' }
];

const CORTOS = new Map(DIAS.map((d) => [d.valor, d.corto]));

// [1, 3, 5] → "Lun, Mié y Vie"
export function textoDias(dias = []) {
    const nombres = DIAS.filter((d) => dias.includes(d.valor)).map((d) => d.corto);
    if (nombres.length === 0) return 'Sin días';
    if (nombres.length === 1) return nombres[0];
    return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}

export const textoHorario = (clase) => `${clase.horaInicio} a ${clase.horaFin}`;
export const textoClase = (clase) => `${clase.nombre} · ${textoDias(clase.dias)} ${textoHorario(clase)}`;
export const diaCorto = (valor) => CORTOS.get(valor) ?? '';

// Día de la semana de hoy en Argentina (0 = domingo)
export const diaDeHoy = () => new Date(`${hoyISO()}T00:00:00Z`).getUTCDay();

// Hora actual en Argentina como "HH:MM", para compararla con el horario de la clase
const formatoHoraAR = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
});
export const horaAhora = () => formatoHoraAR.format(new Date());

// Clases activas que se dictan hoy, ordenadas por hora
export const clasesDeHoy = (clases = []) =>
    clases.filter((c) => c.activa && c.dias.includes(diaDeHoy())).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

// Cuál de las clases de hoy conviene mostrar: la que está pasando ahora; si ninguna, la próxima;
// si ya terminaron todas, la última. Así el mostrador siempre ve la lista que necesita.
export function claseDeAhora(clases = []) {
    const deHoy = clasesDeHoy(clases);
    if (deHoy.length === 0) return null;
    const hora = horaAhora();
    return deHoy.find((c) => hora >= c.horaInicio && hora <= c.horaFin) ?? deHoy.find((c) => hora < c.horaInicio) ?? deHoy.at(-1);
}

// "Ahora", "Empieza 18:00" o "Terminó 10:00": en qué momento está la clase respecto de la hora actual
export function estadoClase(clase) {
    const hora = horaAhora();
    if (hora < clase.horaInicio) return `Empieza ${clase.horaInicio}`;
    if (hora > clase.horaFin) return `Terminó ${clase.horaFin}`;
    return 'Ahora';
}

// _id de los alumnos que ya tienen una asistencia registrada hoy (para tildarlos en la lista)
export function alumnosQueYaVinieron(ingresos = []) {
    const hoy = hoyISO();
    return new Set(ingresos.filter((i) => diaArgentinoISO(i.fecha) === hoy).map((i) => i.alumno));
}

// Valida el formulario de una clase. Devuelve { campo: 'mensaje' } (vacío si está todo bien)
export function validarClase(datos) {
    const errores = {};
    if (!datos.nombre.trim()) errores.nombre = 'Ingresá el nombre de la clase.';
    if (datos.dias.length === 0) errores.dias = 'Elegí al menos un día.';
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(datos.horaInicio)) errores.horaInicio = 'Hora inválida.';
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(datos.horaFin)) errores.horaFin = 'Hora inválida.';
    else if (datos.horaFin <= datos.horaInicio) errores.horaFin = 'Tiene que ser posterior al inicio.';
    return errores;
}
