const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./contactos.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    db.run(`CREATE TABLE IF NOT EXISTS mensajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      projectType TEXT,
      message TEXT,
      timestamp TEXT
    )`);
  }
});

module.exports = db;