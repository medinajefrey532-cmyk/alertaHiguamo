# ComunidadAlerta Higuamo — Sistema de Gestion de Emergencias y API REST

> **Universidad Autonoma de Santo Domingo (UASD)**  
> **Facultad de Ciencias — Escuela de Informatica**  
> **Proyecto Integrador — Hito Final: Diseno e Implementacion de la API REST**  
> 
> **Integrantes:**  
> • **Jefrey Encarnacion Medina** — Matricula: **100687695**  
> • **Jomil Jose Mota** — Matricula: **100617004**  
> 
> **Region Asignada:** Region Higuamo (Provincias: **San Pedro de Macoris**, **Hato Mayor** y **Monte Plata**)  
> **Tecnologias:** Node.js, Express, JavaScript (ES6+), HTML5 Semantico, CSS3, JSON Asincrono  
> **Repositorio GitHub:** [https://github.com/medinajefrey532-cmyk/alertaHiguamo.git](https://github.com/medinajefrey532-cmyk/alertaHiguamo.git)  

---

## 1. Descripcion del Proyecto y Planteamiento del Problema

En la **Region Higuamo**, conformada por las provincias de San Pedro de Macoris, Hato Mayor y Monte Plata, los fenomenos atmosfericos (tormentas tropicales, huracanes y vaguadas) provocan crecidas en los rios Higuamo, Magua, Soco y Comate, generando inundaciones urbanas y rurales, incomunicacion de parajes, carreteras anegadas y aislamiento de familias vulnerables.

### Problematica Identificada
1. **Canales de reporte dispersos:** Los ciudadanos alertan a traves de llamadas telefonicas, notas de voz o publicaciones en redes sociales que se pierden con facilidad.
2. **Falta de priorizacion operativa:** Los equipos de rescate (Defensa Civil, Bomberos, COE regional) tienen dificultades para determinar que eventos implican riesgo vital inmediato y cuales pueden esperar.
3. **Duplicidad e imprecision:** Multiples personas reportan el mismo suceso con nombres comunitarios distintos, entorpeciendo el despliegue logistico.
4. **Descoordinacion de albergues e insumos:** No existia una plataforma unificada para verificar cupos libres en refugios oficiales ni para despachar raciones alimenticias o agua embotellada de forma trazable hacia emergencias especificas.

### Solucion Implementada
**ComunidadAlerta Higuamo** ofrece una **API REST robusta en Node.js y Express** junto a una interfaz web multipagina, ligera, responsiva y adaptada a la realidad dominicana, que permite centralizar reportes ciudadanos, geolocalizarlos en un mapa interactivo, auditar movimientos en albergues y controlar inventarios humanitarios.

---

## 2. Organizacion del Proyecto en Tres Carpetas Principales

El proyecto ha sido organizado para mantener una estricta separacion de responsabilidades en **tres carpetas fundamentales**:

```text
alertaHiguamo/
├── api/                            # 1. CAPA DEL SERVIDOR Y API REST
│   ├── controllers/                # Logica de negocio y operaciones de cada recurso
│   │   ├── incidencias.controller.js  # CRUD, filtros y geocodificacion regional
│   │   ├── refugios.controller.js     # CRUD, variaciones delta (+/-) e historial
│   │   ├── recursos.controller.js     # CRUD, despacho e inventario humanitario
│   │   └── estadisticas.controller.js # Metricas consolidadas en tiempo real
│   ├── routes/                     # Definicion de endpoints y metodos HTTP
│   │   ├── incidencias.routes.js      # Rutas /api/incidencias
│   │   ├── refugios.routes.js         # Rutas /api/refugios
│   │   ├── recursos.routes.js         # Rutas /api/recursos
│   │   └── estadisticas.routes.js     # Rutas /api/estadisticas
│   ├── middlewares/                # Validaciones y control centralizado de errores
│   │   ├── errorHandler.js            # Manejador de 404 (Not Found) y 500 (Server Error)
│   │   └── validators.js              # Validacion de datos de entrada y provincias Higuamo
│   ├── tests/                      # Suite de pruebas automatizadas
│   │   └── test-api.js                # 25 pruebas con 100% de exito (sin dependencias externas)
│   └── app.js                      # Inicializacion de Express, CORS, JSON parser y static
│
├── base_de_datos/                  # 2. CAPA DE PERSISTENCIA Y DATOS LOCALES
│   ├── incidencias.json            # Base de datos persistente de emergencias
│   ├── refugios.json               # Directorio oficial de albergues de la Region Higuamo
│   ├── recursos.json               # Inventario de suministros de auxilio
│   └── storage.js                  # Manejador asincrono (fs.promises) y generador de IDs
│
├── interfaz/                       # 3. CAPA DE INTERFAZ WEB Y USUARIO
│   ├── imagenes/                   # Recursos graficos institucionales (logo, puente)
│   ├── vendor/leaflet/             # Libreria local Leaflet para renderizado del mapa
│   ├── index.html                  # Panel principal (solo incidencias activas en Higuamo)
│   ├── reportar.html               # Formulario ciudadano para reportar emergencias
│   ├── consultar.html              # Seguimiento ciudadano de reporte por codigo INC-xxx
│   ├── registro.html               # Registro maestro de coordinacion (cerradas al final)
│   ├── mapa.html                   # Mapa interactivo con georreferenciacion provincial
│   ├── refugios.html               # Gestion de albergues con variacion (+/-) y bitacora
│   ├── recursos.html               # Inventario y despacho vinculado a emergencias
│   ├── app.js                      # Logica cliente modular conectada a la API REST en vivo
│   └── estilos.css                 # Diseno visual con la paleta oficial de emergencias
│
├── server.js                       # Punto de entrada HTTP (puerto 3000)
├── package.json                    # Scripts npm (start, test) y dependencias
├── package-lock.json               # Bloqueo de versiones de paquetes
├── .gitignore                      # Exclusiones de control de versiones
└── README.md                       # Documentacion tecnica y guia para exposicion
```

---

## 3. Cumplimiento de los Requisitos del Hito (UASD)

| Requisito Exigido en el Hito | Estado | Implementacion en ComunidadAlerta Higuamo |
| :--- | :---: | :--- |
| **Al menos 2 recursos principales** | Cumplido (Superado) | Se implementaron 3 recursos principales completos (`incidencias`, `refugios`, `recursos`) mas un modulo consolidado (`estadisticas`). |
| **Minimo 8 endpoints** | Cumplido (Superado) | **17 endpoints** operativos que cubren consultas, creacion, modificacion parcial, actualizacion total y eliminacion. |
| **Operaciones GET, POST, PUT, PATCH, DELETE** | Cumplido | Implementadas en todos los recursos principales con semantica REST estricta. |
| **Respuestas en formato JSON** | Cumplido | El 100% de las respuestas de la API devuelven encabezado `application/json` y estructura estandarizada `{ success, mensaje, data, errores }`. |
| **Codigos HTTP apropiados** | Cumplido | Se emplean `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found` y `500 Internal Server Error`. |
| **Manejo de rutas 404 y datos invalidos** | Cumplido | Middleware centralizado de errores (`errorHandler.js`) y validaciones rigurosas (`validators.js`). |
| **Validacion basica de datos recibidos** | Cumplido | Se valida longitud minima, catalogo estricto de provincias de Higuamo, tipos de emergencia, cupos numericos y stock. |
| **Probar todos los endpoints** | Cumplido | Suite de **25 pruebas automatizadas** en `api/tests/test-api.js` con tasa de exito del **100%**. |
| **Documentacion en README** | Cumplido | Documentacion completa con tabla de endpoints, payloads JSON, codigos de error y guia de presentacion para el estudiante. |

---

## 4. Instalacion, Puesta en Marcha y Pruebas

### Prerrequisitos
- **Node.js** (v18.0.0 o superior recomendada)
- **npm** (incluido con Node.js)

### Instrucciones de Ejecucion
1. Abrir la terminal o linea de comandos en la carpeta raiz del proyecto:
   ```bash
   cd alertaHiguamo
   ```
2. Instalar dependencias requeridas (Express, CORS, Leaflet):
   ```bash
   npm install
   ```
3. Iniciar el servidor web y API REST:
   ```bash
   npm start
   ```
4. Abrir en cualquier navegador web moderno:
   ```text
   http://localhost:3000
   ```

### Ejecutar las Pruebas Automatizadas
Para verificar el 100% de los endpoints y validaciones:
```bash
npm test
```

---

## 5. Tabla de Endpoints de la API REST

| Metodo | Endpoint | Recurso | Descripcion | Codigo Exito | Codigos Error |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/health` | Sistema | Verificacion de estado y operatividad del servicio | `200 OK` | `500` |
| `GET` | `/api/incidencias` | Incidencias | Listar incidencias con filtros (`provincia`, `prioridad`, `estado`, `search`) | `200 OK` | `500` |
| `GET` | `/api/incidencias/:id` | Incidencias | Obtener detalles completos y linea de tiempo de un reporte | `200 OK` | `404` |
| `POST` | `/api/incidencias` | Incidencias | Registrar un nuevo reporte de emergencia | `201 Created` | `400` |
| `PUT` | `/api/incidencias/:id` | Incidencias | Actualizacion completa de datos de una emergencia | `200 OK` | `404` |
| `PATCH` | `/api/incidencias/:id/estado` | Incidencias | Cambiar estado (`pendiente`, `en_proceso`, `atendida`, `cerrada`) con nota e historial | `200 OK` | `400, 404` |
| `DELETE` | `/api/incidencias/:id` | Incidencias | Eliminar una emergencia del registro | `200 OK` | `404` |
| `GET` | `/api/refugios` | Refugios | Listar refugios habilitados en la region y sus plazas | `200 OK` | `500` |
| `GET` | `/api/refugios/:id` | Refugios | Obtener informacion individual de un refugio | `200 OK` | `404` |
| `POST` | `/api/refugios` | Refugios | Registrar un nuevo albergue oficial | `201 Created` | `400` |
| `PUT` | `/api/refugios/:id` | Refugios | Actualizacion completa de datos de un albergue | `200 OK` | `404` |
| `PATCH` | `/api/refugios/:id/capacidad` | Refugios | Actualizar personas alojadas mediante variacion delta (+/-) con historial | `200 OK` | `400, 404` |
| `DELETE` | `/api/refugios/:id` | Refugios | Dar de baja un refugio del sistema | `200 OK` | `404` |
| `GET` | `/api/recursos` | Recursos | Listar inventario de suministros y almacenes | `200 OK` | `500` |
| `GET` | `/api/recursos/:id` | Recursos | Consultar datos de un recurso de emergencia | `200 OK` | `404` |
| `POST` | `/api/recursos` | Recursos | Dar de alta un nuevo tipo de suministro de auxilio | `201 Created` | `400` |
| `PATCH` | `/api/recursos/:id/entrega` | Recursos | Despachar suministros vinculados a una incidencia especifica | `200 OK` | `400, 404` |
| `DELETE` | `/api/recursos/:id` | Recursos | Eliminar un recurso del inventario | `200 OK` | `404` |
| `GET` | `/api/estadisticas` | Estadisticas | Metricas consolidadas en tiempo real para mando regional | `200 OK` | `500` |

---

## 6. Ejemplos de Solicitudes y Respuestas JSON

### A. Registro de Incidencia (`POST /api/incidencias`)
**Peticion:**
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
**Respuesta HTTP 201 Created:**
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
    "fechaReporte": "2026-11-04T18:00:00.000Z",
    "historial": [
      {
        "fecha": "2026-11-04T18:00:00.000Z",
        "accion": "Reporte registrado",
        "usuario": "Ana Luisa Gomez"
      }
    ]
  }
}
```

### B. Validacion de Datos Invalidos (`POST /api/incidencias` - HTTP 400)
**Peticion:**
```json
{
  "titulo": "Rio",
  "provincia": "La Romana"
}
```
**Respuesta HTTP 400 Bad Request:**
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

### C. Actualizacion de Estado de Emergencia (`PATCH /api/incidencias/INC-001/estado`)
**Peticion:**
```json
{
  "estado": "atendida",
  "nota": "Bomberos y Defensa Civil concluyeron la evacuacion preventiva.",
  "usuario": "Coordinador COE SPM"
}
```
**Respuesta HTTP 200 OK:**
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
        "fecha": "2026-11-04T18:15:00.000Z",
        "accion": "Estado cambiado de 'en_proceso' a 'atendida': Bomberos y Defensa Civil concluyeron la evacuacion preventiva.",
        "usuario": "Coordinador COE SPM"
      }
    ]
  }
}
```

### D. Variacion Delta en Capacidad de Refugio (`PATCH /api/refugios/REF-001/capacidad`)
**Peticion:**
```json
{
  "variacion": 15,
  "usuario": "Encargado de Refugio"
}
```
**Respuesta HTTP 200 OK:**
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
        "fecha": "2026-11-04T18:20:00.000Z",
        "variacion": 15,
        "ocupadosResultante": 60,
        "accion": "Ingreso de 15 persona(s) evacuadas. Total alojadas: 60/150",
        "usuario": "Encargado de Refugio"
      }
    ]
  }
}
```

