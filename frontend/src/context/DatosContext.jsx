import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../lib/api';

// Guarda alumnos, ingresos y planes para toda la app y los recarga cuando el servidor avisa
// por Socket.io que algo cambió (por ejemplo, desde otra computadora o celular).
const DatosContext = createContext(null);

export function DatosProvider({ children }) {
    const [alumnos, setAlumnos] = useState([]);
    const [ingresos, setIngresos] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const recargarAlumnos = useCallback(async () => {
        setAlumnos(await api.alumnos());
    }, []);

    const recargarIngresos = useCallback(async () => {
        setIngresos(await api.ingresos());
    }, []);

    const recargarPlanes = useCallback(async () => {
        setPlanes(await api.planes());
    }, []);

    const recargarTodo = useCallback(async () => {
        setError(null);
        try {
            await Promise.all([recargarAlumnos(), recargarIngresos(), recargarPlanes()]);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }, [recargarAlumnos, recargarIngresos, recargarPlanes]);

    useEffect(() => {
        recargarTodo();

        const socket = io();
        socket.on('alumnos:cambio', () => recargarAlumnos().catch(() => {}));
        socket.on('ingresos:cambio', () => recargarIngresos().catch(() => {}));
        // Si cambia un plan (precio, días de aviso) también cambian los datos que trae cada alumno
        socket.on('planes:cambio', () => {
            recargarPlanes().catch(() => {});
            recargarAlumnos().catch(() => {});
        });
        // Si se cortó la conexión y volvió, puede haberse perdido algún aviso
        socket.io.on('reconnect', recargarTodo);
        // El servidor rechaza el socket si la sesión ya no es válida (venció o desactivaron la cuenta).
        // Se consulta /yo: si responde 401, api.js avisa a AuthContext y se cierra la sesión en pantalla.
        // Así hay un solo camino para "sesión terminada", sea por la API o por el socket.
        socket.on('connect_error', (err) => {
            if (err.message === 'No autorizado') api.yo().catch(() => {});
        });

        return () => socket.disconnect();
    }, [recargarTodo, recargarAlumnos, recargarIngresos, recargarPlanes]);

    // Alumnos por _id, para encontrar en un paso el alumno de cada ingreso (ingreso.alumno es su _id).
    // useMemo: el Map se arma de nuevo solo cuando cambia la lista de alumnos
    const alumnosPorId = useMemo(() => new Map(alumnos.map((a) => [a._id, a])), [alumnos]);

    // Solo los planes que se pueden elegir hoy (para los formularios de alta y de pago)
    const planesActivos = useMemo(() => planes.filter((p) => p.activo), [planes]);

    const valor = {
        alumnos,
        ingresos,
        alumnosPorId,
        planes,
        planesActivos,
        cargando,
        error,
        recargarAlumnos,
        recargarIngresos,
        recargarPlanes,
        recargarTodo
    };

    return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

export const useDatos = () => useContext(DatosContext);
