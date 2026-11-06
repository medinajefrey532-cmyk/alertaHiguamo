// Módulo HTTP nativo de Node.js para comunicación de red en pruebas
const http = require('http');

// Aplicación Express configurada
const app = require('../app');

// Puerto reservado para la suite de pruebas automatizadas
const TEST_PORT = 3999;
let server;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Contadores de resultados
let totalPruebas = 0;
let pruebasExitosas = 0;
let pruebasFallidas = 0;
const resultados = [];

// Registra el resultado de cada aserción en consola y en memoria
function registrarResultado(nombre, esperado, obtenido, statusEsperado, statusObtenido, paso, detalles = '') {
  totalPruebas++;
  if (paso) {
    pruebasExitosas++;
    console.log(`  [PASS] ${nombre} (HTTP ${statusObtenido})`);
  } else {
    pruebasFallidas++;
    console.log(`  [FAIL] ${nombre} (Esperado HTTP ${statusEsperado}, obtenido ${statusObtenido})`);
    if (detalles) console.log(`         Detalles: ${detalles}`);
  }
  resultados.push({
    nombre,
    statusEsperado,
    statusObtenido,
    paso,
    detalles
  });
}

// Función principal que ejecuta la batería completa de pruebas automatizadas de la API REST
async function ejecutarPruebas() {
  console.log('\n=============================================================');
  console.log('[TEST] INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS - ALERTA HIGUAMO');
  console.log('=============================================================\n');

  // Iniciar servidor temporal para pruebas en el puerto asignado
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Servidor de pruebas levantado en ${BASE_URL}\n`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // PRUEBAS DE SALUD Y RUTAS GENERALES
    // -------------------------------------------------------------
    console.log('[MODULO 1] PRUEBAS GENERALES Y DE SALUD');
    {
      // Prueba: Verifica que el endpoint /api/health responda HTTP 200 y success true
      const res = await fetch(`${BASE_URL}/api/health`);
      const data = await res.json();
      registrarResultado(
        'GET /api/health - Verificación de operatividad del sistema',
        200, res.status, 200, res.status,
        res.status === 200 && data.success === true
      );
    }
    {
      // Prueba: Verifica que una ruta inexistente retorne código HTTP 404 estructurado
      const res = await fetch(`${BASE_URL}/api/ruta-fantasma-no-existe`);
      const data = await res.json();
      registrarResultado(
        'GET /api/ruta-fantasma-no-existe - Manejo de ruta no encontrada (404)',
        404, res.status, 404, res.status,
        res.status === 404 && data.success === false
      );
    }

    // -------------------------------------------------------------
    // PRUEBAS DEL RECURSO: INCIDENCIAS (/api/incidencias)
    // -------------------------------------------------------------
    console.log('\n[MODULO 2] PRUEBAS DEL RECURSO: INCIDENCIAS (/api/incidencias)');
    let idIncidenciaCreada = null;

    {
      // Prueba: Verifica que GET /api/incidencias devuelva un arreglo con las emergencias
      const res = await fetch(`${BASE_URL}/api/incidencias`);
      const data = await res.json();
      registrarResultado(
        'GET /api/incidencias - Listar todas las incidencias',
        200, res.status, 200, res.status,
        res.status === 200 && Array.isArray(data.data) && data.data.length > 0
      );
    }
    {
      // Prueba: Verifica el filtrado por parámetro query de provincia
      const res = await fetch(`${BASE_URL}/api/incidencias?provincia=San%20Pedro%20de%20Macor%C3%ADs`);
      const data = await res.json();
      const todosPertenecen = data.data.every(i => i.provincia === 'San Pedro de Macorís');
      registrarResultado(
        'GET /api/incidencias?provincia=... - Filtrar incidencias por provincia',
        200, res.status, 200, res.status,
        res.status === 200 && todosPertenecen
      );
    }
    {
      // Prueba: Verifica la consulta de un reporte existente por su ID
      const res = await fetch(`${BASE_URL}/api/incidencias/INC-001`);
      const data = await res.json();
      registrarResultado(
        'GET /api/incidencias/:id - Obtener incidencia existente por ID (INC-001)',
        200, res.status, 200, res.status,
        res.status === 200 && data.data.id === 'INC-001'
      );
    }
    {
      // Prueba: Verifica que consultar un ID inexistente devuelva 404 Not Found
      const res = await fetch(`${BASE_URL}/api/incidencias/INC-99999`);
      const data = await res.json();
      registrarResultado(
        'GET /api/incidencias/:id - Incidencia inexistente devuelve 404',
        404, res.status, 404, res.status,
        res.status === 404 && data.success === false
      );
    }
    {
      // Prueba: Verifica la creación de una incidencia mediante POST retornando 201 Created
      const nueva = {
        titulo: 'Árbol caído obstruyendo Tendido Eléctrico',
        descripcion: 'Vientos fuertes derribaron una ceiba sobre los cables en el barrio Placer Bonito.',
        tipo: 'colapso_estructura',
        provincia: 'San Pedro de Macorís',
        municipio: 'San Pedro de Macorís',
        comunidad: 'Placer Bonito',
        prioridad: 'alta',
        reportadoPor: { nombre: 'Juana Mercedes', contacto: '809-555-8888' },
        afectadosEstimados: 50
      };
      const res = await fetch(`${BASE_URL}/api/incidencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nueva)
      });
      const data = await res.json();
      idIncidenciaCreada = data.data ? data.data.id : null;
      registrarResultado(
        'POST /api/incidencias - Registrar nueva incidencia exitosamente (201)',
        201, res.status, 201, res.status,
        res.status === 201 && !!idIncidenciaCreada && data.data.estado === 'pendiente'
      );
    }
    {
      // Prueba: Verifica que omitir campos obligatorios o enviar provincia inválida retorne 400 Bad Request
      const invalida = {
        titulo: 'No',
        provincia: 'Santiago'
      };
      const res = await fetch(`${BASE_URL}/api/incidencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalida)
      });
      const data = await res.json();
      registrarResultado(
        'POST /api/incidencias - Validación de datos inválidos devuelve 400',
        400, res.status, 400, res.status,
        res.status === 400 && data.success === false && Array.isArray(data.errores)
      );
    }
    {
      // Prueba: Verifica la actualización completa de una incidencia mediante PUT
      const modif = {
        titulo: 'Árbol caído obstruyendo Tendido Eléctrico (Atención Requerida)',
        tipo: 'colapso_estructura',
        provincia: 'San Pedro de Macorís',
        comunidad: 'Placer Bonito Norte',
        prioridad: 'alta',
        estado: 'en_proceso',
        afectadosEstimados: 75
      };
      const res = await fetch(`${BASE_URL}/api/incidencias/${idIncidenciaCreada}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modif)
      });
      const data = await res.json();
      registrarResultado(
        'PUT /api/incidencias/:id - Actualización completa de incidencia',
        200, res.status, 200, res.status,
        res.status === 200 && data.data.comunidad === 'Placer Bonito Norte'
      );
    }
    {
      // Prueba: Verifica la actualización parcial de estado con PATCH e inserción de nota en historial
      const patchData = {
        estado: 'atendida',
        nota: 'Brigada de EDEESTE retiró el árbol y restableció la energía.',
        usuario: 'Coordinador Regional SPM'
      };
      const res = await fetch(`${BASE_URL}/api/incidencias/${idIncidenciaCreada}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
      });
      const data = await res.json();
      registrarResultado(
        'PATCH /api/incidencias/:id/estado - Actualizar estado a atendida',
        200, res.status, 200, res.status,
        res.status === 200 && data.data.estado === 'atendida'
      );
    }
    {
      // Prueba: Verifica que enviar un estado fuera del enum permitido retorne 400 Bad Request
      const res = await fetch(`${BASE_URL}/api/incidencias/${idIncidenciaCreada}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'estado_inventado_invalido' })
      });
      registrarResultado(
        'PATCH /api/incidencias/:id/estado - Estado inválido devuelve 400',
        400, res.status, 400, res.status,
        res.status === 400
      );
    }
    {
      // Prueba: Verifica la eliminación física de la incidencia creada para no alterar el archivo base
      const res = await fetch(`${BASE_URL}/api/incidencias/${idIncidenciaCreada}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      registrarResultado(
        'DELETE /api/incidencias/:id - Eliminar incidencia creada en prueba',
        200, res.status, 200, res.status,
        res.status === 200 && data.success === true
      );
    }

    // -------------------------------------------------------------
    // PRUEBAS DEL RECURSO: REFUGIOS (/api/refugios)
    // -------------------------------------------------------------
    console.log('\n[MODULO 3] PRUEBAS DEL RECURSO: REFUGIOS (/api/refugios)');
    let idRefugioCreado = null;

    {
      // Prueba: Verifica que GET /api/refugios liste todos los albergues habilitados
      const res = await fetch(`${BASE_URL}/api/refugios`);
      const data = await res.json();
      registrarResultado(
        'GET /api/refugios - Listar todos los refugios',
        200, res.status, 200, res.status,
        res.status === 200 && Array.isArray(data.data) && data.data.length > 0
      );
    }
    {
      // Prueba: Verifica la consulta de un albergue por ID específico
      const res = await fetch(`${BASE_URL}/api/refugios/REF-001`);
      const data = await res.json();
      registrarResultado(
        'GET /api/refugios/:id - Obtener refugio por ID (REF-001)',
        200, res.status, 200, res.status,
        res.status === 200 && data.data.id === 'REF-001'
      );
    }
    {
      // Prueba: Verifica el registro de un nuevo refugio vía POST con cálculo de cupos libres
      const nuevoRefugio = {
        nombre: 'Centro Comunitario Sabana de la Mar',
        provincia: 'Hato Mayor',
        municipio: 'Sabana de la Mar',
        direccion: 'Calle Principal sector El Puerto',
        capacidadTotal: 80,
        espaciosOcupados: 20,
        servicios: ['agua_potable', 'energia_electrica', 'bannos']
      };
      const res = await fetch(`${BASE_URL}/api/refugios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRefugio)
      });
      const data = await res.json();
      idRefugioCreado = data.data ? data.data.id : null;
      registrarResultado(
        'POST /api/refugios - Registrar un nuevo refugio (201)',
        201, res.status, 201, res.status,
        res.status === 201 && data.data.espaciosDisponibles === 60
      );
    }
    {
      // Prueba: Verifica la actualización de ocupación mediante variación incremental (+15)
      const res = await fetch(`${BASE_URL}/api/refugios/${idRefugioCreado}/capacidad`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variacion: 15, usuario: 'Encargado Pruebas' })
      });
      const data = await res.json();
      registrarResultado(
        'PATCH /api/refugios/:id/capacidad - Variación delta positiva (+15) e historial',
        200, res.status, 200, res.status,
        res.status === 200 && data.data.espaciosOcupados === 35 && data.data.espaciosDisponibles === 45
      );
    }
    {
      // Prueba: Verifica la actualización de ocupación mediante variación decremental (-10)
      const res = await fetch(`${BASE_URL}/api/refugios/${idRefugioCreado}/capacidad`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variacion: -10, usuario: 'Encargado Pruebas' })
      });
      const data = await res.json();
      registrarResultado(
        'PATCH /api/refugios/:id/capacidad - Variación delta negativa (-10) e historial',
        200, res.status, 200, res.status,
        res.status === 200 && data.data.espaciosOcupados === 25 && data.data.espaciosDisponibles === 55
      );
    }
    {
      // Prueba: Verifica que sobrepasar la capacidad total del albergue devuelva 400 Bad Request
      const res = await fetch(`${BASE_URL}/api/refugios/${idRefugioCreado}/capacidad`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ espaciosOcupados: 500 })
      });
      registrarResultado(
        'PATCH /api/refugios/:id/capacidad - Ocupación excesiva devuelve 400',
        400, res.status, 400, res.status,
        res.status === 400
      );
    }
    {
      // Prueba: Verifica la eliminación del albergue de prueba mediante DELETE
      const res = await fetch(`${BASE_URL}/api/refugios/${idRefugioCreado}`, {
        method: 'DELETE'
      });
      registrarResultado(
        'DELETE /api/refugios/:id - Eliminar refugio de prueba',
        200, res.status, 200, res.status,
        res.status === 200
      );
    }

    // -------------------------------------------------------------
    // PRUEBAS DEL RECURSO: RECURSOS (/api/recursos)
    // -------------------------------------------------------------
    console.log('\n[MODULO 4] PRUEBAS DEL RECURSO: RECURSOS (/api/recursos)');
    let idRecursoCreado = null;

    {
      // Prueba: Verifica el listado completo de insumos de emergencia
      const res = await fetch(`${BASE_URL}/api/recursos`);
      const data = await res.json();
      registrarResultado(
        'GET /api/recursos - Listar todos los recursos e inventario',
        200, res.status, 200, res.status,
        res.status === 200 && Array.isArray(data.data) && data.data.length > 0
      );
    }
    {
      // Prueba: Verifica el alta de un nuevo recurso de emergencia vía POST
      const nuevoRecurso = {
        nombre: 'Colchones Impermeables de Emergencia',
        categoria: 'albergue',
        unidad: 'unidades',
        cantidadTotal: 120,
        cantidadDisponible: 120,
        provincia: 'Monte Plata',
        ubicacionAlmacen: 'Almacén Provincial Monte Plata'
      };
      const res = await fetch(`${BASE_URL}/api/recursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRecurso)
      });
      const data = await res.json();
      idRecursoCreado = data.data ? data.data.id : null;
      registrarResultado(
        'POST /api/recursos - Registrar nuevo recurso de emergencia (201)',
        201, res.status, 201, res.status,
        res.status === 201 && data.data.cantidadDisponible === 120
      );
    }
    {
      // Prueba: Verifica el despacho de suministros descontando inventario y sumando a entregados
      const entrega = {
        cantidadEntregar: 40,
        destino: 'Refugio Escuela Meriño - Monte Plata'
      };
      const res = await fetch(`${BASE_URL}/api/recursos/${idRecursoCreado}/entrega`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entrega)
      });
      const data = await res.json();
      registrarResultado(
        'PATCH /api/recursos/:id/entrega - Despachar suministros y descontar stock',
        200, res.status, 200, res.status,
        res.status === 200 && data.data.cantidadDisponible === 80 && data.data.cantidadEntregada === 40
      );
    }
    {
      // Prueba: Verifica que intentar entregar más del stock existente devuelva 400 Bad Request
      const res = await fetch(`${BASE_URL}/api/recursos/${idRecursoCreado}/entrega`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidadEntregar: 9999 })
      });
      registrarResultado(
        'PATCH /api/recursos/:id/entrega - Solicitud de stock excesivo devuelve 400',
        400, res.status, 400, res.status,
        res.status === 400
      );
    }
    {
      // Prueba: Verifica la eliminación del recurso temporal de prueba
      const res = await fetch(`${BASE_URL}/api/recursos/${idRecursoCreado}`, {
        method: 'DELETE'
      });
      registrarResultado(
        'DELETE /api/recursos/:id - Eliminar recurso creado en prueba',
        200, res.status, 200, res.status,
        res.status === 200
      );
    }

    // -------------------------------------------------------------
    // PRUEBAS DE ESTADÍSTICAS Y RESUMEN REGIONAL
    // -------------------------------------------------------------
    console.log('\n[MODULO 5] PRUEBAS DEL MODULO DE ESTADISTICAS (/api/estadisticas)');
    {
      // Prueba: Verifica el endpoint consolidado de estadísticas y desglose por región
      const res = await fetch(`${BASE_URL}/api/estadisticas`);
      const data = await res.json();
      registrarResultado(
        'GET /api/estadisticas - Obtener métricas consolidadas de la Región Higuamo',
        200, res.status, 200, res.status,
        res.status === 200 &&
        data.success === true &&
        data.metricas.incidencias !== undefined &&
        data.metricas.refugios !== undefined
      );
    }

  } catch (error) {
    console.error('Error durante la ejecución del test suite:', error);
  } finally {
    // Cierra el servidor de pruebas al finalizar todas las aserciones
    await new Promise(resolve => server.close(resolve));
  }

  // Resumen final de la suite de pruebas
  console.log('\n=============================================================');
  console.log('RESUMEN DE PRUEBAS AUTOMATIZADAS');
  console.log('=============================================================');
  console.log(`  Total pruebas:      ${totalPruebas}`);
  console.log(`  Pruebas exitosas:   ${pruebasExitosas}`);
  console.log(`  Pruebas fallidas:   ${pruebasFallidas}`);
  console.log(`  Tasa de éxito:      ${((pruebasExitosas / totalPruebas) * 100).toFixed(1)}%`);
  console.log('=============================================================\n');

  if (pruebasFallidas > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Ejecución directa de la suite
ejecutarPruebas();
