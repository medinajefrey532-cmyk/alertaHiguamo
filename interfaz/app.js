// ==========================================================================
// ALERTA HIGUAMO — CLIENTE JAVASCRIPT PRINCIPAL
// Este archivo conecta la interfaz web con la API REST (Node.js + Express)
// ==========================================================================

// Determina la URL base de la API según si se abre con servidor HTTP o archivo local
const API_BASE = window.location.protocol === 'file:' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Lista de incidencias activas en memoria para poblar el selector de destino al despachar recursos
let incidenciasActivasMemoria = [];

// Evento principal: se ejecuta cuando el navegador termina de cargar el HTML
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa el contenedor del modal del sistema en el DOM si aún no existe
  crearModalHistorialSiNoExiste();

  // Si la página tiene el contenedor de estadísticas (index o registro), carga las métricas en vivo
  if (document.getElementById('stat-activas')) {
    cargarEstadisticas();
  }

  // Si la página tiene la lista de incidencias, detecta si es la portada (solo activas) o registro completo
  if (document.getElementById('lista-incidencias')) {
    const esInicio = document.getElementById('es-pagina-inicio') !== null;
    cargarIncidencias(esInicio);
  }

  // Si la página es refugios.html, carga el directorio de albergues
  if (document.getElementById('lista-refugios')) {
    cargarRefugios();
  }

  // Si la página es recursos.html, carga el inventario y despachos
  if (document.getElementById('lista-recursos')) {
    cargarRecursos();
  }

  // Si la página es mapa.html, inicializa el mapa interactivo de Leaflet
  if (document.getElementById('mapa-contenedor')) {
    inicializarMapa();
  }

  // Configura los escuchadores de eventos para los formularios de la página
  configurarFormularios();

  // Si el usuario llega desde la portada con ?codigo=INC-xxx, ejecuta la consulta automáticamente
  const urlParams = new URLSearchParams(window.location.search);
  const paramCodigo = urlParams.get('codigo');
  if (paramCodigo && document.getElementById('input-consulta-id')) {
    document.getElementById('input-consulta-id').value = paramCodigo;
    consultarReporteCiudadano(paramCodigo);
  }
});

// ========================================================
// 1. ESTADÍSTICAS OPERATIVAS
// ========================================================

// Función que consulta el endpoint GET /api/estadisticas y actualiza los contadores
async function cargarEstadisticas() {
  try {
    const res = await fetch(`${API_BASE}/estadisticas`);
    if (!res.ok) throw new Error('Error de conexión');
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    // Pasa los datos recibidos al DOM
    actualizarDOMEstadisticas(data.metricas);
  } catch (error) {
    // Si el servidor Node no está corriendo, muestra aviso informativo
    mostrarAvisoServidorDesconectado();
  }
}

// Función que inyecta las cifras de estadísticas en las etiquetas HTML
function actualizarDOMEstadisticas(m) {
  const statActivas = document.getElementById('stat-activas');
  const statTotal = document.getElementById('stat-total');
  const statRefugios = document.getElementById('stat-refugios');
  const statAfectados = document.getElementById('stat-afectados');

  if (statActivas) statActivas.textContent = m.incidencias.activas;
  if (statTotal) statTotal.textContent = m.incidencias.total;
  if (statRefugios) statRefugios.textContent = `${m.refugios.espaciosDisponibles} disp.`;
  if (statAfectados) statAfectados.textContent = m.incidencias.totalAfectadosEstimados;

  // Inyecta el desglose de reportes por provincia en registro.html
  const distContainer = document.getElementById('distribucion-provincias');
  if (distContainer && m.incidencias.porProvincia) {
    distContainer.innerHTML = `
      <div class="stat-badge">San Pedro de Macorís: <strong>${m.incidencias.porProvincia['San Pedro de Macorís'] || 0}</strong></div>
      <div class="stat-badge">Hato Mayor: <strong>${m.incidencias.porProvincia['Hato Mayor'] || 0}</strong></div>
      <div class="stat-badge">Monte Plata: <strong>${m.incidencias.porProvincia['Monte Plata'] || 0}</strong></div>
    `;
  }
}

// ========================================================
// 2. INCIDENCIAS (INICIO Y REGISTRO)
// ========================================================

// Función que consulta GET /api/incidencias con filtros y parámetros
async function cargarIncidencias(soloActivas = false) {
  const container = document.getElementById('lista-incidencias');
  if (!container) return;

  // Lee los valores de los selectores de filtro en registro.html
  const prov = document.getElementById('filtro-provincia')?.value || '';
  const prior = document.getElementById('filtro-prioridad')?.value || '';
  const est = document.getElementById('filtro-estado')?.value || '';

  // Construye los parámetros de la URL para la petición HTTP
  const params = new URLSearchParams();
  if (soloActivas) {
    params.append('soloActivas', 'true');
  } else if (est && est !== 'todas') {
    params.append('estado', est);
  }

  if (prov) params.append('provincia', prov);
  if (prior) params.append('prioridad', prior);

  try {
    container.innerHTML = '<div class="alerta-vacia">Consultando incidencias del servidor...</div>';
    // Petición asíncrona a la API
    const res = await fetch(`${API_BASE}/incidencias?${params.toString()}`);
    if (!res.ok) throw new Error('Servidor no disponible');
    const result = await res.json();
    if (!result.success) throw new Error(result.mensaje);

    // Guarda en memoria las incidencias activas para el selector de despacho de recursos
    incidenciasActivasMemoria = result.data.filter(i => i.estado !== 'cerrada');

    // Dibuja las tarjetas en pantalla
    renderizarIncidencias(result.data, container, soloActivas);
  } catch (error) {
    container.innerHTML = `
      <div class="alerta-error">
        <strong>Servidor no conectado.</strong> Inicia el servidor ejecutando <code>npm start</code> en la terminal para ver los datos en tiempo real (<code>http://localhost:3000</code>).
      </div>
    `;
  }
}

