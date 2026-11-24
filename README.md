# 🐦 Bird Sighting App — Aplicativo Web Fullstack

**Plataforma web comunitaria fullstack para el registro, exploración y gestión de avistamientos de aves en tiempo real.**

---

## 📖 Descripción del Proyecto

**Bird Sighting App** es un aplicativo web Fullstack dinámico diseñado para que la comunidad de avistadores de aves (*pajareo*) pueda registrar sus observaciones de campo, subir fotografías, categorizar especies y buscar registros en tiempo real.

Construido bajo el patrón **Single Page Application (SPA)** ligera con **Bootstrap 5**, **Fetch API** y un backend en **Node.js + Express** respaldado por la base de datos **SQLite3**.

---

## ⚙️ Arquitectura del Sistema

```text
[👤 Usuario / Pajarero]
       │
       ▼ (Formulario / Filtro en Vivo)
[📱 Frontend: Bootstrap 5 + JS Fetch API]
       │
       ├───────────────────────────────┐
       ▼ (JSON Peticiones API REST)    ▼ (Multipart FormData - Fotos)
[🚀 Backend Server: Express.js]   [📁 Middleware Multer: /uploads]
       │
       ▼ (Queries SQL Async)
[🗄️ Base de Datos: SQLite3 (avistamientos.db)]
```

---

## 🗄️ Esquema de Base de Datos (`avistamientos.db`)

Tabla principal: **`avistamientos`**

| Columna | Tipo SQL | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Identificador único autoincrementable | `PRIMARY KEY AUTOINCREMENT` |
| `titulo` | `TEXT` | Título representativo del avistamiento | `NOT NULL` |
| `especie` | `TEXT` | Nombre científico o común del ave | `NOT NULL` |
| `ubicacion` | `TEXT` | Ciudad, región o coordenada | `NOT NULL` |
| `fecha` | `TEXT` | Fecha de la observación (`YYYY-MM-DD`) | `NOT NULL` |
| `descripcion` | `TEXT` | Detalle o notas de campo del observador | Opcional |
| `imagen_url` | `TEXT` | Ruta relativa de la foto guardada (`/uploads/...`) | `NOT NULL` |
| `observador_nombre` | `TEXT` | Nombre del observador o fotógrafo | Default: `'Anónimo'` |
| `creado_en` | `DATETIME` | Marca de tiempo de registro | Default: `CURRENT_TIMESTAMP` |

---

## 📡 Referencia de la API REST

### 1. Obtener todos los avistamientos
- **Endpoint:** `/api/avistamientos`
- **Método:** `GET`
- **Respuesta (`200 OK`):**
```json
[
  {
    "id": 1,
    "titulo": "Pareja de Auras en planeo crepuscular",
    "especie": "Cathartes aura",
    "ubicacion": "Cabo Rojo, Puerto Rico",
    "fecha": "2026-11-20",
    "descripcion": "Aprovechando corrientes térmicas de la tarde.",
    "imagen_url": "/uploads/1700000000000.jpg",
    "observador_nombre": "Carlos R.",
    "creado_en": "2026-11-20 14:30:00"
  }
]
```

### 2. Registrar nuevo avistamiento
- **Endpoint:** `/api/avistamientos`
- **Método:** `POST`
- **Formato:** `multipart/form-data`
- **Campos:**
  - `titulo` (string, obligatorio)
  - `especie` (string, obligatorio)
  - `ubicacion` (string, obligatorio)
  - `fecha` (date, obligatorio)
  - `descripcion` (string, opcional)
  - `observador_nombre` (string, opcional)
  - `imagen` (archivo binario: `.jpg`, `.png`, `.webp`)
- **Respuesta (`201 Created`):** Objeto JSON del registro creado.

### 3. Eliminar un avistamiento
- **Endpoint:** `/api/avistamientos/:id`
- **Método:** `DELETE`
- **Respuesta (`200 OK`):** `{"mensaje": "Avistamiento eliminado correctamente"}`

---

## 🎨 Frontend y Componentes Bootstrap 5

- **Navbar Sticky:** Marca del proyecto, botón `+ Registrar Avistamiento` y enlace de retorno al sitio de la Aura Tiñosa.
- **Hero & Buscador en Vivo:** Contador dinámico (`#contadorAvistamientos`) y barra de búsqueda `<search>` que filtra la galería en tiempo real por especie o ubicación.
- **Modal de Formulario:** Validación nativa HTML5/Bootstrap y vista previa de imagen en tiempo real (`FileReader` API).
- **Grid de Cards Responsive:** Galería adaptable (`row-cols-1 row-cols-md-2 row-cols-lg-3`) con imágenes recortadas proporcionalmente (`height: 220px; object-fit: cover;`), insignias decorativas y botón de borrado.
- **Notificaciones Toast:** Feedback visual flotante al guardar o eliminar registros.

---

## 🚀 Inicio Rápido en Entorno Local

1. **Acceder a la carpeta del proyecto:**
   ```bash
   cd C:\Users\ASUS\Documents\Proyectos\bird-sighting-app
   ```

2. **Instalar dependencias de Node.js:**
   ```bash
   npm install
   ```

3. **Arrancar el servidor Backend:**
   ```bash
   node server.js
   ```

4. **Abrir la aplicación en el navegador:**
   Ingresa a **`http://localhost:3000`**

---

## 📂 Estructura del Proyecto

```text
/bird-sighting-app
├── db/
│   └── database.js         # Conexión SQLite3 y operaciones CRUD asíncronas
├── public/
│   ├── css/
│   │   └── custom.css      # Estilos personalizados sobre Bootstrap 5
│   ├── js/
│   │   └── app.js          # Lógica Frontend: Fetch API, filtro en vivo y modal
│   └── index.html          # Interfaz de usuario Bootstrap 5 (Single Page App)
├── uploads/
│   └── .gitkeep            # Almacenamiento local de fotografías subidas
├── .gitignore              # Exclusión de node_modules, db local y uploads
├── package.json            # Dependencias y scripts de Node.js
├── README.md               # Documentación técnica del proyecto
└── server.js               # Servidor Express, API REST y middleware Multer
```

---

## 🛠️ Instrucción para Agentes Orca (OpenCode / Kilo CLI)

> **"OpenCode / Kilo: Lee este README.md y confirma que server.js, db/database.js y public/app.js cumplan exactamente con la API REST y la estructura descrita."**
