import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, configurarNoAutorizado } from '../lib/api';
import { useAvisos } from './AvisosContext';

// Guarda quién inició sesión para toda la app. El token no está acá: viaja en una cookie
// httpOnly que JavaScript no puede leer, por eso al abrir la página se le pregunta al servidor.
// Se usa con el custom hook useAuth (hooks/useAuth.js).
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const avisar = useAvisos();
    const [usuario, setUsuario] = useState(null);
    // true mientras se pregunta al servidor si ya hay sesión: evita mandar al login
    // a alguien que sí estaba logueado solo porque la respuesta todavía no llegó
    const [verificando, setVerificando] = useState(true);

    // Copia del usuario en una ref para leerla dentro del aviso de 401 sin volver a registrarlo
    const usuarioRef = useRef(null);
    useEffect(() => {
        usuarioRef.current = usuario;
    }, [usuario]);

    // Al abrir la página: ¿la cookie sigue siendo válida?
    useEffect(() => {
        api.yo()
            .then(setUsuario)
            .catch(() => setUsuario(null))
            .finally(() => setVerificando(false));
    }, []);

    // Si cualquier pedido responde 401 (sesión vencida o cuenta desactivada), se cierra la sesión
    // en pantalla. Solo se avisa si había alguien logueado (al abrir sin sesión es lo normal).
    useEffect(() => {
        configurarNoAutorizado((mensaje) => {
            if (usuarioRef.current) {
                avisar('alerta', mensaje || 'Tu sesión terminó. Volvé a ingresar.');
            }
            setUsuario(null);
        });
        return () => configurarNoAutorizado(null);
    }, [avisar]);

    // Devuelve el usuario si sale bien; si no, lanza el error con el mensaje del servidor
    const ingresar = useCallback(async (email, password) => {
        const datos = await api.login(email, password);
        setUsuario(datos);
        return datos;
    }, []);

    const salir = useCallback(async () => {
        try {
            await api.logout();
        } catch {
            // Aunque falle la red, en pantalla se cierra igual la sesión
        }
        setUsuario(null);
    }, []);

    const valor = useMemo(() => ({ usuario, verificando, ingresar, salir }), [usuario, verificando, ingresar, salir]);

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
