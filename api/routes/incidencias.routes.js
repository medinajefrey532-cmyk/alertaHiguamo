// Router de Express para definir endpoints de la API
const express = require('express');
const router = express.Router();

// Controlador que contiene la lógica de negocio de incidencias
const controller = require('../controllers/incidencias.controller');

// Middlewares de validación para entradas de datos
const {
  validarCrearIncidencia,
  validarEstadoIncidencia
} = require('../middlewares/validators');

// GET /api/incidencias - Endpoint para consultar y filtrar el listado de emergencias
router.get('/', controller.obtenerIncidencias);

// GET /api/incidencias/:id - Endpoint para obtener los detalles de una emergencia por su código ID
router.get('/:id', controller.obtenerIncidenciaPorId);

// POST /api/incidencias - Endpoint para reportar y registrar una nueva emergencia validando campos requeridos
router.post('/', validarCrearIncidencia, controller.crearIncidencia);

// PUT /api/incidencias/:id - Endpoint para actualizar completamente los datos de una incidencia existente
router.put('/:id', controller.actualizarIncidencia);

// PATCH /api/incidencias/:id/estado - Endpoint para actualizar el estado operativo y prioridad con historial
router.patch('/:id/estado', validarEstadoIncidencia, controller.actualizarEstadoIncidencia);

// DELETE /api/incidencias/:id - Endpoint para eliminar una incidencia del sistema
router.delete('/:id', controller.eliminarIncidencia);

// Exportación del enrutador de incidencias
module.exports = router;
