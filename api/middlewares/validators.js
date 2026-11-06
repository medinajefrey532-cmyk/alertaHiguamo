// ==========================================================================
// MIDDLEWARES DE VALIDACIÓN DE ENTRADA — ALERTA HIGUAMO
// Este archivo valida los datos recibidos en solicitudes POST, PUT y PATCH
// ==========================================================================

// Lista oficial de provincias que conforman la Región Higuamo
const PROVINCIAS_VALIDAS = [
  'San Pedro de Macorís',
  'Hato Mayor',
  'Monte Plata'
];

// Tipos de emergencias admitidos en el sistema
const TIPOS_INCIDENCIA = [
  'inundacion',
  'deslizamiento',
  'carretera_bloqueada',
  'comunidad_aislada',
  'necesidad_suministros',
  'colapso_estructura',
  'otro'
];

// Niveles de prioridad permitidos
const PRIORIDADES_VALIDAS = ['alta', 'media', 'baja'];

// Estados válidos del ciclo de vida de una emergencia
const ESTADOS_INCIDENCIA = ['pendiente', 'en_proceso', 'atendida', 'cerrada'];

// Estados válidos de operatividad de un refugio
const ESTADOS_REFUGIO = ['operativo', 'lleno', 'no_disponible'];

// Función auxiliar que normaliza el texto de la provincia a su forma oficial
function normalizarProvincia(prov) {
  if (!prov) return null;
  const p = prov.trim().toLowerCase();
  if (p.includes('pedro')) return 'San Pedro de Macorís';
  if (p.includes('hato')) return 'Hato Mayor';
  if (p.includes('monte')) return 'Monte Plata';
  return prov;
}

// Middleware: Valida los datos requeridos para registrar una nueva incidencia (POST /api/incidencias)
function validarCrearIncidencia(req, res, next) {
  const { titulo, tipo, provincia, comunidad } = req.body;
  const errores = [];

  // Valida que el título tenga al menos 5 caracteres
  if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 5) {
    errores.push('El título es obligatorio y debe tener al menos 5 caracteres.');
  }

  // Valida que el tipo de incidencia pertenezca a la lista admitida
  if (!tipo || !TIPOS_INCIDENCIA.includes(tipo)) {
    errores.push(`El tipo de incidencia es obligatorio y debe ser uno de: ${TIPOS_INCIDENCIA.join(', ')}.`);
  }

  // Valida que la provincia pertenezca a la Región Higuamo
  const provNormalizada = normalizarProvincia(provincia);
  if (!provNormalizada || !PROVINCIAS_VALIDAS.includes(provNormalizada)) {
    errores.push(`La provincia debe ser una de las de la Región Higuamo: ${PROVINCIAS_VALIDAS.join(', ')}.`);
  } else {
    req.body.provincia = provNormalizada;
  }

  // Valida que la comunidad o sector no esté vacío
  if (!comunidad || typeof comunidad !== 'string' || comunidad.trim().length === 0) {
    errores.push('La comunidad o sector es obligatorio.');
  }

  // Valida prioridad si fue provista
  if (req.body.prioridad && !PRIORIDADES_VALIDAS.includes(req.body.prioridad)) {
    errores.push(`La prioridad debe ser una de: ${PRIORIDADES_VALIDAS.join(', ')}.`);
  }

  // Valida estado si fue provisto
  if (req.body.estado && !ESTADOS_INCIDENCIA.includes(req.body.estado)) {
    errores.push(`El estado debe ser uno de: ${ESTADOS_INCIDENCIA.join(', ')}.`);
  }

  // Si hay errores, responde 400 Bad Request con la lista de fallos
  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      mensaje: 'Datos de incidencia inválidos.',
      errores
    });
  }

  next();
}

// Middleware: Valida el estado al actualizar una emergencia (PATCH /api/incidencias/:id/estado)
function validarEstadoIncidencia(req, res, next) {
  const { estado } = req.body;
  if (!estado || !ESTADOS_INCIDENCIA.includes(estado)) {
    return res.status(400).json({
      success: false,
      mensaje: `El campo 'estado' es obligatorio y debe ser uno de: ${ESTADOS_INCIDENCIA.join(', ')}.`
    });
  }
  next();
}

