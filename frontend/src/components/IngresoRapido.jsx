import { useRef, useState } from 'react';
import { CircleX, LogIn } from 'lucide-react';
import { api } from '../lib/api';
import { ESTADOS, estadoPago, formatearFecha, textoVencimiento } from '../lib/fechas';
import { nombreCompleto, normalizarDni } from '../lib/alumnos';
import { useDatos } from '../context/DatosContext';
import { Avatar, Boton, Tarjeta, claseInput } from './ui';

const BORDES = { alDia: 'ring-emerald-300 bg-emerald-50/60', porVencer: 'ring-amber-300 bg-amber-50/60', vencido: 'ring-rose-300 bg-rose-50/60' };

// Recepción: se escribe el DNI, se registra el ingreso y se muestra si la cuota está al día
export default function IngresoRapido() {
    const { recargarIngresos } = useDatos();
    const input = useRef(null);
    const [dni, setDni] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null); // { alumno } o { error }

    const registrar = async (e) => {
        e.preventDefault();
        const limpio = normalizarDni(dni);
        if (!limpio) {
            setResultado({ error: 'Escribí el DNI del alumno.' });
            input.current?.focus();
            return;
        }

        setEnviando(true);
        try {
            const ingreso = await api.registrarIngreso(limpio);
            setResultado({ alumno: ingreso.alumno, hora: ingreso.fecha });
            setDni('');
            recargarIngresos().catch(() => {});
        } catch (err) {
            setResultado({
                error: err.message === 'Alumno no encontrado' ? `No hay ningún alumno con DNI ${limpio}.` : err.message
            });
            // Queda seleccionado: al escribir el siguiente DNI se reemplaza en vez de sumarse
            setTimeout(() => input.current?.select(), 0);
        } finally {
            setEnviando(false);
            input.current?.focus();
        }
    };

    const estado = resultado?.alumno && estadoPago(resultado.alumno);

    return (
        <Tarjeta className="p-5">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <LogIn className="size-5 text-slate-500" aria-hidden />
                Registrar ingreso
            </h2>
            <form onSubmit={registrar} className="mt-4 flex gap-2">
                <label htmlFor="dni-ingreso" className="sr-only">
                    DNI del alumno
                </label>
                <input
                    id="dni-ingreso"
                    ref={input}
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="DNI del alumno"
                    className={`${claseInput(false)} text-lg sm:text-lg`}
                />
                <Boton type="submit" cargando={enviando} className="shrink-0 px-5">
                    Registrar
                </Boton>
            </form>

            {resultado?.error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
                    <CircleX className="size-5 shrink-0" aria-hidden />
                    {resultado.error}
                </div>
            )}

            {resultado?.alumno && (
                <div role="status" className={`mt-4 flex items-center gap-4 rounded-xl p-4 ring-2 ${BORDES[estado.clave]}`}>
                    <Avatar alumno={resultado.alumno} tamaño="size-16" />
                    <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-900">{nombreCompleto(resultado.alumno)}</p>
                        <p className={`text-sm font-semibold ${ESTADOS[estado.clave].texto}`}>
                            {estado.clave === 'vencido' ? '⚠ Cuota vencida' : ESTADOS[estado.clave].etiqueta}
                            {' · '}
                            {textoVencimiento(estado.dias)}
                        </p>
                        <p className="text-sm text-slate-500">Vencimiento: {formatearFecha(resultado.alumno.fechaVencimiento)}</p>
                    </div>
                </div>
            )}
        </Tarjeta>
    );
}
