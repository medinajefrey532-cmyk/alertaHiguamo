// ==========================================================================
// CONTROLADOR DEL RECURSO: REFUGIOS (/api/refugios)
// Implementa las operaciones CRUD y control de plazas de albergues
// ==========================================================================

const { readData, writeData, generateId } = require('../../base_de_datos/storage');

const ENTIDAD = 'refugios';

// 1. GET /api/refugios: Lista refugios con filtros por provincia, estado y disponibilidad
async function obtenerRefugios(req, res, next) {
  try {
    const { provincia, estado, soloDisponibles, search } = req.query;
    let refugios = await readData(ENTIDAD);

    // Filtro por provincia
    if (provincia) {
      refugios = refugios.filter(r =>
        r.provincia.toLowerCase().includes(provincia.toLowerCase())
      );
    }

    // Filtro por estado operativo o lleno
    if (estado) {
      refugios = refugios.filter(r =>
        r.estado.toLowerCase() === estado.toLowerCase()
      );
    }

    // Filtro para mostrar solo albergues con plazas libres
    if (soloDisponibles === 'true' || soloDisponibles === '1') {
      refugios = refugios.filter(r => r.espaciosDisponibles > 0 && r.estado === 'operativo');
    }

    // Búsqueda por nombre del centro, municipio o dirección
    if (search) {
      const q = search.toLowerCase();
      refugios = refugios.filter(r =>
        r.nombre.toLowerCase().includes(q) ||
        r.municipio.toLowerCase().includes(q) ||
        r.direccion.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      total: refugios.length,
      data: refugios
    });
  } catch (error) {
    next(error);
  }
}

// 2. GET /api/refugios/:id: Obtiene el detalle de un albergue y su historial de movimientos
async function obtenerRefugioPorId(req, res, next) {
  try {
    const { id } = req.params;
    const refugios = await readData(ENTIDAD);
    const refugio = refugios.find(r => r.id.toUpperCase() === id.toUpperCase());

    if (!refugio) {
      return res.status(404).json({
        success: false,
        mensaje: `Refugio con ID '${id}' no encontrado.`
      });
    }

    res.status(200).json({
      success: true,
      data: refugio
    });
  } catch (error) {
    next(error);
  }
}

// 3. POST /api/refugios: Registra un nuevo refugio comunitario y le asigna código REF-xxx
async function crearRefugio(req, res, next) {
  try {
    const refugios = await readData(ENTIDAD);
    const nuevoId = generateId('REF', refugios);
    const ahora = new Date().toISOString();

    const capacidadTotal = Number(req.body.capacidadTotal);
    const espaciosOcupados = Number(req.body.espaciosOcupados) || 0;

    // Validación lógica: ocupados no pueden superar capacidad total
    if (espaciosOcupados > capacidadTotal) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los espacios ocupados no pueden ser mayores que la capacidad total.'
      });
    }

    const espaciosDisponibles = Math.max(0, capacidadTotal - espaciosOcupados);
    let estadoCalculado = req.body.estado || 'operativo';
    if (espaciosDisponibles === 0 && estadoCalculado === 'operativo') {
      estadoCalculado = 'lleno';
    }

    const nuevoRefugio = {
      id: nuevoId,
      nombre: req.body.nombre.trim(),
      provincia: req.body.provincia,
      municipio: req.body.municipio.trim(),
      direccion: req.body.direccion.trim(),
      coordenadas: req.body.coordenadas || null,
      encargado: req.body.encargado || { nombre: 'Por asignar', telefono: 'No provisto' },
      capacidadTotal,
      espaciosOcupados,
      espaciosDisponibles,
      estado: estadoCalculado,
      servicios: Array.isArray(req.body.servicios) ? req.body.servicios : ['agua_potable'],
      historial: [
        {
          fecha: ahora,
          variacion: espaciosOcupados,
          ocupadosResultante: espaciosOcupados,
          accion: `Refugio habilitado con capacidad para ${capacidadTotal} personas (${espaciosOcupados} ocupados inicialmente)`,
          usuario: req.body.encargado?.nombre || 'Administración de Albergues'
        }
      ],
      fechaActualizacion: ahora
    };

    refugios.push(nuevoRefugio);
    await writeData(ENTIDAD, refugios);

    res.status(201).json({
      success: true,
      mensaje: 'Refugio registrado exitosamente.',
      data: nuevoRefugio
    });
  } catch (error) {
    next(error);
  }
}

