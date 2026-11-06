// ==========================================================================
// CONTROLADOR DEL RECURSO: INCIDENCIAS (/api/incidencias)
// Implementa las operaciones CRUD y filtros del ciclo de vida de emergencias
// ==========================================================================

const { readData, writeData, generateId } = require('../../base_de_datos/storage');

const ENTIDAD = 'incidencias';

// Coordenadas geográficas oficiales de referencia para los municipios y provincias de la Región Higuamo
const COORDENADAS_REFERENCIA = {
  // San Pedro de Macorís y municipios
  'san pedro de macorís': { lat: 18.4552, lng: -69.3148 },
  'consuelo': { lat: 18.5520, lng: -69.2885 },
  'quisqueya': { lat: 18.5550, lng: -69.4120 },
  'los llanos': { lat: 18.6200, lng: -69.4950 },
  'san josé de los llanos': { lat: 18.6200, lng: -69.4950 },
  'ramón santana': { lat: 18.5500, lng: -69.1800 },
  'guayacanes': { lat: 18.4230, lng: -69.4180 },

  // Hato Mayor y municipios
  'hato mayor': { lat: 18.7628, lng: -69.2568 },
  'hato mayor del rey': { lat: 18.7628, lng: -69.2568 },
  'sabana de la mar': { lat: 19.0580, lng: -69.3880 },
  'el valle': { lat: 18.9320, lng: -69.3810 },

  // Monte Plata y municipios
  'monte plata': { lat: 18.8090, lng: -69.7850 },
  'bayaguana': { lat: 18.7562, lng: -69.6385 },
  'sabana grande de boyá': { lat: 18.9440, lng: -69.7940 },
  'yamasá': { lat: 18.7730, lng: -70.0250 },
  'peralvillo': { lat: 18.8680, lng: -70.0880 }
};

// Función auxiliar que resuelve coordenadas aproximadas cuando el ciudadano reporta sin GPS numérico
function resolverCoordenadas(municipio, provincia) {
  const munKey = (municipio || '').toLowerCase().trim();
  const provKey = (provincia || '').toLowerCase().trim();

  let base = null;
  for (const [clave, coord] of Object.entries(COORDENADAS_REFERENCIA)) {
    if (munKey.includes(clave) || clave.includes(munKey)) {
      base = coord;
      break;
    }
  }

  if (!base) {
    base = COORDENADAS_REFERENCIA[provKey] || { lat: 18.72, lng: -69.45 };
  }

  // Ligera dispersión para que reportes simultáneos en el mismo municipio no se superpongan exactamente
  const jitterLat = (Math.random() - 0.5) * 0.012;
  const jitterLng = (Math.random() - 0.5) * 0.012;

  return {
    lat: Number((base.lat + jitterLat).toFixed(4)),
    lng: Number((base.lng + jitterLng).toFixed(4))
  };
}

// 1. GET /api/incidencias: Lista emergencias con filtros por provincia, estado, prioridad, tipo y búsqueda
async function obtenerIncidencias(req, res, next) {
  try {
    const { provincia, estado, prioridad, tipo, search, soloActivas, activas } = req.query;
    let incidencias = await readData(ENTIDAD);

    // Filtra únicamente emergencias activas (todas excepto 'cerrada') para index.html o despacho de recursos
    if (soloActivas === 'true' || activas === 'true') {
      incidencias = incidencias.filter(i => i.estado !== 'cerrada');
    }

    // Filtro por provincia de la Región Higuamo
    if (provincia) {
      incidencias = incidencias.filter(i =>
        i.provincia.toLowerCase().includes(provincia.toLowerCase())
      );
    }

    // Filtro por estado de atención
    if (estado && estado !== 'todas') {
      incidencias = incidencias.filter(i =>
        i.estado.toLowerCase() === estado.toLowerCase()
      );
    }

    // Filtro por nivel de gravedad o prioridad
    if (prioridad) {
      incidencias = incidencias.filter(i =>
        i.prioridad.toLowerCase() === prioridad.toLowerCase()
      );
    }

    // Filtro por tipo de evento (inundación, carretera bloqueada, etc.)
    if (tipo) {
      incidencias = incidencias.filter(i =>
        i.tipo.toLowerCase() === tipo.toLowerCase()
      );
    }

    // Búsqueda textual libre por palabras clave en título, descripción, comunidad o ID
    if (search) {
      const q = search.toLowerCase();
      incidencias = incidencias.filter(i =>
        (i.titulo && i.titulo.toLowerCase().includes(q)) ||
        (i.descripcion && i.descripcion.toLowerCase().includes(q)) ||
        (i.comunidad && i.comunidad.toLowerCase().includes(q)) ||
        (i.municipio && i.municipio.toLowerCase().includes(q)) ||
        (i.id && i.id.toLowerCase().includes(q))
      );
    }

    // Ordenamiento: Más recientes primero; las cerradas se colocan al final de la lista
    incidencias.sort((a, b) => {
      const aCerrada = a.estado === 'cerrada' ? 1 : 0;
      const bCerrada = b.estado === 'cerrada' ? 1 : 0;
      if (aCerrada !== bCerrada) {
        return aCerrada - bCerrada;
      }
      return new Date(b.fechaReporte) - new Date(a.fechaReporte);
    });

    // Respuesta JSON 200 OK
    res.status(200).json({
      success: true,
      total: incidencias.length,
      data: incidencias
    });
  } catch (error) {
    next(error);
  }
}

