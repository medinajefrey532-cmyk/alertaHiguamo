// ==========================================================================
// CONFIGURACION DE LA APLICACION EXPRESS — ALERTA HIGUAMO
// Este archivo configura los middlewares, rutas y manejadores de error de la API
// Ubicado en la carpeta api/
// ==========================================================================

// Importa el framework Express para el servidor web
const express = require('express');
// Importa CORS para permitir peticiones entre diferentes origenes o dominios
const cors = require('cors');
// Modulo nativo de Node.js para resolucion de rutas de archivos en el sistema operativo
const path = require('path');

// Enrutadores modulares de cada recurso de la API
const incidenciasRoutes = require('./routes/incidencias.routes');
const refugiosRoutes = require('./routes/refugios.routes');
const recursosRoutes = require('./routes/recursos.routes');
const estadisticasRoutes = require('./routes/estadisticas.routes');

// Middlewares centralizados para el manejo de rutas no encontradas y errores de servidor
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

// Inicializa la instancia principal de Express
const app = express();

// Middleware: Habilita el intercambio de recursos de origen cruzado (CORS)
app.use(cors());

// Middleware: Parsea automaticamente los cuerpos de peticion entrantes en formato JSON
app.use(express.json());

// Middleware: Parsea datos codificados en URL provenientes de formularios tradicionales
app.use(express.urlencoded({ extended: true }));

// Middleware: Sirve los archivos estaticos de la interfaz web (HTML, CSS, JS, imagenes) desde la carpeta interfaz/
app.use(express.static(path.join(__dirname, '..', 'interfaz')));

// Endpoint GET /api/health: Permite verificar la operatividad y estado general de la API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    mensaje: 'API Alerta Higuamo operativa',
    region: 'Higuamo (San Pedro de Macoris, Hato Mayor, Monte Plata)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Registro de las rutas de cada recurso bajo el prefijo /api
app.use('/api/incidencias', incidenciasRoutes); // Endpoints de emergencias
app.use('/api/refugios', refugiosRoutes);       // Endpoints de albergues
app.use('/api/recursos', recursosRoutes);       // Endpoints de suministros e insumos
app.use('/api/estadisticas', estadisticasRoutes); // Endpoints de metricas consolidadas

// Middleware de captura: responde 404 Not Found a cualquier ruta no declarada
app.use(notFoundHandler);

// Middleware de captura: responde 500 Internal Server Error ante cualquier excepcion no controlada
app.use(errorHandler);

// Exporta la aplicacion configurada para ser utilizada por server.js o la suite de pruebas
module.exports = app;
