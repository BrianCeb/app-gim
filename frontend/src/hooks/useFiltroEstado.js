import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { estadoPago } from '../lib/fechas';

const FILTROS_VALIDOS = ['todos', 'vencido', 'porVencer', 'alDia'];

// Custom hook: estado de pago de cada alumno, cantidades por estado y filtro elegido.
// Antes este mismo cálculo estaba copiado en Pagos y en Alumnos; ahora está en un solo lugar.
//
//   const { filtrados, conteos, filtro, cambiarFiltro } = useFiltroEstado(alumnos, { enUrl: true });
//
// - filtrados: [{ alumno, clave, dias }] de los alumnos que coinciden con el filtro
// - conteos: { todos, alDia, porVencer, vencido } para los botones de FiltrosEstado
// - enUrl: true guarda el filtro en la dirección (?estado=vencido), así el Panel puede llevar
//   directo a Pagos ya filtrado; false lo guarda solo en memoria (se pierde al salir de la pantalla)
export function useFiltroEstado(alumnos, { enUrl = false } = {}) {
    // Los hooks se llaman siempre, en el mismo orden (regla de React): se usa uno u otro valor según enUrl
    const [parametros, setParametros] = useSearchParams();
    const [filtroLocal, setFiltroLocal] = useState('todos');

    const desdeUrl = parametros.get('estado');
    const filtro = enUrl ? (FILTROS_VALIDOS.includes(desdeUrl) ? desdeUrl : 'todos') : filtroLocal;

    const cambiarFiltro = (valor) => {
        if (enUrl) setParametros(valor === 'todos' ? {} : { estado: valor }, { replace: true });
        else setFiltroLocal(valor);
    };

    // useMemo: el estado de cada alumno se recalcula solo cuando cambia la lista de alumnos
    const conEstado = useMemo(() => alumnos.map((alumno) => ({ alumno, ...estadoPago(alumno) })), [alumnos]);

    const conteos = useMemo(() => {
        const c = { todos: conEstado.length, alDia: 0, porVencer: 0, vencido: 0 };
        conEstado.forEach(({ clave }) => c[clave]++);
        return c;
    }, [conEstado]);

    const filtrados = useMemo(
        () => (filtro === 'todos' ? conEstado : conEstado.filter((x) => x.clave === filtro)),
        [conEstado, filtro]
    );

    return { filtrados, conteos, filtro, cambiarFiltro };
}