// 4. PUT /api/refugios/:id: Actualización completa de los datos de un albergue
async function actualizarRefugio(req, res, next) {
  try {
    const { id } = req.params;
    const refugios = await readData(ENTIDAD);
    const index = refugios.findIndex(r => r.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Refugio con ID '${id}' no encontrado para actualizar.`
      });
    }

    const actual = refugios[index];
    const ahora = new Date().toISOString();

    const capacidadTotal = req.body.capacidadTotal !== undefined ? Number(req.body.capacidadTotal) : actual.capacidadTotal;
    const espaciosOcupados = req.body.espaciosOcupados !== undefined ? Number(req.body.espaciosOcupados) : actual.espaciosOcupados;

    if (espaciosOcupados > capacidadTotal) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los espacios ocupados no pueden exceder la capacidad total.'
      });
    }

    const espaciosDisponibles = Math.max(0, capacidadTotal - espaciosOcupados);
    let estado = req.body.estado || actual.estado;
    if (espaciosDisponibles === 0 && estado === 'operativo') {
      estado = 'lleno';
    } else if (espaciosDisponibles > 0 && estado === 'lleno') {
      estado = 'operativo';
    }

    const actualizado = {
      ...actual,
      nombre: req.body.nombre ? req.body.nombre.trim() : actual.nombre,
      provincia: req.body.provincia || actual.provincia,
      municipio: req.body.municipio ? req.body.municipio.trim() : actual.municipio,
      direccion: req.body.direccion ? req.body.direccion.trim() : actual.direccion,
      encargado: req.body.encargado !== undefined ? req.body.encargado : actual.encargado,
      capacidadTotal,
      espaciosOcupados,
      espaciosDisponibles,
      estado,
      servicios: Array.isArray(req.body.servicios) ? req.body.servicios : actual.servicios,
      fechaActualizacion: ahora
    };

    refugios[index] = actualizado;
    await writeData(ENTIDAD, refugios);

    res.status(200).json({
      success: true,
      mensaje: 'Refugio actualizado con éxito.',
      data: actualizado
    });
  } catch (error) {
    next(error);
  }
}

// 5. PATCH /api/refugios/:id/capacidad: Actualiza personas alojadas mediante variación delta (+ o -) o asignación
async function actualizarCapacidadRefugio(req, res, next) {
  try {
    const { id } = req.params;
    const { espaciosOcupados, variacion, usuario } = req.body;
    const refugios = await readData(ENTIDAD);
    const index = refugios.findIndex(r => r.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Refugio con ID '${id}' no encontrado.`
      });
    }

    const refugio = refugios[index];
    let nuevoOcupados = refugio.espaciosOcupados;
    let delta = 0;

    // Si se envía variación relativa (+15, -10)
    if (variacion !== undefined) {
      delta = Number(variacion);
      nuevoOcupados = refugio.espaciosOcupados + delta;
    } else if (espaciosOcupados !== undefined) {
      nuevoOcupados = Number(espaciosOcupados);
      delta = nuevoOcupados - refugio.espaciosOcupados;
    }

    // Validación lógica: la ocupación resultante no puede ser negativa
    if (nuevoOcupados < 0) {
      return res.status(400).json({
        success: false,
        mensaje: `No se puede reducir la ocupación por debajo de 0. Ocupación actual: ${refugio.espaciosOcupados}, intento de egreso: ${Math.abs(delta)}.`
      });
    }

    // Validación lógica: la ocupación no puede superar la capacidad máxima
    if (nuevoOcupados > refugio.capacidadTotal) {
      return res.status(400).json({
        success: false,
        mensaje: `La cantidad resultante (${nuevoOcupados}) supera la capacidad total del refugio (${refugio.capacidadTotal}).`
      });
    }

    // Actualiza ocupación y calcula plazas libres
    refugio.espaciosOcupados = nuevoOcupados;
    refugio.espaciosDisponibles = Math.max(0, refugio.capacidadTotal - nuevoOcupados);

    // Ajusta estado entre 'operativo' y 'lleno'
    if (refugio.espaciosDisponibles === 0 && refugio.estado === 'operativo') {
      refugio.estado = 'lleno';
    } else if (refugio.espaciosDisponibles > 0 && refugio.estado === 'lleno') {
      refugio.estado = 'operativo';
    }

    const ahora = new Date().toISOString();
    refugio.fechaActualizacion = ahora;

    // Registra el movimiento en la bitácora histórica
    refugio.historial = refugio.historial || [];
    const accionTexto = delta > 0
      ? `Ingreso de ${delta} persona(s) evacuadas. Total alojadas: ${refugio.espaciosOcupados}/${refugio.capacidadTotal}`
      : delta < 0
      ? `Salida/egreso de ${Math.abs(delta)} persona(s). Total alojadas: ${refugio.espaciosOcupados}/${refugio.capacidadTotal}`
      : `Actualización de capacidad: ${refugio.espaciosOcupados}/${refugio.capacidadTotal}`;

    refugio.historial.unshift({
      fecha: ahora,
      variacion: delta,
      ocupadosResultante: refugio.espaciosOcupados,
      accion: accionTexto,
      usuario: usuario || 'Encargado de Refugio'
    });

    refugios[index] = refugio;
    await writeData(ENTIDAD, refugios);

    res.status(200).json({
      success: true,
      mensaje: `Movimiento registrado: ${accionTexto}. Plazas libres: ${refugio.espaciosDisponibles}.`,
      data: refugio
    });
  } catch (error) {
    next(error);
  }
}

// 6. DELETE /api/refugios/:id: Elimina un refugio del sistema
async function eliminarRefugio(req, res, next) {
  try {
    const { id } = req.params;
    const refugios = await readData(ENTIDAD);
    const index = refugios.findIndex(r => r.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Refugio con ID '${id}' no encontrado para eliminar.`
      });
    }

    const [eliminado] = refugios.splice(index, 1);
    await writeData(ENTIDAD, refugios);

    res.status(200).json({
      success: true,
      mensaje: `Refugio ${id} eliminado correctamente.`,
      data: eliminado
    });
  } catch (error) {
    next(error);
  }
}

// Exporta las funciones del controlador de refugios
module.exports = {
  obtenerRefugios,
  obtenerRefugioPorId,
  crearRefugio,
  actualizarRefugio,
  actualizarCapacidadRefugio,
  eliminarRefugio
};
