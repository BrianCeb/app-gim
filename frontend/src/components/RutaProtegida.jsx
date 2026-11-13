import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { puede } from '../lib/permisos';
import { Cargando, EstadoVacio } from './ui';

// Envuelve las pantallas que necesitan sesión (y, si se indica, un permiso).
// Uso: <RutaProtegida><Pantalla /></RutaProtegida>  ·  <RutaProtegida permiso="estadisticas">...</RutaProtegida>
// Sin hijos, muestra la ruta anidada (<Outlet />).
export default function RutaProtegida({ permiso, children }) {
    const { usuario, verificando, cerroSesion } = useAuth();
    const ubicacion = useLocation();

    // Todavía no se sabe si hay sesión: no redirigir antes de tiempo
    if (verificando) {
        return <Cargando texto="Verificando sesión…" />;
    }

    // Sin sesión: al login, recordando a dónde quería ir para volver después de ingresar
    // (salvo que haya tocado "Salir": ahí se arranca de cero).
    // replace: así "Atrás" no lo devuelve a una página que lo vuelve a mandar al login
    if (!usuario) {
        const estado = cerroSesion ? null : { desde: ubicacion.pathname + ubicacion.search };
        return <Navigate to="/ingresar" replace state={estado} />;
    }

    if (!puede(usuario, permiso)) {
        return (
            <EstadoVacio
                icono={ShieldAlert}
                titulo="No tenés acceso a esta sección"
                descripcion="Esta sección es solo para administración. Si la necesitás, pedile acceso a quien administra el gimnasio."
            >
                <Link to="/" className="font-semibold text-slate-900 underline">
                    Volver al panel
                </Link>
            </EstadoVacio>
        );
    }

    return children ?? <Outlet />;
}
