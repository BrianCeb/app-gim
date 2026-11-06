import { useRef, useState } from 'react';
import { Camera, CircleAlert, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { DIAS_CUOTA, fechaAISO, formatearFecha, hoyISO, sumarDias } from '../lib/fechas';
import { achicarImagen } from '../lib/imagen';
import { normalizarDni, validarAlumno } from '../lib/alumnos';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { Boton, Campo, claseInput } from './ui';

// Formulario para crear (alumno = null) o editar un alumno, incluida su foto
export default function AlumnoForm({ alumno, onTerminar }) {
    const { recargarAlumnos } = useDatos();
    const avisar = useAvisos();
    const inputFoto = useRef(null);

    const [datos, setDatos] = useState({
        nombre: alumno?.nombre ?? '',
        apellido: alumno?.apellido ?? '',
        dni: alumno?.dni ?? '',
        email: alumno?.email ?? '',
        fechaPago: alumno ? fechaAISO(alumno.fechaPago) : hoyISO()
    });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [guardando, setGuardando] = useState(false);
    // foto: null = sin cambios, { dataUrl } = foto nueva, { quitar: true } = borrar la actual
    const [foto, setFoto] = useState(null);

    const vistaPrevia = foto?.dataUrl ?? (foto?.quitar ? null : alumno?.fotoUrl || null);

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

    const guardar = async (e) => {
        e.preventDefault();
        setErrorGeneral('');

        const nuevosErrores = validarAlumno(datos);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        setGuardando(true);
        const cuerpo = { ...datos, dni: normalizarDni(datos.dni) };
        let guardado;
        try {
            guardado = alumno ? await api.editarAlumno(alumno._id, cuerpo) : await api.crearAlumno(cuerpo);
        } catch (err) {
            setErrorGeneral(err.message);
            setGuardando(false);
            return;
        }

        // El alumno ya quedó guardado; si la foto falla, se avisa pero no se pierde lo demás
        try {
            if (foto?.dataUrl) await api.subirFoto(guardado._id, foto.dataUrl);
            else if (foto?.quitar && alumno?.fotoUrl) await api.eliminarFoto(guardado._id);
            avisar('exito', alumno ? 'Cambios guardados.' : `${guardado.nombre} ${guardado.apellido} fue agregado.`);
        } catch (err) {
            avisar('alerta', `El alumno se guardó, pero hubo un problema con la foto: ${err.message}`);
        }

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
                <Campo
                    etiqueta="Fecha de pago"
                    error={errores.fechaPago}
                    ayuda={datos.fechaPago && `La cuota vence el ${formatearFecha(sumarDias(datos.fechaPago, DIAS_CUOTA))}.`}
                >
                    <input type="date" value={datos.fechaPago} onChange={cambiar('fechaPago')} className={claseInput(errores.fechaPago)} />
                </Campo>
            </div>

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
