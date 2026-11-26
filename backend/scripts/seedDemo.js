// Datos de demostración: 20 alumnos ficticios con sus asistencias, pagos y fichas de salud,
// para poder mostrar el Panel y las Estadísticas con los gráficos llenos.
//
// Uso: npm run seed:demo              → solo cuenta qué haría (no guarda nada)
//      npm run seed:demo -- --aplicar → carga los datos (si ya estaban, los vuelve a generar)
//      npm run seed:demo -- --borrar  → borra todo lo ficticio y deja la base como estaba
//
// Cómo se reconocen los ficticios: su DNI empieza con "99" y tiene 8 dígitos (99000001 en
// adelante). Ningún DNI argentino real llega a ese número, así que --borrar nunca toca a un
// alumno de verdad. Lo único que se borra es lo que tiene ese DNI (y sus asistencias y pagos).
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Alumno from '../src/dao/models/Alumno.js';
import Plan from '../src/dao/models/Plan.js';
import Pago, { MEDIOS_PAGO } from '../src/dao/models/Pago.js';
import Ingreso from '../src/dao/models/Ingreso.js';
import FichaSalud from '../src/dao/models/FichaSalud.js';
import Usuario from '../src/dao/models/Usuario.js';
import { sumarDuracion } from '../src/utils/vencimiento.js';
import pdfApto from './pdfApto.js';

// El .env está en backend/, sin importar desde qué carpeta se ejecute el script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const APLICAR = process.argv.includes('--aplicar');
const BORRAR = process.argv.includes('--borrar');

// Marca de los datos ficticios: DNI de 8 dígitos que empieza con 99
const DNI_DEMO = /^99\d{6}$/;
const PRIMER_DNI = 99000001;

// Cuántos días hacia atrás se generan asistencias (el gráfico de Estadísticas muestra 30)
const DIAS_ASISTENCIA = 90;
// Cuántos pagos tiene cada alumno (el actual y los dos períodos anteriores), para que la
// recaudación por mes tenga con qué comparar
const PAGOS_POR_ALUMNO = 3;

/* ===============================
   🧰 AYUDANTES
================================= */

// Azar reproducible (generador congruencial): corriendo el script dos veces salen los mismos
// datos, así lo que se ve en pantalla coincide con lo que dice la documentación
function azar(semilla) {
    // Multiplicador de Lehmer: estado * 48271 nunca pasa de 2^53, así que la cuenta es exacta
    let estado = semilla % 2147483647;
    return () => {
        estado = (estado * 48271) % 2147483647;
        return estado / 2147483647;
    };
}

const hoyUTC = () => {
    const ahora = new Date();
    return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
};

const sumarDias = (fecha, dias) => new Date(fecha.getTime() + dias * 24 * 60 * 60 * 1000);
const sumarMeses = (fecha, meses) => sumarDuracion(fecha, { cantidad: meses, unidad: 'meses' });
// Corre la fecha "veces" períodos del plan hacia atrás (un plan puede ser por meses o por días)
const restarPeriodos = (fecha, plan, veces) =>
    sumarDuracion(fecha, { cantidad: -plan.duracion.cantidad * veces, unidad: plan.duracion.unidad });
const formatoAR = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });

// Los 20 alumnos ficticios. "venceEn" son los días que faltan para que venza su cuota, contados
// desde hoy: así quedan 4 vencidos, 4 por vencer (3 días de aviso del plan Mensual) y 12 al día.
// "ficha" es el estado del apto físico que se les carga, para que el Panel muestre los tres casos.
const ALUMNOS = [
    { nombre: 'Lucía', apellido: 'Gómez', venceEn: 23, ficha: 'alDia' },
    { nombre: 'Martín', apellido: 'Sosa', venceEn: -21, ficha: 'sinFicha' },
    { nombre: 'Camila', apellido: 'Ríos', venceEn: 11, ficha: 'alDia' },
    { nombre: 'Nicolás', apellido: 'Herrera', venceEn: 2, ficha: 'vencida' },
    { nombre: 'Sofía', apellido: 'Luna', venceEn: 27, ficha: 'alDia' },
    { nombre: 'Tomás', apellido: 'Molina', venceEn: -9, ficha: 'sinFicha' },
    { nombre: 'Valentina', apellido: 'Paz', venceEn: 17, ficha: 'porVencer' },
    { nombre: 'Julián', apellido: 'Ferreyra', venceEn: 0, ficha: 'alDia' },
    { nombre: 'Agustina', apellido: 'Núñez', venceEn: 29, ficha: 'alDia' },
    { nombre: 'Franco', apellido: 'Vega', venceEn: -4, ficha: 'vencida' },
    { nombre: 'Milagros', apellido: 'Acosta', venceEn: 14, ficha: 'alDia' },
    { nombre: 'Bruno', apellido: 'Cáceres', venceEn: 3, ficha: 'alDia' },
    { nombre: 'Delfina', apellido: 'Quiroga', venceEn: 21, ficha: 'porVencer' },
    { nombre: 'Emanuel', apellido: 'Ibáñez', venceEn: -1, ficha: 'sinFicha' },
    { nombre: 'Rocío', apellido: 'Maldonado', venceEn: 25, ficha: 'alDia' },
    { nombre: 'Gonzalo', apellido: 'Pereyra', venceEn: 6, ficha: 'alDia' },
    { nombre: 'Brenda', apellido: 'Ortiz', venceEn: 19, ficha: 'alDia' },
    { nombre: 'Matías', apellido: 'Figueroa', venceEn: 1, ficha: 'alDia' },
    { nombre: 'Antonella', apellido: 'Benítez', venceEn: 28, ficha: 'alDia' },
    { nombre: 'Leandro', apellido: 'Godoy', venceEn: 9, ficha: 'alDia' }
];

