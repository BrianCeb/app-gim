// Cálculo del vencimiento de la cuota según el plan del alumno.
// Todas las fechas son a medianoche UTC (así se guardan las fechas de pago y vencimiento).
// El frontend tiene el mismo cálculo en lib/fechas.js, para mostrar el vencimiento antes de guardar.

// Suma la duración de un plan a una fecha.
// - "meses": mes calendario (5/11 → 5/12). Si el día no existe en el mes de destino,
//   queda el último día de ese mes: 31/1 + 1 mes → 28/2 (o 29/2 en año bisiesto).
// - "dias": días fijos (para un plan semanal, 7 días).
export function sumarDuracion(fecha, { cantidad, unidad }) {
    const resultado = new Date(fecha);

    if (unidad === 'dias') {
        resultado.setUTCDate(resultado.getUTCDate() + cantidad);
        return resultado;
    }

    const dia = resultado.getUTCDate();
    // Primero se va al día 1 del mes de destino (así setUTCMonth nunca "se pasa" al mes siguiente)
    resultado.setUTCDate(1);
    resultado.setUTCMonth(resultado.getUTCMonth() + cantidad);
    // Día 0 del mes siguiente = último día del mes de destino
    const ultimoDia = new Date(Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0)).getUTCDate();
    resultado.setUTCDate(Math.min(dia, ultimoDia));
    return resultado;
}

// Nuevo vencimiento al registrar un pago:
// - Si paga antes de que le venza, el período nuevo se suma al vencimiento actual (no pierde días).
// - Si paga el día que vence o después, el período cuenta desde el día del pago.
// - Sin vencimiento anterior (alta de un alumno), cuenta desde el día del pago.
export function calcularVencimiento({ fechaPago, duracion, vencimientoActual = null }) {
    const pagaAntes = vencimientoActual && fechaPago < vencimientoActual;
    const desde = pagaAntes ? vencimientoActual : fechaPago;
    return sumarDuracion(desde, duracion);
}
