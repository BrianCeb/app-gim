import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { api } from '../lib/api';
import { ETIQUETA_ROL, ROLES } from '../lib/permisos';
import { useAuth } from '../hooks/useAuth';
import { Boton, Campo, claseInput } from './ui';

// Mismo mínimo que el backend (PASSWORD_MIN en el modelo Usuario)
export const PASSWORD_MIN = 8;

// Mismas reglas que el backend, para avisar antes de enviar.
// conPassword: en el alta se pide la contraseña; al editar, no (se cambia aparte)
function validarUsuario(datos, conPassword) {
    const errores = {};
    if (!datos.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) errores.email = 'Ingresá un email válido.';
    if (conPassword && datos.password.length < PASSWORD_MIN) {
        errores.password = `Mínimo ${PASSWORD_MIN} caracteres.`;
    }
    return errores;
}

function ErrorGeneral({ mensaje }) {
    if (!mensaje) return null;
    return (
        <div role="alert" className="flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {mensaje}
        </div>
    );
}

function BotonesFormulario({ onCancelar, guardando, textoGuardar }) {
    return (
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Boton type="button" variante="secundario" onClick={onCancelar} disabled={guardando}>
                Cancelar
            </Boton>
            <Boton type="submit" cargando={guardando}>
                {textoGuardar}
            </Boton>
        </div>
    );
}

/* ===============================
   Formulario para crear (cuenta = null) o editar una cuenta del personal.
   Al editar no se toca la contraseña ni el estado activo: eso se hace con sus propios botones.
   onGuardado(cuentaGuardada) se llama cuando el servidor confirma.
================================= */
export default function UsuarioForm({ cuenta, onGuardado, onCancelar }) {
    const { usuario } = useAuth();
    const esNueva = !cuenta;
    // Regla: nadie puede cambiar su propio rol (el backend también lo rechaza)
    const esLaPropia = cuenta?._id === usuario._id;

    const [datos, setDatos] = useState({
        nombre: cuenta?.nombre ?? '',
        email: cuenta?.email ?? '',
        rol: cuenta?.rol ?? ROLES.RECEPCION,
        password: ''
    });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cambiar = (campo) => (e) => {
        setDatos((d) => ({ ...d, [campo]: e.target.value }));
        if (errores[campo]) setErrores((err) => ({ ...err, [campo]: undefined }));
        setErrorGeneral('');
    };

    const guardar = async (e) => {
        e.preventDefault();
        setErrorGeneral('');

        const nuevosErrores = validarUsuario(datos, esNueva);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        setGuardando(true);
        const cuerpo = { nombre: datos.nombre.trim(), email: datos.email.trim(), rol: datos.rol };
        try {
            const guardada = esNueva
                ? await api.crearUsuario({ ...cuerpo, password: datos.password })
                : await api.editarUsuario(cuenta._id, { ...cuerpo, activo: cuenta.activo });
            onGuardado(guardada);
        } catch (err) {
            setErrorGeneral(err.message);
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={guardar} noValidate className="space-y-5">
            <ErrorGeneral mensaje={errorGeneral} />

            <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Nombre" error={errores.nombre}>
                    <input value={datos.nombre} onChange={cambiar('nombre')} autoComplete="off" className={claseInput(errores.nombre)} />
                </Campo>
                <Campo etiqueta="Email" error={errores.email} ayuda="Es el dato para iniciar sesión.">
                    <input type="email" value={datos.email} onChange={cambiar('email')} autoComplete="off" className={claseInput(errores.email)} />
                </Campo>
                <Campo
                    etiqueta="Rol"
                    ayuda={
                        esLaPropia
                            ? 'No podés cambiar tu propio rol.'
                            : 'Recepción no ve Estadísticas, no elimina alumnos ni gestiona el personal.'
                    }
                >
                    <select value={datos.rol} onChange={cambiar('rol')} disabled={esLaPropia} className={`${claseInput(false)} disabled:bg-slate-50 disabled:text-slate-500`}>
                        {Object.values(ROLES).map((rol) => (
                            <option key={rol} value={rol}>
                                {ETIQUETA_ROL[rol]}
                            </option>
                        ))}
                    </select>
                </Campo>
                {esNueva && (
                    <Campo etiqueta="Contraseña" error={errores.password} ayuda={`Mínimo ${PASSWORD_MIN} caracteres. Pasásela a la persona.`}>
                        {/* new-password: que el navegador no autocomplete con la contraseña de quien está usando la app */}
                        <input type="password" value={datos.password} onChange={cambiar('password')} autoComplete="new-password" className={claseInput(errores.password)} />
                    </Campo>
                )}
            </div>

            <BotonesFormulario onCancelar={onCancelar} guardando={guardando} textoGuardar={esNueva ? 'Crear cuenta' : 'Guardar cambios'} />
        </form>
    );
}

/* ===============================
   Formulario para poner una contraseña nueva a una cuenta (también la propia).
   Se escribe dos veces para no dejar a alguien afuera por un error de tipeo.
================================= */
export function CambiarPasswordForm({ cuenta, onGuardado, onCancelar }) {
    const [password, setPassword] = useState('');
    const [repetir, setRepetir] = useState('');
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [guardando, setGuardando] = useState(false);

    const guardar = async (e) => {
        e.preventDefault();
        setErrorGeneral('');

        const nuevosErrores = {};
        if (password.length < PASSWORD_MIN) nuevosErrores.password = `Mínimo ${PASSWORD_MIN} caracteres.`;
        else if (repetir !== password) nuevosErrores.repetir = 'Las contraseñas no coinciden.';
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        setGuardando(true);
        try {
            await api.cambiarPassword(cuenta._id, password);
            onGuardado();
        } catch (err) {
            setErrorGeneral(err.message);
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={guardar} noValidate className="space-y-5">
            <ErrorGeneral mensaje={errorGeneral} />
            <p className="text-sm text-slate-600">
                Nueva contraseña para <span className="font-semibold text-slate-900">{cuenta.nombre}</span> ({cuenta.email}).
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Contraseña nueva" error={errores.password} ayuda={`Mínimo ${PASSWORD_MIN} caracteres.`}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrores({}); }}
                        autoComplete="new-password"
                        className={claseInput(errores.password)}
                    />
                </Campo>
                <Campo etiqueta="Repetir contraseña" error={errores.repetir}>
                    <input
                        type="password"
                        value={repetir}
                        onChange={(e) => { setRepetir(e.target.value); setErrores({}); }}
                        autoComplete="new-password"
                        className={claseInput(errores.repetir)}
                    />
                </Campo>
            </div>
            <BotonesFormulario onCancelar={onCancelar} guardando={guardando} textoGuardar="Cambiar contraseña" />
        </form>
    );
}