// Hace cuántos meses se firmó el apto físico, según el estado que se le quiere dar.
// El apto vale un año: 13 meses = vencido, 11 = por vencer (quedan menos de 30 días), 2 = al día
const MESES_APTO = { vencida: 13, porVencer: 11, alDia: 2 };

// Email sin tildes ni ñ, como lo escribiría el personal
const emailDe = ({ nombre, apellido }) =>
    `${nombre}.${apellido}`
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase() + '@ejemplo.com';

/* ===============================
   🧹 BORRAR LOS DATOS FICTICIOS
================================= */
async function borrarDemo() {
    const alumnos = await Alumno.find({ dni: DNI_DEMO }).select('_id');
    const ids = alumnos.map((a) => a._id);

    if (ids.length === 0) {
        console.log('No hay alumnos ficticios para borrar.');
        return { alumnos: 0 };
    }

    // Se borra todo lo que cuelga de esos alumnos: sin esto quedarían asistencias y pagos
    // sueltos sumando en las estadísticas
    const asistencias = await Ingreso.deleteMany({ alumno: { $in: ids } });
    const pagos = await Pago.deleteMany({ alumno: { $in: ids } });
    const fichas = await FichaSalud.deleteMany({ alumno: { $in: ids } });
    await Alumno.deleteMany({ _id: { $in: ids } });

    console.log(
        `🧹 Borrados: ${ids.length} alumnos, ${asistencias.deletedCount} asistencias, ${pagos.deletedCount} pagos y ${fichas.deletedCount} fichas.`
    );
    return { alumnos: ids.length };
}

