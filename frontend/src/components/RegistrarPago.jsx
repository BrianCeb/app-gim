import { useState } from 'react';
import { api } from '../lib/api';
import { calcularVencimiento, formatearFecha, hoyISO } from '../lib/fechas';
import { formatearPrecio, textoDuracion, textoPlan } from '../lib/planes';
import { nombreCompleto } from '../lib/alumnos';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { Confirmacion } from './Modal';
import { Campo, claseInput } from './ui';

// Diálogo para renovar la cuota. Por defecto usa la fecha de hoy y el plan del alumno,
// pero se pueden cambiar (si pagó ayer y se carga hoy, o si se pasa a otro plan con este pago).
export default function RegistrarPago({ alumno, onCerrar }) {
    const { recargarAlumnos, planesActivos } = useDatos();
    const avisar = useAvisos();
    const [fechaPago, setFechaPago] = useState(hoyISO());
    // Un plan desactivado ya no se cobra: en ese caso hay que elegir otro
    const [planId, setPlanId] = useState(alumno.plan?.activo ? alumno.plan._id : '');
    const [guardando, setGuardando] = useState(false);
    const [intento, setIntento] = useState(false);

    const plan = planesActivos.find((p) => p._id === planId);
    // Mismo cálculo que el backend: pago adelantado se suma al vencimiento actual
    const nuevoVencimiento =
        fechaPago && plan && calcularVencimiento({ fechaPago, duracion: plan.duracion, vencimientoActual: alumno.fechaVencimiento });

    const confirmar = async () => {
        setIntento(true);
        if (!fechaPago || !plan) return;
        setGuardando(true);
        try {
            const actualizado = await api.registrarPago(alumno._id, fechaPago, plan._id);
            await recargarAlumnos().catch(() => {});
            avisar('exito', `Pago registrado. ${alumno.nombre} queda al día hasta el ${formatearFecha(actualizado.fechaVencimiento)}.`);
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
            </div>
        </Confirmacion>
    );
}
