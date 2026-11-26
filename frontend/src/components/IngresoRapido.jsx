import { useRef, useState } from 'react';
import { CircleX, LogIn, Search } from 'lucide-react';
import { api } from '../lib/api';
import { ESTADOS, estadoPago, formatearFecha, formatearHora, textoVencimiento } from '../lib/fechas';
import { nombreCompleto } from '../lib/alumnos';
import { estadoFicha, textoFicha } from '../lib/fichaSalud';
import { useDatos } from '../context/DatosContext';
import { useBuscarAlumno } from '../hooks/useBuscarAlumno';
import { Avatar, Boton, EstadoBadge, Tarjeta, claseInput } from './ui';

const BORDES = { alDia: 'ring-emerald-300 bg-emerald-50/60', porVencer: 'ring-amber-300 bg-amber-50/60', vencido: 'ring-rose-300 bg-rose-50/60' };

// Recepción: se escribe el DNI o el nombre, se registra la asistencia del alumno y se muestra
// si la cuota está al día. Con el DNI completo alcanza con apretar Enter (es único); con un
// nombre aparecen las coincidencias y se elige una.
export default function IngresoRapido() {
    const { recargarIngresos } = useDatos();
    const input = useRef(null);
    const [busqueda, setBusqueda] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null); // { alumno, hora } o { error }

    // Custom hook: busca sobre los alumnos ya cargados, sin consultar al servidor en cada tecla
    const { sugerencias, exacto, total } = useBuscarAlumno(busqueda);

    // Se muestran las sugerencias mientras se escribe, salvo cuando el DNI ya es exacto
    // (ahí no hay nada que elegir) o cuando hay una sola coincidencia, que Enter ya resuelve
    const mostrarSugerencias = !exacto && sugerencias.length > 1;

    const registrar = async (alumno) => {
        setEnviando(true);
        try {
            const ingreso = await api.registrarIngreso(alumno.dni);
            setResultado({ alumno: ingreso.alumno, hora: ingreso.fecha });
            setBusqueda('');
            recargarIngresos().catch(() => {});
        } catch (err) {
            setResultado({ error: err.message });
        } finally {
            setEnviando(false);
            input.current?.focus();
        }
    };

    const enviar = async (e) => {
        e.preventDefault();
        if (!busqueda.trim()) {
            setResultado({ error: 'Escribí el DNI o el nombre del alumno.' });
            input.current?.focus();
            return;
        }

        // Un solo candidato (DNI exacto o una única coincidencia por nombre): se registra directo
        const elegido = exacto ?? (sugerencias.length === 1 ? sugerencias[0] : null);
        if (elegido) return registrar(elegido);

        setResultado({
            error:
                sugerencias.length > 1
                    ? 'Hay varios alumnos con ese nombre: elegí uno de la lista.'
                    : `No hay ningún alumno que coincida con “${busqueda.trim()}”.`
        });
        // Queda seleccionado: al escribir lo siguiente se reemplaza en vez de sumarse
        setTimeout(() => input.current?.select(), 0);
    };

    const escribir = (e) => {
        setBusqueda(e.target.value);
        setResultado(null);
    };

    const estado = resultado?.alumno && estadoPago(resultado.alumno);
    const ficha = resultado?.alumno && estadoFicha(resultado.alumno);

    return (
        <Tarjeta className="p-5">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <LogIn className="size-5 text-slate-500" aria-hidden />
                Registrar asistencia
            </h2>
            <form onSubmit={enviar} className="mt-4 flex gap-2">
                <label htmlFor="buscar-asistencia" className="sr-only">
                    DNI o nombre del alumno
                </label>
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <input
                        id="buscar-asistencia"
                        ref={input}
                        value={busqueda}
                        onChange={escribir}
                        autoComplete="off"
                        placeholder="DNI o nombre del alumno"
                        className={`${claseInput(false)} pl-9 text-lg sm:text-lg`}
                    />
                </div>
                <Boton type="submit" cargando={enviando} className="shrink-0 px-5">
                    Registrar
                </Boton>
            </form>

            {mostrarSugerencias && (
                <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200">
                    {sugerencias.map((alumno) => (
                        <li key={alumno._id}>
                            <button
                                type="button"
                                onClick={() => registrar(alumno)}
                                disabled={enviando}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-60"
                            >
                                <Avatar alumno={alumno} tamaño="size-9" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-slate-900">{nombreCompleto(alumno)}</span>
                                    <span className="block text-xs text-slate-500 tabular-nums">DNI {alumno.dni}</span>
                                </span>
                                <EstadoBadge alumno={alumno} />
                            </button>
                        </li>
                    ))}
                    {total > sugerencias.length && (
                        <li className="bg-slate-50 px-3 py-2 text-xs text-slate-500">
                            Hay {total} alumnos que coinciden. Escribí un poco más para encontrarlo.
                        </li>
                    )}
                </ul>
            )}

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
                        <p className="text-sm text-slate-500">
                            Vencimiento: {formatearFecha(resultado.alumno.fechaVencimiento)} · Asistencia de las {formatearHora(resultado.hora)}
                        </p>
                        {/* La ficha de salud se avisa acá porque es el momento en que el alumno está en el mostrador */}
                        {ficha.clave !== 'alDia' && <p className="mt-1 text-sm font-semibold text-amber-800">⚠ {textoFicha(ficha)}</p>}
                    </div>
                </div>
            )}
        </Tarjeta>
    );
}
