const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ADMIN_PASSWORD = 'admin123';

// Configuración de Multer para la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/';
    try {
      // Intenta crear el directorio, si ya existe no hace nada
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      console.error('Error al crear el directorio de subidas:', err);
      // Pasa el error a Express para que lo maneje.
      cb(err); 
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

/* GET página de inicio. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET página de contacto. */
router.get('/contacto', function(req, res, next) {
  res.render('contacto', { title: 'Contacto' });
});

/* POST para manejar el envío del formulario de contacto */
router.post('/enviar-contacto', function(req, res, next) {
  const { name, email, projectType, message } = req.body;

  const now = new Date();
  const options = { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const venezuelaTime = now.toLocaleString('es-VE', options);

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

/* GET página de servicios. */
router.get('/servicios', function(req, res, next) {
  res.render('servicios', { title: 'Nuestros Servicios' });
});

/* GET página de portafolio. */
router.get('/portafolio', function(req, res, next) {
  db.all('SELECT * FROM proyectos', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.render('portafolio', { proyectos: [] });
    } else {
      const proyectos = rows.map(row => ({
        ...row,
        images: JSON.parse(row.images),
        tech: JSON.parse(row.tech)
      }));
      res.render('portafolio', { title: 'Portafolio', proyectos: proyectos });
    }
  });
});

/* GET página "Sobre Nosotros". */
router.get('/sobrenosotros', function(req, res, next) {
  res.render('sobre-nosotros', { title: 'Sobre Nosotros' });
});

/* GET página de recursos y FAQs. */
router.get('/recursos', function(req, res, next) {
  res.render('recursos', { title: 'Recursos y FAQs' });
});

/* GET página de inicio de sesión del administrador. */
router.get('/admin', function(req, res, next) {
  res.render('login-admin', { title: 'Acceso de Administrador', error: null });
});

/* POST para procesar el inicio de sesión del administrador */
router.post('/admin/login', function(req, res, next) {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.redirect('/admin/dashboard');
  } else {
    res.render('login-admin', { title: 'Acceso de Administrador', error: 'Contraseña incorrecta. Inténtalo de nuevo.' });
  }
});

/* GET página del panel de administración. */
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

/* GET para mostrar el formulario de agregar proyecto. */
router.get('/admin/agregar-proyecto', (req, res) => {
    res.render('agregar-proyecto', { title: 'Agregar Proyecto' });
});

/* POST para manejar la adición de un nuevo proyecto, incluyendo la subida de imágenes. */
router.post('/admin/agregar-proyecto', upload.array('images', 5), (req, res) => {
  const { title, shortDescription, description, tech, link } = req.body;

  // Validación de los campos del formulario y los archivos subidos.
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Por favor, sube al menos una imagen para el proyecto.' });
  }

  if (!title || !description || !tech) {
    return res.status(400).json({ success: false, message: 'El título, la descripción y la tecnología son campos obligatorios.' });
  }
  
  const images = req.files.map(file => `/uploads/${file.filename}`);
  const techArray = tech.split(',').map(item => item.trim());

  db.run(`INSERT INTO proyectos (title, shortDescription, description, images, tech, link) VALUES (?, ?, ?, ?, ?, ?)`, 
    [title, shortDescription, description, JSON.stringify(images), JSON.stringify(techArray), link],
    function(err) {
      if (err) {
        console.error('Error al agregar el proyecto a la base de datos:', err.message);
        return res.status(500).json({ success: false, message: 'Error al agregar el proyecto: ' + err.message });
      }
      res.json({ success: true, message: '¡Proyecto agregado con éxito!' });
  });
});

/* GET API para obtener todos los proyectos. */
router.get('/api/proyectos', (req, res) => {
  db.all(`SELECT * FROM proyectos`, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener los proyectos: ' + err.message });
    }
    const projects = rows.map(row => ({
      ...row,
      images: JSON.parse(row.images),
      tech: JSON.parse(row.tech)
    }));
    res.json(projects);
  });
});

/* GET API para obtener un proyecto por ID. */
router.get('/api/proyectos/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM proyectos WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener el proyecto: ' + err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });
    }
    const project = {
      ...row,
      images: JSON.parse(row.images),
      tech: JSON.parse(row.tech)
    };
    res.json(project);
  });
});

/* DELETE API para eliminar un proyecto, incluyendo sus imágenes. */
router.delete('/api/proyectos/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT images FROM proyectos WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al buscar el proyecto: ' + err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });
    }

    const imagesToDelete = JSON.parse(row.images);

    db.run(`DELETE FROM proyectos WHERE id = ?`, [id], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error al eliminar el proyecto: ' + err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });
      }

      imagesToDelete.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', 'public', imagePath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error('Error al eliminar la imagen:', err.message);
          }
        });
      });
      
      res.json({ success: true, message: 'Proyecto eliminado con éxito.' });
    });
  });
});

module.exports = router;
