// Medios de pago aceptados (lista fija, HU 12). Tiene que coincidir con MEDIOS_PAGO de
// backend/src/dao/models/Pago.js: el backend rechaza cualquier otro valor.
// "valor" es lo que se guarda; "etiqueta", lo que se muestra.
export const MEDIOS_PAGO = [
    { valor: 'efectivo', etiqueta: 'Efectivo' },
    { valor: 'transferencia', etiqueta: 'Transferencia' },
    { valor: 'debito', etiqueta: 'Débito' },
    { valor: 'credito', etiqueta: 'Crédito' }
];

// 'debito' → 'Débito' (si llega un valor desconocido, se muestra tal cual)
export const etiquetaMedio = (valor) => MEDIOS_PAGO.find((m) => m.valor === valor)?.etiqueta ?? valor;

// Validación en el cliente antes de enviar (el backend vuelve a validar)
export const validarMedio = (valor) =>
    MEDIOS_PAGO.some((m) => m.valor === valor) ? null : 'Elegí el medio de pago.';
