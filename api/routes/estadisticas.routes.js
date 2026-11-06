// Router de Express para definir endpoints de la API
const express = require('express');
const router = express.Router();

// Controlador que consolida las métricas del sistema
const controller = require('../controllers/estadisticas.controller');

// GET /api/estadisticas - Endpoint para obtener métricas consolidadas en tiempo real de la región
router.get('/', controller.obtenerEstadisticas);

// Exportación del enrutador de estadísticas
module.exports = router;