// 2. GET /api/incidencias/:id: Obtiene los detalles y bitácora de una emergencia por su código único
async function obtenerIncidenciaPorId(req, res, next) {
  try {
    const { id } = req.params;
    const incidencias = await readData(ENTIDAD);
    const incidencia = incidencias.find(i => i.id.toUpperCase() === id.toUpperCase());

    // Si el ID no existe en el archivo JSON, responde 404 Not Found
    if (!incidencia) {
      return res.status(404).json({
        success: false,
        mensaje: `Incidencia con ID '${id}' no encontrada.`
      });
    }

    res.status(200).json({
      success: true,
      data: incidencia
    });
  } catch (error) {
    next(error);
  }
}

// 3. POST /api/incidencias: Registra una nueva emergencia ciudadana y le asigna código INC-xxx
async function crearIncidencia(req, res, next) {
  try {
    const incidencias = await readData(ENTIDAD);
    // Genera automáticamente el siguiente ID secuencial (ej. INC-004)
    const nuevoId = generateId('INC', incidencias);
    const ahora = new Date().toISOString();

    // Resuelve coordenadas: usa las enviadas o calcula según el municipio en Higuamo
    const coordsValidas = req.body.coordenadas && typeof req.body.coordenadas.lat === 'number' && typeof req.body.coordenadas.lng === 'number';
    const coordenadas = coordsValidas
      ? req.body.coordenadas
      : resolverCoordenadas(req.body.municipio, req.body.provincia);

    // Estructura del nuevo objeto de emergencia
    const nuevaIncidencia = {
      id: nuevoId,
      titulo: req.body.titulo.trim(),
      descripcion: req.body.descripcion ? req.body.descripcion.trim() : '',
      tipo: req.body.tipo,
      provincia: req.body.provincia,
      municipio: req.body.municipio ? req.body.municipio.trim() : req.body.provincia,
      comunidad: req.body.comunidad.trim(),
      coordenadas,
      prioridad: req.body.prioridad || 'media',
      estado: req.body.estado || 'pendiente',
      reportadoPor: req.body.reportadoPor || { nombre: 'Ciudadano', contacto: 'No provisto' },
      afectadosEstimados: Number(req.body.afectadosEstimados) || 0,
      suministrosRecibidos: [],
      fechaReporte: ahora,
      historial: [
        {
          fecha: ahora,
          accion: 'Reporte de emergencia registrado en el sistema',
          usuario: req.body.reportadoPor?.nombre || 'Ciudadano'
        }
      ]
    };

    // Guarda al principio de la lista y persiste en incidencias.json
    incidencias.unshift(nuevaIncidencia);
    await writeData(ENTIDAD, incidencias);

    // Respuesta JSON 201 Created
    res.status(201).json({
      success: true,
      mensaje: 'Incidencia registrada exitosamente.',
      data: nuevaIncidencia
    });
  } catch (error) {
    next(error);
  }
}

