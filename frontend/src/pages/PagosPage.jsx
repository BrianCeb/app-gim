import { useMemo, useState } from 'react';
import { History, Wallet } from 'lucide-react';
import { useDatos } from '../context/DatosContext';
import { useFiltroEstado } from '../hooks/useFiltroEstado';
import { formatearFecha, textoVencimiento } from '../lib/fechas';
import { nombreCompleto } from '../lib/alumnos';
import { textoPlan } from '../lib/planes';
import RegistrarPago from '../components/RegistrarPago';
import HistorialPagos from '../components/HistorialPagos';
import { Avatar, Boton, Cargando, Encabezado, EstadoBadge, EstadoVacio, FiltrosEstado, Tarjeta } from '../components/ui';

export default function PagosPage() {
    const { alumnos, cargando } = useDatos();
    const [pagando, setPagando] = useState(null);
    const [viendoHistorial, setViendoHistorial] = useState(null);

    // Custom hook: estado de cada alumno, conteos y filtro. enUrl: el filtro vive en la dirección
    // (?estado=vencido) para poder llegar directo desde el Panel
    const { filtrados, conteos, filtro, cambiarFiltro } = useFiltroEstado(alumnos, { enUrl: true });

    // Primero los más urgentes: menos días para el vencimiento (los vencidos tienen días negativos)
    const visibles = useMemo(() => [...filtrados].sort((a, b) => a.dias - b.dias), [filtrados]);

    return (
        <>
            <Encabezado titulo="Pagos" descripcion="Cuotas ordenadas por vencimiento: primero las más urgentes." />

            <div className="mb-4">
                <FiltrosEstado valor={filtro} onCambio={cambiarFiltro} conteos={conteos} />
            </div>

            <Tarjeta className="overflow-hidden">
                {cargando ? (
                    <Cargando />
                ) : visibles.length === 0 ? (
                    <EstadoVacio
                        icono={Wallet}
                        titulo={alumnos.length === 0 ? 'Todavía no hay alumnos' : 'Nada por acá'}
                        descripcion={alumnos.length === 0 ? 'Cuando agregues alumnos vas a ver sus cuotas acá.' : 'No hay alumnos con este estado de pago.'}
                    />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {visibles.map(({ alumno, dias }) => (
                            <li key={alumno._id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                                <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                                    <Avatar alumno={alumno} />
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-900">{nombreCompleto(alumno)}</p>
                                        <p className="text-sm text-slate-500">
                                            {textoVencimiento(dias)} · <span className="tabular-nums">{formatearFecha(alumno.fechaVencimiento)}</span>
                                        </p>
                                        {/* Plan y precio vigente: lo que hay que cobrarle al renovar */}
                                        <p className="truncate text-sm text-slate-500">{alumno.plan ? textoPlan(alumno.plan) : 'Sin plan asignado'}</p>
                                    </div>
                                </div>
                                <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                                    <EstadoBadge alumno={alumno} />
                                    <div className="flex gap-2">
                                        <Boton variante="secundario" className="py-2" onClick={() => setViendoHistorial(alumno)}>
                                            <History className="size-4" aria-hidden /> Historial
                                        </Boton>
                                        <Boton variante={dias < 0 ? 'primario' : 'secundario'} className="py-2" onClick={() => setPagando(alumno)}>
                                            Registrar pago
                                        </Boton>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Tarjeta>

            {pagando && <RegistrarPago alumno={pagando} onCerrar={() => setPagando(null)} />}
            {viendoHistorial && <HistorialPagos alumno={viendoHistorial} onCerrar={() => setViendoHistorial(null)} />}
        </>
    );
}
