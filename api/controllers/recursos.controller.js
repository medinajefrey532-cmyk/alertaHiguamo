// Utilidades de almacenamiento para leer y guardar datos en archivos JSON y generar IDs únicos
const { readData, writeData, generateId } = require('../../base_de_datos/storage');

// Nombre del archivo y recurso en la base de datos local
const ENTIDAD = 'recursos';

// GET /api/recursos - Obtiene el listado de suministros y recursos de emergencia con filtros opcionales
async function obtenerRecursos(req, res, next) {
  try {
    // Parámetros de consulta opcionales: provincia, categoría del suministro o término de búsqueda
    const { provincia, categoria, search } = req.query;

    // Lectura de todos los recursos almacenados en el archivo recursos.json
    let recursos = await readData(ENTIDAD);

    // Filtrar recursos por provincia si se especifica en la URL
    if (provincia) {
      recursos = recursos.filter(r =>
        r.provincia.toLowerCase().includes(provincia.toLowerCase())
      );
    }

    // Filtrar recursos por categoría específica (agua, alimentos, salud, rescate, etc.)
    if (categoria) {
      recursos = recursos.filter(r =>
        r.categoria.toLowerCase() === categoria.toLowerCase()
      );
    }

    // Búsqueda por texto coincidente en nombre del recurso o nombre del almacén
    if (search) {
      const q = search.toLowerCase();
      recursos = recursos.filter(r =>
        r.nombre.toLowerCase().includes(q) ||
        r.ubicacionAlmacen.toLowerCase().includes(q)
      );
    }

    // Retorna la lista filtrada de recursos con código HTTP 200 y total
    res.status(200).json({
      success: true,
      total: recursos.length,
      data: recursos
    });
  } catch (error) {
    // Pasa cualquier error inesperado al middleware global de errores
    next(error);
  }
}

// GET /api/recursos/:id - Obtiene un recurso o suministro individual por su identificador
async function obtenerRecursoPorId(req, res, next) {
  try {
    // Extracción del parámetro identificador de la URL (ej: REC-001)
    const { id } = req.params;

    // Lectura del archivo de recursos
    const recursos = await readData(ENTIDAD);

    // Búsqueda del recurso por ID insensible a mayúsculas/minúsculas
    const recurso = recursos.find(r => r.id.toUpperCase() === id.toUpperCase());

    // Retornar error 404 si el recurso no existe en el registro
    if (!recurso) {
      return res.status(404).json({
        success: false,
        mensaje: `Recurso con ID '${id}' no encontrado.`
      });
    }

    // Retornar los datos del recurso con código HTTP 200
    res.status(200).json({
      success: true,
      data: recurso
    });
  } catch (error) {
    // Pasa cualquier error inesperado al middleware global de errores
    next(error);
  }
}

// POST /api/recursos - Registra un nuevo suministro en el inventario regional
async function crearRecurso(req, res, next) {
  try {
    // Carga de recursos actuales para generar el siguiente ID secuencial
    const recursos = await readData(ENTIDAD);

    // Generación automática del identificador único prefijado con REC
    const nuevoId = generateId('REC', recursos);

    // Marca de tiempo ISO actual para auditoría
    const ahora = new Date().toISOString();

    // Conversión de cantidades numéricas
    const cantidadTotal = Number(req.body.cantidadTotal);
    const cantidadDisponible = req.body.cantidadDisponible !== undefined ? Number(req.body.cantidadDisponible) : cantidadTotal;
    const cantidadEntregada = req.body.cantidadEntregada !== undefined ? Number(req.body.cantidadEntregada) : (cantidadTotal - cantidadDisponible);

    // Construcción del nuevo objeto de recurso con estructura formal
    const nuevoRecurso = {
      id: nuevoId,
      nombre: req.body.nombre.trim(),
      categoria: req.body.categoria.trim().toLowerCase(),
      unidad: req.body.unidad.trim(),
      cantidadTotal,
      cantidadDisponible,
      cantidadEntregada,
      ubicacionAlmacen: req.body.ubicacionAlmacen ? req.body.ubicacionAlmacen.trim() : `Almacén Central ${req.body.provincia}`,
      provincia: req.body.provincia,
      responsable: req.body.responsable ? req.body.responsable.trim() : 'Encargado de Logística',
      historialEntregas: [],
      fechaActualizacion: ahora
    };

    // Agregar el nuevo recurso a la lista y persistir en archivo JSON
    recursos.push(nuevoRecurso);
    await writeData(ENTIDAD, recursos);

    // Respuesta HTTP 201 de creación exitosa con el recurso creado
    res.status(201).json({
      success: true,
      mensaje: 'Recurso registrado exitosamente.',
      data: nuevoRecurso
    });
  } catch (error) {
    // Pasa cualquier error inesperado al middleware global de errores
    next(error);
  }
}

