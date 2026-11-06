# UNIVERSIDAD AUTONOMA DE SANTO DOMINGO (UASD)
## FACULTAD DE CIENCIAS — ESCUELA DE INFORMATICA
### Proyecto Integrador — Hito Final: Diseno e Implementacion de la API REST

---

**Asignatura:** Desarrollo Web / Proyecto Integrador  
**Proyecto:** ComunidadAlerta Higuamo — Sistema de Gestion de Emergencias y Respuesta Rapida  
**Region Asignada:** Region Higuamo (San Pedro de Macoris, Hato Mayor y Monte Plata)  
**Equipo de Desarrollo:**  
- **Jefrey Encarnacion Medina** — Matricula: **100687695**  
- **Jomil Jose Mota** — Matricula: **100617004**  

**Fecha de Entrega:** Noviembre 2026  
**Repositorio Oficial en GitHub:** [https://github.com/medinajefrey532-cmyk/alertaHiguamo.git](https://github.com/medinajefrey532-cmyk/alertaHiguamo.git)  

---

## 1. Resumen del Proyecto y Problematica

En la **Region Higuamo** (San Pedro de Macoris, Hato Mayor y Monte Plata), ante eventos hidrometeorologicos frecuentes (tormentas tropicales, vaguadas e inundaciones de los rios Higuamo, Magua, Soco y Comate), los reportes de emergencias suelen recibirse de manera desorganizada y dispersa mediante llamadas telefonicas o redes sociales. Esto ocasiona duplicidad de reportes, demoras en la priorizacion de casos con riesgo de vida, falta de control en los albergues habilitados y descoordinacion en el despacho de suministros humanitarios.

**ComunidadAlerta Higuamo** resuelve este problema mediante una **API REST robusta, modular y ligera desarrollada con Node.js y Express**, conectada a una base de datos local JSON persistente y a una interfaz web multipagina interactiva, facilitando la recepcion ciudadana, clasificacion por gravedad y coordinacion logistica regional.

---

## 2. Cumplimiento de los Criterios de Evaluacion del Hito

| Criterio Exigido por la UASD | Estado | Implementacion en ComunidadAlerta Higuamo |
| :--- | :---: | :--- |
| **Al menos 2 recursos principales** | Cumplido | Implementados **3 recursos completos**: `incidencias`, `refugios` y `recursos humanitarios`, ademas de un modulo de `estadisticas`. |
| **Minimo 8 endpoints** | Cumplido | **17 endpoints funcionales** (mas del doble de lo exigido). |
| **Operaciones GET, POST, PUT/PATCH, DELETE** | Cumplido | Implementadas en todos los recursos con semantica REST estricta. |
| **Respuestas en formato JSON** | Cumplido | 100% de respuestas estructuradas en JSON con `{ success, mensaje, data, errores }`. |
| **Codigos de estado HTTP apropiados** | Cumplido | `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Server Error`. |
| **Manejo de errores y datos invalidos** | Cumplido | Middleware centralizado (`errorHandler.js`) y validaciones rigurosas (`validators.js`). |
| **Validacion basica de datos** | Cumplido | Validacion de tipos, longitudes, limites numericos y pertenencia estricta a Higuamo. |
| **Pruebas de todos los endpoints** | Cumplido | Suite de **25 pruebas automatizadas** con **100% de exito**. |
| **Documentacion tecnica** | Cumplido | `README.md`, `GUIA_EXPOSICION.md` y este informe formal de entrega. |

---

## 3. Tabla Completa de Endpoints de la API REST

| Metodo | Endpoint | Recurso | Descripcion Operativa | Codigo Exito | Codigos Error |
| :---: | :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/health` | Sistema | Verificacion de operatividad y estado general de la API | `200 OK` | `500` |
| `GET` | `/api/incidencias` | Incidencias | Listar incidencias con filtros (`provincia`, `prioridad`, `estado`, `search`) | `200 OK` | `500` |
| `GET` | `/api/incidencias/:id` | Incidencias | Obtener detalles y trazabilidad de un reporte por su ID (`INC-xxx`) | `200 OK` | `404` |
| `POST` | `/api/incidencias` | Incidencias | Registrar un nuevo reporte de emergencia ciudadana con geolocalizacion | `201 Created` | `400` |
| `PUT` | `/api/incidencias/:id` | Incidencias | Actualizacion integral de datos de la incidencia | `200 OK` | `404` |
| `PATCH` | `/api/incidencias/:id/estado` | Incidencias | Cambiar estado operativo (`pendiente`, `en_proceso`, `atendida`, `cerrada`) | `200 OK` | `400, 404` |
| `DELETE` | `/api/incidencias/:id` | Incidencias | Eliminar un reporte del sistema | `200 OK` | `404` |
| `GET` | `/api/refugios` | Refugios | Consultar directorio de albergues y plazas disponibles | `200 OK` | `500` |
| `GET` | `/api/refugios/:id` | Refugios | Consultar informacion y bitacora de un refugio especifico (`REF-xxx`) | `200 OK` | `404` |
| `POST` | `/api/refugios` | Refugios | Registrar un nuevo albergue oficial en la region | `201 Created` | `400` |
| `PUT` | `/api/refugios/:id` | Refugios | Actualizacion completa de informacion del albergue | `200 OK` | `404` |
| `PATCH` | `/api/refugios/:id/capacidad` | Refugios | Modificar personas alojadas por variacion delta (+/-) con historial | `200 OK` | `400, 404` |
| `DELETE` | `/api/refugios/:id` | Refugios | Dar de baja un albergue del registro | `200 OK` | `404` |
| `GET` | `/api/recursos` | Recursos | Consultar inventario de suministros y almacenes | `200 OK` | `500` |
| `GET` | `/api/recursos/:id` | Recursos | Consultar datos de un suministro especifico (`REC-xxx`) | `200 OK` | `404` |
| `POST` | `/api/recursos` | Recursos | Dar de alta un nuevo tipo de suministro de auxilio humanitario | `201 Created` | `400` |
| `PATCH` | `/api/recursos/:id/entrega` | Recursos | Despachar suministros vinculados a una emergencia con doble bitacora | `200 OK` | `400, 404` |
| `DELETE` | `/api/recursos/:id` | Recursos | Eliminar un suministro del inventario | `200 OK` | `404` |
| `GET` | `/api/estadisticas` | Estadisticas | Metricas consolidadas en tiempo real de toda la region | `200 OK` | `500` |

---

## 4. Ejemplos de Solicitudes y Respuestas JSON

### A. Registro Exitoso de Incidencia (`POST /api/incidencias`)
* **Endpoint:** `POST /api/incidencias`
* **Encabezados:** `Content-Type: application/json`
* **Cuerpo de Solicitud (Payload):**
```json
{
  "titulo": "Crecida del Rio Soco anega viviendas en Ramon Santana",
  "descripcion": "El agua cubrio la calle principal de Barrio Nuevo y penetro en cinco casas.",
  "tipo": "inundacion",
  "provincia": "San Pedro de Macoris",
  "municipio": "Ramon Santana",
  "comunidad": "Barrio Nuevo",
  "prioridad": "alta",
  "reportadoPor": {
    "nombre": "Ana Luisa Gomez",
    "contacto": "809-555-1234"
  },
  "afectadosEstimados": 25
}
```
* **Respuesta Exitosa (Codigo HTTP: `201 Created`):**
```json
{
  "success": true,
  "mensaje": "Incidencia registrada exitosamente.",
  "data": {
    "id": "INC-008",
    "titulo": "Crecida del Rio Soco anega viviendas en Ramon Santana",
    "descripcion": "El agua cubrio la calle principal de Barrio Nuevo y penetro en cinco casas.",
    "tipo": "inundacion",
    "provincia": "San Pedro de Macoris",
    "municipio": "Ramon Santana",
    "comunidad": "Barrio Nuevo",
    "prioridad": "alta",
    "estado": "pendiente",
    "coordenadas": {
      "lat": 18.552,
      "lng": -69.178
    },
    "reportadoPor": {
      "nombre": "Ana Luisa Gomez",
      "contacto": "809-555-1234"
    },
    "afectadosEstimados": 25,
    "fechaReporte": "2026-11-06T18:00:00.000Z",
    "historial": [
      {
        "fecha": "2026-11-06T18:00:00.000Z",
        "accion": "Reporte registrado",
        "usuario": "Ana Luisa Gomez"
      }
    ]
  }
}
```

---

### B. Manejo de Datos Invalidos (`POST /api/incidencias` - Codigo 400)
* **Endpoint:** `POST /api/incidencias`
* **Cuerpo de Solicitud Invalido:**
```json
{
  "titulo": "Rio",
  "provincia": "La Romana"
}
```
* **Respuesta de Error Controlado (Codigo HTTP: `400 Bad Request`):**
```json
{
  "success": false,
  "mensaje": "Datos de incidencia invalidos.",
  "errores": [
    "El titulo es obligatorio y debe tener al menos 5 caracteres.",
    "El tipo de incidencia es obligatorio y debe ser uno de: inundacion, deslizamiento, carretera_bloqueada, comunidad_aislada, necesidad_suministros, colapso_estructura, otro.",
    "La provincia debe ser una de las de la Region Higuamo: San Pedro de Macoris, Hato Mayor, Monte Plata.",
    "La comunidad o sector es obligatorio."
  ]
}
```

---

### C. Actualizacion de Estado con Bitacora (`PATCH /api/incidencias/:id/estado`)
* **Endpoint:** `PATCH /api/incidencias/INC-001/estado`
* **Cuerpo de Solicitud:**
```json
{
  "estado": "atendida",
  "nota": "Bomberos y Defensa Civil concluyeron la evacuacion preventiva.",
  "usuario": "Coordinador COE SPM"
}
```
* **Respuesta Exitosa (Codigo HTTP: `200 OK`):**
```json
{
  "success": true,
  "mensaje": "Estado de la incidencia INC-001 actualizado a 'atendida'.",
  "data": {
    "id": "INC-001",
    "estado": "atendida",
    "prioridad": "alta",
    "historial": [
      {
        "fecha": "2026-11-02T14:30:00.000Z",
        "accion": "Reporte registrado",
        "usuario": "Ciudadano"
      },
      {
        "fecha": "2026-11-06T18:15:00.000Z",
        "accion": "Estado cambiado de 'en_proceso' a 'atendida': Bomberos y Defensa Civil concluyeron la evacuacion preventiva.",
        "usuario": "Coordinador COE SPM"
      }
    ]
  }
}
```

---

### D. Variacion Delta en Capacidad de Refugio (`PATCH /api/refugios/:id/capacidad`)
* **Endpoint:** `PATCH /api/refugios/REF-001/capacidad`
* **Cuerpo de Solicitud (Ingreso de 15 personas):**
```json
{
  "variacion": 15,
  "usuario": "Encargado de Refugio"
}
```
* **Respuesta Exitosa (Codigo HTTP: `200 OK`):**
```json
{
  "success": true,
  "mensaje": "Movimiento registrado: Ingreso de 15 persona(s) evacuadas. Total alojadas: 60/150. Plazas libres: 90.",
  "data": {
    "id": "REF-001",
    "nombre": "Liceo Gaston Fernando Deligne",
    "capacidadTotal": 150,
    "espaciosOcupados": 60,
    "espaciosDisponibles": 90,
    "estado": "operativo",
    "historial": [
      {
        "fecha": "2026-11-06T18:20:00.000Z",
        "variacion": 15,
        "ocupadosResultante": 60,
        "accion": "Ingreso de 15 persona(s) evacuadas. Total alojadas: 60/150",
        "usuario": "Encargado de Refugio"
      }
    ]
  }
}
```

---

### E. Despacho de Suministro Vinculado a Incidencia (`PATCH /api/recursos/:id/entrega`)
* **Endpoint:** `PATCH /api/recursos/REC-001/entrega`
* **Cuerpo de Solicitud:**
```json
{
  "cantidadEntregar": 25,
  "incidenciaId": "INC-001",
  "usuario": "Encargado de Logistica Regional"
}
```
* **Respuesta Exitosa (Codigo HTTP: `200 OK`):**
```json
{
  "success": true,
  "mensaje": "Entrega de 25 botellones registrada exitosamente hacia INC-001 - Barrio Blanco (San Pedro de Macoris).",
  "data": {
    "id": "REC-001",
    "nombre": "Botellones de Agua Potable (5 gal)",
    "cantidadTotal": 500,
    "cantidadDisponible": 325,
    "cantidadEntregada": 175,
    "historialEntregas": [
      {
        "fecha": "2026-11-06T18:25:00.000Z",
        "cantidad": 25,
        "unidad": "botellones",
        "incidenciaId": "INC-001",
        "destino": "INC-001 - Barrio Blanco (San Pedro de Macoris)"
      }
    ]
  }
}
```

---

### F. Manejo de Recurso No Encontrado (`GET /api/incidencias/INC-99999` - Codigo 404)
* **Endpoint:** `GET /api/incidencias/INC-99999`
* **Respuesta (Codigo HTTP: `404 Not Found`):**
```json
{
  "success": false,
  "mensaje": "Incidencia con ID 'INC-99999' no encontrada."
}
```

---

## 5. Evidencias de Ejecucion de Pruebas Automatizadas

La API cuenta con una suite completa de pruebas unitarias y de integracion ejecutables mediante el comando `npm test`. Todas las pruebas se ejecutan de manera autonoma contra un servidor HTTP temporal en el puerto 3999:

```text
=============================================================
[TEST] INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS - ALERTA HIGUAMO
=============================================================

Servidor de pruebas levantado en http://localhost:3999

[MODULO 1] PRUEBAS GENERALES Y DE SALUD
  [PASS] GET /api/health - Verificacion de operatividad del sistema (HTTP 200)
  [PASS] GET /api/ruta-fantasma-no-existe - Manejo de ruta no encontrada (404) (HTTP 404)

[MODULO 2] PRUEBAS DEL RECURSO: INCIDENCIAS (/api/incidencias)
  [PASS] GET /api/incidencias - Listar todas las incidencias (HTTP 200)
  [PASS] GET /api/incidencias?provincia=... - Filtrar incidencias por provincia (HTTP 200)
  [PASS] GET /api/incidencias/:id - Obtener incidencia existente por ID (INC-001) (HTTP 200)
  [PASS] GET /api/incidencias/:id - Incidencia inexistente devuelve 404 (HTTP 404)
  [PASS] POST /api/incidencias - Registrar nueva incidencia exitosamente (201) (HTTP 201)
  [PASS] POST /api/incidencias - Validacion de datos invalidos devuelve 400 (HTTP 400)
  [PASS] PUT /api/incidencias/:id - Actualizacion completa de incidencia (HTTP 200)
  [PASS] PATCH /api/incidencias/:id/estado - Actualizar estado a atendida (HTTP 200)
  [PASS] PATCH /api/incidencias/:id/estado - Estado invalido devuelve 400 (HTTP 400)
  [PASS] DELETE /api/incidencias/:id - Eliminar incidencia creada en prueba (HTTP 200)

[MODULO 3] PRUEBAS DEL RECURSO: REFUGIOS (/api/refugios)
  [PASS] GET /api/refugios - Listar todos los refugios (HTTP 200)
  [PASS] GET /api/refugios/:id - Obtener refugio por ID (REF-001) (HTTP 200)
  [PASS] POST /api/refugios - Registrar un nuevo refugio (201) (HTTP 201)
  [PASS] PATCH /api/refugios/:id/capacidad - Variacion delta positiva (+15) e historial (HTTP 200)
  [PASS] PATCH /api/refugios/:id/capacidad - Variacion delta negativa (-10) e historial (HTTP 200)
  [PASS] PATCH /api/refugios/:id/capacidad - Ocupacion excesiva devuelve 400 (HTTP 400)
  [PASS] DELETE /api/refugios/:id - Eliminar refugio de prueba (HTTP 200)

[MODULO 4] PRUEBAS DEL RECURSO: RECURSOS (/api/recursos)
  [PASS] GET /api/recursos - Listar todos los recursos e inventario (HTTP 200)
  [PASS] POST /api/recursos - Registrar nuevo recurso de emergencia (201) (HTTP 201)
  [PASS] PATCH /api/recursos/:id/entrega - Despachar suministros y descontar stock (HTTP 200)
  [PASS] PATCH /api/recursos/:id/entrega - Solicitud de stock excesivo devuelve 400 (HTTP 400)
  [PASS] DELETE /api/recursos/:id - Eliminar recurso creado en prueba (HTTP 200)

[MODULO 5] PRUEBAS DEL MODULO DE ESTADISTICAS (/api/estadisticas)
  [PASS] GET /api/estadisticas - Obtener metricas consolidadas de la Region Higuamo (HTTP 200)

=============================================================
RESUMEN DE PRUEBAS AUTOMATIZADAS
=============================================================
  Total pruebas:      25
  Pruebas exitosas:   25
  Pruebas fallidas:   0
  Tasa de exito:      100.0%
=============================================================
```

---

## 6. Conclusiones y Estado del Proyecto

1. **Cumplimiento Total:** Se superaron todos los objetivos planteados para el hito del proyecto integrador, disponiendo de una API REST formal, probada y completamente documentada.
2. **Organizacion Modular:** El codigo se encuentra distribuido limpiamente en tres capas (`api/`, `interfaz/` y `base_de_datos/`), garantizando mantenibilidad, trazabilidad y facilidad de evaluacion.
3. **Persistencia y Disponibilidad:** Persistencia local asincrona en JSON con generacion de codigos correlativos (`INC-xxx`, `REF-xxx`, `REC-xxx`) y biblioteca de mapas Leaflet alojada localmente en `vendor/` para operar sin caidas de red.
4. **Repositorio Publico:** Codigo fuente sincronizado en GitHub: [https://github.com/medinajefrey532-cmyk/alertaHiguamo.git](https://github.com/medinajefrey532-cmyk/alertaHiguamo.git)
