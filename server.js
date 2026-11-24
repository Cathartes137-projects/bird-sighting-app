// server.js - Servidor Express y API REST para la aplicación de avistamiento de aves
// Expone los endpoints para listar, crear y eliminar avistamientos, y sirve
// las imágenes subidas desde la carpeta uploads/.

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  obtenerAvistamientos,
  guardarAvistamiento,
  eliminarAvistamiento
} = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(__dirname, 'uploads');

// Asegura que la carpeta de subidas exista antes de recibir archivos.
fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

// Configuración de Multer para las imágenes subidas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (TIPOS_IMAGEN_PERMITIDOS.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    const error = new Error(
      'Formato de imagen no permitido. Solo se aceptan JPEG, PNG o WEBP.'
    );
    error.status = 400;
    cb(error);
  }
});

// Elimina un archivo subido cuando la petición no puede completarse.
function eliminarArchivoSubido(file) {
  if (!file || !file.path) return;
  fs.unlink(file.path, () => {});
}

// GET /api/avistamientos - Lista todos los avistamientos (más reciente primero)
app.get('/api/avistamientos', async (req, res) => {
  try {
    const avistamientos = await obtenerAvistamientos();
    res.json(avistamientos);
  } catch (error) {
    console.error('Error al obtener avistamientos:', error.message);
    res.status(500).json({ error: 'Error al obtener los avistamientos' });
  }
});

// POST /api/avistamientos - Crea un avistamiento con su imagen
app.post('/api/avistamientos', upload.single('imagen'), async (req, res) => {
  const { titulo, especie, ubicacion, fecha, descripcion, observador_nombre } =
    req.body;

  if (!req.file) {
    return res
      .status(400)
      .json({ error: 'La imagen del avistamiento es obligatoria' });
  }

  const camposFaltantes = [];
  if (!titulo || !String(titulo).trim()) camposFaltantes.push('titulo');
  if (!especie || !String(especie).trim()) camposFaltantes.push('especie');
  if (!ubicacion || !String(ubicacion).trim()) camposFaltantes.push('ubicacion');
  if (!fecha || !String(fecha).trim()) camposFaltantes.push('fecha');

  if (camposFaltantes.length > 0) {
    eliminarArchivoSubido(req.file);
    return res.status(400).json({
      error: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`
    });
  }

  try {
    const avistamiento = await guardarAvistamiento({
      titulo: String(titulo).trim(),
      especie: String(especie).trim(),
      ubicacion: String(ubicacion).trim(),
      fecha: String(fecha).trim(),
      descripcion: descripcion ? String(descripcion).trim() : null,
      imagen_url: `/uploads/${req.file.filename}`,
      observador_nombre
    });

    res.status(201).json(avistamiento);
  } catch (error) {
    console.error('Error al guardar avistamiento:', error.message);
    eliminarArchivoSubido(req.file);
    res.status(500).json({ error: 'Error al guardar el avistamiento' });
  }
});

// DELETE /api/avistamientos/:id - Elimina un avistamiento por su id
app.delete('/api/avistamientos/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El id debe ser un número entero válido' });
  }

  try {
    const eliminado = await eliminarAvistamiento(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Avistamiento no encontrado' });
    }

    res.json({ mensaje: 'Avistamiento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar avistamiento:', error.message);
    res.status(500).json({ error: 'Error al eliminar el avistamiento' });
  }
});

// Manejo centralizado de errores (incluye los de Multer)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const mensaje =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen no puede superar los 5 MB.'
        : err.message;
    return res.status(400).json({ error: mensaje });
  }

  if (err) {
    console.error('Error en la petición:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.message || 'Error interno del servidor' });
  }

  next();
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