// Función que genera el HTML de las tarjetas de incidencias a partir del arreglo recibido
function renderizarIncidencias(incidencias, container, soloActivas = false) {
  // Si no hay incidencias que coincidan con la búsqueda, muestra un mensaje amigable
  if (!incidencias || incidencias.length === 0) {
    container.innerHTML = `
      <div class="alerta-vacia">
        ${soloActivas ? 'No hay incidencias críticas activas en este momento en la Región Higuamo.' : 'No se encontraron incidencias con los filtros seleccionados.'}
      </div>
    `;
    return;
  }

  // Itera cada incidencia y genera su tarjeta visual con insignias de prioridad y estado
  container.innerHTML = incidencias.map(inc => {
    const esCerrada = inc.estado === 'cerrada';
    return `
      <!-- Tarjeta individual de incidencia con clase dinámica según prioridad y estado -->
      <article class="tarjeta-incidencia prioridad-${inc.prioridad} ${esCerrada ? 'incidencia-cerrada' : ''}">
        <!-- Encabezado de la tarjeta: código de reporte y etiquetas de prioridad y estado -->
        <div class="incidencia-header">
          <span class="incidencia-id">${inc.id}</span>
          <div class="incidencia-badges">
            <span class="badge badge-${inc.prioridad}">Prioridad ${inc.prioridad.toUpperCase()}</span>
            <span class="badge badge-${inc.estado}">Estado: ${inc.estado.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>

        <!-- Título y descripción detallada del reporte de emergencia -->
        <h3 class="incidencia-titulo">${inc.titulo}</h3>
        <p class="incidencia-desc">${inc.descripcion || 'Sin descripción adicional provista.'}</p>

        <!-- Metadatos de la emergencia: comunidad, municipio, provincia, personas afectadas y fecha -->
        <div class="incidencia-meta">
          <span>Ubicación: <strong>${inc.comunidad}</strong> (${inc.municipio}, ${inc.provincia})</span>
          <span>Afectados aprox.: <strong>${inc.afectadosEstimados || 0}</strong></span>
          <span>Fecha de reporte: <strong>${new Date(inc.fechaReporte).toLocaleString()}</strong></span>
        </div>

        <!-- Bloque condicional: muestra los suministros que ya fueron despachados a esta incidencia -->
        ${inc.suministrosRecibidos && inc.suministrosRecibidos.length > 0 ? `
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 6px 12px; border-radius: 4px; font-size: 0.82rem; margin-bottom: 12px; color: #166534;">
            <strong>Suministros enviados a esta emergencia:</strong> ${inc.suministrosRecibidos.map(s => `${s.cantidad} ${s.unidad} (${s.nombre})`).join(', ')}
          </div>
        ` : ''}

        <!-- Controles operativos del coordinador: selector para cambiar estado y botón para ver bitácora -->
        <div class="incidencia-acciones">
          <div class="control-estado-grupo">
            <label>Actualizar Estado:</label>
            <!-- Al cambiar de opción dispara PATCH /api/incidencias/:id/estado -->
            <select onchange="cambiarEstadoIncidencia('${inc.id}', this.value)" class="select-estado">
              <option value="pendiente" ${inc.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="en_proceso" ${inc.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
              <option value="atendida" ${inc.estado === 'atendida' ? 'selected' : ''}>Atendida</option>
              <option value="cerrada" ${inc.estado === 'cerrada' ? 'selected' : ''}>Cerrada</option>
            </select>
          </div>
          <!-- Botón que abre el modal del sistema con la bitácora histórica -->
          <button type="button" class="btn btn-sm btn-outline" onclick="verDetallesIncidencia('${inc.id}')">Ver Historial</button>
        </div>
      </article>
    `;
  }).join('');
}

