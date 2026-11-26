import { useRef, useState } from 'react';
import { Camera, CircleAlert, FileText, Paperclip, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { fechaAISO, formatearFecha, hoyISO, sumarDuracion } from '../lib/fechas';
import { formatearPrecio, textoDuracion, textoPlan } from '../lib/planes';
import { validarMedio } from '../lib/pagos';
import { achicarImagen } from '../lib/imagen';
import { leerFichaSalud } from '../lib/archivo';
import { normalizarDni, validarAlumno } from '../lib/alumnos';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { Boton, Campo, FichaBadge, claseInput } from './ui';
import SelectorMedio from './SelectorMedio';

// Formulario para crear (alumno = null) o editar un alumno, incluida su foto
export default function AlumnoForm({ alumno, onTerminar }) {
    const { recargarAlumnos, planesActivos } = useDatos();
    const avisar = useAvisos();
    const inputFoto = useRef(null);
    const inputFicha = useRef(null);

    const [datos, setDatos] = useState({
        nombre: alumno?.nombre ?? '',
        apellido: alumno?.apellido ?? '',
        dni: alumno?.dni ?? '',
        email: alumno?.email ?? '',
        fechaPago: alumno ? fechaAISO(alumno.fechaPago) : hoyISO(),
        // Alta: si hay un solo plan, ya viene elegido. Edición: el plan que tiene el alumno
        plan: alumno?.plan?._id ?? (planesActivos.length === 1 ? planesActivos[0]._id : '')
    });
    // Solo en el alta: el alta es el primer pago y queda en el historial con su medio (HU 12).
    // Al editar no se pide: editar no es cobrar
    const [medio, setMedio] = useState('');
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [guardando, setGuardando] = useState(false);
    // foto: null = sin cambios, { dataUrl } = foto nueva, { quitar: true } = borrar la actual
    const [foto, setFoto] = useState(null);
    // Ficha de salud (apto físico), con la misma idea que la foto: null = sin cambios,
    // { dataUrl, nombre } = archivo nuevo, { quitar: true } = borrar la que tenía.
    // La fecha es la del certificado del médico y solo se pide cuando se adjunta un archivo nuevo
    const [ficha, setFicha] = useState(null);
    const [fechaFicha, setFechaFicha] = useState(hoyISO());

    // Opciones del selector: los planes activos y, si el alumno tiene uno que ya no se ofrece, también ese
    const planActualInactivo = alumno?.plan && !alumno.plan.activo ? alumno.plan : null;
    const opcionesPlan = planActualInactivo ? [...planesActivos, planActualInactivo] : planesActivos;
    const planElegido = opcionesPlan.find((p) => p._id === datos.plan);

    const vistaPrevia = foto?.dataUrl ?? (foto?.quitar ? null : alumno?.fotoUrl || null);
    // Ficha que el alumno ya tiene guardada (null en el alta o si nunca entregó el apto)
    const fichaActual = alumno?.fichaSalud?.url ? alumno.fichaSalud : null;

    const cambiar = (campo) => (e) => {
        setDatos((d) => ({ ...d, [campo]: e.target.value }));
        if (errores[campo]) setErrores((err) => ({ ...err, [campo]: undefined }));
        setErrorGeneral('');
    };

    const elegirFoto = async (e) => {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        if (!archivo) return;
        try {
            setFoto({ dataUrl: await achicarImagen(archivo) });
        } catch (err) {
            avisar('error', err.message);
        }
    };

    const elegirFicha = async (e) => {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        if (!archivo) return;
        try {
            setFicha(await leerFichaSalud(archivo));
            setErrores((err) => ({ ...err, fichaSalud: undefined }));
        } catch (err) {
            avisar('error', err.message);
        }
    };

    const guardar = async (e) => {
        e.preventDefault();
        setErrorGeneral('');

        const nuevosErrores = validarAlumno(datos);
        if (!alumno && validarMedio(medio)) nuevosErrores.medio = validarMedio(medio);
        // La ficha es opcional, pero si se adjunta una hace falta la fecha del apto para saber cuándo vence
        if (ficha?.dataUrl) {
            if (!fechaFicha) nuevosErrores.fichaSalud = 'Indicá la fecha del apto físico.';
            else if (fechaFicha > hoyISO()) nuevosErrores.fichaSalud = 'La fecha del apto no puede ser futura.';
        }
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        setGuardando(true);
        const cuerpo = { ...datos, dni: normalizarDni(datos.dni), ...(alumno ? {} : { medio }) };
        let guardado;
        try {
            guardado = alumno ? await api.editarAlumno(alumno._id, cuerpo) : await api.crearAlumno(cuerpo);
        } catch (err) {
            setErrorGeneral(err.message);
            setGuardando(false);
            return;
        }

        // El alumno ya quedó guardado; la foto y la ficha son archivos aparte, así que si una falla
        // se avisa pero no se pierde lo demás
        const problemas = [];
        try {
            if (foto?.dataUrl) await api.subirFoto(guardado._id, foto.dataUrl);
            else if (foto?.quitar && alumno?.fotoUrl) await api.eliminarFoto(guardado._id);
        } catch (err) {
            problemas.push(`la foto (${err.message})`);
        }
        try {
            if (ficha?.dataUrl) await api.subirFicha(guardado._id, ficha.dataUrl, fechaFicha, ficha.nombre);
            else if (ficha?.quitar && alumno?.fichaSalud?.url) await api.eliminarFicha(guardado._id);
        } catch (err) {
            problemas.push(`la ficha de salud (${err.message})`);
        }

        if (problemas.length > 0) avisar('alerta', `El alumno se guardó, pero hubo un problema con ${problemas.join(' y con ')}.`);
        else avisar('exito', alumno ? 'Cambios guardados.' : `${guardado.nombre} ${guardado.apellido} fue agregado.`);

        await recargarAlumnos().catch(() => {});
        setGuardando(false);
        onTerminar();
    };

    return (
        <form onSubmit={guardar} noValidate className="space-y-5">
            {errorGeneral && (
                <div role="alert" className="flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {errorGeneral}
                </div>
            )}

            <div className="flex items-center gap-4">
                {vistaPrevia ? (
                    <img src={vistaPrevia} alt="Foto del alumno" className="size-20 rounded-full bg-slate-100 object-cover" />
                ) : (
                    <span className="flex size-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Camera className="size-7" aria-hidden />
                    </span>
                )}
                <div className="flex flex-col items-start gap-1.5">
                    <Boton type="button" variante="secundario" onClick={() => inputFoto.current?.click()} className="py-2">
                        <Camera className="size-4" aria-hidden />
                        {vistaPrevia ? 'Cambiar foto' : 'Agregar foto'}
                    </Boton>
                    {vistaPrevia && (
                        <button
                            type="button"
                            onClick={() => setFoto({ quitar: true })}
                            className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-500"
                        >
                            <Trash2 className="size-3.5" aria-hidden /> Quitar foto
                        </button>
                    )}
                    <input ref={inputFoto} type="file" accept="image/*" onChange={elegirFoto} className="hidden" />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Nombre" error={errores.nombre}>
                    <input value={datos.nombre} onChange={cambiar('nombre')} autoComplete="off" className={claseInput(errores.nombre)} />
                </Campo>
                <Campo etiqueta="Apellido" error={errores.apellido}>
                    <input value={datos.apellido} onChange={cambiar('apellido')} autoComplete="off" className={claseInput(errores.apellido)} />
                </Campo>
                <Campo etiqueta="DNI" error={errores.dni}>
                    <input
                        value={datos.dni}
                        onChange={cambiar('dni')}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="Sin puntos"
                        className={claseInput(errores.dni)}
                    />
                </Campo>
                <Campo etiqueta="Email" error={errores.email}>
                    <input type="email" value={datos.email} onChange={cambiar('email')} autoComplete="off" className={claseInput(errores.email)} />
                </Campo>
                <Campo etiqueta="Plan" error={errores.plan} ayuda={planElegido && `Cada pago cubre ${textoDuracion(planElegido.duracion)}.`}>
                    <select value={datos.plan} onChange={cambiar('plan')} className={claseInput(errores.plan)}>
                        <option value="">Elegí un plan…</option>
                        {opcionesPlan.map((p) => (
                            <option key={p._id} value={p._id}>
                                {textoPlan(p)}
                                {p.activo ? '' : ' (ya no se ofrece)'}
                            </option>
                        ))}
                    </select>
                </Campo>
                <Campo etiqueta="Fecha de pago" error={errores.fechaPago} ayuda={textoVence(alumno, datos, planElegido)}>
                    <input type="date" value={datos.fechaPago} onChange={cambiar('fechaPago')} className={claseInput(errores.fechaPago)} />
                </Campo>
            </div>

            {/* Ficha de salud: es opcional para poder guardar (en el mostrador no siempre la traen),
                pero si falta el alumno queda marcado en el listado y en el Panel */}
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FileText className="size-4 text-slate-500" aria-hidden />
                            Ficha de salud (apto físico)
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">PDF o foto del certificado. Vale un año desde la fecha del apto.</p>
                    </div>
                    {alumno && !ficha && <FichaBadge alumno={alumno} todos />}
                </div>

                {ficha?.dataUrl ? (
                    <p className="flex items-center gap-2 text-sm text-slate-700">
                        <Paperclip className="size-4 shrink-0 text-slate-500" aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-medium">{ficha.nombre}</span>
                    </p>
                ) : fichaActual && !ficha?.quitar ? (
                    <p className="text-sm text-slate-700">
                        Apto del <strong className="font-semibold">{formatearFecha(fichaActual.fecha)}</strong>, vence el{' '}
                        <strong className="font-semibold">{formatearFecha(fichaActual.vence)}</strong>.{' '}
                        <a
                            href={fichaActual.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-slate-900 underline decoration-slate-400 hover:decoration-slate-900"
                        >
                            Ver ficha
                        </a>
                    </p>
                ) : (
                    <p className="text-sm text-slate-500">
                        {ficha?.quitar
                            ? 'Al guardar se va a quitar la ficha cargada.'
                            : 'Todavía no hay ficha. El alumno se puede guardar igual y queda marcado como “Sin ficha”.'}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <Boton type="button" variante="secundario" onClick={() => inputFicha.current?.click()} className="py-2">
                        <Paperclip className="size-4" aria-hidden />
                        {fichaActual || ficha?.dataUrl ? 'Reemplazar ficha' : 'Adjuntar ficha'}
                    </Boton>
                    {(ficha?.dataUrl || (fichaActual && !ficha?.quitar)) && (
                        <button
                            type="button"
                            onClick={() => setFicha(ficha?.dataUrl ? null : { quitar: true })}
                            className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-500"
                        >
                            <Trash2 className="size-3.5" aria-hidden /> {ficha?.dataUrl ? 'Descartar archivo' : 'Quitar ficha'}
                        </button>
                    )}
                    <input ref={inputFicha} type="file" accept="application/pdf,image/*" onChange={elegirFicha} className="hidden" />
                </div>

                {/* La fecha del certificado solo se pide con un archivo nuevo: de ella sale el vencimiento */}
                {ficha?.dataUrl && (
                    <div className="max-w-56">
                        <Campo
                            etiqueta="Fecha del apto"
                            error={errores.fichaSalud}
                            ayuda={fechaFicha && `Vence el ${formatearFecha(vencimientoApto(fechaFicha))}.`}
                        >
                            <input
                                type="date"
                                value={fechaFicha}
                                max={hoyISO()}
                                onChange={(e) => {
                                    setFechaFicha(e.target.value);
                                    setErrores((err) => ({ ...err, fichaSalud: undefined }));
                                }}
                                className={claseInput(errores.fichaSalud)}
                            />
                        </Campo>
                    </div>
                )}
            </div>

            {!alumno && (
                <div className="space-y-2">
                    <SelectorMedio
                        valor={medio}
                        onCambio={(valor) => {
                            setMedio(valor);
                            setErrores((err) => ({ ...err, medio: undefined }));
                        }}
                        error={errores.medio}
                    />
                    {planElegido && (
                        <p className="text-sm text-slate-500">
                            Primer pago: <strong className="font-semibold text-slate-900">{formatearPrecio(planElegido.precio)}</strong>. Queda en el historial de pagos.
                        </p>
                    )}
                </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Boton type="button" variante="secundario" onClick={onTerminar} disabled={guardando}>
                    Cancelar
                </Boton>
                <Boton type="submit" cargando={guardando}>
                    {alumno ? 'Guardar cambios' : 'Agregar alumno'}
                </Boton>
            </div>
        </form>
    );
}

// El apto físico vale un año desde la fecha del certificado (igual que vencimientoFicha en el backend).
// Trabaja con textos "YYYY-MM-DD"; un apto del 29/2 vence el 1/3 del año siguiente
function vencimientoApto(iso) {
    const [anio, mes, dia] = iso.split('-').map(Number);
    return new Date(Date.UTC(anio + 1, mes - 1, dia)).toISOString().slice(0, 10);
}

// Texto de ayuda con el vencimiento que va a quedar (mismas reglas que el backend):
// - Alta: desde la fecha de pago, con la duración del plan.
// - Edición: si se corrige la fecha de pago, se recalcula; si no, queda el vencimiento actual
//   (cambiar de plan se aplica desde el próximo pago).
function textoVence(alumno, datos, plan) {
    if (!datos.fechaPago || !plan) return null;
    const cambioFecha = alumno && datos.fechaPago !== fechaAISO(alumno.fechaPago);
    if (!alumno || cambioFecha) {
        return `La cuota vence el ${formatearFecha(sumarDuracion(datos.fechaPago, plan.duracion))}.`;
    }
    const cambioPlan = datos.plan !== alumno.plan?._id;
    return `Vence el ${formatearFecha(alumno.fechaVencimiento)}.${cambioPlan ? ' El plan nuevo se aplica desde el próximo pago.' : ''}`;
}
