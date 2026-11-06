// Router de Express para definir endpoints de la API
const express = require('express');
const router = express.Router();

// Controlador que contiene la lógica de negocio de refugios
const controller = require('../controllers/refugios.controller');

// Middlewares de validación para entradas de datos de refugios
const {
  validarCrearRefugio,
  validarCapacidadRefugio
} = require('../middlewares/validators');

// GET /api/refugios - Endpoint para consultar y filtrar albergues oficiales
router.get('/', controller.obtenerRefugios);

// GET /api/refugios/:id - Endpoint para obtener datos de un refugio individual por su código ID
router.get('/:id', controller.obtenerRefugioPorId);

// POST /api/refugios - Endpoint para registrar un nuevo albergue validando campos obligatorios
router.post('/', validarCrearRefugio, controller.crearRefugio);

// PUT /api/refugios/:id - Endpoint para actualizar completamente la información del refugio
router.put('/:id', controller.actualizarRefugio);

// PATCH /api/refugios/:id/capacidad - Endpoint para registrar variación (+/-) de personas con historial
router.patch('/:id/capacidad', validarCapacidadRefugio, controller.actualizarCapacidadRefugio);

// DELETE /api/refugios/:id - Endpoint para dar de baja o eliminar un refugio del sistema
router.delete('/:id', controller.eliminarRefugio);

// Exportación del enrutador de refugios
module.exports = router;
