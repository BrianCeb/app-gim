// Migración: completa el campo "alumno" (ObjectId) de los ingresos guardados antes de que existiera,
// buscando al alumno por el DNI del ingreso.
// Uso: npm run migrar:ingresos              → solo muestra qué cambiaría (no guarda nada)
//      npm run migrar:ingresos -- --aplicar  → guarda los cambios
// Solo toca ingresos sin "alumno": se puede correr varias veces sin riesgo.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Ingreso from '../src/dao/models/Ingreso.js';
import Alumno from '../src/dao/models/Alumno.js';

// El .env está en backend/, sin importar desde qué carpeta se ejecute el script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const APLICAR = process.argv.includes('--aplicar');

async function vincularIngresos() {
    await connectDB();

    // $exists: false = ingresos viejos, que todavía no tienen el campo
    const pendientes = await Ingreso.find({ alumno: { $exists: false } }).lean();
    if (pendientes.length === 0) {
        console.log('✅ No hay ingresos sin vincular. No se modificó nada.');
        return;
    }

    // Un solo pedido a la base para todos los alumnos de esos DNI (en vez de uno por ingreso)
    const dnis = [...new Set(pendientes.map((i) => i.dni))];
    const alumnos = await Alumno.find({ dni: { $in: dnis } }, '_id dni').lean();
    const idPorDni = new Map(alumnos.map((a) => [a.dni, a._id]));

    const vinculables = pendientes.filter((i) => idPorDni.has(i.dni));
    const sinAlumno = pendientes.filter((i) => !idPorDni.has(i.dni));

    console.log(`Ingresos sin vincular: ${pendientes.length}`);
    console.log(`  · con alumno encontrado por DNI: ${vinculables.length}`);
    console.log(`  · sin alumno (se eliminó o cambió de DNI): ${sinAlumno.length}`);
    if (sinAlumno.length > 0) {
        console.log(`    DNI sin alumno: ${[...new Set(sinAlumno.map((i) => i.dni))].join(', ')}`);
        console.log('    Esos ingresos quedan como están: la pantalla los muestra como "Alumno eliminado (DNI ...)".');
    }

    if (!APLICAR) {
        console.log('\nℹ️ Prueba sin cambios. Para guardar, corré: npm run migrar:ingresos -- --aplicar');
        return;
    }

    if (vinculables.length === 0) {
        console.log('\nNo hay ingresos para vincular. No se modificó nada.');
        return;
    }

    // bulkWrite: todas las actualizaciones en un solo pedido. El filtro repite
    // "alumno no existe" para no pisar nada si el script se corre dos veces a la vez
    const resultado = await Ingreso.bulkWrite(
        vinculables.map((i) => ({
            updateOne: {
                filter: { _id: i._id, alumno: { $exists: false } },
                update: { $set: { alumno: idPorDni.get(i.dni) } }
            }
        }))
    );
    console.log(`\n✅ Ingresos vinculados: ${resultado.modifiedCount}`);
}

try {
    await vincularIngresos();
} catch (error) {
    console.error('❌ No se pudo completar la migración:', error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