// PUT /api/recursos/:id - Actualización completa de datos de un recurso existente
async function actualizarRecurso(req, res, next) {
  try {
    // Identificador recibido en los parámetros de ruta
    const { id } = req.params;

    // Lectura de recursos para ubicar el índice del elemento
    const recursos = await readData(ENTIDAD);
    const index = recursos.findIndex(r => r.id.toUpperCase() === id.toUpperCase());

    // Retornar error 404 si el recurso no existe
    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Recurso con ID '${id}' no encontrado para actualizar.`
      });
    }

    // Datos actuales del recurso y fecha actual
    const actual = recursos[index];
    const ahora = new Date().toISOString();

    // Objeto con datos actualizados manteniendo valores previos si no fueron enviados
    const actualizado = {
      ...actual,
      nombre: req.body.nombre ? req.body.nombre.trim() : actual.nombre,
      categoria: req.body.categoria ? req.body.categoria.trim().toLowerCase() : actual.categoria,
      unidad: req.body.unidad ? req.body.unidad.trim() : actual.unidad,
      cantidadTotal: req.body.cantidadTotal !== undefined ? Number(req.body.cantidadTotal) : actual.cantidadTotal,
      cantidadDisponible: req.body.cantidadDisponible !== undefined ? Number(req.body.cantidadDisponible) : actual.cantidadDisponible,
      cantidadEntregada: req.body.cantidadEntregada !== undefined ? Number(req.body.cantidadEntregada) : actual.cantidadEntregada,
      ubicacionAlmacen: req.body.ubicacionAlmacen ? req.body.ubicacionAlmacen.trim() : actual.ubicacionAlmacen,
      provincia: req.body.provincia || actual.provincia,
      responsable: req.body.responsable ? req.body.responsable.trim() : actual.responsable,
      fechaActualizacion: ahora
    };

    // Guardar recurso modificado en el arreglo y persistir en disco
    recursos[index] = actualizado;
    await writeData(ENTIDAD, recursos);

    // Respuesta HTTP 200 con el recurso actualizado
    res.status(200).json({
      success: true,
      mensaje: 'Recurso actualizado con éxito.',
      data: actualizado
    });
  } catch (error) {
    // Pasa cualquier error inesperado al middleware global de errores
    next(error);
  }
}

// PATCH /api/recursos/:id/entrega - Despacha insumos hacia una incidencia de emergencia específica
async function registrarEntregaRecurso(req, res, next) {
  try {
    // ID del recurso a despachar
    const { id } = req.params;

    // Datos del formulario de despacho: cantidad, destino, ID de la incidencia vinculada y usuario
    const { cantidadEntregar, destino, incidenciaId, usuario } = req.body;
    const cantidad = Number(cantidadEntregar);

    // Validación de cantidad positiva
    if (isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'La cantidad a entregar debe ser un número mayor a 0.'
      });
    }

    // Lectura del catálogo de recursos
    const recursos = await readData(ENTIDAD);
    const index = recursos.findIndex(r => r.id.toUpperCase() === id.toUpperCase());

    // Retorna error 404 si el recurso no existe
    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Recurso con ID '${id}' no encontrado.`
      });
    }

    const recurso = recursos[index];

    // Validación de stock: evita despachar más de lo que está disponible
    if (cantidad > recurso.cantidadDisponible) {
      return res.status(400).json({
        success: false,
        mensaje: `Inventario insuficiente. Stock disponible: ${recurso.cantidadDisponible} ${recurso.unidad}. Intentó entregar: ${cantidad}.`
      });
    }

    // Fecha y hora del despacho
    const ahora = new Date().toISOString();

    // Vínculo bidireccional: si se especifica una incidencia, registrar el despacho en el historial de dicha incidencia
    let detalleDestino = destino ? destino.trim() : 'Comunidad afectada';
    if (incidenciaId) {
      const incidencias = await readData('incidencias');
      const incIndex = incidencias.findIndex(i => i.id.toUpperCase() === incidenciaId.toUpperCase());
      if (incIndex !== -1) {
        const inc = incidencias[incIndex];
        detalleDestino = `${inc.id} - ${inc.comunidad} (${inc.provincia})`;

        // Registro de auditoría en la línea de tiempo de la incidencia afectada
        inc.historial = inc.historial || [];
        inc.historial.push({
          fecha: ahora,
          accion: `Despacho de suministros recibido: ${cantidad} ${recurso.unidad} de ${recurso.nombre}`,
          usuario: usuario || 'Encargado de Recursos'
        });

        // Registro estructurado en suministros recibidos por la emergencia
        inc.suministrosRecibidos = inc.suministrosRecibidos || [];
        inc.suministrosRecibidos.push({
          recursoId: recurso.id,
          nombre: recurso.nombre,
          cantidad,
          unidad: recurso.unidad,
          fecha: ahora
        });

        incidencias[incIndex] = inc;
        await writeData('incidencias', incidencias);
      }
    }

    // Descontar inventario disponible e incrementar cantidad entregada en el recurso
    recurso.cantidadDisponible -= cantidad;
    recurso.cantidadEntregada = (recurso.cantidadEntregada || 0) + cantidad;

    // Agregar entrada al historial de entregas del propio recurso para trazabilidad
    recurso.historialEntregas = recurso.historialEntregas || [];
    recurso.historialEntregas.unshift({
      fecha: ahora,
      cantidad,
      unidad: recurso.unidad,
      incidenciaId: incidenciaId || null,
      destino: detalleDestino
    });
    recurso.fechaActualizacion = ahora;

    // Guardar cambios del recurso en recursos.json
    recursos[index] = recurso;
    await writeData(ENTIDAD, recursos);

    // Respuesta HTTP 200 con confirmación del despacho y datos actualizados
    res.status(200).json({
      success: true,
      mensaje: `Entrega de ${cantidad} ${recurso.unidad} registrada exitosamente hacia ${detalleDestino}.`,
      data: recurso
    });
  } catch (error) {
    // Pasa cualquier error inesperado al middleware global de errores
    next(error);
  }
}

