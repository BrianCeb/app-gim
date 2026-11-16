import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Pencil, RefreshCw, UserCheck, UserCog, UserPlus, UserX } from 'lucide-react';
import { useAvisos } from '../context/AvisosContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { ETIQUETA_ROL, ROLES } from '../lib/permisos';
import UsuarioForm, { CambiarPasswordForm } from '../components/UsuarioForm';
import { Confirmacion, Modal } from '../components/Modal';
import AjustesTabs from '../components/AjustesTabs';
import { Boton, BotonIcono, Cargando, Encabezado, EstadoVacio, Tarjeta } from '../components/ui';

// Etiquetas de rol y de estado, para que se distingan de un vistazo
function BadgeRol({ rol }) {
    const clase = rol === ROLES.ADMINISTRACION ? 'bg-violet-50 text-violet-700 ring-violet-200' : 'bg-sky-50 text-sky-700 ring-sky-200';
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${clase}`}>{ETIQUETA_ROL[rol]}</span>;
}

function BadgeEstado({ activo }) {
    return activo ? (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Activa</span>
    ) : (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">Desactivada</span>
    );
}

/* ===============================
   👥 PERSONAL (Ajustes, solo administración)
   La lista no está en DatosContext porque solo la usa esta pantalla: se carga al entrar.
   Las cuentas no se borran: se desactivan y se pueden volver a activar.
================================= */
export default function PersonalPage() {
    const avisar = useAvisos();
    const { usuario, actualizarUsuario } = useAuth();

    const [cuentas, setCuentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    // formulario: null = cerrado, 'nueva' = alta, objeto cuenta = edición
    const [formulario, setFormulario] = useState(null);
    const [cambiandoPassword, setCambiandoPassword] = useState(null);
    // cuenta a la que se le va a cambiar el estado (activar o desactivar)
    const [cambiandoEstado, setCambiandoEstado] = useState(null);
    const [guardandoEstado, setGuardandoEstado] = useState(false);

    const cargar = useCallback(async () => {
        setError('');
        try {
            setCuentas(await api.usuarios());
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const alGuardar = (guardada) => {
        avisar('exito', formulario === 'nueva' ? `Se creó la cuenta de ${guardada.nombre}.` : 'Cambios guardados.');
        actualizarUsuario(guardada); // si era la propia, el menú muestra el nombre nuevo
        setFormulario(null);
        cargar();
    };

    const alCambiarPassword = () => {
        avisar('exito', `Se cambió la contraseña de ${cambiandoPassword.nombre}.`);
        setCambiandoPassword(null);
    };

    const confirmarEstado = async () => {
        const cuenta = cambiandoEstado;
        setGuardandoEstado(true);
        try {
            await api.editarUsuario(cuenta._id, { nombre: cuenta.nombre, email: cuenta.email, rol: cuenta.rol, activo: !cuenta.activo });
            avisar('exito', cuenta.activo ? `La cuenta de ${cuenta.nombre} quedó desactivada.` : `La cuenta de ${cuenta.nombre} quedó activa.`);
            setCambiandoEstado(null);
            cargar();
        } catch (err) {
            avisar('error', err.message);
        } finally {
            setGuardandoEstado(false);
        }
    };

    const acciones = (cuenta) => {
        // Regla: nadie se desactiva a sí mismo (el backend también lo rechaza)
        const esLaPropia = cuenta._id === usuario._id;
        return (
            <div className="flex justify-end gap-0.5">
                <BotonIcono etiqueta="Editar" onClick={() => setFormulario(cuenta)}>
                    <Pencil className="size-4.5" />
                </BotonIcono>
                <BotonIcono etiqueta="Cambiar contraseña" onClick={() => setCambiandoPassword(cuenta)}>
                    <KeyRound className="size-4.5" />
                </BotonIcono>
                {!esLaPropia &&
                    (cuenta.activo ? (
                        <BotonIcono etiqueta="Desactivar" onClick={() => setCambiandoEstado(cuenta)} className="hover:bg-rose-50 hover:text-rose-600">
                            <UserX className="size-4.5" />
                        </BotonIcono>
                    ) : (
                        <BotonIcono etiqueta="Activar" onClick={() => setCambiandoEstado(cuenta)} className="hover:bg-emerald-50 hover:text-emerald-600">
                            <UserCheck className="size-4.5" />
                        </BotonIcono>
                    ))}
            </div>
        );
    };

    const activas = cuentas.filter((c) => c.activo).length;

    return (
        <>
            <Encabezado titulo="Ajustes" descripcion="Planes de cuota y cuentas del personal" />
            <AjustesTabs />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                    {cargando ? 'Cuentas para ingresar a la app.' : `${activas} ${activas === 1 ? 'cuenta activa' : 'cuentas activas'} de ${cuentas.length}.`}
                </p>
                <Boton onClick={() => setFormulario('nueva')} className="w-full shrink-0 sm:w-auto">
                    <UserPlus className="size-4" aria-hidden /> Nueva cuenta
                </Boton>
            </div>

            <Tarjeta className="overflow-hidden">
                {cargando ? (
                    <Cargando texto="Cargando personal…" />
                ) : error ? (
                    <EstadoVacio icono={UserCog} titulo="No se pudo cargar el personal" descripcion={error}>
                        <Boton variante="secundario" onClick={cargar}>
                            <RefreshCw className="size-4" aria-hidden /> Reintentar
                        </Boton>
                    </EstadoVacio>
                ) : (
                    <>
                        {/* Tabla (computadora) */}
                        <table className="hidden w-full text-left text-sm md:table">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">Nombre</th>
                                    <th className="px-3 py-3">Rol</th>
                                    <th className="px-3 py-3">Estado</th>
                                    <th className="px-5 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cuentas.map((cuenta) => (
                                    <tr key={cuenta._id} className={`hover:bg-slate-50/60 ${cuenta.activo ? '' : 'text-slate-400'}`}>
                                        <td className="px-5 py-3">
                                            <p className={`font-medium ${cuenta.activo ? 'text-slate-900' : 'text-slate-500'}`}>
                                                {cuenta.nombre}
                                                {cuenta._id === usuario._id && <span className="ml-2 text-xs font-normal text-slate-500">(vos)</span>}
                                            </p>
                                            <p className="truncate text-slate-500">{cuenta.email}</p>
                                        </td>
                                        <td className="px-3 py-3">
                                            <BadgeRol rol={cuenta.rol} />
                                        </td>
                                        <td className="px-3 py-3">
                                            <BadgeEstado activo={cuenta.activo} />
                                        </td>
                                        <td className="px-5 py-3">{acciones(cuenta)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Tarjetas (celular) */}
                        <ul className="divide-y divide-slate-100 md:hidden">
                            {cuentas.map((cuenta) => (
                                <li key={cuenta._id} className="p-4">
                                    <div className="min-w-0">
                                        <p className={`truncate font-medium ${cuenta.activo ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {cuenta.nombre}
                                            {cuenta._id === usuario._id && <span className="ml-2 text-xs font-normal text-slate-500">(vos)</span>}
                                        </p>
                                        <p className="truncate text-sm text-slate-500">{cuenta.email}</p>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <div className="flex flex-wrap gap-1.5">
                                            <BadgeRol rol={cuenta.rol} />
                                            <BadgeEstado activo={cuenta.activo} />
                                        </div>
                                        {acciones(cuenta)}
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
                titulo={formulario === 'nueva' ? 'Nueva cuenta' : 'Editar cuenta'}
            >
                {formulario !== null && (
                    <UsuarioForm
                        key={formulario === 'nueva' ? 'nueva' : formulario._id}
                        cuenta={formulario === 'nueva' ? null : formulario}
                        onGuardado={alGuardar}
                        onCancelar={() => setFormulario(null)}
                    />
                )}
            </Modal>

            <Modal abierto={cambiandoPassword !== null} onCerrar={() => setCambiandoPassword(null)} titulo="Cambiar contraseña">
                {cambiandoPassword && (
                    <CambiarPasswordForm
                        key={cambiandoPassword._id}
                        cuenta={cambiandoPassword}
                        onGuardado={alCambiarPassword}
                        onCancelar={() => setCambiandoPassword(null)}
                    />
                )}
            </Modal>

            <Confirmacion
                abierto={cambiandoEstado !== null}
                onCerrar={() => setCambiandoEstado(null)}
                onConfirmar={confirmarEstado}
                titulo={cambiandoEstado?.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                textoConfirmar={cambiandoEstado?.activo ? 'Sí, desactivar' : 'Sí, activar'}
                variante={cambiandoEstado?.activo ? 'peligro' : 'exito'}
                cargando={guardandoEstado}
            >
                {cambiandoEstado &&
                    (cambiandoEstado.activo ? (
                        <p>
                            <strong className="text-slate-900">{cambiandoEstado.nombre}</strong> no va a poder ingresar a la app, y si tiene la sesión abierta se
                            le cierra en el momento. Podés volver a activar la cuenta cuando quieras.
                        </p>
                    ) : (
                        <p>
                            <strong className="text-slate-900">{cambiandoEstado.nombre}</strong> va a poder volver a ingresar con su contraseña de siempre.
                        </p>
                    ))}
            </Confirmacion>
        </>
    );
}
