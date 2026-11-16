import { useState } from 'react';
import { api } from '../lib/api';
import { calcularVencimiento, formatearFecha, hoyISO } from '../lib/fechas';
import { formatearPrecio, textoDuracion, textoPlan } from '../lib/planes';
import { etiquetaMedio, validarMedio } from '../lib/pagos';
import { nombreCompleto } from '../lib/alumnos';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { Confirmacion } from './Modal';
import { Campo, claseInput } from './ui';
import SelectorMedio from './SelectorMedio';

// Diálogo para renovar la cuota. Por defecto usa la fecha de hoy y el plan del alumno,
// pero se pueden cambiar (si pagó ayer y se carga hoy, o si se pasa a otro plan con este pago).
// HU 12: el medio de pago no viene elegido a propósito, para que quede registrado cómo pagó de verdad.
export default function RegistrarPago({ alumno, onCerrar }) {
    const { recargarAlumnos, planesActivos } = useDatos();
    const avisar = useAvisos();
    const [fechaPago, setFechaPago] = useState(hoyISO());
    // Un plan desactivado ya no se cobra: en ese caso hay que elegir otro
    const [planId, setPlanId] = useState(alumno.plan?.activo ? alumno.plan._id : '');
    const [medio, setMedio] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [intento, setIntento] = useState(false);

    const plan = planesActivos.find((p) => p._id === planId);
    // Mismo cálculo que el backend: pago adelantado se suma al vencimiento actual
    const nuevoVencimiento =
        fechaPago && plan && calcularVencimiento({ fechaPago, duracion: plan.duracion, vencimientoActual: alumno.fechaVencimiento });

    const confirmar = async () => {
        setIntento(true);
        if (!fechaPago || !plan || validarMedio(medio)) return;
        setGuardando(true);
        try {
            const actualizado = await api.registrarPago(alumno._id, fechaPago, plan._id, medio);
            await recargarAlumnos().catch(() => {});
            avisar(
                'exito',
                `Pago de ${formatearPrecio(actualizado.pago.monto)} en ${etiquetaMedio(medio).toLowerCase()} registrado. ${alumno.nombre} queda al día hasta el ${formatearFecha(actualizado.fechaVencimiento)}.`
            );
            onCerrar();
        } catch (err) {
            avisar('error', err.message);
            setGuardando(false);
        }
    };

    return (
        <Confirmacion
            abierto
            onCerrar={onCerrar}
            onConfirmar={confirmar}
            titulo="Registrar pago"
            textoConfirmar={plan?.precio > 0 ? `Registrar ${formatearPrecio(plan.precio)}` : 'Registrar pago'}
            variante="exito"
            cargando={guardando}
        >
            <p className="mb-4">
                Vas a renovar la cuota de <strong className="text-slate-900">{nombreCompleto(alumno)}</strong>.
                {alumno.plan && !alumno.plan.activo && ` Su plan "${alumno.plan.nombre}" ya no se ofrece: elegí otro.`}
            </p>
            <div className="space-y-4">
                <Campo
                    etiqueta="Plan"
                    error={intento && !plan ? 'Elegí un plan.' : null}
                    ayuda={plan && `${formatearPrecio(plan.precio)} por ${textoDuracion(plan.duracion)}.`}
                >
                    <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={claseInput(intento && !plan)}>
                        <option value="">Elegí un plan…</option>
                        {planesActivos.map((p) => (
                            <option key={p._id} value={p._id}>
                                {textoPlan(p)}
                            </option>
                        ))}
                    </select>
                </Campo>
                <Campo
                    etiqueta="Fecha de pago"
                    error={intento && !fechaPago ? 'Elegí una fecha.' : null}
                    ayuda={nuevoVencimiento ? `Nuevo vencimiento: ${formatearFecha(nuevoVencimiento)}` : 'Elegí la fecha y el plan.'}
                >
                    <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} className={claseInput(intento && !fechaPago)} />
                </Campo>
                <SelectorMedio valor={medio} onCambio={setMedio} error={intento ? validarMedio(medio) : null} />
                {/* Lo que hay que cobrar, bien visible: es el precio del plan y no se edita (sin descuentos) */}
                {plan && (
                    <div className="flex items-baseline justify-between rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                        <span className="text-sm font-medium text-slate-600">A cobrar</span>
                        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{formatearPrecio(plan.precio)}</span>
                    </div>
                )}
            </div>
        </Confirmacion>
    );
}
