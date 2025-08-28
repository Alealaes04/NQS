var express = require('express');
var router = express.Router();
const db = require('../db/database');
const ADMIN_PASSWORD = 'admin123';


// INICIO
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//CONTACTO
router.get('/contacto', function(req, res, next) {
  res.render('contacto', { title: 'Contacto' });
});

/* POST para enviar el formulario de contacto */
router.post('/enviar-contacto', function(req, res, next) {
  const { name, email, projectType, message } = req.body;

  // Obtener la fecha y hora de Venezuela (UTC-4)
  const now = new Date();
  const options = { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const venezuelaTime = now.toLocaleString('es-VE', options);

  // Usa la sentencia SQL para insertar los datos
  const sql = `INSERT INTO mensajes (name, email, projectType, message, timestamp) VALUES (?, ?, ?, ?, ?)`;

  db.run(sql, [name, email, projectType, message, venezuelaTime], function(err) {
    if (err) {
      console.error('Error al insertar el mensaje:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Ocurrió un error al enviar tu mensaje. Por favor, inténtalo de nuevo.'
      });
    }
    
    console.log(`Mensaje de ${name} insertado con el ID: ${this.lastID}`);
    res.status(200).json({
      success: true,
      message: '¡Tu mensaje ha sido enviado con éxito!'
    });
  });
});

//SERVICIOS
router.get('/servicios', function(req, res, next) {
  res.render('servicios', { title: 'Nuestros Servicios' });
});

//PORTAFOLIO
router.get('/portafolio', function(req, res, next) {
  res.render('portafolio', { title: 'Portafolio' });
});

//SOBRE NOSOTROS
router.get('/sobrenosotros', function(req, res, next) {
  res.render('sobre-nosotros', { title: 'Sobre Nosotros' });
});

//RECURSOS Y FAQs
router.get('/recursos', function(req, res, next) {
  res.render('recursos', { title: 'Recursos y FAQs' });
});

//ADMIN LOGIN
router.get('/admin', function(req, res, next) {
  res.render('login-admin', { title: 'Acceso de Administrador', error: null });
});

/* POST para procesar el acceso del administrador. */
router.post('/admin/login', function(req, res, next) {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.redirect('/admin/dashboard');
  } else {
    res.render('login-admin', { title: 'Acceso de Administrador', error: 'Contraseña incorrecta. Inténtalo de nuevo.' });
  }
});

//ADMIN DASHBOARD
router.get('/admin/dashboard', function(req, res, next) {
  const sql = `SELECT * FROM mensajes ORDER BY timestamp DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener los mensajes:', err.message);
      return res.status(500).send('Error interno del servidor.');
    }
    res.render('admin', {
      title: 'Panel de Administración',
      mensajes: rows
    });
  });
});

module.exports = router;