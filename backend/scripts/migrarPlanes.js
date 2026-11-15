// Migración de la HU 11: crea el plan "Mensual" (si no existe) y se lo asigna a los alumnos
// que todavía no tienen plan. NO toca fechas de pago ni de vencimiento.
// Uso: npm run migrar:planes              → solo muestra qué cambiaría (no guarda nada)
//      npm run migrar:planes -- --aplicar  → guarda los cambios
// Solo toca alumnos sin plan: se puede correr varias veces sin riesgo.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Plan from '../src/dao/models/Plan.js';
import Alumno from '../src/dao/models/Alumno.js';

// El .env está en backend/, sin importar desde qué carpeta se ejecute el script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const APLICAR = process.argv.includes('--aplicar');

// Plan inicial: equivale a la regla anterior (una cuota por mes). El precio arranca en 0
// y administración lo carga después desde Ajustes → Planes
const PLAN_INICIAL = {
    nombre: 'Mensual',
    duracion: { cantidad: 1, unidad: 'meses' },
    precio: 0,
    diasAviso: 3
};

async function migrarPlanes() {
    await connectDB();

    const existente = await Plan.findOne({ nombre: PLAN_INICIAL.nombre });
    // $in: [null] también encuentra a los alumnos que no tienen el campo
    const sinPlan = await Alumno.countDocuments({ plan: { $in: [null] } });

    console.log(`Plan "${PLAN_INICIAL.nombre}": ${existente ? 'ya existe' : 'no existe, se va a crear'}`);
    console.log(`Alumnos sin plan: ${sinPlan}`);

    if (!APLICAR) {
        console.log('\nℹ️ Prueba sin cambios. Para guardar, corré: npm run migrar:planes -- --aplicar');
        return;
    }

    const plan = existente ?? (await Plan.create(PLAN_INICIAL));
    if (!existente) console.log(`\n✅ Plan "${plan.nombre}" creado.`);

    if (sinPlan === 0) {
        console.log('No hay alumnos sin plan. No se modificó ningún alumno.');
        return;
    }

    // updateMany: un solo pedido para todos. Solo se agrega el plan, el vencimiento queda igual
    const resultado = await Alumno.updateMany({ plan: { $in: [null] } }, { $set: { plan: plan._id } });
    console.log(`✅ Alumnos con plan "${plan.nombre}" asignado: ${resultado.modifiedCount}`);
}

try {
    await migrarPlanes();
} catch (error) {
    console.error('❌ No se pudo completar la migración:', error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
