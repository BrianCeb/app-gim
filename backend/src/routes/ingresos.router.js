import express from 'express';
import Ingreso from '../dao/models/Ingreso.js';
import Alumno from '../dao/models/Alumno.js';

const router = express.Router();

// nuevo ingreso por DNI
router.post('/', async (req, res) => {
    try {
        const dni = String(req.body.dni ?? '').replace(/[.\s]/g, '');
        if (!dni) {
            return res.status(400).json({ error: 'El DNI es obligatorio.' });
        }

        const alumno = await Alumno.findOne({ dni });

        if (!alumno) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }

        const nuevo = new Ingreso({
            dni,
            fecha: new Date()
        });

        await nuevo.save();
        req.app.get('io')?.emit('ingresos:cambio');

        // Se devuelve también el alumno para mostrar en pantalla su foto y estado de pago
        res.status(201).json({ ...nuevo.toObject(), alumno });
    } catch (error) {
        console.error(' Error al guardar ingreso:', error);
        res.status(500).json({ error: 'Error al registrar ingreso' });
    }
});

// todos los ingresos
router.get('/', async (req, res) => {
    try {
        const ingresos = await Ingreso.find().sort({ fecha: -1 });
        res.json(ingresos);
    } catch (error) {
        console.error(' Error al obtener ingresos:', error);
        res.status(500).json({ error: 'Error al obtener ingresos' });
    }
});

export default router;
