// ==========================================================================
// MIDDLEWARES DE CAPTURA Y MANEJO DE ERRORES — ALERTA HIGUAMO
// Este archivo intercepta rutas inexistentes (404) y fallos internos de servidor (500)
// ==========================================================================

// Middleware para rutas no encontradas: intercepta cualquier solicitud a endpoints no declarados
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
}

// Middleware centralizado de errores: captura excepciones no controladas y devuelve respuesta JSON 500
function errorHandler(err, req, res, next) {
  console.error('Error interno:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    mensaje: err.message || 'Error interno del servidor.',
    detalles: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

// Exporta los middlewares para ser registrados en src/app.js
module.exports = {
  notFoundHandler,
  errorHandler
};
