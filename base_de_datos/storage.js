// ==========================================================================
// MODULO DE PERSISTENCIA Y BASE DE DATOS LOCAL — ALERTA HIGUAMO
// Este archivo gestiona la lectura y escritura asincrona de archivos JSON
// Ubicado en la carpeta base_de_datos/ junto a los archivos JSON del sistema
// ==========================================================================

// Modulo de sistema de archivos asincrono basado en promesas de Node.js
const fs = require('fs').promises;
const path = require('path');

// Directorio fisico donde residen los archivos JSON (base_de_datos/)
const DATA_DIR = __dirname;

// Funcion auxiliar que resuelve la ruta absoluta al archivo JSON de una entidad
async function getFilePath(entity) {
  return path.join(DATA_DIR, `${entity}.json`);
}

// Funcion que lee el archivo JSON de la entidad indicada y devuelve el arreglo parseado
async function readData(entity) {
  try {
    const filePath = await getFilePath(entity);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Si el archivo no existe aun (ENOENT), devuelve un arreglo vacio sin romper la ejecucion
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Funcion que escribe los datos actualizados en el archivo JSON con formato legible (indentacion 2)
async function writeData(entity, data) {
  const filePath = await getFilePath(entity);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Funcion que genera un identificador alfanumerico correlativo y unico (ej: INC-001, REF-001, REC-001)
function generateId(prefix, existingItems = []) {
  const numbers = existingItems
    .map(item => {
      // Extrae el numero del ID existente mediante expresion regular
      const match = (item.id || '').match(new RegExp(`^${prefix}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  // Obtiene el numero mas alto y le suma 1 con relleno de ceros a 3 digitos
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  const next = max + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

// Exporta las funciones para ser utilizadas por los controladores de la API
module.exports = {
  readData,
  writeData,
  generateId
};
