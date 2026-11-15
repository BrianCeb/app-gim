import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { api } from '../lib/api';
import { avisoSugerido, validarPlan } from '../lib/planes';
import { Boton, Campo, claseInput } from './ui';

/* ===============================
   Formulario para crear (plan = null) o editar un plan de cuota (solo administración).
   El estado activo no se toca acá: se cambia con su propio botón en la lista.
   onGuardado(planGuardado) se llama cuando el servidor confirma.
================================= */
export default function PlanForm({ plan, onGuardado, onCancelar }) {
    const esNuevo = !plan;

    // Los inputs trabajan con texto; se convierten a número recién al enviar
    const [datos, setDatos] = useState({
        nombre: plan?.nombre ?? '',
        cantidad: String(plan?.duracion.cantidad ?? 1),
        unidad: plan?.duracion.unidad ?? 'meses',
        precio: plan ? String(plan.precio) : '',
        diasAviso: String(plan?.diasAviso ?? avisoSugerido('meses'))
    });
    // Mientras no se toquen los días de aviso, siguen la sugerencia de la unidad (3 meses / 1 días)
    const [avisoTocado, setAvisoTocado] = useState(!esNuevo);
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cambiar = (campo) => (e) => {
        const valor = e.target.value;
        setDatos((d) => {
            const nuevos = { ...d, [campo]: valor };
            if (campo === 'unidad' && !avisoTocado) nuevos.diasAviso = String(avisoSugerido(valor));
            return nuevos;
        });
        if (campo === 'diasAviso') setAvisoTocado(true);
        if (errores[campo]) setErrores((err) => ({ ...err, [campo]: undefined }));
        setErrorGeneral('');
    };

    const guardar = async (e) => {
        e.preventDefault();
        setErrorGeneral('');

        const nuevosErrores = validarPlan(datos);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        setGuardando(true);
        const cuerpo = {
            nombre: datos.nombre.trim(),
            duracion: { cantidad: Number(datos.cantidad), unidad: datos.unidad },
            precio: Number(datos.precio),
            diasAviso: Number(datos.diasAviso)
        };
        try {
            const guardado = esNuevo ? await api.crearPlan(cuerpo) : await api.editarPlan(plan._id, { ...cuerpo, activo: plan.activo });
            onGuardado(guardado);
        } catch (err) {
            setErrorGeneral(err.message);
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={guardar} noValidate className="space-y-5">
            {errorGeneral && (
                <div role="alert" className="flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {errorGeneral}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Campo etiqueta="Nombre" error={errores.nombre} ayuda="Por ejemplo: Mensual, Trimestral, Semanal.">
                        <input value={datos.nombre} onChange={cambiar('nombre')} autoComplete="off" className={claseInput(errores.nombre)} />
                    </Campo>
                </div>
                <Campo etiqueta="Duración" error={errores.cantidad} ayuda="Cuánto cubre cada pago.">
                    <div className="flex gap-2">
                        <input
                            value={datos.cantidad}
                            onChange={cambiar('cantidad')}
                            inputMode="numeric"
                            aria-label="Cantidad"
                            className={`${claseInput(errores.cantidad)} w-20`}
                        />
                        <select value={datos.unidad} onChange={cambiar('unidad')} aria-label="Unidad" className={claseInput(false)}>
                            <option value="meses">Meses</option>
                            <option value="dias">Días</option>
                        </select>
                    </div>
                </Campo>
                <Campo etiqueta="Precio" error={errores.precio} ayuda="En pesos, sin puntos.">
                    <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            value={datos.precio}
                            onChange={cambiar('precio')}
                            inputMode="numeric"
                            placeholder="25000"
                            className={`${claseInput(errores.precio)} pl-7`}
                        />
                    </div>
                </Campo>
                <Campo etiqueta="Aviso de vencimiento" error={errores.diasAviso} ayuda="Días antes del vencimiento en que el alumno aparece “Por vencer”.">
                    <input value={datos.diasAviso} onChange={cambiar('diasAviso')} inputMode="numeric" className={claseInput(errores.diasAviso)} />
                </Campo>
            </div>

            {!esNuevo && (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    Los cambios de duración y precio se aplican desde el próximo pago de cada alumno: los vencimientos actuales no cambian.
                </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Boton type="button" variante="secundario" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </Boton>
                <Boton type="submit" cargando={guardando}>
                    {esNuevo ? 'Crear plan' : 'Guardar cambios'}
                </Boton>
            </div>
        </form>
    );
}
