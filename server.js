// ==========================================================================
// PUNTO DE ENTRADA DEL SERVIDOR HTTP — ALERTA HIGUAMO
// Este archivo levanta el servidor web en el puerto asignado (por defecto 3000)
// Conecta la API (carpeta api/) con la interfaz web (carpeta interfaz/)
// ==========================================================================

// Importa la aplicacion configurada de Express desde la carpeta api/
const app = require('./api/app');

// Define el puerto de ejecucion: variable de entorno o puerto 3000 por defecto
const PORT = process.env.PORT || 3000;

// Inicia la escucha de peticiones HTTP en el puerto especificado
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`[INFO] Servidor Alerta Higuamo en ejecucion`);
  console.log(`URL Principal: http://localhost:${PORT}`);
  console.log(`API Endpoints: http://localhost:${PORT}/api/incidencias`);
  console.log(`               http://localhost:${PORT}/api/refugios`);
  console.log(`               http://localhost:${PORT}/api/recursos`);
  console.log(`               http://localhost:${PORT}/api/estadisticas`);
  console.log('====================================================');
});
