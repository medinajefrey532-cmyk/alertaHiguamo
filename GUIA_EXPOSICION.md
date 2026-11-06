# Guia de Exposicion para el Estudiante — ComunidadAlerta Higuamo

> **Universidad Autonoma de Santo Domingo (UASD)**  
> **Facultad de Ciencias — Escuela de Informatica**  
> **Proyecto Integrador — Hito Final: Diseno e Implementacion de la API REST**  
> 
> **Integrantes del Equipo:**  
> • **Jefrey Encarnacion Medina** — Matricula: **100687695**  
> • **Jomil Jose Mota** — Matricula: **100617004**  
> 
> **Region Asignada:** Region Higuamo (**San Pedro de Macoris**, **Hato Mayor** y **Monte Plata**)  
> **Tecnologias:** Node.js, Express, JavaScript, HTML5 Semantico, CSS3, JSON Asincrono  
> **Repositorio:** [https://github.com/medinajefrey532-cmyk/alertaHiguamo.git](https://github.com/medinajefrey532-cmyk/alertaHiguamo.git)  
> **Objetivo de este documento:** Servir como guion y libreto completo para que el estudiante exponga el proyecto con total claridad, orden y seguridad tecnica.

---

## 1. Resumen Ejecutivo para la Presentacion
* **Tiempo Total Estimado:** 7 a 10 minutos.
* **Mensaje Central:** "ComunidadAlerta Higuamo" no es una maqueta ni un prototipo estatico; es una **plataforma completamente funcional** con una **API REST robusta en Node.js y Express** organizada en **3 capas independientes** (`api/`, `interfaz/` y `base_de_datos/`), validada con **25 pruebas automatizadas al 100% de exito** y disenada para resolver una problematica real en la Region Higuamo.

---

## 2. Preparacion Previa a la Exposicion (Antes de empezar)

1. **Abrir la terminal en la carpeta del proyecto:**
   ```bash
   cd alertaHiguamo
   ```
2. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   *(Verificar que muestre el mensaje: `[INFO] Servidor Alerta Higuamo en ejecucion` en `http://localhost:3000`)*
3. **Abrir dos ventanas en el navegador:**
   - Ventana 1: `http://localhost:3000` (la interfaz web en vivo).
   - Ventana 2: El editor de codigo (VS Code) con las 3 carpetas visibles en la barra lateral (`api/`, `base_de_datos/`, `interfaz/`).
4. **Tener una terminal secundaria lista para ejecutar las pruebas:**
   ```bash
   npm test
   ```

---

## 3. Guion de Exposicion Paso a Paso

### Paso 1: Introduccion y Planteamiento del Problema (1 minuto)
* **Accion:** Mostrar la portada del proyecto en el navegador.
* **Que decir:**  
  > *"Saludos cordiales profesor y companeros. Nuestro equipo esta conformado por Jefrey Encarnacion Medina y Jomil Jose Mota. Nuestro proyecto integrador se titula **ComunidadAlerta Higuamo**, y aborda la problematica de la gestion y respuesta a emergencias en la **Region Higuamo**, conformada por **San Pedro de Macoris**, **Hato Mayor** y **Monte Plata**.*  
  >  
  > *Ante fenomenos atmosfericos como tormentas tropicales y vaguadas, las crecidas simultaneas de los rios Higuamo, Magua, Soco y Comate provocan inundaciones, cortes de vias y comunidades aisladas. Historicamente, los reportes ciudadanos se reciben dispersos por llamadas o redes sociales, lo que dificulta saber que situacion es mas grave, provoca reportes duplicados y entorpece la logistica de albergues y suministros.*  
  >  
  > *Nuestra solucion centraliza estos reportes a traves de una **API REST moderna en Node.js y Express**, conectada a una plataforma web institucional."*

---

### Paso 2: Cumplimiento de los Requisitos del Hito de la UASD (1 a 2 minutos)
* **Accion:** Mostrar la tabla de endpoints en el archivo `README.md` o la salida de la consola de pruebas.
* **Que decir:**  
  > *"Para este hito, la asignacion nos exigia como minimo: 2 recursos principales, 8 endpoints, operaciones CRUD, respuestas JSON con codigos HTTP adecuados, validacion de datos y pruebas automatizadas.*  
  >  
  > *En nuestro proyecto no solo cumplimos, sino que superamos ampliamente los requerimientos:*  
  > 1. *Implementamos **3 recursos completos**: `incidencias`, `refugios` y `recursos humanitarios`, ademas de un modulo de `estadisticas` consolidado.*  
  > 2. *Contamos con **17 endpoints operativos** (mas del doble del minimo solicitado).*  
  > 3. *Implementamos todos los metodos REST: `GET` para consultas y filtros, `POST` para creacion, `PUT` para actualizaciones totales, `PATCH` para variaciones de estado y cupo con auditoria, y `DELETE` para bajas.*  
  > 4. *Todas las respuestas manejan formato estandar JSON con codigos HTTP: `200 OK`, `201 Created`, `400 Bad Request` ante datos invalidos, `404 Not Found` cuando no existe un recurso, y `500` para errores.*  
  > 5. *Disponemos de una suite de **25 pruebas automatizadas**, con un **100% de tasa de exito**."*

* **Demostracion de pruebas:** Ejecutar en vivo en la terminal:
  ```bash
  npm test
  ```
  *(Senalar a la audiencia que los 5 modulos y las 25 aserciones pasan limpiamente).*

---

### Paso 3: Arquitectura Organizada en 3 Carpetas y Codigo Comentado (2 minutos)
* **Accion:** Abrir el explorador de archivos en el editor de codigo y desplegar la estructura.
* **Que decir:**  
  > *"Para garantizar un codigo limpio, mantenible y profesional, organizamos el proyecto en **tres carpetas fundamentales**, separando estrictamente las responsabilidades:*  
  >  
  > 1. *`api/`: Contiene el backend Express (`app.js`), los controladores (`controllers/`) con la logica de negocio, las rutas modulares (`routes/`), los middlewares de validacion (`middlewares/`) y la suite de pruebas (`tests/`).*  
  > 2. *`base_de_datos/`: Aloja la persistencia en archivos JSON (`incidencias.json`, `refugios.json`, `recursos.json`) y el modulo asincrono `storage.js` que utiliza `fs.promises` para lecturas y escrituras atomicas seguras.*  
  > 3. *`interfaz/`: Contiene las vistas multipagina en HTML5 semantico, los estilos CSS institucionales, las imagenes y el cliente JavaScript modular `app.js` que consume la API.*  
  >  
  > *Un aspecto fundamental es que **todo el codigo esta documentado bajo el patron 'esto hace esto'**, explicando directamente la funcion de cada bloque, validador y controlador para facilitar la comprension del sistema."*

---

### Paso 4: Demostracion en Vivo de la Plataforma Web (3 a 4 minutos)
* **Accion:** Ir al navegador (`http://localhost:3000`) e interactuar con cada seccion:

#### 1. Pantalla de Inicio (`index.html`)
* Explicar las 4 tarjetas de metricas en tiempo real (calculadas dinamicamente desde `/api/estadisticas`).
* **Punto clave:** Destacar que en la seccion de "Emergencias Activas" de Inicio **solo se muestran las emergencias activas (pendientes y en proceso)**; las que ya fueron atendidas o cerradas no congestionan la pantalla de inicio.

#### 2. Reportar Emergencia (`reportar.html`)
* Llenar un reporte de ejemplo:
  - Titulo: *"Crecida del Rio Soco anega viviendas"*
  - Tipo: *Inundacion*
  - Provincia: *San Pedro de Macoris*
  - Municipio: *Ramon Santana*
  - Comunidad: *Barrio Nuevo*
  - Prioridad: *Alta*
  - Afectados estimados: *30*
* Hacer clic en **"Enviar Reporte de Emergencia"**.
* Mostrar la notificacion institucional con el codigo correlativo generado (ej: `INC-008`).

#### 3. Consultar Estado (`consultar.html`)
* Ingresar el codigo generado (o `INC-001`).
* Hacer clic en **"Buscar Reporte"**.
* Mostrar como se renderiza la tarjeta del reporte con su estado, severidad y la **linea de tiempo del historial** con fecha y responsable.

#### 4. Registro Maestro de Coordinacion (`registro.html`)
* Explicar los filtros por provincia (San Pedro de Macoris, Hato Mayor, Monte Plata) y prioridad.
* Mostrar como las incidencias cerradas se posicionan al final de la lista.
* Cambiar el estado de una incidencia a **"en proceso"** o **"atendida"** con una nota operativa, demostrando como se actualiza en vivo mediante `PATCH /api/incidencias/:id/estado`.

#### 5. Gestion de Refugios Oficiales (`refugios.html`)
* Mostrar las tarjetas de albergues y su barra porcentual de ocupacion.
* **Punto clave de diseno:** Explicar el campo de **variacion delta (+/-)**:
  > *"Para evitar que un operador modifique accidentalmente la capacidad total o el numero absoluto de alojados, el sistema opera por variacion: si ingresan 15 evacuados se introduce `+15`; si salen 5 se introduce `-5`. Esto actualiza las plazas libres y crea un registro inmutable en el historial del albergue."*
* Pulsar en **"Ver Historial"** de un refugio para mostrar la bitacora de auditoria.

#### 6. Recursos y Suministros Humanitarios (`recursos.html`)
* Mostrar el inventario de botellones de agua, raciones, botiquines y botes de rescate.
* Realizar un despacho: ingresar cantidad (ej: 20 botellones) y seleccionar en el desplegable la incidencia de destino.
* Confirmar el despacho:
  > *"Al despachar, el inventario disponible disminuye, pero ademas la entrega se vincula y se anota de manera sincronizada tanto en el historial del recurso como en el historial de la incidencia de emergencia receptora."*

#### 7. Mapa Regional Georreferenciado (`mapa.html`)
* Mostrar los marcadores interactivos Leaflet sobre la Region Higuamo.
* Presionar los botones de acceso rapido: **"San Pedro de Macoris"**, **"Hato Mayor"** y **"Monte Plata"** para ver como la camara se enfoca suavemente en cada provincia.

---

### Paso 5: Conclusion y Preguntas (1 minuto)
* **Que decir:**  
  > *"En conclusion, ComunidadAlerta Higuamo cumple y supera todos los requerimientos del hito integrador:  
  > - Es una API REST con semantica estandar, 17 endpoints y 3 recursos interconectados.  
  > - Posee una interfaz web intuitiva, responsiva y adaptada a la identidad visual de proteccion civil.  
  > - Dispone de persistencia de datos segura y 25 pruebas automatizadas al 100%.  
  >  
  > Quedamos a su entera disposicion para cualquier pregunta o para profundizar en cualquier aspecto tecnico del codigo. Muchas gracias."*

---

## 4. Banco de Posibles Preguntas del Profesor y Respuestas Clave

**P1: ¿Por que usaron archivos JSON en lugar de una base de datos relacional como PostgreSQL o MySQL?**  
* **Respuesta:** *"Para este hito de la API REST, el objetivo academico principal era estructurar los endpoints, metodos HTTP, validaciones, codigos de estado y respuestas JSON con Node.js y Express. Usamos persistencia asincrona en JSON con `fs.promises` para garantizar que los datos se guarden fisicamente en disco sin dependencias externas pesadas, dejando la capa `base_de_datos/storage.js` totalmente desacoplada para conectarse a MongoDB, PostgreSQL o MySQL en el siguiente hito con solo modificar el adaptador."*

**P2: ¿Como garantizan que una persona no ingrese datos corruptos o de otra region?**  
* **Respuesta:** *"A traves de los middlewares en `api/middlewares/validators.js`. Validamos longitudes minimas, tipos de emergencia permitidos, y restringimos estrictamente las provincias a las 3 de Higuamo (San Pedro de Macoris, Hato Mayor y Monte Plata). Cualquier intento fuera de esos catalogos es rechazado inmediatamente con un codigo `400 Bad Request` y un arreglo explicativo de errores."*

**P3: ¿Como se relaciona el despacho de recursos con las incidencias?**  
* **Respuesta:** *"En el controlador `recursos.controller.js` bajo la ruta `PATCH /api/recursos/:id/entrega`, si se proporciona un `incidenciaId`, el backend actualiza atomicamente el stock en `recursos.json` y al mismo tiempo abre `incidencias.json` para agregar una entrada al historial de la emergencia indicando que recibieron esos suministros, logrando trazabilidad bidireccional."*

**P4: ¿Por que las incidencias cerradas se muestran al final en el registro y no aparecen en el inicio?**  
* **Respuesta:** *"Por criterio de diseno operativo de centros de mando: en una situacion de emergencia, los coordinadores necesitan ver prioritariamente las situaciones activas (pendientes y en proceso) que demandan vidas y recursos inmediatos. Lo cerrado ya esta resuelto, por lo que pasa al historial de registro general para consulta historica."*

**P5: ¿Que es la carpeta `vendor/` y de donde sale el mapa? ¿Como se creo o descargo?**  
* **Respuesta:** *"En desarrollo de software, la palabra `vendor` se refiere a bibliotecas de proveedores de terceros (third-party libraries). En nuestro proyecto, `interfaz/vendor/` contiene la biblioteca de codigo abierto **Leaflet.js** (version 1.9.4) junto con sus estilos CSS y sus imagenes de marcadores (pines y sombras).*  
*El mapa se nutre de la capa cartografica abierta **OpenStreetMap (OSM)**. Lo incluimos de manera local en `vendor/` por contingencia operativa: si en el aula de clases o en el centro de emergencias la conexion a internet es lenta o inestable, el mapa y los controles interactivos cargan de forma 100% autonoma y local, sin depender de CDNs externos ni de APIs de pago como Google Maps."*
