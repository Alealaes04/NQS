const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./nexus_data.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

db.serialize(() => {
  // Tabla para mensajes de contacto
  db.run(`CREATE TABLE IF NOT EXISTS mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    projectType TEXT,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL
  )`);

  // Tabla para proyectos del portafolio
  db.run(`CREATE TABLE IF NOT EXISTS proyectos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    shortDescription TEXT NOT NULL,
    description TEXT NOT NULL,
    images TEXT NOT NULL,
    tech TEXT NOT NULL,
    link TEXT
  )`, (err) => {
    if (err) {
      console.error('Error al crear la tabla de proyectos:', err.message);
    } else {
      console.log('Tabla de proyectos lista.');
    }
  });
});

module.exports = db;
