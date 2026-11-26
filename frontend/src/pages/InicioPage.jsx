import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, CircleCheck, Dumbbell, Eye, EyeOff, IdCard, Smartphone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Boton, Campo, Cargando, claseInput } from '../components/ui';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BENEFICIOS = [
    { icono: IdCard, texto: 'Registrá la asistencia por DNI o por nombre, en segundos.' },
    { icono: CircleCheck, texto: 'Sabé al instante quién está al día y quién debe la cuota.' },
    { icono: Smartphone, texto: 'Usalo en la computadora de recepción o en el celular.' }
];

// Ilustración de ejemplo (datos ficticios) de lo que se ve al registrar una asistencia.
// Se puede reemplazar por una foto real del gimnasio sin tocar el resto de la pantalla.
function IlustracionInicio({ className = '' }) {
    return (
        <svg viewBox="0 0 440 270" className={className} role="img" aria-label="Ejemplo de una asistencia registrada y del resumen de cuotas">
            {/* tarjeta principal */}
            <rect x="10" y="20" width="400" height="236" rx="22" fill="#1e293b" stroke="#ffffff" strokeOpacity="0.08" />
            <text x="36" y="58" fill="#94a3b8" fontSize="13" fontWeight="600">ASISTENCIA REGISTRADA · 18:42</text>

            {/* alumno */}
            <circle cx="62" cy="100" r="26" fill="#334155" />
            <text x="62" y="106" fill="#e2e8f0" fontSize="16" fontWeight="700" textAnchor="middle">JP</text>
            <text x="104" y="96" fill="#ffffff" fontSize="18" fontWeight="700">Juan Pérez</text>
            <text x="104" y="118" fill="#94a3b8" fontSize="13">DNI 30.123.456 · vence el 12/12</text>
            <rect x="300" y="84" width="84" height="28" rx="14" fill="#34d399" fillOpacity="0.15" />
            <circle cx="317" cy="98" r="4" fill="#34d399" />
            <text x="328" y="103" fill="#6ee7b7" fontSize="13" fontWeight="700">Al día</text>

            <line x1="36" x2="384" y1="148" y2="148" stroke="#ffffff" strokeOpacity="0.08" />

            {/* resumen de cuotas */}
            {[
                { x: 36, color: '#34d399', etiqueta: 'Al día', valor: '42', ancho: 100 },
                { x: 156, color: '#fbbf24', etiqueta: 'Por vencer', valor: '6', ancho: 40 },
                { x: 276, color: '#fb7185', etiqueta: 'Vencidos', valor: '3', ancho: 24 }
            ].map(({ x, color, etiqueta, valor, ancho }) => (
                <g key={etiqueta}>
                    <text x={x} y="182" fill="#94a3b8" fontSize="13">{etiqueta}</text>
                    <text x={x} y="212" fill="#ffffff" fontSize="24" fontWeight="700">{valor}</text>
                    <rect x={x} y="226" width="100" height="8" rx="4" fill="#ffffff" fillOpacity="0.08" />
                    <rect x={x} y="226" width={ancho} height="8" rx="4" fill={color} />
                </g>
            ))}

            {/* sello de confirmación */}
            <circle cx="404" cy="26" r="22" fill="#34d399" />
            <path d="M394 26l7 7 13-14" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function InicioPage() {
    const { usuario, verificando, ingresar } = useAuth();
    const navegar = useNavigate();
    const ubicacion = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [errores, setErrores] = useState({});
    const [errorServidor, setErrorServidor] = useState('');
    const [enviando, setEnviando] = useState(false);

    // A dónde volver después de ingresar (la pantalla que pidió antes de que lo mandaran acá)
    const destino = ubicacion.state?.desde && ubicacion.state.desde !== '/ingresar' ? ubicacion.state.desde : '/';

    if (verificando) return <Cargando texto="Verificando sesión…" />;
    // Si ya tiene la sesión iniciada no tiene sentido mostrarle el login
    if (usuario) return <Navigate to={destino} replace />;

    // Mismas reglas que el servidor, para avisar antes de enviar
    const validar = () => {
        const nuevos = {};
        if (!email.trim()) nuevos.email = 'Escribí tu email.';
        else if (!EMAIL_REGEX.test(email.trim())) nuevos.email = 'Revisá el email: falta la @ o el dominio (ej.: nombre@gmail.com).';
        if (!password) nuevos.password = 'Escribí tu contraseña.';
        setErrores(nuevos);
        return Object.keys(nuevos).length === 0;
    };

    const alEnviar = async (e) => {
        e.preventDefault();
        setErrorServidor('');
        if (!validar()) return;

        setEnviando(true);
        try {
            await ingresar(email.trim(), password);
            navegar(destino, { replace: true });
        } catch (err) {
            // El servidor ya manda mensajes claros: credenciales incorrectas, cuenta desactivada o sin conexión
            setErrorServidor(err.message);
            setPassword('');
            setEnviando(false);
        }
    };

    return (
        <div className="min-h-dvh lg:grid lg:grid-cols-2">
            {/* Propuesta de valor */}
            <section className="relative flex flex-col overflow-hidden bg-slate-900 px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-12">
                <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-emerald-400 p-1.5 text-slate-900">
                        <Dumbbell className="size-5" aria-hidden />
                    </span>
                    <span className="text-lg font-bold tracking-tight">GimnasioApp</span>
                </div>

                {/* my-auto centra el bloque en pantallas altas; pt-10 asegura aire bajo el logo en las bajas */}
                <div className="max-w-lg pt-10 lg:my-auto">
                    <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl xl:text-5xl">
                        Cuotas y asistencias del gimnasio, <span className="text-emerald-400">bajo control.</span>
                    </h1>
                    <p className="mt-4 text-base text-pretty text-slate-300 sm:text-lg">
                        Todo lo que necesita la recepción en un solo lugar: quién entra, quién está al día y a quién hay que
                        recordarle la cuota.
                    </p>
                    <ul className="mt-8 hidden flex-col gap-3 sm:flex">
                        {BENEFICIOS.map(({ icono: Icono, texto }) => (
                            <li key={texto} className="flex items-center gap-3 text-sm text-slate-200">
                                <span className="rounded-lg bg-white/10 p-2 text-emerald-300">
                                    <Icono className="size-4" aria-hidden />
                                </span>
                                {texto}
                            </li>
                        ))}
                    </ul>
                    <IlustracionInicio className="mt-10 hidden w-full max-w-sm lg:block" />
                </div>
            </section>

            {/* Formulario para iniciar sesión */}
            <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:py-12">
                <div className="w-full max-w-sm">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ingresá a tu cuenta</h2>
                    <p className="mt-1 text-sm text-slate-500">Usá el email y la contraseña que te dio administración.</p>

                    <form onSubmit={alEnviar} noValidate className="mt-8 flex flex-col gap-5">
                        <Campo etiqueta="Email" error={errores.email}>
                            <input
                                type="email"
                                inputMode="email"
                                autoComplete="username"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nombre@ejemplo.com"
                                aria-invalid={!!errores.email}
                                className={claseInput(errores.email)}
                            />
                        </Campo>

                        <Campo etiqueta="Contraseña" error={errores.password}>
                            <div className="relative">
                                <input
                                    type={verPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    // el botón del ojo está dentro de la etiqueta: sin esto el lector de
                                    // pantalla anunciaría "Contraseña Mostrar contraseña"
                                    aria-label="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-invalid={!!errores.password}
                                    className={`${claseInput(errores.password)} pr-11`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setVerPassword((v) => !v)}
                                    aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    aria-pressed={verPassword}
                                    className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-400 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-slate-900"
                                >
                                    {verPassword ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
                                </button>
                            </div>
                        </Campo>

                        {errorServidor && (
                            <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
                                <CircleAlert className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
                                {errorServidor}
                            </div>
                        )}

                        <Boton type="submit" cargando={enviando} className="w-full py-3 text-base">
                            {enviando ? 'Ingresando…' : 'Ingresar'}
                        </Boton>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        ¿No tenés cuenta u olvidaste la contraseña? Pedísela a administración.
                    </p>
                </div>
            </section>
        </div>
    );
}
