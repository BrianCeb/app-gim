import { useId } from 'react';
import { MEDIOS_PAGO } from '../lib/pagos';

// Botones grandes para elegir el medio de pago (se usa al cobrar y en el alta).
// Botones en vez de un <select>: son 4 opciones, se ven todas juntas y se eligen con un toque.
// En 2 columnas: botones anchos, fáciles de tocar (ley de Fitts) y "Transferencia" entra completa.
// Se comportan como un grupo de radio: role="radiogroup" y aria-checked para lectores de pantalla.
export default function SelectorMedio({ valor, onCambio, error }) {
    const idEtiqueta = useId();
    return (
        <div>
            <span id={idEtiqueta} className="mb-1.5 block text-sm font-medium text-slate-700">
                Medio de pago
            </span>
            <div role="radiogroup" aria-labelledby={idEtiqueta} className="grid grid-cols-2 gap-2">
                {MEDIOS_PAGO.map((m) => {
                    const elegido = valor === m.valor;
                    return (
                        <button
                            key={m.valor}
                            type="button"
                            role="radio"
                            aria-checked={elegido}
                            onClick={() => onCambio(m.valor)}
                            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                                elegido
                                    ? 'bg-slate-900 text-white'
                                    : `bg-white text-slate-700 ring-1 hover:bg-slate-50 ${error ? 'ring-rose-400' : 'ring-slate-300'}`
                            }`}
                        >
                            {m.etiqueta}
                        </button>
                    );
                })}
            </div>
            {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
        </div>
    );
}
