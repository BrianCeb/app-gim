import { useMemo } from 'react';
import { nombreCompleto, normalizarDni, textoBuscable } from '../lib/alumnos';
import { useDatos } from '../context/DatosContext';

// Cuántos alumnos se ofrecen como sugerencia: más que esto no se lee de un vistazo en el mostrador
export const MAX_SUGERENCIAS = 6;

// Custom hook: busca alumnos por DNI o por nombre sobre la lista que ya tiene DatosContext,
// así el mostrador no espera una consulta al servidor mientras escribe.
//
//   const { sugerencias, exacto, total } = useBuscarAlumno(busqueda);
//
// - exacto: el alumno cuyo DNI es exactamente lo escrito. El DNI es único, así que con eso alcanza
//   para registrar la asistencia sin elegir de una lista (es el camino rápido de siempre).
// - sugerencias: coincidencias por nombre, apellido o parte del DNI, hasta MAX_SUGERENCIAS.
// - total: cuántas coincidencias hay en total, para avisar si quedaron afuera.
export function useBuscarAlumno(busqueda, { maximo = MAX_SUGERENCIAS } = {}) {
    const { alumnos } = useDatos();
    const texto = busqueda.trim();

    // useMemo: se vuelve a buscar solo cuando cambia el texto o la lista de alumnos
    return useMemo(() => {
        if (!texto) return { sugerencias: [], exacto: null, total: 0 };

        const buscado = textoBuscable(texto);
        const dni = normalizarDni(texto);
        const esNumero = /^\d+$/.test(dni);

        const coincidencias = alumnos.filter(
            (alumno) => textoBuscable(nombreCompleto(alumno)).includes(buscado) || (esNumero && alumno.dni.includes(dni))
        );

        return {
            sugerencias: coincidencias.slice(0, maximo),
            total: coincidencias.length,
            exacto: esNumero ? (alumnos.find((alumno) => alumno.dni === dni) ?? null) : null
        };
    }, [alumnos, texto, maximo]);
}