// DELETE /api/recursos/:id - Elimina un recurso del inventario del sistema
async function eliminarRecurso(req, res, next) {
  try {
    // Identificador recibido en la URL
    const { id } = req.params;

    // Lectura del listado de recursos
    const recursos = await readData(ENTIDAD);
    const index = recursos.findIndex(r => r.id.toUpperCase() === id.toUpperCase());

    // Retorna error 404 si el recurso no existe
    if (index === -1) {
      return res.status(404).json({
        success: false,
        mensaje: `Recurso con ID '${id}' no encontrado para eliminar.`
      });
    }

    // Remueve el recurso del arreglo
    const [eliminado] = recursos.splice(index, 1);

    // Guarda los cambios en recursos.json
    await writeData(ENTIDAD, recursos);

    // Respuesta HTTP 200 con el recurso eliminado
    res.status(200).json({
      success: true,
      mensaje: `Recurso ${id} eliminado correctamente.`,
      data: eliminado
    });
  } catch (error) {
    // Pasa cualquier error inesperado al middleware global de errores
    next(error);
  }
}

// Exportación de funciones controladoras para uso en las rutas
module.exports = {
  obtenerRecursos,
  obtenerRecursoPorId,
  crearRecurso,
  actualizarRecurso,
  registrarEntregaRecurso,
  eliminarRecurso
};
