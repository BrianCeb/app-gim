import { useMemo, useState } from 'react';
import { CalendarClock, CircleCheck, CircleOff, Pencil, Plus } from 'lucide-react';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { api } from '../lib/api';
import { textoDias, textoHorario } from '../lib/clases';
import AjustesTabs from '../components/AjustesTabs';
import ClaseForm from '../components/ClaseForm';
import { Confirmacion, Modal } from '../components/Modal';
import { Boton, BotonIcono, Cargando, Encabezado, EstadoVacio, Tarjeta } from '../components/ui';

function BadgeEstado({ activa }) {
    return activa ? (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Activa</span>
    ) : (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">Desactivada</span>
    );
}

const textoAlumnos = (n) => `${n} ${n === 1 ? 'alumno' : 'alumnos'}`;

/* ===============================
   🕒 CLASES / TURNOS (Ajustes, solo administración)
   Una clase es un turno fijo (días + horario). Los alumnos se anotan en una desde su ficha,
   y en Asistencia se los marca con un clic. No se borran: se desactivan.
================================= */
export default function ClasesPage() {
    const { clases, alumnos, cargando, recargarClases, recargarAlumnos } = useDatos();
    const avisar = useAvisos();

    // formulario: null = cerrado, 'nueva' = alta, objeto clase = edición
    const [formulario, setFormulario] = useState(null);
    const [cambiandoEstado, setCambiandoEstado] = useState(null);
    const [guardandoEstado, setGuardandoEstado] = useState(false);

    // Cuántos alumnos tiene cada clase (para saber a quiénes afecta desactivarla)
    const alumnosPorClase = useMemo(() => {
        const conteo = new Map();
        alumnos.forEach((a) => a.clase && conteo.set(a.clase, (conteo.get(a.clase) ?? 0) + 1));
        return conteo;
    }, [alumnos]);

    const recargar = () => Promise.all([recargarClases(), recargarAlumnos()]).catch(() => {});

    const alGuardar = (guardada) => {
        avisar('exito', formulario === 'nueva' ? `Se creó la clase ${guardada.nombre}.` : 'Cambios guardados.');
        setFormulario(null);
        recargar();
    };

    const confirmarEstado = async () => {
        const clase = cambiandoEstado;
        setGuardandoEstado(true);
        try {
            const { nombre, dias, horaInicio, horaFin } = clase;
            await api.editarClase(clase._id, { nombre, dias, horaInicio, horaFin, activa: !clase.activa });
            avisar('exito', clase.activa ? `La clase ${clase.nombre} quedó desactivada.` : `La clase ${clase.nombre} quedó activa.`);
            setCambiandoEstado(null);
            recargar();
        } catch (err) {
            avisar('error', err.message);
        } finally {
            setGuardandoEstado(false);
        }
    };

    const acciones = (clase) => (
        <div className="flex justify-end gap-0.5">
            <BotonIcono etiqueta="Editar" onClick={() => setFormulario(clase)}>
                <Pencil className="size-4.5" />
            </BotonIcono>
            {clase.activa ? (
                <BotonIcono etiqueta="Desactivar" onClick={() => setCambiandoEstado(clase)} className="hover:bg-rose-50 hover:text-rose-600">
                    <CircleOff className="size-4.5" />
                </BotonIcono>
            ) : (
                <BotonIcono etiqueta="Activar" onClick={() => setCambiandoEstado(clase)} className="hover:bg-emerald-50 hover:text-emerald-600">
                    <CircleCheck className="size-4.5" />
                </BotonIcono>
            )}
        </div>
    );

    const activas = clases.filter((c) => c.activa).length;
    const afectados = cambiandoEstado ? alumnosPorClase.get(cambiandoEstado._id) ?? 0 : 0;

    return (
        <>
            <Encabezado titulo="Ajustes" descripcion="Planes de cuota, clases y cuentas del personal" />
            <AjustesTabs />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                    {activas} {activas === 1 ? 'clase activa' : 'clases activas'} de {clases.length}. Cada alumno puede anotarse en una, y en Asistencia
                    se marca la lista de la clase con un clic.
                </p>
                <Boton onClick={() => setFormulario('nueva')} className="w-full shrink-0 sm:w-auto">
                    <Plus className="size-4" aria-hidden /> Nueva clase
                </Boton>
            </div>

            <Tarjeta className="overflow-hidden">
                {cargando ? (
                    <Cargando texto="Cargando clases…" />
                ) : clases.length === 0 ? (
                    <EstadoVacio
                        icono={CalendarClock}
                        titulo="Todavía no hay clases"
                        descripcion="Creá los turnos del gimnasio (por ejemplo, mañana y tarde) para anotar a los alumnos."
                    >
                        <Boton onClick={() => setFormulario('nueva')}>
                            <Plus className="size-4" aria-hidden /> Nueva clase
                        </Boton>
                    </EstadoVacio>
                ) : (
                    <>
                        {/* Tabla (computadora) */}
                        <table className="hidden w-full text-left text-sm md:table">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">Clase</th>
                                    <th className="px-3 py-3">Días</th>
                                    <th className="px-3 py-3">Horario</th>
                                    <th className="px-3 py-3">Alumnos</th>
                                    <th className="px-3 py-3">Estado</th>
                                    <th className="px-5 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {clases.map((clase) => (
                                    <tr key={clase._id} className={`hover:bg-slate-50/60 ${clase.activa ? '' : 'text-slate-400'}`}>
                                        <td className={`px-5 py-3 font-medium ${clase.activa ? 'text-slate-900' : 'text-slate-500'}`}>{clase.nombre}</td>
                                        <td className="px-3 py-3 text-slate-600">{textoDias(clase.dias)}</td>
                                        <td className="px-3 py-3 text-slate-600 tabular-nums">{textoHorario(clase)}</td>
                                        <td className="px-3 py-3 text-slate-600 tabular-nums">{alumnosPorClase.get(clase._id) ?? 0}</td>
                                        <td className="px-3 py-3">
                                            <BadgeEstado activa={clase.activa} />
                                        </td>
                                        <td className="px-5 py-3">{acciones(clase)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Tarjetas (celular) */}
                        <ul className="divide-y divide-slate-100 md:hidden">
                            {clases.map((clase) => (
                                <li key={clase._id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className={`truncate font-medium ${clase.activa ? 'text-slate-900' : 'text-slate-500'}`}>{clase.nombre}</p>
                                            <p className="text-sm text-slate-500">
                                                {textoDias(clase.dias)} · {textoAlumnos(alumnosPorClase.get(clase._id) ?? 0)}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">{textoHorario(clase)}</p>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <BadgeEstado activa={clase.activa} />
                                        {acciones(clase)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Tarjeta>

            <Modal
                abierto={formulario !== null}
                onCerrar={() => setFormulario(null)}
                titulo={formulario === 'nueva' ? 'Nueva clase' : 'Editar clase'}
            >
                {formulario !== null && (
                    <ClaseForm
                        key={formulario === 'nueva' ? 'nueva' : formulario._id}
                        clase={formulario === 'nueva' ? null : formulario}
                        onGuardado={alGuardar}
                        onCancelar={() => setFormulario(null)}
                    />
                )}
            </Modal>

            <Confirmacion
                abierto={cambiandoEstado !== null}
                onCerrar={() => setCambiandoEstado(null)}
                onConfirmar={confirmarEstado}
                titulo={cambiandoEstado?.activa ? 'Desactivar clase' : 'Activar clase'}
                textoConfirmar={cambiandoEstado?.activa ? 'Sí, desactivar' : 'Sí, activar'}
                cargando={guardandoEstado}
            >
                {cambiandoEstado && (
                    <p>
                        {cambiandoEstado.activa ? (
                            <>
                                <strong className="text-slate-900">{cambiandoEstado.nombre}</strong> no se va a poder elegir para alumnos nuevos ni va a
                                aparecer en Asistencia.{' '}
                                {afectados > 0 && <>Los {textoAlumnos(afectados)} anotados la conservan hasta que se los pase a otra clase.</>}
                            </>
                        ) : (
                            <>
                                <strong className="text-slate-900">{cambiandoEstado.nombre}</strong> se va a poder volver a elegir y a aparecer en
                                Asistencia.
                            </>
                        )}
                    </p>
                )}
            </Confirmacion>
        </>
    );
}
