import { createContext, useCallback, useContext, useState } from 'react';
import { CircleCheck, CircleX, TriangleAlert, X } from 'lucide-react';

// Mensajes cortos que aparecen en una esquina y se van solos ("toasts")
const AvisosContext = createContext(null);

const ESTILOS = {
    exito: { icono: CircleCheck, clases: 'text-emerald-600' },
    error: { icono: CircleX, clases: 'text-rose-600' },
    alerta: { icono: TriangleAlert, clases: 'text-amber-600' }
};

let siguienteId = 1;

export function AvisosProvider({ children }) {
    const [avisos, setAvisos] = useState([]);

    const cerrar = useCallback((id) => {
        setAvisos((actuales) => actuales.filter((a) => a.id !== id));
    }, []);

    const avisar = useCallback(
        (tipo, mensaje) => {
            const id = siguienteId++;
            setAvisos((actuales) => [...actuales.slice(-2), { id, tipo, mensaje }]);
            setTimeout(() => cerrar(id), tipo === 'error' ? 6000 : 3500);
        },
        [cerrar]
    );

    return (
        <AvisosContext.Provider value={avisar}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:w-96 sm:px-0"
            >
                {avisos.map(({ id, tipo, mensaje }) => {
                    const { icono: Icono, clases } = ESTILOS[tipo];
                    return (
                        <div
                            key={id}
                            role={tipo === 'error' ? 'alert' : 'status'}
                            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white p-3.5 shadow-lg ring-1 ring-slate-900/10"
                        >
                            <Icono className={`mt-0.5 size-5 shrink-0 ${clases}`} aria-hidden />
                            <p className="flex-1 text-sm text-slate-700">{mensaje}</p>
                            <button
                                onClick={() => cerrar(id)}
                                className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                                aria-label="Cerrar aviso"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </AvisosContext.Provider>
    );
}

export const useAvisos = () => useContext(AvisosContext);
