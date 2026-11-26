import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { api } from '../lib/api';
import { DIAS, validarClase } from '../lib/clases';
import { Boton, Campo, claseInput } from './ui';

/* ===============================
   Formulario para crear (clase = null) o editar una clase (solo administración).
   El estado activa no se toca acá: se cambia con su propio botón en la lista.
   onGuardado(claseGuardada) se llama cuando el servidor confirma.
================================= */
export default function ClaseForm({ clase, onGuardado, onCancelar }) {
    const esNueva = !clase;

    const [datos, setDatos] = useState({
        nombre: clase?.nombre ?? '',
        dias: clase?.dias ?? [],
        horaInicio: clase?.horaInicio ?? '08:00',
        horaFin: clase?.horaFin ?? '10:00'
    });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cambiar = (campo) => (e) => {
        const valor = e.target.value;
        setDatos((d) => ({ ...d, [campo]: valor }));
        if (errores[campo]) setErrores((err) => ({ ...err, [campo]: undefined }));
        setErrorGeneral('');
    };

    // Los días se eligen como botones que se encienden y se apagan: se ven los siete de una vez
    const alternarDia = (valor) => {
        setDatos((d) => ({
            ...d,
            dias: d.dias.includes(valor) ? d.dias.filter((x) => x !== valor) : [...d.dias, valor]
        }));
        setErrores((err) => ({ ...err, dias: undefined }));
        setErrorGeneral('');
    };

    const guardar = async (e) => {
        e.preventDefault();
        setErrorGeneral('');

        const nuevosErrores = validarClase(datos);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        setGuardando(true);
        const cuerpo = { nombre: datos.nombre.trim(), dias: datos.dias, horaInicio: datos.horaInicio, horaFin: datos.horaFin };
        try {
            const guardada = esNueva ? await api.crearClase(cuerpo) : await api.editarClase(clase._id, { ...cuerpo, activa: clase.activa });
            onGuardado(guardada);
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

            <Campo etiqueta="Nombre" error={errores.nombre} ayuda="Por ejemplo: Turno mañana, Turno tarde, Funcional.">
                <input value={datos.nombre} onChange={cambiar('nombre')} autoComplete="off" className={claseInput(errores.nombre)} />
            </Campo>

            <fieldset>
                <legend className="mb-1.5 block text-sm font-medium text-slate-700">Días</legend>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Días de la clase">
                    {DIAS.map(({ valor, nombre, corto }) => {
                        const elegido = datos.dias.includes(valor);
                        return (
                            <button
                                key={valor}
                                type="button"
                                onClick={() => alternarDia(valor)}
                                aria-pressed={elegido}
                                aria-label={nombre}
                                className={`w-14 rounded-lg px-2 py-2 text-sm font-semibold transition ${
                                    elegido ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {corto}
                            </button>
                        );
                    })}
                </div>
                {errores.dias && <span className="mt-1 block text-sm text-rose-600">{errores.dias}</span>}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Hora de inicio" error={errores.horaInicio}>
                    <input type="time" value={datos.horaInicio} onChange={cambiar('horaInicio')} className={claseInput(errores.horaInicio)} />
                </Campo>
                <Campo etiqueta="Hora de fin" error={errores.horaFin}>
                    <input type="time" value={datos.horaFin} onChange={cambiar('horaFin')} className={claseInput(errores.horaFin)} />
                </Campo>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Boton type="button" variante="secundario" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </Boton>
                <Boton type="submit" cargando={guardando}>
                    {esNueva ? 'Crear clase' : 'Guardar cambios'}
                </Boton>
            </div>
        </form>
    );
}
