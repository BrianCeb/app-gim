import { diasHasta } from './fechas';

// Ficha de salud (apto físico). Es opcional para dar de alta al alumno, pero el personal
// tiene que poder ver de un vistazo a quién le falta: el apto vale un año y hay que renovarlo.
//
// El alumno trae el resumen en alumno.fichaSalud = { url, fecha, vence }; url vacía = no la entregó.

// Con cuánta anticipación se avisa que hay que renovar el apto
export const DIAS_AVISO_FICHA = 30;

// Se usan los mismos colores que el estado de la cuota (ya revisados para contraste AA),
// pero con etiquetas propias: el texto aclara que habla de la ficha, no del pago
export const ESTADOS_FICHA = {
    alDia: { etiqueta: 'Ficha al día', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', punto: 'bg-emerald-500' },
    porVencer: { etiqueta: 'Ficha por vencer', badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', punto: 'bg-amber-500' },
    vencida: { etiqueta: 'Ficha vencida', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', punto: 'bg-rose-500' },
    sinFicha: { etiqueta: 'Sin ficha', badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', punto: 'bg-slate-500' }
};

// Estado de la ficha del alumno: sinFicha, vencida, porVencer o alDia (dias = los que faltan para vencer)
export function estadoFicha(alumno) {
    const ficha = alumno.fichaSalud;
    if (!ficha?.url || !ficha?.vence) return { clave: 'sinFicha', dias: null };

    const dias = diasHasta(ficha.vence);
    if (dias < 0) return { clave: 'vencida', dias };
    if (dias <= DIAS_AVISO_FICHA) return { clave: 'porVencer', dias };
    return { clave: 'alDia', dias };
}

// "A revisar" = el alumno está entrenando sin apto válido: nunca lo entregó o ya se le venció.
// Es el número que se muestra en el Panel y el que filtra la pantalla de Alumnos.
export const fichaARevisar = (alumno) => ['sinFicha', 'vencida'].includes(estadoFicha(alumno).clave);

export function textoFicha({ clave, dias }) {
    if (clave === 'sinFicha') return 'No entregó el apto físico';
    if (clave === 'vencida') return dias === -1 ? 'El apto venció ayer' : `El apto venció hace ${-dias} días`;
    if (clave === 'porVencer') return dias === 0 ? 'El apto vence hoy' : `El apto vence en ${dias} días`;
    return `El apto vence en ${dias} días`;
}
