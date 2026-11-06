import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDatos } from '../context/DatosContext';
import { ESTADOS, diaArgentinoISO, estadoPago, formatearFechaCorta, hoyISO, sumarDias } from '../lib/fechas';
import { Cargando, Encabezado, Tarjeta } from '../components/ui';

const DIAS_GRAFICO = 30;

export default function EstadisticasPage() {
    const { alumnos, ingresos, cargando } = useDatos();

    // Ingresos por día de los últimos 30 días (los días sin ingresos aparecen en 0)
    const porDia = useMemo(() => {
        const hoy = hoyISO();
        const conteo = new Map();
        for (let i = DIAS_GRAFICO - 1; i >= 0; i--) conteo.set(sumarDias(hoy, -i), 0);
        ingresos.forEach((ing) => {
            const dia = diaArgentinoISO(ing.fecha);
            if (conteo.has(dia)) conteo.set(dia, conteo.get(dia) + 1);
        });
        return [...conteo].map(([dia, cantidad]) => ({ dia: formatearFechaCorta(dia), cantidad }));
    }, [ingresos]);

    const estados = useMemo(() => {
        const c = { alDia: 0, porVencer: 0, vencido: 0 };
        alumnos.forEach((a) => c[estadoPago(a).clave]++);
        return Object.entries(c).map(([clave, valor]) => ({ clave, nombre: ESTADOS[clave].etiqueta, valor }));
    }, [alumnos]);

    const totalMes = porDia.reduce((suma, d) => suma + d.cantidad, 0);

    if (cargando) return <Cargando />;

    return (
        <>
            <Encabezado titulo="Estadísticas" descripcion="Se actualizan solas cuando hay ingresos o pagos nuevos." />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Tarjeta className="p-4">
                    <p className="text-sm text-slate-500">Ingresos (30 días)</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{totalMes}</p>
                </Tarjeta>
                <Tarjeta className="p-4">
                    <p className="text-sm text-slate-500">Promedio por día</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{(totalMes / DIAS_GRAFICO).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                </Tarjeta>
                <Tarjeta className="p-4">
                    <p className="text-sm text-slate-500">Alumnos</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{alumnos.length}</p>
                </Tarjeta>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Tarjeta className="p-5 lg:col-span-2">
                    <h2 className="mb-4 font-semibold text-slate-900">Ingresos por día · últimos 30 días</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={porDia} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(valor) => [valor, 'Ingresos']} />
                                <Bar dataKey="cantidad" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Tarjeta>

                <Tarjeta className="p-5">
                    <h2 className="mb-4 font-semibold text-slate-900">Estado de las cuotas</h2>
                    {alumnos.length === 0 ? (
                        <p className="py-16 text-center text-sm text-slate-500">Todavía no hay alumnos.</p>
                    ) : (
                        <>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={estados} dataKey="valor" nameKey="nombre" innerRadius="60%" outerRadius="95%" paddingAngle={2} stroke="none">
                                            {estados.map((e) => (
                                                <Cell key={e.clave} fill={ESTADOS[e.clave].color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="mt-4 space-y-2">
                                {estados.map((e) => (
                                    <li key={e.clave} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-slate-600">
                                            <span className={`size-2.5 rounded-full ${ESTADOS[e.clave].punto}`} aria-hidden />
                                            {e.nombre}
                                        </span>
                                        <span className="font-semibold tabular-nums">{e.valor}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </Tarjeta>
            </div>
        </>
    );
}
