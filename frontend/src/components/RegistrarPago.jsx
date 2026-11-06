import { useState } from 'react';
import { api } from '../lib/api';
import { DIAS_CUOTA, formatearFecha, hoyISO, sumarDias } from '../lib/fechas';
import { nombreCompleto } from '../lib/alumnos';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { Confirmacion } from './Modal';
import { Campo, claseInput } from './ui';

// Diálogo para renovar la cuota. Por defecto usa la fecha de hoy, pero se puede cambiar
// (por ejemplo, si el alumno pagó ayer y se carga hoy).
export default function RegistrarPago({ alumno, onCerrar }) {
    const { recargarAlumnos } = useDatos();
    const avisar = useAvisos();
    const [fechaPago, setFechaPago] = useState(hoyISO());
    const [guardando, setGuardando] = useState(false);

    const confirmar = async () => {
        if (!fechaPago) return;
        setGuardando(true);
        try {
            await api.registrarPago(alumno._id, fechaPago);
            await recargarAlumnos().catch(() => {});
            avisar('exito', `Pago registrado. ${alumno.nombre} queda al día hasta el ${formatearFecha(sumarDias(fechaPago, DIAS_CUOTA))}.`);
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
            textoConfirmar="Registrar pago"
            variante="exito"
            cargando={guardando}
        >
            <p className="mb-4">
                Vas a renovar la cuota de <strong className="text-slate-900">{nombreCompleto(alumno)}</strong>.
            </p>
            <Campo
                etiqueta="Fecha de pago"
                ayuda={fechaPago ? `Nuevo vencimiento: ${formatearFecha(sumarDias(fechaPago, DIAS_CUOTA))}` : 'Elegí una fecha.'}
            >
                <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} className={claseInput(!fechaPago)} />
            </Campo>
        </Confirmacion>
    );
}
