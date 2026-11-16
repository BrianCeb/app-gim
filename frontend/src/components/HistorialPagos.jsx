import { useState } from 'react';
import { CircleAlert, ReceiptText, Undo2 } from 'lucide-react';
import { api } from '../lib/api';
import { puede } from '../lib/permisos';
import { diaArgentinoISO, formatearFecha } from '../lib/fechas';
import { formatearPrecio } from '../lib/planes';
import { etiquetaMedio } from '../lib/pagos';
import { nombreCompleto } from '../lib/alumnos';
import { useAuth } from '../hooks/useAuth';
import { useHistorialPagos } from '../hooks/useHistorialPagos';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { Modal } from './Modal';
import { Boton, Cargando, EstadoVacio } from './ui';

// Historial de pagos de un alumno (HU 12). Lo ven los dos roles; anular es solo de administración.
// Los datos los trae el custom hook useHistorialPagos: este componente solo los dibuja.
export default function HistorialPagos({ alumno, onCerrar }) {
    const { usuario } = useAuth();
    const { recargarAlumnos } = useDatos();
    const avisar = useAvisos();
    const { pagos, cargando, error, recargar, anulable } = useHistorialPagos(alumno._id);

    // Recepción no ve el botón; igual la API responde 403 si alguien intenta anular
    const puedeAnular = puede(usuario, 'anularPago');
    // La confirmación se muestra dentro del mismo modal (no una ventana encima de otra)
    const [confirmando, setConfirmando] = useState(false);
    const [anulando, setAnulando] = useState(false);

    const anular = async () => {
        setAnulando(true);
        try {
            await api.anularPago(anulable._id);
            await Promise.all([recargar(), recargarAlumnos().catch(() => {})]);
            avisar('exito', `Pago anulado. El vencimiento volvió al ${formatearFecha(anulable.vencimientoAnterior)}.`);
            setConfirmando(false);
        } catch (err) {
            avisar('error', err.message);
        } finally {
            setAnulando(false);
        }
    };

    return (
        <Modal abierto onCerrar={onCerrar} titulo="Historial de pagos">
            <p className="mb-4 text-sm text-slate-500">
                Pagos de <strong className="font-semibold text-slate-900">{nombreCompleto(alumno)}</strong>, del más reciente al más viejo.
            </p>

            {cargando ? (
                <Cargando texto="Cargando pagos…" />
            ) : error ? (
                <div role="alert" className="flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {error}
                </div>
            ) : pagos.length === 0 ? (
                <EstadoVacio
                    icono={ReceiptText}
                    titulo="Sin pagos registrados"
                    descripcion="El historial empezó con la HU 12: los pagos anteriores no tienen monto ni medio guardados."
                />
            ) : (
                <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                    {pagos.map((pago) => (
                        <li key={pago._id} className={`px-4 py-3 ${pago.vigente ? '' : 'bg-slate-50'}`}>
                            <div className="flex items-baseline justify-between gap-3">
                                {/* Fecha y monto arriba y grandes: es lo primero que se busca */}
                                <p className={`font-semibold tabular-nums ${pago.vigente ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                                    {formatearFecha(pago.fecha)}
                                </p>
                                <p className={`text-lg font-bold tabular-nums ${pago.vigente ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                                    {formatearPrecio(pago.monto)}
                                </p>
                            </div>
                            <p className="text-sm text-slate-500">
                                {pago.planNombre} · {etiquetaMedio(pago.medio)} · cubre hasta el {formatearFecha(pago.vencimientoNuevo)}
                            </p>
                            <p className="text-xs text-slate-500">Registró: {pago.usuarioNombre}</p>

                            {!pago.vigente && (
                                <p className="mt-1 text-xs font-semibold text-rose-700">
                                    Anulado el {formatearFecha(diaArgentinoISO(pago.anulado.fecha))} por {pago.anulado.usuarioNombre}
                                </p>
                            )}

                            {puedeAnular && anulable?._id === pago._id && !confirmando && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmando(true)}
                                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-500"
                                >
                                    <Undo2 className="size-3.5" aria-hidden /> Anular este pago
                                </button>
                            )}

                            {confirmando && anulable?._id === pago._id && (
                                <div role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
                                    <p>
                                        ¿Anular el pago de <strong>{formatearPrecio(pago.monto)}</strong> del {formatearFecha(pago.fecha)}? El vencimiento
                                        vuelve al <strong>{formatearFecha(pago.vencimientoAnterior)}</strong>. El pago queda en el historial, tachado.
                                    </p>
                                    <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                        <Boton variante="secundario" className="py-2" onClick={() => setConfirmando(false)} disabled={anulando}>
                                            Cancelar
                                        </Boton>
                                        <Boton variante="peligro" className="py-2" onClick={anular} cargando={anulando}>
                                            Sí, anular
                                        </Boton>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {puedeAnular && pagos.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">Solo se puede anular el último pago. El del alta se corrige desde "Editar alumno".</p>
            )}
        </Modal>
    );
}
