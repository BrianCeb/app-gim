import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { ESTADOS, estadoPago } from '../lib/fechas';

// Piezas visuales pequeñas que se repiten en varias pantallas

const VARIANTES_BOTON = {
    primario: 'bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400',
    secundario: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
    peligro: 'bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-300',
    exito: 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-emerald-300'
};

export function Boton({ variante = 'primario', cargando = false, className = '', children, ...props }) {
    return (
        <button
            {...props}
            disabled={cargando || props.disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed ${VARIANTES_BOTON[variante]} ${className}`}
        >
            {cargando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {children}
        </button>
    );
}

export function BotonIcono({ etiqueta, className = '', children, ...props }) {
    return (
        <button
            {...props}
            title={etiqueta}
            aria-label={etiqueta}
            className={`rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900 ${className}`}
        >
            {children}
        </button>
    );
}

export function Campo({ etiqueta, error, children, ayuda }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">{etiqueta}</span>
            {children}
            {error ? (
                <span className="mt-1 block text-sm text-rose-600">{error}</span>
            ) : (
                ayuda && <span className="mt-1 block text-sm text-slate-500">{ayuda}</span>
            )}
        </label>
    );
}

export const claseInput = (conError) =>
    `block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-base text-slate-900 ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm ${
        conError ? 'ring-rose-400 focus:ring-rose-500' : 'ring-slate-300 focus:ring-slate-900'
    }`;

export function Tarjeta({ className = '', children }) {
    return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 ${className}`}>{children}</div>;
}

export function EstadoBadge({ alumno }) {
    const { clave } = estadoPago(alumno);
    const estado = ESTADOS[clave];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${estado.badge}`}>
            <span className={`size-1.5 rounded-full ${estado.punto}`} aria-hidden />
            {estado.etiqueta}
        </span>
    );
}

export function Avatar({ alumno, tamaño = 'size-10' }) {
    const [falloFoto, setFalloFoto] = useState(false);
    const iniciales = `${alumno.nombre?.[0] ?? ''}${alumno.apellido?.[0] ?? ''}`.toUpperCase();

    if (alumno.fotoUrl && !falloFoto) {
        return (
            <img
                src={alumno.fotoUrl}
                alt=""
                onError={() => setFalloFoto(true)}
                className={`${tamaño} shrink-0 rounded-full bg-slate-100 object-cover`}
            />
        );
    }
    return (
        <span
            aria-hidden
            className={`${tamaño} inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600`}
        >
            {iniciales}
        </span>
    );
}

export function Cargando({ texto = 'Cargando…' }) {
    return (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            {texto}
        </div>
    );
}

export function EstadoVacio({ icono: Icono, titulo, descripcion, children }) {
    return (
        <div className="flex flex-col items-center px-6 py-14 text-center">
            {Icono && (
                <span className="mb-4 rounded-full bg-slate-100 p-3 text-slate-500">
                    <Icono className="size-6" aria-hidden />
                </span>
            )}
            <h3 className="font-semibold text-slate-900">{titulo}</h3>
            {descripcion && <p className="mt-1 max-w-sm text-sm text-slate-500">{descripcion}</p>}
            {children && <div className="mt-5">{children}</div>}
        </div>
    );
}

export function Encabezado({ titulo, descripcion, children }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
                {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
            </div>
            {children && <div className="flex gap-2">{children}</div>}
        </div>
    );
}

export function FiltrosEstado({ valor, onCambio, conteos }) {
    const opciones = [
        { clave: 'todos', etiqueta: 'Todos' },
        { clave: 'vencido', etiqueta: 'Vencidos' },
        { clave: 'porVencer', etiqueta: 'Por vencer' },
        { clave: 'alDia', etiqueta: 'Al día' }
    ];
    return (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por estado de pago">
            {opciones.map(({ clave, etiqueta }) => (
                <button
                    key={clave}
                    onClick={() => onCambio(clave)}
                    aria-pressed={valor === clave}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                        valor === clave ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                    }`}
                >
                    {etiqueta}
                    <span className={`ml-1.5 ${valor === clave ? 'text-slate-300' : 'text-slate-400'}`}>{conteos[clave]}</span>
                </button>
            ))}
        </div>
    );
}