### E. Despacho de Suministro Vinculado a Incidencia (`PATCH /api/recursos/REC-001/entrega`)
**Peticion:**
```json
{
  "cantidadEntregar": 25,
  "incidenciaId": "INC-001",
  "usuario": "Encargado de Almacen Regional"
}
```
**Respuesta HTTP 200 OK:**
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
        "fecha": "2026-11-04T18:25:00.000Z",
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

## 7. Evidencias de Pruebas Automatizadas

Al ejecutar `npm test`, se ejecuta la suite automatizada sobre la carpeta `api/tests/`:

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

## 8. Guia de Exposicion para la Presentacion

Para la exposicion del proyecto ante el profesor y companeros, se ha creado una guia dedicada paso a paso con el libreto completo de que decir, que archivos mostrar, como demostrar la plataforma en vivo y un banco de preguntas frecuentes:

👉 **[Consultar la Guia de Exposicion Completa (GUIA_EXPOSICION.md)](GUIA_EXPOSICION.md)**

---

## 9. Paleta de Colores Oficial y Diseno Visual

El diseno visual se apega estrictamente a la paleta oficial institucional de emergencias:

- **Rojo Emergencia (`#D9381E`):** Alertas criticas, incidencias de alta prioridad y botones de accion urgente.
- **Azul Marino (`#1B365D`):** Encabezados, estructura institucional y elementos de navegacion.
- **Verde Rescate (`#2E7D32`):** Incidencias atendidas, confirmaciones de exito y refugios con disponibilidad.
- **Ambar Prevencion (`#F59E0B`):** Incidencias en proceso, advertencias y prioridad media.
- **Gris Fondo Suave (`#F8FAFC`):** Fondo general de alto contraste y legibilidad para telefonos moviles.
- **Texto Principal (`#0F172A`):** Tipografia de alto contraste sobre fondo claro para maxima accesibilidad.

---

## Creditos y Equipo de Desarrollo
- **Institucion:** Universidad Autonoma de Santo Domingo (UASD)
- **Facultad:** Facultad de Ciencias — Escuela de Informatica
- **Asignatura:** Desarrollo Web / Proyecto Integrador
- **Desarrolladores:**
  - **Jefrey Encarnacion Medina** — Matricula: **100687695**
  - **Jomil Jose Mota** — Matricula: **100617004**
- **Caso Asignado:** Region Higuamo (San Pedro de Macoris, Hato Mayor, Monte Plata)
- **Repositorio:** [https://github.com/medinajefrey532-cmyk/alertaHiguamo.git](https://github.com/medinajefrey532-cmyk/alertaHiguamo.git)
