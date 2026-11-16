import { useMemo, useState } from 'react';
import { CircleCheck, CircleOff, Pencil, Plus, Tags } from 'lucide-react';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { api } from '../lib/api';
import { formatearPrecio, textoDuracion } from '../lib/planes';
import AjustesTabs from '../components/AjustesTabs';
import PlanForm from '../components/PlanForm';
import { Confirmacion, Modal } from '../components/Modal';
import { Boton, BotonIcono, Cargando, Encabezado, EstadoVacio, Tarjeta } from '../components/ui';

function BadgeEstado({ activo }) {
    return activo ? (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Activo</span>
    ) : (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">Desactivado</span>
    );
}

const textoAlumnos = (n) => `${n} ${n === 1 ? 'alumno' : 'alumnos'}`;

/* ===============================
   🏷️ PLANES DE CUOTA (Ajustes, solo administración)
   Los planes están en DatosContext porque también los usan los formularios de alumno y de pago.
   No se borran: se desactivan (los alumnos que lo tenían lo conservan hasta su próximo pago).
================================= */
export default function PlanesPage() {
    const { planes, alumnos, cargando, recargarPlanes, recargarAlumnos } = useDatos();
    const avisar = useAvisos();

    // formulario: null = cerrado, 'nuevo' = alta, objeto plan = edición
    const [formulario, setFormulario] = useState(null);
    const [cambiandoEstado, setCambiandoEstado] = useState(null);
    const [guardandoEstado, setGuardandoEstado] = useState(false);

    // Cuántos alumnos tiene cada plan (para saber a quiénes afecta un cambio)
    const alumnosPorPlan = useMemo(() => {
        const conteo = new Map();
        alumnos.forEach((a) => a.plan && conteo.set(a.plan._id, (conteo.get(a.plan._id) ?? 0) + 1));
        return conteo;
    }, [alumnos]);

    // Recarga planes y alumnos: los alumnos traen el precio y el aviso de su plan
    const recargar = () => Promise.all([recargarPlanes(), recargarAlumnos()]).catch(() => {});

    const alGuardar = (guardado) => {
        avisar('exito', formulario === 'nuevo' ? `Se creó el plan ${guardado.nombre}.` : 'Cambios guardados.');
        setFormulario(null);
        recargar();
    };

    const confirmarEstado = async () => {
        const plan = cambiandoEstado;
        setGuardandoEstado(true);
        try {
            const { nombre, duracion, precio, diasAviso } = plan;
            await api.editarPlan(plan._id, { nombre, duracion, precio, diasAviso, activo: !plan.activo });
            avisar('exito', plan.activo ? `El plan ${plan.nombre} quedó desactivado.` : `El plan ${plan.nombre} quedó activo.`);
            setCambiandoEstado(null);
            recargar();
        } catch (err) {
            avisar('error', err.message);
        } finally {
            setGuardandoEstado(false);
        }
    };

    const acciones = (plan) => (
        <div className="flex justify-end gap-0.5">
            <BotonIcono etiqueta="Editar" onClick={() => setFormulario(plan)}>
                <Pencil className="size-4.5" />
            </BotonIcono>
            {plan.activo ? (
                <BotonIcono etiqueta="Desactivar" onClick={() => setCambiandoEstado(plan)} className="hover:bg-rose-50 hover:text-rose-600">
                    <CircleOff className="size-4.5" />
                </BotonIcono>
            ) : (
                <BotonIcono etiqueta="Activar" onClick={() => setCambiandoEstado(plan)} className="hover:bg-emerald-50 hover:text-emerald-600">
                    <CircleCheck className="size-4.5" />
                </BotonIcono>
            )}
        </div>
    );

    const activos = planes.filter((p) => p.activo).length;
    const afectados = cambiandoEstado ? alumnosPorPlan.get(cambiandoEstado._id) ?? 0 : 0;

    return (
        <>
            <Encabezado titulo="Ajustes" descripcion="Planes de cuota y cuentas del personal" />
            <AjustesTabs />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                    {activos} {activos === 1 ? 'plan activo' : 'planes activos'} de {planes.length}. Recepción los elige al cargar un alumno o un pago,
                    pero no los puede cambiar.
                </p>
                <Boton onClick={() => setFormulario('nuevo')} className="w-full shrink-0 sm:w-auto">
                    <Plus className="size-4" aria-hidden /> Nuevo plan
                </Boton>
            </div>

            <Tarjeta className="overflow-hidden">
                {cargando ? (
                    <Cargando texto="Cargando planes…" />
                ) : planes.length === 0 ? (
                    <EstadoVacio icono={Tags} titulo="Todavía no hay planes" descripcion="Creá el primer plan para poder dar de alta alumnos." />
                ) : (
                    <>
                        {/* Tabla (computadora) */}
                        <table className="hidden w-full text-left text-sm md:table">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">Plan</th>
                                    <th className="px-3 py-3">Duración</th>
                                    <th className="px-3 py-3 text-right">Precio</th>
                                    <th className="px-3 py-3">Aviso</th>
                                    <th className="px-3 py-3">Alumnos</th>
                                    <th className="px-3 py-3">Estado</th>
                                    <th className="px-5 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {planes.map((plan) => (
                                    <tr key={plan._id} className={`hover:bg-slate-50/60 ${plan.activo ? '' : 'text-slate-400'}`}>
                                        <td className={`px-5 py-3 font-medium ${plan.activo ? 'text-slate-900' : 'text-slate-500'}`}>{plan.nombre}</td>
                                        <td className="px-3 py-3 text-slate-600">{textoDuracion(plan.duracion)}</td>
                                        <td className="px-3 py-3 text-right text-slate-900 tabular-nums">{formatearPrecio(plan.precio)}</td>
                                        <td className="px-3 py-3 text-slate-600">{plan.diasAviso} {plan.diasAviso === 1 ? 'día' : 'días'} antes</td>
                                        <td className="px-3 py-3 text-slate-600 tabular-nums">{alumnosPorPlan.get(plan._id) ?? 0}</td>
                                        <td className="px-3 py-3">
                                            <BadgeEstado activo={plan.activo} />
                                        </td>
                                        <td className="px-5 py-3">{acciones(plan)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Tarjetas (celular) */}
                        <ul className="divide-y divide-slate-100 md:hidden">
                            {planes.map((plan) => (
                                <li key={plan._id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className={`truncate font-medium ${plan.activo ? 'text-slate-900' : 'text-slate-500'}`}>{plan.nombre}</p>
                                            <p className="text-sm text-slate-500">
                                                {textoDuracion(plan.duracion)} · {textoAlumnos(alumnosPorPlan.get(plan._id) ?? 0)}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-slate-900 tabular-nums">{formatearPrecio(plan.precio)}</p>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <BadgeEstado activo={plan.activo} />
                                        {acciones(plan)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Tarjeta>

            <Modal abierto={formulario !== null} onCerrar={() => setFormulario(null)} titulo={formulario === 'nuevo' ? 'Nuevo plan' : 'Editar plan'}>
                {formulario !== null && (
                    <PlanForm
                        key={formulario === 'nuevo' ? 'nuevo' : formulario._id}
                        plan={formulario === 'nuevo' ? null : formulario}
                        onGuardado={alGuardar}
                        onCancelar={() => setFormulario(null)}
                    />
                )}
            </Modal>

            <Confirmacion
                abierto={cambiandoEstado !== null}
                onCerrar={() => setCambiandoEstado(null)}
                onConfirmar={confirmarEstado}
                titulo={cambiandoEstado?.activo ? 'Desactivar plan' : 'Activar plan'}
                textoConfirmar={cambiandoEstado?.activo ? 'Sí, desactivar' : 'Sí, activar'}
                variante={cambiandoEstado?.activo ? 'peligro' : 'exito'}
                cargando={guardandoEstado}
            >
                {cambiandoEstado &&
                    (cambiandoEstado.activo ? (
                        <p>
                            <strong className="text-slate-900">{cambiandoEstado.nombre}</strong> ya no se va a poder elegir para alumnos nuevos ni para cobrar.
                            {afectados > 0 &&
                                ` Lo tienen ${textoAlumnos(afectados)}: conservan su vencimiento, y en su próximo pago hay que elegirles otro plan.`}
                        </p>
                    ) : (
                        <p>
                            <strong className="text-slate-900">{cambiandoEstado.nombre}</strong> se va a poder volver a elegir al cargar alumnos y pagos.
                        </p>
                    ))}
            </Confirmacion>
        </>
    );
}
