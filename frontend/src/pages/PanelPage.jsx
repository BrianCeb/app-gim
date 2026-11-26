import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { useDatos } from '../context/DatosContext';
import { diaArgentinoISO, estadoPago, formatearFechaLarga, hoyISO, textoVencimiento } from '../lib/fechas';
import { nombreCompleto } from '../lib/alumnos';
import { fichaARevisar } from '../lib/fichaSalud';
import IngresoRapido from '../components/IngresoRapido';
import RegistrarPago from '../components/RegistrarPago';
import { Avatar, Boton, Cargando, EstadoBadge, EstadoVacio, Tarjeta } from '../components/ui';

function Indicador({ titulo, valor, a, acento = 'text-slate-900', className = '' }) {
    return (
        <Link to={a} className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition hover:ring-slate-900/15 ${className}`}>
            <p className="text-sm text-slate-500">{titulo}</p>
            <p className={`mt-1 text-3xl font-bold tracking-tight ${acento}`}>{valor}</p>
        </Link>
    );
}

export default function PanelPage() {
    const { alumnos, ingresos, cargando } = useDatos();
    const [pagando, setPagando] = useState(null);

    const resumen = useMemo(() => {
        const conEstado = alumnos.map((a) => ({ alumno: a, ...estadoPago(a) }));
        const hoy = hoyISO();
        return {
            alDia: conEstado.filter((x) => x.clave === 'alDia').length,
            porVencer: conEstado.filter((x) => x.clave === 'porVencer').length,
            vencidos: conEstado.filter((x) => x.clave === 'vencido').length,
            asistenciasHoy: ingresos.filter((i) => diaArgentinoISO(i.fecha) === hoy).length,
            // Alumnos entrenando sin apto físico válido: nunca lo entregaron o ya les venció
            fichaARevisar: alumnos.filter(fichaARevisar).length,
            // Los que necesitan atención: vencidos y por vencer, primero los más urgentes
            atencion: conEstado.filter((x) => x.clave !== 'alDia').sort((a, b) => a.dias - b.dias)
        };
    }, [alumnos, ingresos]);

    return (
        <>
            <div className="mb-6">
                <p className="text-sm font-medium text-slate-500 first-letter:uppercase">{formatearFechaLarga(hoyISO())}</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-3">
                    <IngresoRapido />

                    {/* Cinco bloques de lectura rápida: la asistencia del día, los tres estados de cuota
                        y las fichas de salud a revisar. En celular la grilla se reduce a 2 columnas y el
                        quinto bloque ocupa las dos, para no dejar un hueco */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <Indicador titulo="Asistencias hoy" valor={resumen.asistenciasHoy} a="/ingresos" />
                        <Indicador titulo="Al día" valor={resumen.alDia} a="/pagos?estado=alDia" acento="text-emerald-600" />
                        <Indicador titulo="Por vencer" valor={resumen.porVencer} a="/pagos?estado=porVencer" acento="text-amber-600" />
                        <Indicador titulo="Vencidos" valor={resumen.vencidos} a="/pagos?estado=vencido" acento="text-rose-600" />
                        <Indicador
                            titulo="Ficha a revisar"
                            valor={resumen.fichaARevisar}
                            a="/alumnos?ficha=pendiente"
                            acento={resumen.fichaARevisar > 0 ? 'text-amber-600' : 'text-slate-900'}
                            className="max-sm:col-span-2"
                        />
                    </div>
                </div>

                <Tarjeta className="lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="font-semibold text-slate-900">Cuotas a revisar</h2>
                        <Link to="/pagos" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                            Ver todas
                        </Link>
                    </div>
                    {cargando ? (
                        <Cargando />
                    ) : resumen.atencion.length === 0 ? (
                        <EstadoVacio icono={CalendarCheck} titulo="Todo en orden" descripcion="No hay cuotas vencidas ni por vencer." />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {resumen.atencion.slice(0, 6).map(({ alumno, dias }) => (
                                <li key={alumno._id} className="flex items-center gap-3 px-5 py-3">
                                    <Avatar alumno={alumno} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-900">{nombreCompleto(alumno)}</p>
                                        <p className="text-xs text-slate-500">{textoVencimiento(dias)}</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <EstadoBadge alumno={alumno} />
                                    </div>
                                    <Boton variante="secundario" className="px-3 py-1.5" onClick={() => setPagando(alumno)}>
                                        Pagó
                                    </Boton>
                                </li>
                            ))}
                        </ul>
                    )}
                </Tarjeta>
            </div>

            {pagando && <RegistrarPago alumno={pagando} onCerrar={() => setPagando(null)} />}
        </>
    );
}
