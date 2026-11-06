import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useDatos } from '../context/DatosContext';
import { estadoPago, formatearFecha, textoVencimiento } from '../lib/fechas';
import { nombreCompleto } from '../lib/alumnos';
import RegistrarPago from '../components/RegistrarPago';
import { Avatar, Boton, Cargando, Encabezado, EstadoBadge, EstadoVacio, FiltrosEstado, Tarjeta } from '../components/ui';

const FILTROS_VALIDOS = ['todos', 'vencido', 'porVencer', 'alDia'];

export default function PagosPage() {
    const { alumnos, cargando } = useDatos();
    const [parametros, setParametros] = useSearchParams();
    const [pagando, setPagando] = useState(null);

    // El filtro vive en la URL (?estado=vencido) para poder llegar directo desde el Panel
    const filtro = FILTROS_VALIDOS.includes(parametros.get('estado')) ? parametros.get('estado') : 'todos';
    const cambiarFiltro = (valor) => setParametros(valor === 'todos' ? {} : { estado: valor }, { replace: true });

    const conEstado = useMemo(
        () => alumnos.map((a) => ({ alumno: a, ...estadoPago(a) })).sort((a, b) => a.dias - b.dias),
        [alumnos]
    );

    const conteos = useMemo(() => {
        const c = { todos: conEstado.length, alDia: 0, porVencer: 0, vencido: 0 };
        conEstado.forEach(({ clave }) => c[clave]++);
        return c;
    }, [conEstado]);

    const visibles = filtro === 'todos' ? conEstado : conEstado.filter((x) => x.clave === filtro);

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
                                    </div>
                                </div>
                                <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                                    <EstadoBadge alumno={alumno} />
                                    <Boton variante={dias < 0 ? 'primario' : 'secundario'} className="py-2" onClick={() => setPagando(alumno)}>
                                        Registrar pago
                                    </Boton>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Tarjeta>

            {pagando && <RegistrarPago alumno={pagando} onCerrar={() => setPagando(null)} />}
        </>
    );
}
