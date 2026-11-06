import { useMemo, useState } from 'react';
import { Pencil, Search, Trash2, UserPlus, Users, Wallet } from 'lucide-react';
import { useDatos } from '../context/DatosContext';
import { useAvisos } from '../context/AvisosContext';
import { api } from '../lib/api';
import { estadoPago, formatearFecha } from '../lib/fechas';
import { nombreCompleto, normalizarDni, textoBuscable } from '../lib/alumnos';
import AlumnoForm from '../components/AlumnoForm';
import RegistrarPago from '../components/RegistrarPago';
import { Confirmacion, Modal } from '../components/Modal';
import { Avatar, Boton, BotonIcono, Cargando, Encabezado, EstadoBadge, EstadoVacio, FiltrosEstado, Tarjeta, claseInput } from '../components/ui';

export default function AlumnosPage() {
    const { alumnos, cargando, recargarAlumnos } = useDatos();
    const avisar = useAvisos();

    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('todos');
    // formulario: null = cerrado, 'nuevo' = alta, objeto alumno = edición
    const [formulario, setFormulario] = useState(null);
    const [pagando, setPagando] = useState(null);
    const [eliminando, setEliminando] = useState(null);
    const [borrando, setBorrando] = useState(false);

    const conEstado = useMemo(() => alumnos.map((a) => ({ alumno: a, estado: estadoPago(a).clave })), [alumnos]);

    const conteos = useMemo(() => {
        const c = { todos: conEstado.length, alDia: 0, porVencer: 0, vencido: 0 };
        conEstado.forEach(({ estado }) => c[estado]++);
        return c;
    }, [conEstado]);

    // Busca por nombre, apellido o DNI (con o sin puntos)
    const visibles = useMemo(() => {
        const texto = textoBuscable(busqueda.trim());
        const dni = normalizarDni(busqueda);
        return conEstado.filter(({ alumno, estado }) => {
            if (filtro !== 'todos' && estado !== filtro) return false;
            if (!texto) return true;
            return textoBuscable(nombreCompleto(alumno)).includes(texto) || (dni && alumno.dni.includes(dni));
        });
    }, [conEstado, busqueda, filtro]);

    const confirmarEliminar = async () => {
        setBorrando(true);
        try {
            await api.eliminarAlumno(eliminando._id);
            await recargarAlumnos().catch(() => {});
            avisar('exito', `${nombreCompleto(eliminando)} fue eliminado.`);
            setEliminando(null);
        } catch (err) {
            avisar('error', err.message);
        } finally {
            setBorrando(false);
        }
    };

    const acciones = (alumno) => (
        <div className="flex justify-end gap-0.5">
            <BotonIcono etiqueta="Registrar pago" onClick={() => setPagando(alumno)}>
                <Wallet className="size-4.5" />
            </BotonIcono>
            <BotonIcono etiqueta="Editar" onClick={() => setFormulario(alumno)}>
                <Pencil className="size-4.5" />
            </BotonIcono>
            <BotonIcono etiqueta="Eliminar" onClick={() => setEliminando(alumno)} className="hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="size-4.5" />
            </BotonIcono>
        </div>
    );

    return (
        <>
            <Encabezado titulo="Alumnos" descripcion={`${alumnos.length} ${alumnos.length === 1 ? 'alumno registrado' : 'alumnos registrados'}`}>
                <Boton onClick={() => setFormulario('nuevo')} className="w-full sm:w-auto">
                    <UserPlus className="size-4" aria-hidden /> Nuevo alumno
                </Boton>
            </Encabezado>

            <div className="mb-4 space-y-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <input
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre, apellido o DNI"
                        aria-label="Buscar alumno"
                        className={`${claseInput(false)} pl-9`}
                    />
                </div>
                <FiltrosEstado valor={filtro} onCambio={setFiltro} conteos={conteos} />
            </div>

            <Tarjeta className="overflow-hidden">
                {cargando ? (
                    <Cargando texto="Cargando alumnos…" />
                ) : alumnos.length === 0 ? (
                    <EstadoVacio icono={Users} titulo="Todavía no hay alumnos" descripcion="Agregá el primer alumno para empezar.">
                        <Boton onClick={() => setFormulario('nuevo')}>
                            <UserPlus className="size-4" aria-hidden /> Nuevo alumno
                        </Boton>
                    </EstadoVacio>
                ) : visibles.length === 0 ? (
                    <EstadoVacio icono={Search} titulo="Sin resultados" descripcion="No hay alumnos que coincidan con la búsqueda o el filtro." />
                ) : (
                    <>
                        {/* Tabla (computadora) */}
                        <table className="hidden w-full text-left text-sm md:table">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">Alumno</th>
                                    <th className="px-3 py-3">DNI</th>
                                    <th className="px-3 py-3">Último pago</th>
                                    <th className="px-3 py-3">Vencimiento</th>
                                    <th className="px-3 py-3">Estado</th>
                                    <th className="px-5 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {visibles.map(({ alumno }) => (
                                    <tr key={alumno._id} className="hover:bg-slate-50/60">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar alumno={alumno} />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-900">{nombreCompleto(alumno)}</p>
                                                    <p className="truncate text-slate-500">{alumno.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600 tabular-nums">{alumno.dni}</td>
                                        <td className="px-3 py-3 text-slate-600 tabular-nums">{formatearFecha(alumno.fechaPago)}</td>
                                        <td className="px-3 py-3 text-slate-600 tabular-nums">{formatearFecha(alumno.fechaVencimiento)}</td>
                                        <td className="px-3 py-3">
                                            <EstadoBadge alumno={alumno} />
                                        </td>
                                        <td className="px-5 py-3">{acciones(alumno)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Tarjetas (celular) */}
                        <ul className="divide-y divide-slate-100 md:hidden">
                            {visibles.map(({ alumno }) => (
                                <li key={alumno._id} className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar alumno={alumno} tamaño="size-12" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-slate-900">{nombreCompleto(alumno)}</p>
                                            <p className="text-sm text-slate-500 tabular-nums">DNI {alumno.dni}</p>
                                        </div>
                                        <EstadoBadge alumno={alumno} />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <p className="text-sm text-slate-500">
                                            Vence el <span className="font-medium text-slate-700 tabular-nums">{formatearFecha(alumno.fechaVencimiento)}</span>
                                        </p>
                                        {acciones(alumno)}
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
                titulo={formulario === 'nuevo' ? 'Nuevo alumno' : 'Editar alumno'}
            >
                {formulario !== null && (
                    <AlumnoForm
                        key={formulario === 'nuevo' ? 'nuevo' : formulario._id}
                        alumno={formulario === 'nuevo' ? null : formulario}
                        onTerminar={() => setFormulario(null)}
                    />
                )}
            </Modal>

            {pagando && <RegistrarPago alumno={pagando} onCerrar={() => setPagando(null)} />}

            <Confirmacion
                abierto={eliminando !== null}
                onCerrar={() => setEliminando(null)}
                onConfirmar={confirmarEliminar}
                titulo="Eliminar alumno"
                textoConfirmar="Sí, eliminar"
                cargando={borrando}
            >
                {eliminando && (
                    <p>
                        ¿Seguro que querés eliminar a <strong className="text-slate-900">{nombreCompleto(eliminando)}</strong> (DNI {eliminando.dni})? Esta
                        acción no se puede deshacer.
                    </p>
                )}
            </Confirmacion>
        </>
    );
}