// Función que envía PATCH /api/incidencias/:id/estado para actualizar el ciclo de vida de la emergencia
async function cambiarEstadoIncidencia(id, nuevoEstado) {
  try {
    // Petición PATCH al backend
    const res = await fetch(`${API_BASE}/incidencias/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado, usuario: 'Coordinador Regional' })
    });
    if (!res.ok) throw new Error('Error al actualizar estado');
    const data = await res.json();
    if (data.success) {
      // Muestra notificación tipo toast
      mostrarNotificacion(`Estado de ${id} actualizado a ${nuevoEstado.replace('_', ' ').toUpperCase()}`, 'exito');
      // Recarga la lista respetando si estamos en portada o en registro
      const esInicio = document.getElementById('es-pagina-inicio') !== null;
      cargarIncidencias(esInicio);
      cargarEstadisticas();
    } else {
      mostrarNotificacion(data.mensaje || 'Error al actualizar', 'error');
    }
  } catch (err) {
    mostrarNotificacion(`No se pudo conectar con el servidor: ${err.message}`, 'error');
  }
}

// ========================================================
// 3. CONSULTA CIUDADANA POR CÓDIGO (GET /api/incidencias/:id)
// ========================================================

// Función que consulta los datos de un reporte específico ingresado por el ciudadano
async function consultarReporteCiudadano(id) {
  const resultadoDiv = document.getElementById('resultado-consulta');
  if (!resultadoDiv) return;

  // Limpia espacios y convierte el código a mayúsculas (ej. inc-001 -> INC-001)
  const idLimpio = id.trim().toUpperCase();
  if (!idLimpio) {
    resultadoDiv.innerHTML = '<div class="alerta-error">Por favor ingresa un código de reporte válido (ej. INC-001).</div>';
    return;
  }

  try {
    resultadoDiv.innerHTML = '<div class="alerta-vacia">Buscando reporte en el sistema...</div>';
    // Petición GET al endpoint /api/incidencias/:id
    const res = await fetch(`${API_BASE}/incidencias/${idLimpio}`);
    if (!res.ok) {
      if (res.status === 404) {
        resultadoDiv.innerHTML = `
          <div class="alerta-error">
            <strong>No se encontró ningún reporte con el código "${idLimpio}".</strong> Verifica el código asignado al registrar tu emergencia.
          </div>
        `;
        return;
      }
      throw new Error('Servidor no disponible');
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);
    const inc = data.data;

    // Renderiza el informe detallado con estado, datos, suministros despachados y bitácora de brigadas
    resultadoDiv.innerHTML = `
      <div class="reporte-detalle-box">
        <div class="reporte-header">
          <h3 style="margin: 0; color: var(--azul-marino);">${inc.titulo}</h3>
          <span class="badge badge-${inc.estado}">ESTADO: ${inc.estado.replace('_', ' ').toUpperCase()}</span>
        </div>
        <p style="margin-bottom: 6px;"><strong>Código de Caso:</strong> <span class="id-destacado">${inc.id}</span></p>
        <p style="margin-bottom: 6px;"><strong>Ubicación:</strong> ${inc.comunidad}, ${inc.municipio}, ${inc.provincia}</p>
        <p style="margin-bottom: 6px;"><strong>Tipo de Situación:</strong> ${inc.tipo.replace('_', ' ')}</p>
        <p style="margin-bottom: 6px;"><strong>Prioridad Asignada:</strong> <span class="badge badge-${inc.prioridad}">${inc.prioridad.toUpperCase()}</span></p>
        <p style="margin-bottom: 12px;"><strong>Fecha de Registro:</strong> ${new Date(inc.fechaReporte).toLocaleString()}</p>
        
        <!-- Lista de insumos enviados a esta emergencia en particular -->
        ${inc.suministrosRecibidos && inc.suministrosRecibidos.length > 0 ? `
          <div class="modal-suministro-item" style="margin: 14px 0;">
            <strong>Suministros humanitarios despachados hacia esta incidencia:</strong>
            <ul style="margin-top: 4px; padding-left: 20px;">
              ${inc.suministrosRecibidos.map(s => `<li>${s.cantidad} ${s.unidad} de <strong>${s.nombre}</strong> (${new Date(s.fecha).toLocaleTimeString()})</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Bitácora cronológica de acciones registradas por los equipos de rescate -->
        <h4 style="font-size: 0.95rem; color: var(--azul-marino); margin-top: 16px; margin-bottom: 8px;">Bitácora de Seguimiento de las Brigadas:</h4>
        <ul class="linea-tiempo">
          ${(inc.historial || []).map(h => `
            <li>
              <strong>${new Date(h.fecha).toLocaleTimeString()}:</strong> ${h.accion} <em style="color: #64748B;">(${h.usuario || 'Sistema'})</em>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  } catch (err) {
    resultadoDiv.innerHTML = `
      <div class="alerta-error">
        <strong>Error de conexión.</strong> Asegúrate de que el servidor esté encendido con <code>npm start</code>.
      </div>
    `;
  }
}

// ========================================================
// 4. MÓDULO DE REFUGIOS Y ALBERGUES (/api/refugios)
// ========================================================

// Función que consulta GET /api/refugios y pasa la lista al renderizador
async function cargarRefugios() {
  const container = document.getElementById('lista-refugios');
  if (!container) return;

  try {
    container.innerHTML = '<div class="alerta-vacia">Consultando refugios del servidor...</div>';
    const res = await fetch(`${API_BASE}/refugios`);
    if (!res.ok) throw new Error('Servidor no disponible');
    const result = await res.json();
    if (!result.success) throw new Error(result.mensaje);
    // Dibuja las tarjetas de albergues
    renderizarRefugios(result.data, container);
  } catch (err) {
    container.innerHTML = `
      <div class="alerta-error">
        <strong>Servidor no conectado.</strong> Inicia el servidor con <code>npm start</code> para ver los refugios activos.
      </div>
    `;
  }
}

// Función que dibuja en pantalla las tarjetas de refugios con su barra de ocupación y controles de variación
function renderizarRefugios(refugios, container) {
  if (!refugios || refugios.length === 0) {
    container.innerHTML = '<div class="alerta-vacia">No hay refugios registrados en este momento.</div>';
    return;
  }

  container.innerHTML = refugios.map(ref => {
    // Calcula el porcentaje de ocupación del albergue
    const pct = Math.min(100, Math.round((ref.espaciosOcupados / ref.capacidadTotal) * 100));
    return `
      <!-- Tarjeta individual de refugio -->
      <article class="tarjeta-refugio">
        <div class="refugio-header">
          <h4>${ref.nombre}</h4>
          <span class="badge badge-${ref.estado}">${ref.estado.toUpperCase()}</span>
        </div>
        <p class="refugio-loc"><strong>${ref.provincia}</strong> — ${ref.municipio} (${ref.direccion})</p>
        <p class="refugio-contacto">Encargado: ${ref.encargado?.nombre || 'Administración'} — Tel: ${ref.encargado?.telefono || 'No provisto'}</p>

        <!-- Bloque de visualización fija de la ocupación actual: sólo lectura para evitar accidentes -->
        <div class="refugio-ocupacion-actual">
          <span class="refugio-ocupacion-label">Ocupación Actual:</span>
          <span class="refugio-ocupacion-valor">${ref.espaciosOcupados} <span style="font-size: 0.82rem; font-weight: normal; color: #64748B;">/ ${ref.capacidadTotal} personas</span></span>
        </div>

        <!-- Barra gráfica de progreso que cambia de verde a rojo si supera el 85% -->
        <div class="barra-capacidad-wrapper">
          <div class="barra-labels">
            <span>Ocupación: ${pct}%</span>
            <span><strong>${ref.espaciosDisponibles}</strong> plazas libres de ${ref.capacidadTotal}</span>
          </div>
          <div class="barra-progreso">
            <div class="barra-relleno" style="width: ${pct}%; background-color: ${pct > 85 ? 'var(--rojo-emergencia)' : 'var(--verde-rescate)'};"></div>
          </div>
        </div>

        <!-- Formulario de variación delta: número positivo para ingresos, negativo para egresos -->
        <div class="refugio-actualizar-bloque">
          <label for="variacion-${ref.id}">Registrar variación de personas evacuadas:</label>
          <div class="input-grupo-variacion">
            <input type="number" id="variacion-${ref.id}" placeholder="Ej: +10 o -5" step="1">
            <button type="button" class="btn btn-sm btn-primario" onclick="registrarVariacionRefugio('${ref.id}')">Registrar</button>
          </div>
          <span class="refugio-input-ayuda">Ingresa número positivo para ingresos o negativo (-) para egresos. La cantidad actual está protegida contra cambios involuntarios.</span>
        </div>

        <!-- Botón para consultar la bitácora de movimientos y horas de este refugio -->
        <div class="refugio-acciones-footer">
          <button type="button" class="btn btn-sm btn-outline btn-block" onclick="verHistorialRefugio('${ref.id}')">Ver Historial de Movimientos</button>
        </div>
      </article>
    `;
  }).join('');
}

// Función que envía PATCH /api/refugios/:id/capacidad con la variación numérica (+ o -)
async function registrarVariacionRefugio(id) {
  const input = document.getElementById(`variacion-${id}`);
  if (!input) return;

  const valorTxt = input.value.trim();
  if (valorTxt === '' || isNaN(valorTxt)) {
    mostrarNotificacion('Ingresa una cantidad numérica de variación (ej. 15 o -5)', 'error');
    return;
  }

  const delta = parseInt(valorTxt, 10);
  if (delta === 0) {
    mostrarNotificacion('La variación debe ser distinta de cero', 'error');
    return;
  }

  try {
    // Envía la variación al endpoint PATCH
    const res = await fetch(`${API_BASE}/refugios/${id}/capacidad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variacion: delta,
        usuario: 'Encargado de Refugio'
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.mensaje || 'Error al actualizar capacidad');
    }

    // Notificación de éxito y recarga de datos
    mostrarNotificacion(data.mensaje, 'exito');
    input.value = '';
    cargarRefugios();
    cargarEstadisticas();
  } catch (err) {
    mostrarNotificacion(`Error: ${err.message}`, 'error');
  }
}

// Función que abre el modal del sistema y muestra la bitácora cronológica de entradas y salidas de un refugio
async function verHistorialRefugio(id) {
  // Asegura que el modal exista en el DOM
  crearModalHistorialSiNoExiste();
  const modal = document.getElementById('modal-historial');
  const tituloEl = document.getElementById('modal-historial-titulo');
  const contenidoEl = document.getElementById('modal-historial-contenido');

  if (!modal || !contenidoEl) return;

  tituloEl.textContent = `Historial de Movimientos: ${id}`;
  contenidoEl.innerHTML = '<div class="alerta-vacia">Cargando historial del refugio...</div>';
  modal.style.display = 'flex';

  try {
    // Consulta los datos del refugio por ID con GET /api/refugios/:id
    const res = await fetch(`${API_BASE}/refugios/${id}`);
    if (!res.ok) throw new Error('No se pudo obtener el refugio');
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);

    const ref = data.data;
    const historial = ref.historial || [];

    // Genera el cuerpo del modal con datos generales y la lista de movimientos
    contenidoEl.innerHTML = `
      <!-- Resumen general del albergue -->
      <div class="modal-info-resumen">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0; color: var(--azul-marino); font-size: 1.05rem;">${ref.nombre}</h4>
          <span class="badge badge-${ref.estado}">${ref.estado.toUpperCase()}</span>
        </div>
        <p><strong>Ubicación:</strong> ${ref.municipio}, ${ref.provincia} (${ref.direccion})</p>
        <p><strong>Capacidad Total:</strong> ${ref.capacidadTotal} personas | <strong>Ocupación Actual:</strong> ${ref.espaciosOcupados} | <strong>Plazas Disponibles:</strong> ${ref.espaciosDisponibles}</p>
        <p><strong>Encargado:</strong> ${ref.encargado?.nombre || 'No asignado'} (Tel: ${ref.encargado?.telefono || 'No provisto'})</p>
      </div>

      <!-- Línea de tiempo de movimientos de personas -->
      <div style="margin-top: 14px;">
        <div class="modal-seccion-titulo">Bitácora de Entradas y Salidas de Evacuados</div>
        ${historial.length === 0 ? '<p style="color: #64748B; font-size: 0.9rem;">No hay registros de movimientos en este refugio.</p>' : `
          <ul class="linea-tiempo">
            ${historial.map(h => {
              const deltaNum = Number(h.variacion) || 0;
              // Insignia verde para ingresos, roja para egresos o neutra para el estado inicial
              const badgeVariacion = deltaNum > 0
                ? `<span class="badge" style="background:#DCFCE7; color:#166534; font-weight:700;">+${deltaNum} (Ingreso)</span>`
                : deltaNum < 0
                ? `<span class="badge" style="background:#FEE2E2; color:#991B1B; font-weight:700;">${deltaNum} (Egreso)</span>`
                : `<span class="badge badge-media">Inicial</span>`;

              return `
                <li>
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <strong>${new Date(h.fecha).toLocaleString()}</strong>
                    ${badgeVariacion}
                  </div>
                  <div>${h.accion}</div>
                  <div style="font-size: 0.78rem; color: #64748B; margin-top: 2px;">
                    Ocupantes resultantes: <strong>${h.ocupadosResultante !== undefined ? h.ocupadosResultante : ref.espaciosOcupados} / ${ref.capacidadTotal}</strong> • Registrado por: <em>${h.usuario || 'Encargado'}</em>
                  </div>
                </li>
              `;
            }).join('')}
          </ul>
        `}
      </div>

      <!-- Botón para cerrar el modal -->
      <div style="margin-top: 20px; text-align: right;">
        <button type="button" class="btn btn-primario" onclick="cerrarModalHistorial()">Cerrar Historial</button>
      </div>
    `;
  } catch (err) {
    contenidoEl.innerHTML = `
      <div class="alerta-error">
        Error al consultar historial: ${err.message}. Asegúrate de que el servidor esté activo.
      </div>
    `;
  }
}

// ========================================================
// 5. MÓDULO DE RECURSOS HUMANITARIOS (/api/recursos)
// ========================================================

// Función que consulta el inventario y las incidencias activas en paralelo
async function cargarRecursos() {
  const container = document.getElementById('lista-recursos');
  if (!container) return;

  try {
    container.innerHTML = '<div class="alerta-vacia">Consultando recursos e incidencias...</div>';

    // Obtener simultáneamente recursos e incidencias activas para el selector de destino
    const [resRec, resInc] = await Promise.all([
      fetch(`${API_BASE}/recursos`),
      fetch(`${API_BASE}/incidencias?soloActivas=true`)
    ]);

    if (!resRec.ok) throw new Error('Servidor no disponible');

    const resultRec = await resRec.json();
    const resultInc = resInc.ok ? await resInc.json() : { data: [] };

    const incidencias = resultInc.data || [];
    incidenciasActivasMemoria = incidencias;

    // Renderiza las tarjetas de insumos y la tabla de despachos
    renderizarRecursos(resultRec.data || [], incidencias, container);
    renderizarTablaEntregas(resultRec.data || []);
  } catch (err) {
    container.innerHTML = `
      <div class="alerta-error">
        <strong>Servidor no conectado.</strong> Inicia el servidor con <code>npm start</code> para ver el inventario de suministros.
      </div>
    `;
  }
}

// Función que dibuja las tarjetas de recursos y su formulario de despacho integrado
function renderizarRecursos(recursos, incidencias, container) {
  if (!recursos || recursos.length === 0) {
    container.innerHTML = '<div class="alerta-vacia">No hay recursos registrados en el inventario.</div>';
    return;
  }

  // Genera las opciones del menú desplegable con las incidencias activas
  const opcionesIncidencias = incidencias.length > 0
    ? incidencias.map(i => `<option value="${i.id}">${i.id} — ${i.comunidad} (${i.provincia})</option>`).join('')
    : '<option value="">(No hay incidencias activas en este momento)</option>';

  container.innerHTML = recursos.map(rec => `
    <!-- Tarjeta individual de recurso en almacén -->
    <article class="tarjeta-recurso">
      <div class="recurso-header">
        <h4>${rec.nombre}</h4>
        <span class="badge badge-categoria">${rec.categoria.toUpperCase()}</span>
      </div>
      <p class="recurso-ubicacion">Almacén: <strong>${rec.ubicacionAlmacen}</strong> (${rec.provincia})</p>

      <!-- Cuadrícula métrica: Total, Disponible y Entregado -->
      <div class="recurso-metricas-grid">
        <div class="metrica-col">
          <span class="col-label">Total</span>
          <span class="col-val">${rec.cantidadTotal} ${rec.unidad}</span>
        </div>
        <div class="metrica-col disponible">
          <span class="col-label">Disponible</span>
          <span class="col-val">${rec.cantidadDisponible} ${rec.unidad}</span>
        </div>
        <div class="metrica-col entregado">
          <span class="col-label">Entregado</span>
          <span class="col-val">${rec.cantidadEntregada} ${rec.unidad}</span>
        </div>
      </div>

      <!-- Formulario de despacho apilado al 100% de ancho sin desbordes -->
      <div class="recurso-despacho-box">
        <label>Despachar a Incidencia / Emergencia:</label>
        <div class="despacho-form-grid">
          <div class="despacho-inputs-row">
            <input type="number" id="despacho-cant-${rec.id}" placeholder="Cantidad a enviar (${rec.unidad})" min="1" max="${rec.cantidadDisponible}">
            <select id="despacho-incidencia-${rec.id}">
              <option value="">-- Seleccionar incidencia de destino --</option>
              ${opcionesIncidencias}
            </select>
          </div>
          <!-- Botón que ejecuta PATCH /api/recursos/:id/entrega -->
          <button type="button" class="btn btn-sm btn-primario" onclick="despacharSuministro('${rec.id}')">Confirmar Despacho a Incidencia</button>
        </div>
      </div>
    </article>
  `).join('');
}

// Función que genera la tabla histórica con todos los suministros despachados a emergencias
function renderizarTablaEntregas(recursos) {
  const containerTabla = document.getElementById('contenedor-tabla-despachos');
  if (!containerTabla) return;

  // Extrae y recopila todas las entregas de todos los recursos
  const todasEntregas = [];
  recursos.forEach(r => {
    (r.historialEntregas || []).forEach(e => {
      todasEntregas.push({
        recursoNombre: r.nombre,
        recursoId: r.id,
        cantidad: e.cantidad,
        unidad: e.unidad || r.unidad,
        destino: e.destino,
        incidenciaId: e.incidenciaId,
        fecha: e.fecha
      });
    });
  });

  // Ordena los despachos del más reciente al más antiguo
  todasEntregas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (todasEntregas.length === 0) {
    containerTabla.innerHTML = '<p style="color: var(--texto-secundario); font-size: 0.9rem;">Aún no se han registrado despachos de suministros a incidencias.</p>';
    return;
  }

  // Dibuja la tabla estructurada
  containerTabla.innerHTML = `
    <div class="tabla-despachos-wrapper">
      <table class="tabla-despachos">
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Recurso Despachado</th>
            <th>Cantidad Entregada</th>
            <th>Incidencia / Comunidad de Destino</th>
          </tr>
        </thead>
        <tbody>
          ${todasEntregas.map(ent => `
            <tr>
              <td><strong>${new Date(ent.fecha).toLocaleString()}</strong></td>
              <td>${ent.recursoNombre}</td>
              <td><span class="badge badge-alta" style="background:#DCFCE7; color:#166534;">${ent.cantidad} ${ent.unidad}</span></td>
              <td><strong>${ent.destino}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Función que valida y despacha insumos hacia una emergencia activa mediante PATCH /api/recursos/:id/entrega
async function despacharSuministro(id) {
  const inputCant = document.getElementById(`despacho-cant-${id}`);
  const selectInc = document.getElementById(`despacho-incidencia-${id}`);
  const cantidad = Number(inputCant?.value);
  const incidenciaId = selectInc?.value;

  // Validación de cantidad positiva
  if (!cantidad || cantidad <= 0) {
    mostrarNotificacion('Ingresa una cantidad mayor a 0 a despachar', 'error');
    return;
  }

  // Validación de selección de incidencia de destino
  if (!incidenciaId) {
    mostrarNotificacion('Debes seleccionar la incidencia a la que se envían estos recursos', 'error');
    return;
  }

  try {
    // Petición PATCH al endpoint de entrega de recursos
    const res = await fetch(`${API_BASE}/recursos/${id}/entrega`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cantidadEntregar: cantidad,
        incidenciaId: incidenciaId,
        usuario: 'Encargado de Recursos'
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.mensaje || 'Error al despachar');
    }

    const data = await res.json();
    if (data.success) {
      mostrarNotificacion(data.mensaje, 'exito');
      cargarRecursos();
      cargarEstadisticas();
    } else {
      mostrarNotificacion(data.mensaje || 'Error al despachar', 'error');
    }
  } catch (err) {
    mostrarNotificacion(`Error: ${err.message}`, 'error');
  }
}

// ========================================================
// 6. MAPA REGIONAL (LEAFLET + DATOS EN VIVO)
// ========================================================

// Instancia global del mapa de Leaflet y capa de marcadores
let mapaHiguamo = null;
let capaMarcadores = null;

// Coordenadas del centro geográfico de la Región Higuamo
const COORDENADAS_CENTRALES = [18.72, -69.45];

// Función que inicializa el mapa interactivo con OpenStreetMap
function inicializarMapa(forzarRecenter = false) {
  const mapaDiv = document.getElementById('mapa-contenedor');
  if (!mapaDiv) return;

  if (typeof L === 'undefined') {
    mapaDiv.innerHTML = '<div style="padding: 40px; text-align: center;">Cargando mapa regional...</div>';
    return;
  }

  // Crea la instancia de Leaflet centrada en Higuamo
  if (!mapaHiguamo) {
    mapaHiguamo = L.map('mapa-contenedor', {
      center: COORDENADAS_CENTRALES,
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Carga las teselas cartográficas de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap | Alerta Higuamo'
    }).addTo(mapaHiguamo);

    // Crea el grupo de capas para agregar marcadores
    capaMarcadores = L.layerGroup().addTo(mapaHiguamo);
  } else if (forzarRecenter) {
    mapaHiguamo.setView(COORDENADAS_CENTRALES, 10);
  }

  setTimeout(() => mapaHiguamo.invalidateSize(), 300);
  // Consulta la API y coloca los puntos en el mapa
  poblarMarcadoresMapa();
}

// Función que consulta las incidencias y refugios de la API y dibuja los círculos georreferenciados
async function poblarMarcadoresMapa() {
  if (!capaMarcadores) return;
  // Limpia los marcadores previos para evitar duplicados
  capaMarcadores.clearLayers();

  try {
    // Consulta simultánea de incidencias y refugios
    const [resInc, resRef] = await Promise.all([
      fetch(`${API_BASE}/incidencias`),
      fetch(`${API_BASE}/refugios`)
    ]);
    if (!resInc.ok || !resRef.ok) return;

    const dataInc = await resInc.json();
    const dataRef = await resRef.json();

    const incidencias = dataInc.data || [];
    const refugios = dataRef.data || [];

    // Dibuja los marcadores de incidencias: rojo para alta prioridad, ámbar para media/baja
    incidencias.forEach(inc => {
      if (!inc.coordenadas) return;
      const esAlta = inc.prioridad === 'alta';
      const color = esAlta ? '#D9381E' : '#F59E0B';

      const circle = L.circleMarker([inc.coordenadas.lat, inc.coordenadas.lng], {
        radius: esAlta ? 11 : 9,
        fillColor: color,
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      });

      // Ventana de información emergente (popup) al hacer clic en el marcador
      circle.bindPopup(`
        <div style="font-family: sans-serif; min-width: 200px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #1B365D;">${inc.id}</strong>
            <span style="background: ${color}; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${inc.prioridad}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; color: #0F172A;">${inc.titulo}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569;">Ubicación: <strong>${inc.comunidad}</strong> (${inc.provincia})</p>
          <p style="margin: 0; font-size: 11px; color: #475569;">Estado: <strong>${inc.estado.replace('_', ' ').toUpperCase()}</strong></p>
        </div>
      `);
      capaMarcadores.addLayer(circle);
    });

    // Dibuja los marcadores de refugios: círculos verdes con las plazas disponibles
    refugios.forEach(ref => {
      if (!ref.coordenadas) return;
      const circle = L.circleMarker([ref.coordenadas.lat, ref.coordenadas.lng], {
        radius: 10,
        fillColor: '#2E7D32',
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95
      });

      circle.bindPopup(`
        <div style="font-family: sans-serif; min-width: 200px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #2E7D32;">${ref.id}</strong>
            <span style="background: #2E7D32; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">REFUGIO</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; color: #1B365D;">${ref.nombre}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569;">Ubicación: <strong>${ref.direccion}</strong> (${ref.provincia})</p>
          <p style="margin: 0; font-size: 11px; color: #0F172A;">Plazas Libres: <strong>${ref.espaciosDisponibles}</strong> de ${ref.capacidadTotal}</p>
        </div>
      `);
      capaMarcadores.addLayer(circle);
    });
  } catch (e) {
    console.error('Error al poblar marcadores:', e);
  }
}

// Función que desplaza y hace zoom a la provincia seleccionada en el mapa
function enfocarRegion(region) {
  if (!mapaHiguamo) return;
  if (region === 'toda') {
    mapaHiguamo.setView(COORDENADAS_CENTRALES, 10);
  } else if (region === 'spm') {
    mapaHiguamo.flyTo([18.4552, -69.3148], 13);
  } else if (region === 'hato') {
    mapaHiguamo.flyTo([18.7628, -69.2568], 12);
  } else if (region === 'monte') {
    mapaHiguamo.flyTo([18.8090, -69.7850], 12);
  }
}

// ========================================================
// 7. MODAL DE HISTORIAL DEL SISTEMA (INTERFAZ PROPIA)
// ========================================================

// Función que crea el elemento modal en el DOM una sola vez
function crearModalHistorialSiNoExiste() {
  if (document.getElementById('modal-historial')) return;

  const modalDiv = document.createElement('div');
  modalDiv.id = 'modal-historial';
  modalDiv.className = 'modal-overlay';
  modalDiv.style.display = 'none';

  modalDiv.innerHTML = `
    <div class="modal-tarjeta">
      <div class="modal-header">
        <h3 id="modal-historial-titulo">Historial de Incidencia</h3>
        <button type="button" class="btn-cerrar-modal" onclick="cerrarModalHistorial()">&times;</button>
      </div>
      <div class="modal-body" id="modal-historial-contenido">
        <!-- Contenido dinámico inyectado por JS -->
      </div>
    </div>
  `;

  // Cierra el modal si el usuario hace clic fuera de la tarjeta
  modalDiv.addEventListener('click', (e) => {
    if (e.target === modalDiv) cerrarModalHistorial();
  });

  document.body.appendChild(modalDiv);
}

// Función que abre el modal y muestra la bitácora histórica y suministros recibidos por una incidencia
async function verDetallesIncidencia(id) {
  crearModalHistorialSiNoExiste();
  const modal = document.getElementById('modal-historial');
  const tituloEl = document.getElementById('modal-historial-titulo');
  const contenidoEl = document.getElementById('modal-historial-contenido');

  if (!modal || !contenidoEl) return;

  tituloEl.textContent = `Historial de Emergencia: ${id}`;
  contenidoEl.innerHTML = '<div class="alerta-vacia">Cargando bitácora del servidor...</div>';
  modal.style.display = 'flex';

  try {
    // Consulta la incidencia por ID con GET /api/incidencias/:id
    const res = await fetch(`${API_BASE}/incidencias/${id}`);
    if (!res.ok) throw new Error('No se pudo obtener la incidencia');
    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje);

    const inc = data.data;

    // Renderiza el informe dentro del modal
    contenidoEl.innerHTML = `
      <div class="modal-info-resumen">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0; color: var(--azul-marino); font-size: 1.05rem;">${inc.titulo}</h4>
          <span class="badge badge-${inc.estado}">${inc.estado.replace('_', ' ').toUpperCase()}</span>
        </div>
        <p><strong>Ubicación:</strong> ${inc.comunidad}, ${inc.municipio} (${inc.provincia})</p>
        <p><strong>Prioridad:</strong> <span class="badge badge-${inc.prioridad}">${inc.prioridad.toUpperCase()}</span> | <strong>Afectados estimados:</strong> ${inc.afectadosEstimados || 0}</p>
        <p><strong>Fecha de reporte:</strong> ${new Date(inc.fechaReporte).toLocaleString()}</p>
        <p><strong>Reportado por:</strong> ${inc.reportadoPor?.nombre || 'Ciudadano'} (${inc.reportadoPor?.contacto || 'Sin contacto'})</p>
      </div>

      <!-- Suministros entregados a esta emergencia -->
      ${inc.suministrosRecibidos && inc.suministrosRecibidos.length > 0 ? `
        <div style="margin-bottom: 18px;">
          <div class="modal-seccion-titulo">Suministros Humanitarios Entregados</div>
          ${inc.suministrosRecibidos.map(s => `
            <div class="modal-suministro-item">
              <strong>${s.cantidad} ${s.unidad} de ${s.nombre}</strong><br>
              <span style="font-size: 0.8rem; color: #475569;">Registrado: ${new Date(s.fecha).toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Bitácora de seguimiento de las brigadas -->
      <div>
        <div class="modal-seccion-titulo">Línea de Tiempo y Bitácora de Acciones</div>
        <ul class="linea-tiempo">
          ${(inc.historial || []).map(h => `
            <li>
              <strong>${new Date(h.fecha).toLocaleString()}:</strong> ${h.accion} <br>
              <span style="font-size: 0.78rem; color: #64748B;">Registrado por: ${h.usuario || 'Sistema'}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div style="margin-top: 20px; text-align: right;">
        <button type="button" class="btn btn-primario" onclick="cerrarModalHistorial()">Cerrar Historial</button>
      </div>
    `;
  } catch (err) {
    contenidoEl.innerHTML = `
      <div class="alerta-error">
        Error al consultar la bitácora: ${err.message}. Asegúrate de que el servidor esté activo.
      </div>
    `;
  }
}

// Función que oculta el modal del sistema
function cerrarModalHistorial() {
  const modal = document.getElementById('modal-historial');
  if (modal) modal.style.display = 'none';
}

// ========================================================
// 8. CONFIGURACIÓN DE FORMULARIOS Y NOTIFICACIONES
// ========================================================

// Función que vincula los eventos submit de todos los formularios de la plataforma
function configurarFormularios() {
  // Formulario de reporte ciudadano (POST /api/incidencias)
  const formIncidencia = document.getElementById('form-registro-incidencia');
  if (formIncidencia) {
    formIncidencia.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formIncidencia.querySelector('button[type="submit"]');
      const txtOriginal = btn.textContent;
      btn.textContent = 'Enviando reporte...';
      btn.disabled = true;

      // Recopila los datos del formulario en un objeto payload
      const payload = {
        titulo: document.getElementById('inc-titulo').value,
        tipo: document.getElementById('inc-tipo').value,
        provincia: document.getElementById('inc-provincia').value,
        municipio: document.getElementById('inc-municipio').value,
        comunidad: document.getElementById('inc-comunidad').value,
        prioridad: document.getElementById('inc-prioridad').value,
        afectadosEstimados: Number(document.getElementById('inc-afectados').value) || 0,
        descripcion: document.getElementById('inc-descripcion').value,
        reportadoPor: {
          nombre: document.getElementById('inc-nombre').value || 'Ciudadano',
          contacto: document.getElementById('inc-contacto').value || 'No provisto'
        }
      };

      try {
        // Envía el reporte mediante POST /api/incidencias
        const res = await fetch(`${API_BASE}/incidencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.errores?.join(', ') || errData.mensaje || 'Error al enviar');
        }

        const result = await res.json();
        if (result.success) {
          formIncidencia.reset();
          // Muestra el mensaje de éxito con el código de seguimiento asignado
          const box = document.getElementById('alerta-registro-exito');
          if (box) {
            box.innerHTML = `
              <strong>Reporte registrado exitosamente.</strong><br>
              Código de confirmación: <span class="id-destacado">${result.data.id}</span>.<br>
              Guarda este código para consultar el avance de la atención de tu emergencia.
            `;
            box.style.display = 'block';
            box.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } catch (err) {
        mostrarNotificacion(`No se pudo enviar el reporte: ${err.message}`, 'error');
      } finally {
        btn.textContent = txtOriginal;
        btn.disabled = false;
      }
    });
  }

  // Formulario de consulta ciudadana por ID en consultar.html (GET /api/incidencias/:id)
  const formConsulta = document.getElementById('form-consulta-estado');
  if (formConsulta) {
    formConsulta.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('input-consulta-id');
      consultarReporteCiudadano(input.value);
    });
  }

  // Escuchadores de eventos para los filtros dinámicos en registro.html
  ['filtro-provincia', 'filtro-prioridad', 'filtro-estado'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        const esInicio = document.getElementById('es-pagina-inicio') !== null;
        cargarIncidencias(esInicio);
      });
    }
  });

  // Formulario para registrar nuevo refugio comunitario (POST /api/refugios)
  const formNuevoRefugio = document.getElementById('form-nuevo-refugio');
  if (formNuevoRefugio) {
    formNuevoRefugio.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Objeto con los datos del nuevo refugio
      const payload = {
        nombre: document.getElementById('ref-nombre').value,
        provincia: document.getElementById('ref-provincia').value,
        municipio: document.getElementById('ref-municipio').value,
        direccion: document.getElementById('ref-direccion').value,
        capacidadTotal: Number(document.getElementById('ref-capacidad').value),
        encargado: { nombre: document.getElementById('ref-encargado').value || 'Encargado', telefono: 'No provisto' }
      };

      try {
        // Petición POST al endpoint de creación de refugios
        const res = await fetch(`${API_BASE}/refugios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          mostrarNotificacion('Refugio registrado exitosamente', 'exito');
          formNuevoRefugio.reset();
          toggleFormNuevoRefugio();
          // Recarga la lista de refugios y estadísticas en vivo
          cargarRefugios();
          cargarEstadisticas();
        } else {
          mostrarNotificacion(data.mensaje || 'Error', 'error');
        }
      } catch (err) {
        mostrarNotificacion(`Error: ${err.message}`, 'error');
      }
    });
  }

  // Formulario para registrar nuevo insumo en almacén (POST /api/recursos)
  const formNuevoRecurso = document.getElementById('form-nuevo-recurso');
  if (formNuevoRecurso) {
    formNuevoRecurso.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Objeto con los datos del nuevo suministro
      const payload = {
        nombre: document.getElementById('rec-nombre').value,
        categoria: document.getElementById('rec-categoria').value,
        unidad: document.getElementById('rec-unidad').value,
        cantidadTotal: Number(document.getElementById('rec-cantidad').value),
        provincia: document.getElementById('rec-provincia').value
      };

      try {
        // Petición POST al endpoint de creación de recursos
        const res = await fetch(`${API_BASE}/recursos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          mostrarNotificacion('Recurso registrado exitosamente', 'exito');
          formNuevoRecurso.reset();
          toggleFormNuevoRecurso();
          // Recarga el inventario y estadísticas en vivo
          cargarRecursos();
          cargarEstadisticas();
        } else {
          mostrarNotificacion(data.mensaje || 'Error', 'error');
        }
      } catch (err) {
        mostrarNotificacion(`Error: ${err.message}`, 'error');
      }
    });
  }
}

