import { useMemo, useState } from 'react';
import { CalendarClock, Check, LoaderCircle } from 'lucide-react';
import { api } from '../lib/api';
import { nombreCompleto } from '../lib/alumnos';
import { alumnosQueYaVinieron, claseDeAhora, clasesDeHoy, estadoClase, textoHorario } from '../lib/clases';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { Avatar, Cargando, EstadoBadge, EstadoVacio, Tarjeta, claseInput } from './ui';

/* ===============================
   Lista de la clase que está pasando: se marca la asistencia con un clic en el nombre.
   Es la vía rápida para los alumnos que vienen siempre al mismo turno; el buscador por DNI o
   nombre sigue estando para los que no tienen clase fija o vienen en otro horario.
================================= */
export default function ListaClase() {
    const { alumnos, ingresos, clases, cargando, recargarIngresos } = useDatos();
    const avisar = useAvisos();

    // Clase elegida a mano; si no se eligió ninguna, la que corresponde a este momento
    const [elegida, setElegida] = useState('');
    const [marcando, setMarcando] = useState(null);

    const deHoy = useMemo(() => clasesDeHoy(clases), [clases]);
    const clase = deHoy.find((c) => c._id === elegida) ?? claseDeAhora(clases);

    // Los alumnos guardan el _id de su clase: se filtran acá, sin pedir nada al servidor
    const deLaClase = useMemo(
        () => (clase ? alumnos.filter((a) => a.clase === clase._id) : []),
        [alumnos, clase]
    );
    const yaVinieron = useMemo(() => alumnosQueYaVinieron(ingresos), [ingresos]);
    const marcados = deLaClase.filter((a) => yaVinieron.has(a._id)).length;

    const marcar = async (alumno) => {
        if (yaVinieron.has(alumno._id)) return; // ya tiene su asistencia de hoy
        setMarcando(alumno._id);
        try {
            await api.registrarIngreso(alumno.dni);
            await recargarIngresos().catch(() => {});
        } catch (err) {
            avisar('error', err.message);
        } finally {
            setMarcando(null);
        }
    };

    if (cargando) {
        return (
            <Tarjeta>
                <Cargando texto="Cargando clases…" />
            </Tarjeta>
        );
    }

    if (!clase) {
        return (
            <Tarjeta>
                <EstadoVacio
                    icono={CalendarClock}
                    titulo="Hoy no hay clases"
                    descripcion="Las clases se crean en Ajustes → Clases. Mientras tanto, la asistencia se registra por DNI o por nombre."
                />
            </Tarjeta>
        );
    }

    return (
        <Tarjeta>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        <CalendarClock className="size-5 text-slate-500" aria-hidden />
                        {clase.nombre}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {textoHorario(clase)} · {estadoClase(clase)} · {marcados} de {deLaClase.length} marcados
                    </p>
                </div>
                {/* Si hoy hay más de una clase, se puede cambiar de turno sin salir de la pantalla */}
                {deHoy.length > 1 && (
                    <label>
                        <span className="sr-only">Elegir clase</span>
                        <select value={clase._id} onChange={(e) => setElegida(e.target.value)} className={`${claseInput(false)} w-auto`}>
                            {deHoy.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.nombre} ({textoHorario(c)})
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {deLaClase.length === 0 ? (
                <EstadoVacio
                    icono={CalendarClock}
                    titulo="Nadie anotado todavía"
                    descripcion={`Para que un alumno aparezca acá, elegí "${clase.nombre}" en su ficha, en Alumnos.`}
                />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {deLaClase.map((alumno) => {
                        const vino = yaVinieron.has(alumno._id);
                        return (
                            <li key={alumno._id}>
                                <button
                                    type="button"
                                    onClick={() => marcar(alumno)}
                                    disabled={vino || marcando === alumno._id}
                                    aria-pressed={vino}
                                    className={`flex w-full items-center gap-3 px-5 py-3 text-left transition ${
                                        vino ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                                    } disabled:cursor-default`}
                                >
                                    <Avatar alumno={alumno} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-slate-900">{nombreCompleto(alumno)}</span>
                                        <span className="block text-xs text-slate-500">{vino ? 'Ya registrada' : 'Tocá para registrar'}</span>
                                    </span>
                                    <EstadoBadge alumno={alumno} />
                                    <span
                                        aria-hidden
                                        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                                            vino ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        {marcando === alumno._id ? (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        ) : (
                                            <Check className="size-4" />
                                        )}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Tarjeta>
    );
}
