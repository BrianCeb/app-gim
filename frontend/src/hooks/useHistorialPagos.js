import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

// Custom hook: trae el historial de pagos de un alumno y avisa si está cargando o si falló.
//   const { pagos, cargando, error, recargar } = useHistorialPagos(alumno._id);
// Junta useState + useEffect + useCallback en un solo lugar, así el componente que muestra el
// historial solo se ocupa de dibujarlo. recargar() sirve para actualizar la lista después de anular.
export function useHistorialPagos(alumnoId) {
    const [pagos, setPagos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const recargar = useCallback(async () => {
        setError(null);
        try {
            setPagos(await api.historialPagos(alumnoId));
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }, [alumnoId]);

    useEffect(() => {
        // Si cambia el alumno antes de que llegue la respuesta, se descarta la respuesta vieja
        // (si no, podría verse un instante el historial de otro alumno)
        let vigente = true;
        setCargando(true);
        setError(null);
        api.historialPagos(alumnoId)
            .then((datos) => vigente && setPagos(datos))
            .catch((err) => vigente && setError(err.message))
            .finally(() => vigente && setCargando(false));
        return () => {
            vigente = false;
        };
    }, [alumnoId]);

    // Qué pago se puede anular (mismas reglas que el backend): el último vigente, y no si es el del alta
    // (el del alta no tiene estado anterior). La lista llega del más reciente al más viejo,
    // así que el último vigente es el primero sin anular
    const ultimoVigente = pagos.find((p) => p.vigente);
    const anulable = ultimoVigente?.fechaPagoAnterior ? ultimoVigente : null;

    return { pagos, cargando, error, recargar, anulable };
}