// Función que muestra u oculta el formulario de nuevo refugio al hacer clic en el botón
function toggleFormNuevoRefugio() {
  const cont = document.getElementById('contenedor-form-refugio');
  if (cont) cont.style.display = cont.style.display === 'none' ? 'block' : 'none';
}

// Función que muestra u oculta el formulario de nuevo recurso al hacer clic en el botón
function toggleFormNuevoRecurso() {
  const cont = document.getElementById('contenedor-form-recurso');
  if (cont) cont.style.display = cont.style.display === 'none' ? 'block' : 'none';
}

// Función que inserta un mensaje de alerta si el usuario abre los archivos HTML sin haber encendido el servidor Node
function mostrarAvisoServidorDesconectado() {
  const banner = document.querySelector('.metricas-resumen-banner');
  if (banner && !document.getElementById('aviso-servidor-offline')) {
    const aviso = document.createElement('div');
    aviso.id = 'aviso-servidor-offline';
    aviso.className = 'alerta-vacia';
    aviso.style.gridColumn = '1 / -1';
    aviso.style.borderColor = '#F59E0B';
    aviso.innerHTML = '<strong>Servidor en espera:</strong> Para consultar y registrar datos en tiempo real, ejecuta <code>npm start</code> en tu terminal y accede mediante <code>http://localhost:3000</code>.';
    banner.prepend(aviso);
  }
}

// Función para mostrar notificaciones flotantes temporales (toasts) de éxito o error
function mostrarNotificacion(mensaje, tipo = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  // Animación de entrada y desvanecimiento a los 4 segundos
  setTimeout(() => toast.classList.add('visible'), 50);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}
