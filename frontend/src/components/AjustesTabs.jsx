import { NavLink } from 'react-router-dom';

// Pestañas de "Ajustes" (solo administración). Cada pestaña es una ruta propia (/planes, /personal):
// así se puede entrar directo a cada una y el botón "atrás" del navegador funciona.
// Se agrupan en un solo ítem del menú para que la barra inferior del celular no pase de 6 ítems.
const PESTANAS = [
    { a: '/planes', etiqueta: 'Planes' },
    { a: '/personal', etiqueta: 'Personal' }
];

export default function AjustesTabs() {
    return (
        <nav aria-label="Ajustes" className="mb-6 flex gap-1 border-b border-slate-200">
            {PESTANAS.map(({ a, etiqueta }) => (
                <NavLink
                    key={a}
                    to={a}
                    className={({ isActive }) =>
                        `-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                            isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`
                    }
                >
                    {etiqueta}
                </NavLink>
            ))}
        </nav>
    );
}