// Middleware: Valida los datos requeridos para registrar un refugio (POST /api/refugios)
function validarCrearRefugio(req, res, next) {
  const { nombre, provincia, municipio, direccion, capacidadTotal } = req.body;
  const errores = [];

  // Valida nombre del refugio
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
    errores.push('El nombre del refugio es obligatorio (mínimo 3 caracteres).');
  }

  // Valida que la provincia sea de Higuamo
  const provNormalizada = normalizarProvincia(provincia);
  if (!provNormalizada || !PROVINCIAS_VALIDAS.includes(provNormalizada)) {
    errores.push(`La provincia debe ser: ${PROVINCIAS_VALIDAS.join(', ')}.`);
  } else {
    req.body.provincia = provNormalizada;
  }

  if (!municipio || typeof municipio !== 'string') {
    errores.push('El municipio es obligatorio.');
  }

  if (!direccion || typeof direccion !== 'string') {
    errores.push('La dirección es obligatoria.');
  }

  // Valida capacidad numérica positiva
  const cap = Number(capacidadTotal);
  if (isNaN(cap) || cap <= 0) {
    errores.push('La capacidad total debe ser un número entero mayor que 0.');
  }

  if (req.body.estado && !ESTADOS_REFUGIO.includes(req.body.estado)) {
    errores.push(`El estado debe ser: ${ESTADOS_REFUGIO.join(', ')}.`);
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      mensaje: 'Datos del refugio inválidos.',
      errores
    });
  }

  next();
}

// Middleware: Valida la variación o asignación de capacidad de un refugio (PATCH /api/refugios/:id/capacidad)
function validarCapacidadRefugio(req, res, next) {
  const { espaciosOcupados, variacion, delta, cambio } = req.body;

  // Validación si se envía variación relativa (+15, -10)
  if (variacion !== undefined || delta !== undefined || cambio !== undefined) {
    const v = Number(variacion ?? delta ?? cambio);
    if (isNaN(v) || v === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'La variación debe ser un número entero diferente de cero (positivo para ingresos, negativo para egresos).'
      });
    }
    req.body.variacion = v;
    return next();
  }

  // Validación si se envía asignación directa de ocupados
  if (espaciosOcupados !== undefined) {
    const ocupados = Number(espaciosOcupados);
    if (isNaN(ocupados) || ocupados < 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El campo espaciosOcupados debe ser un número entero mayor o igual a 0.'
      });
    }
    req.body.espaciosOcupados = ocupados;
    return next();
  }

  return res.status(400).json({
    success: false,
    mensaje: 'Debe especificar el número de personas a ingresar/egresar (variación) o el total de espaciosOcupados.'
  });
}

// Middleware: Valida los datos requeridos para registrar un recurso (POST /api/recursos)
function validarCrearRecurso(req, res, next) {
  const { nombre, categoria, unidad, cantidadTotal, provincia } = req.body;
  const errores = [];

  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
    errores.push('El nombre del recurso es obligatorio.');
  }

  if (!categoria || typeof categoria !== 'string') {
    errores.push('La categoría del recurso es obligatoria (ej: agua, alimentos, salud, rescate).');
  }

  if (!unidad || typeof unidad !== 'string') {
    errores.push('La unidad de medida es obligatoria (ej: botellones, raciones, cajas).');
  }

  const provNormalizada = normalizarProvincia(provincia);
  if (!provNormalizada || !PROVINCIAS_VALIDAS.includes(provNormalizada)) {
    errores.push(`La provincia debe ser: ${PROVINCIAS_VALIDAS.join(', ')}.`);
  } else {
    req.body.provincia = provNormalizada;
  }

  const total = Number(cantidadTotal);
  if (isNaN(total) || total < 0) {
    errores.push('La cantidad total debe ser un número mayor o igual a 0.');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      mensaje: 'Datos del recurso inválidos.',
      errores
    });
  }

  next();
}

// Exporta las constantes y funciones de validación
module.exports = {
  PROVINCIAS_VALIDAS,
  TIPOS_INCIDENCIA,
  PRIORIDADES_VALIDAS,
  ESTADOS_INCIDENCIA,
  ESTADOS_REFUGIO,
  normalizarProvincia,
  validarCrearIncidencia,
  validarEstadoIncidencia,
  validarCrearRefugio,
  validarCapacidadRefugio,
  validarCrearRecurso
};
