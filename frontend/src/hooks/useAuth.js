import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Custom hook: cualquier componente obtiene la sesión con una línea, const { usuario, salir } = useAuth();
// y no necesita saber que por dentro hay un Context.
// Si se usa fuera de <AuthProvider> avisa con un error claro, en vez de fallar más adelante con "undefined".
export function useAuth() {
    const contexto = useContext(AuthContext);
    if (!contexto) {
        throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    }
    return contexto;
}
