import { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { useDatos } from '../context/DatosContext';
import { diaArgentinoISO, formatearFechaLarga, formatearHora, hoyISO } from '../lib/fechas';
import { nombreCompleto } from '../lib/alumnos';
import IngresoRapido from '../components/IngresoRapido';
import { Avatar, Cargando, Encabezado, EstadoBadge, EstadoVacio, Tarjeta, claseInput } from '../components/ui';

export default function IngresosPage() {
    const { ingresos, alumnosPorDni, cargando } = useDatos();
    const [dia, setDia] = useState(hoyISO());

    // Los ingresos ya vienen ordenados del más reciente al más antiguo
    const delDia = useMemo(() => ingresos.filter((i) => diaArgentinoISO(i.fecha) === dia), [ingresos, dia]);
    const esHoy = dia === hoyISO();

    return (
        <>
            <Encabezado titulo="Ingresos" descripcion="Registrá la entrada de cada alumno con su DNI." />

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <IngresoRapido />
                </div>

                <Tarjeta className="lg:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                        <div>
                            <h2 className="font-semibold text-slate-900">{esHoy ? 'Ingresos de hoy' : 'Ingresos del día'}</h2>
                            <p className="text-sm text-slate-500">
                                <span className="inline-block first-letter:uppercase">{formatearFechaLarga(dia)}</span> · {delDia.length}{' '}
                                {delDia.length === 1 ? 'ingreso' : 'ingresos'}
                            </p>
                        </div>
                        <label>
                            <span className="sr-only">Elegir día</span>
                            <input
                                type="date"
                                value={dia}
                                max={hoyISO()}
                                onChange={(e) => setDia(e.target.value || hoyISO())}
                                className={`${claseInput(false)} w-auto`}
                            />
                        </label>
                    </div>

                    {cargando ? (
                        <Cargando texto="Cargando ingresos…" />
                    ) : delDia.length === 0 ? (
                        <EstadoVacio icono={Clock} titulo="Sin ingresos" descripcion={esHoy ? 'Todavía nadie ingresó hoy.' : 'No hubo ingresos ese día.'} />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {delDia.map((ingreso) => {
                                const alumno = alumnosPorDni.get(ingreso.dni);
                                return (
                                    <li key={ingreso._id} className="flex items-center gap-3 px-5 py-3">
                                        <span className="w-12 shrink-0 text-sm font-medium text-slate-500 tabular-nums">{formatearHora(ingreso.fecha)}</span>
                                        {alumno ? (
                                            <>
                                                <Avatar alumno={alumno} />
                                                <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{nombreCompleto(alumno)}</p>
                                                <EstadoBadge alumno={alumno} />
                                            </>
                                        ) : (
                                            <p className="flex-1 text-sm text-slate-500">Alumno eliminado (DNI {ingreso.dni})</p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Tarjeta>
            </div>
        </>
    );
}
