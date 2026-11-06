// Utilidad para lectura asíncrona de archivos JSON del sistema
const { readData } = require('../../base_de_datos/storage');

// GET /api/estadisticas - Calcula y consolida métricas operativas de la región Higuamo en tiempo real
async function obtenerEstadisticas(req, res, next) {
  try {
    // Lectura simultánea y paralela de las 3 colecciones principales: incidencias, refugios y recursos
    const [incidencias, refugios, recursos] = await Promise.all([
      readData('incidencias'),
      readData('refugios'),
      readData('recursos')
    ]);

    // Cálculo de totales de incidencias y desglose por estado
    const totalIncidencias = incidencias.length;
    const porEstado = {
      pendiente: incidencias.filter(i => i.estado === 'pendiente').length,
      en_proceso: incidencias.filter(i => i.estado === 'en_proceso').length,
      atendida: incidencias.filter(i => i.estado === 'atendida').length,
      cerrada: incidencias.filter(i => i.estado === 'cerrada').length
    };

    // Emergencias activas: suma únicamente las pendientes y en proceso que requieren atención urgente
    const emergenciasActivas = porEstado.pendiente + porEstado.en_proceso;

    // Conteo de incidencias clasificadas por prioridad (alta, media, baja)
    const porPrioridad = {
      alta: incidencias.filter(i => i.prioridad === 'alta').length,
      media: incidencias.filter(i => i.prioridad === 'media').length,
      baja: incidencias.filter(i => i.prioridad === 'baja').length
    };

    // Conteo de incidencias distribuidas por cada provincia de la región Higuamo
    const porProvincia = {
      'San Pedro de Macorís': incidencias.filter(i => i.provincia === 'San Pedro de Macorís').length,
      'Hato Mayor': incidencias.filter(i => i.provincia === 'Hato Mayor').length,
      'Monte Plata': incidencias.filter(i => i.provincia === 'Monte Plata').length
    };

    // Conteo agrupado por tipología de emergencia (inundación, deslizamiento, vía bloqueada, etc.)
    const porTipo = {};
    incidencias.forEach(i => {
      porTipo[i.tipo] = (porTipo[i.tipo] || 0) + 1;
    });

    // Sumatoria total de personas afectadas estimadas en los reportes
    const totalAfectadosEstimados = incidencias.reduce((sum, i) => sum + (i.afectadosEstimados || 0), 0);

    // Métricas operativas de refugios oficiales
    const totalRefugios = refugios.length;
    const capacidadTotalRefugios = refugios.reduce((sum, r) => sum + (r.capacidadTotal || 0), 0);
    const totalEspaciosOcupados = refugios.reduce((sum, r) => sum + (r.espaciosOcupados || 0), 0);
    const totalEspaciosDisponibles = refugios.reduce((sum, r) => sum + (r.espaciosDisponibles || 0), 0);

    // Porcentaje de ocupación general de albergues en la región
    const porcentajeOcupacionRefugios = capacidadTotalRefugios > 0
      ? Number(((totalEspaciosOcupados / capacidadTotalRefugios) * 100).toFixed(1))
      : 0;

    // Métricas de suministros y recursos de emergencia
    const totalRecursosTipos = recursos.length;
    const totalUnidadesDisponibles = recursos.reduce((sum, r) => sum + (r.cantidadDisponible || 0), 0);
    const totalUnidadesEntregadas = recursos.reduce((sum, r) => sum + (r.cantidadEntregada || 0), 0);

    // Retorna el reporte de estadísticas estructurado en formato JSON con código HTTP 200
    res.status(200).json({
      success: true,
      fechaConsulta: new Date().toISOString(),
      region: 'Higuamo',
      metricas: {
        incidencias: {
          total: totalIncidencias,
          activas: emergenciasActivas,
          porEstado,
          porPrioridad,
          porProvincia,
          porTipo,
          totalAfectadosEstimados
        },
        refugios: {
          totalRefugios,
          capacidadTotal: capacidadTotalRefugios,
          espaciosOcupados: totalEspaciosOcupados,
          espaciosDisponibles: totalEspaciosDisponibles,
          porcentajeOcupacion: porcentajeOcupacionRefugios
        },
        recursos: {
          totalTipos: totalRecursosTipos,
          totalUnidadesDisponibles,
          totalUnidadesEntregadas
        }
      }
    });
  } catch (error) {
    // Pasa cualquier error inesperado al middleware global de errores
    next(error);
  }
}

// Exportación del controlador de estadísticas
module.exports = {
  obtenerEstadisticas
};
