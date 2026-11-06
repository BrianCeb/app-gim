import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { Boton } from './ui';

// Ventana superpuesta. En celular aparece desde abajo y ocupa el ancho completo.
export function Modal({ abierto, onCerrar, titulo, children, ancho = 'sm:max-w-lg' }) {
    const idTitulo = useId();

    useEffect(() => {
        if (!abierto) return;
        const alPresionar = (e) => e.key === 'Escape' && onCerrar();
        document.addEventListener('keydown', alPresionar);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', alPresionar);
            document.body.style.overflow = '';
        };
    }, [abierto, onCerrar]);

    if (!abierto) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={onCerrar} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${ancho}`}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 id={idTitulo} className="text-lg font-semibold text-slate-900">
                        {titulo}
                    </h2>
                    <button onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">
                        <X className="size-5" />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-5">{children}</div>
            </div>
        </div>
    );
}

export function Confirmacion({ abierto, onCerrar, onConfirmar, titulo, children, textoConfirmar, variante = 'peligro', cargando }) {
    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} ancho="sm:max-w-md">
            <div className="text-sm text-slate-600">{children}</div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
                    Cancelar
                </Boton>
                <Boton variante={variante} onClick={onConfirmar} cargando={cargando}>
                    {textoConfirmar}
                </Boton>
            </div>
        </Modal>
    );
}
