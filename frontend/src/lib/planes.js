// Textos y validaciones de los planes de cuota (mismas reglas que backend/src/routes/planes.router.js)

const formatoPesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

// 25000 → "$ 25.000"
export const formatearPrecio = (precio) => formatoPesos.format(precio ?? 0);

// "1 mes", "3 meses", "7 días"
export function textoDuracion({ cantidad, unidad }) {
    if (unidad === 'dias') return `${cantidad} ${cantidad === 1 ? 'día' : 'días'}`;
    return `${cantidad} ${cantidad === 1 ? 'mes' : 'meses'}`;
}

// "Mensual · $ 25.000" (para las opciones de los selectores)
export const textoPlan = (plan) => `${plan.nombre} · ${formatearPrecio(plan.precio)}`;

// Aviso "por vencer" sugerido: 3 días para planes de meses, 1 para planes de días
export const avisoSugerido = (unidad) => (unidad === 'dias' ? 1 : 3);

const esEnteroDesde = (texto, minimo) => /^\d+$/.test(String(texto).trim()) && Number(texto) >= minimo;

// Valida el formulario de un plan. Devuelve { campo: 'mensaje' } (vacío si está todo bien)
export function validarPlan(datos) {
    const errores = {};
    if (!datos.nombre.trim()) errores.nombre = 'Ingresá el nombre del plan.';
    if (!esEnteroDesde(datos.cantidad, 1)) errores.cantidad = 'Número entero, 1 o más.';
    if (!esEnteroDesde(datos.precio, 0)) errores.precio = 'Precio en pesos, sin puntos ni centavos.';
    if (!esEnteroDesde(datos.diasAviso, 0)) errores.diasAviso = 'Número entero, 0 o más.';
    else if (datos.unidad === 'dias' && Number(datos.diasAviso) >= Number(datos.cantidad)) {
        errores.diasAviso = 'Tiene que ser menos que la duración del plan.';
    }
    return errores;
}
