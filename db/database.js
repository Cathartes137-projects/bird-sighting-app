// db/database.js - Conexión, esquema y utilidades de SQLite
// Encapsula el acceso a la base de datos de avistamientos de aves y expone
// funciones basadas en promesas para que el servidor no dependa de callbacks.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'avistamientos.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Garantiza que la tabla exista antes de ejecutar cualquier consulta.
const dbReady = new Promise((resolve, reject) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS avistamientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      especie TEXT NOT NULL,
      ubicacion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      descripcion TEXT,
      imagen_url TEXT NOT NULL,
      observador_nombre TEXT DEFAULT 'Anónimo',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla avistamientos:', err.message);
      reject(err);
      return;
    }
    resolve();
  });
});

// Devuelve todos los avistamientos, del más reciente al más antiguo.
function obtenerAvistamientos() {
  return dbReady.then(
    () =>
      new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM avistamientos ORDER BY fecha DESC, id DESC';
        db.all(sql, [], (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        });
      })
  );
}

// Inserta un avistamiento y devuelve el registro recién creado.
function guardarAvistamiento(datos) {
  const {
    titulo,
    especie,
    ubicacion,
    fecha,
    descripcion = null,
    imagen_url,
    observador_nombre
  } = datos;

  const observador =
    observador_nombre && String(observador_nombre).trim()
      ? String(observador_nombre).trim()
      : 'Anónimo';

  const sql = `
    INSERT INTO avistamientos
      (titulo, especie, ubicacion, fecha, descripcion, imagen_url, observador_nombre)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  return dbReady.then(
    () =>
      new Promise((resolve, reject) => {
        db.run(
          sql,
          [titulo, especie, ubicacion, fecha, descripcion, imagen_url, observador],
          function (err) {
            if (err) {
              reject(err);
              return;
            }

            db.get(
              'SELECT * FROM avistamientos WHERE id = ?',
              [this.lastID],
              (selectErr, row) => {
                if (selectErr) {
                  reject(selectErr);
                  return;
                }
                resolve(row);
              }
            );
          }
        );
      })
  );
}

// Elimina un avistamiento por id. Devuelve true si existía y fue eliminado.
function eliminarAvistamiento(id) {
  return dbReady.then(
    () =>
      new Promise((resolve, reject) => {
        db.run('DELETE FROM avistamientos WHERE id = ?', [id], function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        });
      })
  );
}

module.exports = {
  db,
  obtenerAvistamientos,
  guardarAvistamiento,
  eliminarAvistamiento
};