/* ===============================
   🌱 CARGAR LOS DATOS FICTICIOS
================================= */
async function cargarDemo() {
    // Los alumnos ficticios usan los planes reales del gimnasio: así los montos de la
    // recaudación son los de verdad y no hay que inventar precios
    const planes = await Plan.find({ activo: true }).sort({ precio: 1 });
    if (planes.length === 0) {
        throw new Error('No hay ningún plan de cuota activo. Creá uno en Ajustes → Planes y volvé a correr el script.');
    }
    // Los pagos guardan quién los registró: se usa una cuenta de administración que ya exista
    const usuario = await Usuario.findOne({ rol: 'administracion', activo: true });
    if (!usuario) {
        throw new Error('No hay ninguna cuenta de administración activa. Corré primero: npm run seed:admin');
    }

    const hoy = hoyUTC();
    const aleatorio = azar(20261125);
    let totalAsistencias = 0;
    let totalPagos = 0;
    let totalFichas = 0;

    for (const [indice, datos] of ALUMNOS.entries()) {
        const plan = planes[indice % planes.length];
        const fechaVencimiento = sumarDias(hoy, datos.venceEn);
        // El último pago cubre el período que termina en el vencimiento
        const fechaPago = restarPeriodos(fechaVencimiento, plan, 1);

        const alumno = await Alumno.create({
            nombre: datos.nombre,
            apellido: datos.apellido,
            dni: String(PRIMER_DNI + indice),
            email: emailDe(datos),
            fechaPago,
            fechaVencimiento,
            plan: plan._id
        });

        // --- Historial de pagos: el actual y los dos períodos anteriores
        const pagos = [];
        for (let i = PAGOS_POR_ALUMNO - 1; i >= 0; i--) {
            const fecha = restarPeriodos(fechaPago, plan, i);
            const vencimientoNuevo = sumarDuracion(fecha, plan.duracion);
            const anterior = pagos.at(-1) ?? null;
            pagos.push({
                alumno: alumno._id,
                alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
                alumnoDni: alumno.dni,
                fecha,
                plan: plan._id,
                planNombre: plan.nombre,
                monto: plan.precio,
                // Los medios se reparten para que el desglose de la recaudación muestre los cuatro
                medio: MEDIOS_PAGO[(indice + i) % MEDIOS_PAGO.length],
                usuario: usuario._id,
                usuarioNombre: usuario.nombre,
                // El más viejo hace de alta (sin estado anterior); los otros, de renovación
                fechaPagoAnterior: anterior?.fecha ?? null,
                planAnterior: anterior ? plan._id : null,
                vencimientoAnterior: anterior?.vencimientoNuevo ?? null,
                vencimientoNuevo,
                // Se fuerza la fecha de registro para que el historial quede en orden real:
                // sin esto los tres pagos quedarían registrados en el mismo instante (ahora)
                createdAt: fecha,
                updatedAt: fecha
            });
        }
        // timestamps: false para que Mongoose respete el createdAt de arriba
        await Pago.insertMany(pagos, { timestamps: false });
        totalPagos += pagos.length;

        // --- Ficha de salud: PDF de ejemplo, salvo los que "no la entregaron"
        if (datos.ficha !== 'sinFicha') {
            const fechaApto = sumarMeses(hoy, -MESES_APTO[datos.ficha]);
            const vence = sumarMeses(fechaApto, 12);
            const pdf = pdfApto({
                nombre: `${alumno.nombre} ${alumno.apellido}`,
                dni: alumno.dni,
                fecha: formatoAR.format(fechaApto),
                vence: formatoAR.format(vence)
            });

            await FichaSalud.create({
                alumno: alumno._id,
                data: pdf,
                contentType: 'application/pdf',
                nombreArchivo: `apto-fisico-${alumno.dni}.pdf`,
                fecha: fechaApto,
                vence
            });
            alumno.fichaSalud = { url: `/api/alumnos/${alumno._id}/ficha?v=${fechaApto.getTime()}`, fecha: fechaApto, vence };
            await alumno.save();
            totalFichas++;
        }

        // --- Asistencias: cada alumno viene entre 2 y 5 días por semana, en horario de mañana
        // o de tarde. Deja de venir cuando se le vence la cuota (así el gráfico se parece a la realidad)
        const diasPorSemana = 2 + Math.floor(aleatorio() * 4);
        const asistencias = [];
        for (let atras = DIAS_ASISTENCIA - 1; atras >= 0; atras--) {
            const dia = sumarDias(hoy, -atras);
            if (dia.getUTCDay() === 0) continue; // el gimnasio no abre los domingos
            if (dia > fechaVencimiento) continue; // con la cuota vencida dejó de venir
            if (aleatorio() > diasPorSemana / 6) continue;

            // Hora de Argentina (UTC-3): mañana entre 8 y 11, tarde entre 17 y 21
            const manana = aleatorio() < 0.45;
            const hora = manana ? 8 + Math.floor(aleatorio() * 4) : 17 + Math.floor(aleatorio() * 5);
            const minutos = Math.floor(aleatorio() * 60);
            asistencias.push({
                alumno: alumno._id,
                dni: alumno.dni,
                fecha: new Date(Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), hora + 3, minutos))
            });
        }
        await Ingreso.insertMany(asistencias);
        totalAsistencias += asistencias.length;
    }

    console.log(`✅ Cargados: ${ALUMNOS.length} alumnos, ${totalPagos} pagos, ${totalFichas} fichas de salud y ${totalAsistencias} asistencias.`);
    console.log(`   Planes usados: ${planes.map((p) => p.nombre).join(', ')}. Pagos registrados a nombre de ${usuario.nombre}.`);
}

/* ===============================
   ▶️ EJECUCIÓN
================================= */
async function seedDemo() {
    await connectDB();

    const existentes = await Alumno.countDocuments({ dni: DNI_DEMO });
    const reales = await Alumno.countDocuments({ dni: { $not: DNI_DEMO } });
    console.log(`Alumnos reales en la base: ${reales}. Alumnos ficticios: ${existentes}.`);

    if (BORRAR) {
        if (!APLICAR) {
            console.log(`\nℹ️ Prueba sin cambios: se borrarían los ${existentes} alumnos ficticios con todo lo suyo.`);
            console.log('Para borrarlos de verdad: npm run seed:demo -- --borrar --aplicar');
            return;
        }
        await borrarDemo();
        return;
    }

    if (!APLICAR) {
        console.log(`\nℹ️ Prueba sin cambios. Se cargarían ${ALUMNOS.length} alumnos ficticios con sus pagos, fichas y asistencias.`);
        if (existentes > 0) console.log('Los ficticios que ya están se borrarían primero, para no duplicarlos.');
        console.log('Para guardarlos: npm run seed:demo -- --aplicar');
        return;
    }

    // Volver a cargar siempre parte de cero: las fechas son relativas a hoy, así que lo cargado
    // hace unos días ya no mostraría los estados que se quieren ver en la demo
    if (existentes > 0) await borrarDemo();
    await cargarDemo();
}

try {
    await seedDemo();
} catch (error) {
    console.error('❌ No se pudieron cargar los datos de demostración:', error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
