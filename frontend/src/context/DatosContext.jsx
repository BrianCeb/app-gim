import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../lib/api';

// Guarda alumnos e ingresos para toda la app y los recarga cuando el servidor avisa
// por Socket.io que algo cambió (por ejemplo, desde otra computadora o celular).
const DatosContext = createContext(null);

export function DatosProvider({ children }) {
    const [alumnos, setAlumnos] = useState([]);
    const [ingresos, setIngresos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const recargarAlumnos = useCallback(async () => {
        setAlumnos(await api.alumnos());
    }, []);

    const recargarIngresos = useCallback(async () => {
        setIngresos(await api.ingresos());
    }, []);

    const recargarTodo = useCallback(async () => {
        setError(null);
        try {
            await Promise.all([recargarAlumnos(), recargarIngresos()]);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }, [recargarAlumnos, recargarIngresos]);

    useEffect(() => {
        recargarTodo();

        const socket = io();
        socket.on('alumnos:cambio', () => recargarAlumnos().catch(() => {}));
        socket.on('ingresos:cambio', () => recargarIngresos().catch(() => {}));
        // Si se cortó la conexión y volvió, puede haberse perdido algún aviso
        socket.io.on('reconnect', recargarTodo);

        return () => socket.disconnect();
    }, [recargarTodo, recargarAlumnos, recargarIngresos]);

    const alumnosPorDni = useMemo(() => new Map(alumnos.map((a) => [a.dni, a])), [alumnos]);

    const valor = {
        alumnos,
        ingresos,
        alumnosPorDni,
        cargando,
        error,
        recargarAlumnos,
        recargarIngresos,
        recargarTodo
    };

    return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

export const useDatos = () => useContext(DatosContext);
