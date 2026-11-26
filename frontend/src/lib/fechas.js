// Las fechas de pago y vencimiento se guardan a medianoche UTC, así que se muestran en UTC
// para que no "salten" un día. Los ingresos son un momento exacto y se muestran en hora argentina.
const ZONA_AR = 'America/Argentina/Buenos_Aires';
const MS_DIA = 24 * 60 * 60 * 1000;

// Si un alumno no tiene plan (datos viejos sin migrar), se usa el aviso de siempre: 3 días
export const DIAS_POR_VENCER = 3;

const formatoFecha = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
const formatoFechaCorta = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
const formatoFechaLarga = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
const formatoHora = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA_AR, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const formatoISOArgentina = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_AR });

// "YYYY-MM-DD" de hoy en Argentina
export const hoyISO = () => formatoISOArgentina.format(new Date());

// "YYYY-MM-DD" del día argentino en que ocurrió un momento (para agrupar ingresos)
export const diaArgentinoISO = (fecha) => formatoISOArgentina.format(new Date(fecha));

// Fecha guardada en la base -> "YYYY-MM-DD" (para inputs type="date")
export const fechaAISO = (fecha) => (fecha ? new Date(fecha).toISOString().slice(0, 10) : '');

// Aceptan tanto fechas de la base como textos "YYYY-MM-DD"
const aFecha = (fecha) => new Date(String(fecha).length === 10 ? `${fecha}T00:00:00Z` : fecha);
export const formatearFecha = (fecha) => (fecha ? formatoFecha.format(aFecha(fecha)) : '—');
export const formatearFechaCorta = (fecha) => formatoFechaCorta.format(aFecha(fecha));
export const formatearFechaLarga = (fecha) => formatoFechaLarga.format(aFecha(fecha));
export const formatearHora = (fecha) => formatoHora.format(new Date(fecha));

export function sumarDias(iso, dias) {
    const fecha = new Date(`${iso}T00:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() + dias);
    return fecha.toISOString().slice(0, 10);
}

// Lunes de la semana (argentina) a la que pertenece un día "YYYY-MM-DD".
// Se usa para contar cuántas clases hizo el alumno en la semana que paga su plan
export function lunesDeLaSemana(iso = hoyISO()) {
    const dia = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = domingo
    return sumarDias(iso, dia === 0 ? -6 : 1 - dia);
}

// Mismo cálculo que backend/src/utils/vencimiento.js, para mostrar el vencimiento antes de guardar.
// Trabaja con textos "YYYY-MM-DD". "meses" = mes calendario (31/1 + 1 mes → 28/2); "dias" = días fijos
export function sumarDuracion(iso, { cantidad, unidad }) {
    if (unidad === 'dias') return sumarDias(iso, cantidad);
    const [anio, mes, dia] = iso.split('-').map(Number);
    // Date.UTC(año, mes destino + 1, 0) = último día del mes destino
    const ultimoDia = new Date(Date.UTC(anio, mes - 1 + cantidad + 1, 0)).getUTCDate();
    return new Date(Date.UTC(anio, mes - 1 + cantidad, Math.min(dia, ultimoDia))).toISOString().slice(0, 10);
}

// Pago adelantado: se suma al vencimiento actual. Pago el día que vence o después: desde la fecha de pago
export function calcularVencimiento({ fechaPago, duracion, vencimientoActual = null }) {
    const actual = vencimientoActual ? fechaAISO(vencimientoActual) : null;
    const desde = actual && fechaPago < actual ? actual : fechaPago;
    return sumarDuracion(desde, duracion);
}

export function diasHasta(fechaVencimiento) {
    const hoy = Date.parse(`${hoyISO()}T00:00:00Z`);
    return Math.round((Date.parse(`${fechaAISO(fechaVencimiento)}T00:00:00Z`) - hoy) / MS_DIA);
}

export const ESTADOS = {
    alDia: { etiqueta: 'Al día', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', punto: 'bg-emerald-500', texto: 'text-emerald-700', color: '#10b981' },
    porVencer: { etiqueta: 'Por vencer', badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', punto: 'bg-amber-500', texto: 'text-amber-700', color: '#f59e0b' },
    vencido: { etiqueta: 'Vencido', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', punto: 'bg-rose-500', texto: 'text-rose-700', color: '#f43f5e' }
};

// Cada plan define con cuántos días de anticipación el alumno aparece "por vencer"
export function estadoPago(alumno) {
    const dias = diasHasta(alumno.fechaVencimiento);
    const diasAviso = alumno.plan?.diasAviso ?? DIAS_POR_VENCER;
    if (dias < 0) return { clave: 'vencido', dias };
    if (dias <= diasAviso) return { clave: 'porVencer', dias };
    return { clave: 'alDia', dias };
}

export function textoVencimiento(dias) {
    if (dias < -1) return `Venció hace ${-dias} días`;
    if (dias === -1) return 'Venció ayer';
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return `Vence en ${dias} días`;
}