// 4. PUT /api/incidencias/:id: Actualización completa de todos los campos de una incidencia
async function actualizarIncidencia(req, res, next) {
  try {
    const { id } = req.params;
    const incidencias = await readData(ENTIDAD);
    const index = incidencias.findIndex(i => i.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Incidencia con ID '${id}' no encontrada para actualizar.`
      });
    }

    const actual = incidencias[index];
    const ahora = new Date().toISOString();

    const actualizada = {
      ...actual,
      titulo: req.body.titulo ? req.body.titulo.trim() : actual.titulo,
      descripcion: req.body.descripcion !== undefined ? req.body.descripcion.trim() : actual.descripcion,
      tipo: req.body.tipo || actual.tipo,
      provincia: req.body.provincia || actual.provincia,
      municipio: req.body.municipio ? req.body.municipio.trim() : actual.municipio,
      comunidad: req.body.comunidad ? req.body.comunidad.trim() : actual.comunidad,
      prioridad: req.body.prioridad || actual.prioridad,
      estado: req.body.estado || actual.estado,
      afectadosEstimados: req.body.afectadosEstimados !== undefined ? Number(req.body.afectadosEstimados) : actual.afectadosEstimados,
      coordenadas: req.body.coordenadas !== undefined ? req.body.coordenadas : actual.coordenadas,
      fechaUltimaModificacion: ahora
    };

    // Registra la modificación en la bitácora
    actualizada.historial = actual.historial || [];
    actualizada.historial.push({
      fecha: ahora,
      accion: 'Incidencia modificada por completo',
      usuario: req.body.usuario || 'Coordinador'
    });

    incidencias[index] = actualizada;
    await writeData(ENTIDAD, incidencias);

    res.status(200).json({
      success: true,
      mensaje: 'Incidencia actualizada con éxito.',
      data: actualizada
    });
  } catch (error) {
    next(error);
  }
}

// 5. PATCH /api/incidencias/:id/estado: Actualiza el estado (pendiente, en_proceso, atendida, cerrada) y añade a la bitácora
async function actualizarEstadoIncidencia(req, res, next) {
  try {
    const { id } = req.params;
    const { estado, nota, usuario, prioridad } = req.body;
    const incidencias = await readData(ENTIDAD);
    const index = incidencias.findIndex(i => i.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Incidencia con ID '${id}' no encontrada.`
      });
    }

    const ahora = new Date().toISOString();
    const incidencia = incidencias[index];
    const estadoAnterior = incidencia.estado;
    incidencia.estado = estado;

    if (prioridad) {
      incidencia.prioridad = prioridad;
    }

    // Agrega el movimiento a la bitácora histórica
    incidencia.historial = incidencia.historial || [];
    incidencia.historial.push({
      fecha: ahora,
      accion: `Estado cambiado de '${estadoAnterior.replace('_', ' ')}' a '${estado.replace('_', ' ')}'${nota ? `: ${nota}` : ''}`,
      usuario: usuario || 'Coordinador Regional'
    });

    incidencia.fechaUltimaModificacion = ahora;
    incidencias[index] = incidencia;
    await writeData(ENTIDAD, incidencias);

    res.status(200).json({
      success: true,
      mensaje: `Estado de la incidencia ${id} actualizado a '${estado}'.`,
      data: incidencia
    });
  } catch (error) {
    next(error);
  }
}

// 6. DELETE /api/incidencias/:id: Elimina una emergencia del registro
async function eliminarIncidencia(req, res, next) {
  try {
    const { id } = req.params;
    const incidencias = await readData(ENTIDAD);
    const index = incidencias.findIndex(i => i.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Incidencia con ID '${id}' no encontrada para eliminar.`
      });
    }

    const [eliminada] = incidencias.splice(index, 1);
    await writeData(ENTIDAD, incidencias);

    res.status(200).json({
      success: true,
      mensaje: `Incidencia ${id} eliminada correctamente.`,
      data: eliminada
    });
  } catch (error) {
    next(error);
  }
}

// Exporta las funciones controladoras del módulo de incidencias
module.exports = {
  obtenerIncidencias,
  obtenerIncidenciaPorId,
  crearIncidencia,
  actualizarIncidencia,
  actualizarEstadoIncidencia,
  eliminarIncidencia
};
