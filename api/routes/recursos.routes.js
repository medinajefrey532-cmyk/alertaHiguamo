// Router de Express para definir endpoints de la API
const express = require('express');
const router = express.Router();

// Controlador que contiene la lógica de negocio de suministros y recursos
const controller = require('../controllers/recursos.controller');

// Middleware de validación para registro de recursos
const { validarCrearRecurso } = require('../middlewares/validators');

// GET /api/recursos - Endpoint para consultar inventario de suministros y aplicar filtros
router.get('/', controller.obtenerRecursos);

// GET /api/recursos/:id - Endpoint para consultar un recurso específico por su código ID
router.get('/:id', controller.obtenerRecursoPorId);

// POST /api/recursos - Endpoint para agregar un nuevo tipo de suministro al inventario
router.post('/', validarCrearRecurso, controller.crearRecurso);

// PUT /api/recursos/:id - Endpoint para actualizar datos generales de un suministro existente
router.put('/:id', controller.actualizarRecurso);

// PATCH /api/recursos/:id/entrega - Endpoint para despachar insumos hacia una emergencia vinculada
router.patch('/:id/entrega', controller.registrarEntregaRecurso);

// DELETE /api/recursos/:id - Endpoint para eliminar un recurso del inventario regional
router.delete('/:id', controller.eliminarRecurso);

// Exportación del enrutador de recursos
module.exports = router;
