import { NavLink, Outlet } from 'react-router-dom';
import { ChartColumn, Dumbbell, LayoutDashboard, LogIn, RefreshCw, Users, Wallet, WifiOff } from 'lucide-react';
import { useDatos } from '../context/DatosContext';
import { Boton } from './ui';

const SECCIONES = [
    { a: '/', etiqueta: 'Panel', icono: LayoutDashboard },
    { a: '/ingresos', etiqueta: 'Ingresos', icono: LogIn },
    { a: '/alumnos', etiqueta: 'Alumnos', icono: Users },
    { a: '/pagos', etiqueta: 'Pagos', icono: Wallet },
    { a: '/estadisticas', etiqueta: 'Estadísticas', icono: ChartColumn }
];

function Marca() {
    return (
        <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-emerald-400 p-1.5 text-slate-900">
                <Dumbbell className="size-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight">GimnasioApp</span>
        </div>
    );
}

function AvisoConexion() {
    const { error, recargarTodo } = useDatos();
    if (!error) return null;
    return (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-xl bg-rose-50 p-4 ring-1 ring-rose-200 sm:flex-row sm:items-center">
            <WifiOff className="size-5 shrink-0 text-rose-600" aria-hidden />
            <div className="flex-1 text-sm">
                <p className="font-semibold text-rose-800">No se pudo cargar la información</p>
                <p className="text-rose-700">{error}</p>
            </div>
            <Boton variante="secundario" onClick={recargarTodo}>
                <RefreshCw className="size-4" aria-hidden /> Reintentar
            </Boton>
        </div>
    );
}

export default function Layout() {
    return (
        <div className="min-h-dvh">
            {/* Menú lateral (computadora) */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 px-4 py-6 text-white lg:flex">
                <div className="px-2">
                    <Marca />
                </div>
                <nav className="mt-10 flex flex-col gap-1" aria-label="Secciones">
                    {SECCIONES.map(({ a, etiqueta, icono: Icono }) => (
                        <NavLink
                            key={a}
                            to={a}
                            end={a === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <Icono className="size-5" aria-hidden />
                            {etiqueta}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Barra superior (celular) */}
            <header className="sticky top-0 z-30 flex items-center bg-slate-900 px-4 py-3 text-white lg:hidden">
                <Marca />
            </header>

            <main className="px-4 pt-6 pb-28 sm:px-6 lg:pb-10 lg:pl-72 lg:pr-8">
                <div className="mx-auto max-w-6xl">
                    <AvisoConexion />
                    <Outlet />
                </div>
            </main>

            {/* Barra inferior (celular) */}
            <nav
                aria-label="Secciones"
                className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
            >
                {SECCIONES.map(({ a, etiqueta, icono: Icono }) => (
                    <NavLink
                        key={a}
                        to={a}
                        end={a === '/'}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`
                        }
                    >
                        <Icono className="size-5" aria-hidden />
                        {etiqueta}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
