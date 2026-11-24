/**
 * app.js - Lógica Frontend y Consumo de la API REST para Avistamiento de Aves
 * Desarrollado con JavaScript moderno (ES6+), Fetch API y Bootstrap 5.
 */

// =============================================================================
// Constantes y Elementos del DOM
// =============================================================================
const API_URL = '/api/avistamientos';

const galeriaAvistamientos = document.getElementById('galeriaAvistamientos');
const contadorAvistamientos = document.getElementById('contadorAvistamientos');
const modalElement = document.getElementById('modalAvistamiento');
const formAvistamiento = document.getElementById('formAvistamiento');
const inputImagen = document.getElementById('imagen');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const filtroRapido = document.getElementById('filtroRapido');
const btnLimpiarFiltro = document.getElementById('btnLimpiarFiltro');
const btnSubmitForm = document.getElementById('btnSubmitForm');
const spinnerSubmit = document.getElementById('spinnerSubmit');
const iconoSubmit = document.getElementById('iconoSubmit');
const textoSubmit = document.getElementById('textoSubmit');

const toastElement = document.getElementById('liveToast');
const toastMensaje = document.getElementById('liveToastMensaje');

// Instancias de componentes de Bootstrap
let modalInstancia = null;
let toastInstancia = null;

// Caché local de avistamientos para filtrado instantáneo
let listaAvistamientos = [];

// =============================================================================
// Inicialización
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (modalElement && typeof bootstrap !== 'undefined') {
    modalInstancia = new bootstrap.Modal(modalElement);
  }

  if (toastElement && typeof bootstrap !== 'undefined') {
    toastInstancia = new bootstrap.Toast(toastElement, { delay: 4000 });
  }

  // Carga inicial de datos
  cargarAvistamientos();

  // Escuchadores de eventos
  configurarEventos();
});

// =============================================================================
// Configuración de Eventos de la Interfaz
// =============================================================================
function configurarEventos() {
  // Envío del formulario (POST)
  if (formAvistamiento) {
    formAvistamiento.addEventListener('submit', manejarEnvioFormulario);
  }

  // Previsualización de la foto seleccionada
  if (inputImagen) {
    inputImagen.addEventListener('change', manejarCambioImagen);
  }

  // Limpieza del formulario al cerrar el modal
  if (modalElement) {
    modalElement.addEventListener('hidden.bs.modal', resetearFormulario);
  }

  // Delegación de eventos en la galería para el botón Eliminar (DELETE)
  if (galeriaAvistamientos) {
    galeriaAvistamientos.addEventListener('click', manejarClickGaleria);
  }

  // Filtro rápido de búsqueda
  if (filtroRapido) {
    filtroRapido.addEventListener('input', manejarFiltro);
  }

  // Botón para limpiar filtro
  if (btnLimpiarFiltro) {
    btnLimpiarFiltro.addEventListener('click', () => {
      filtroRapido.value = '';
      btnLimpiarFiltro.classList.add('d-none');
      renderizarGaleria(listaAvistamientos);
      filtroRapido.focus();
    });
  }
}

// =============================================================================
// Funciones de Consumo de API
// =============================================================================

/**
 * Realiza GET /api/avistamientos y renderiza la galería
 */
async function cargarAvistamientos() {
  mostrarEstadoCarga();

  try {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
      throw new Error(`Error en el servidor (${respuesta.status}) al obtener los datos.`);
    }

    const datos = await respuesta.json();

    // Guardar en caché y actualizar contador
    listaAvistamientos = Array.isArray(datos) ? datos : (datos.avistamientos || []);
    actualizarContador(listaAvistamientos.length);

    // Si hay un término de filtro activo, aplicarlo
    const terminoFiltro = filtroRapido ? filtroRapido.value.trim().toLowerCase() : '';
    if (terminoFiltro) {
      aplicarFiltro(terminoFiltro);
    } else {
      renderizarGaleria(listaAvistamientos);
    }
  } catch (error) {
    console.error('Error al cargar avistamientos:', error);
    mostrarAlertaToast(error.message || 'No fue posible cargar los avistamientos.', 'danger');
    renderizarErrorCarga();
  }
}

/**
 * Intercepta el submit, construye FormData y envía POST /api/avistamientos
 * @param {Event} e
 */
async function manejarEnvioFormulario(e) {
  e.preventDefault();

  // Validación de campos con estilos de Bootstrap
  if (!formAvistamiento.checkValidity()) {
    e.stopPropagation();
    formAvistamiento.classList.add('was-validated');
    return;
  }

  const formData = new FormData(formAvistamiento);

  // Activación de estado de carga en el botón submit
  cambiarEstadoBotonSubmit(true);

  try {
    const respuesta = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (respuesta.status === 201 || respuesta.ok) {
      // Éxito: Cerrar modal, reiniciar formulario y notificar
      if (modalInstancia) {
        modalInstancia.hide();
      }

      resetearFormulario();
      mostrarAlertaToast('¡Avistamiento registrado exitosamente!', 'success');

      // Refrescar galería
      await cargarAvistamientos();
    } else {
      const mensajeError = resultado.error || 'Ocurrió un error al guardar el avistamiento.';
      mostrarAlertaToast(mensajeError, 'danger');
    }
  } catch (error) {
    console.error('Error al registrar avistamiento:', error);
    mostrarAlertaToast('Error de conexión con el servidor. Inténtalo nuevamente.', 'danger');
  } finally {
    cambiarEstadoBotonSubmit(false);
  }
}

/**
 * Maneja la acción de eliminar un registro mediante DELETE /api/avistamientos/:id
 * @param {string|number} id
 * @param {string} titulo
 */
async function eliminarRegistro(id, titulo) {
  const nombreAvistamiento = titulo ? `"${titulo}"` : 'este avistamiento';
  const confirmacion = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente ${nombreAvistamiento}? Esta acción no se puede deshacer.`);

  if (!confirmacion) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (respuesta.ok) {
      mostrarAlertaToast('Avistamiento eliminado correctamente.', 'success');
      await cargarAvistamientos();
    } else {
      const mensajeError = resultado.error || 'No fue posible eliminar el registro.';
      mostrarAlertaToast(mensajeError, 'danger');
    }
  } catch (error) {
    console.error('Error al eliminar avistamiento:', error);
    mostrarAlertaToast('Error al conectar con el servidor para eliminar el registro.', 'danger');
  }
}

// =============================================================================
// Renderizado y Manipulación del DOM
// =============================================================================

/**
 * Renderiza el listado de avistamientos o el estado vacío en el contenedor
 * @param {Array} avistamientos
 */
function renderizarGaleria(avistamientos) {
  if (!galeriaAvistamientos) return;

  galeriaAvistamientos.innerHTML = '';

  if (!avistamientos || avistamientos.length === 0) {
    const esFiltro = filtroRapido && filtroRapido.value.trim().length > 0;
    renderizarEstadoVacio(esFiltro);
    return;
  }

  const fragmento = document.createDocumentFragment();

  avistamientos.forEach((item) => {
    const columna = document.createElement('div');
    columna.className = 'col';

    const fechaFormateada = formatearFecha(item.fecha);
    const observador = item.observador_nombre && item.observador_nombre.trim()
      ? item.observador_nombre.trim()
      : 'Anónimo';

    columna.innerHTML = `
      <article class="card h-100 bird-card border-0 shadow-sm" aria-labelledby="card-title-${item.id}">
        <div class="card-img-wrapper position-relative overflow-hidden">
          <img src="${escapeHtml(item.imagen_url)}" 
               class="card-img-top" 
               alt="Fotografía de ${escapeHtml(item.especie)}: ${escapeHtml(item.titulo)}"
               loading="lazy"
               onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=600&q=80';">
          <span class="badge-especie position-absolute top-0 start-0 m-3 px-3 py-1 rounded-pill shadow-sm" title="${escapeHtml(item.especie)}">
            <i class="bi bi-feather me-1" aria-hidden="true"></i>${escapeHtml(item.especie)}
          </span>
        </div>

        <div class="card-body d-flex flex-column p-4">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
            <span class="badge-fecha small d-inline-flex align-items-center gap-1" title="Fecha del avistamiento">
              <i class="bi bi-calendar3" aria-hidden="true"></i>
              <time datetime="${escapeHtml(item.fecha)}">${escapeHtml(fechaFormateada)}</time>
            </span>
            <span class="small text-muted d-inline-flex align-items-center gap-1" title="Registrado por">
              <i class="bi bi-person-circle text-secondary" aria-hidden="true"></i>
              <span class="text-truncate" style="max-width: 130px;">${escapeHtml(observador)}</span>
            </span>
          </div>

          <h3 id="card-title-${item.id}" class="card-title h5 fw-bold text-dark mb-2 text-truncate" title="${escapeHtml(item.titulo)}">
            ${escapeHtml(item.titulo)}
          </h3>

          <p class="card-text text-muted small mb-2 d-flex align-items-center gap-1">
            <i class="bi bi-geo-alt-fill text-danger flex-shrink-0" aria-hidden="true"></i>
            <span class="text-truncate" title="${escapeHtml(item.ubicacion)}">${escapeHtml(item.ubicacion)}</span>
          </p>

          ${
            item.descripcion
              ? `<p class="card-text text-secondary small flex-grow-1 card-descripcion mt-2 mb-3" title="${escapeHtml(item.descripcion)}">
                  ${escapeHtml(item.descripcion)}
                 </p>`
              : `<p class="card-text text-muted small fst-italic flex-grow-1 mt-2 mb-3">Sin notas adicionales de campo.</p>`
          }

          <div class="pt-3 mt-auto border-top d-flex justify-content-between align-items-center">
            <small class="text-muted fw-semibold">ID: #${item.id}</small>
            <button type="button" 
                    class="btn btn-outline-danger btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 btn-eliminar"
                    data-id="${item.id}"
                    data-titulo="${escapeHtml(item.titulo)}"
                    aria-label="Eliminar avistamiento: ${escapeHtml(item.titulo)}">
              <i class="bi bi-trash3-fill" aria-hidden="true"></i>
              <span class="small fw-semibold">Eliminar</span>
            </button>
          </div>
        </div>
      </article>
    `;

    fragmento.appendChild(columna);
  });

  galeriaAvistamientos.appendChild(fragmento);
}

/**
 * Renderiza el mensaje de estado vacío elegante
 * @param {boolean} esResultadoFiltro
 */
function renderizarEstadoVacio(esResultadoFiltro = false) {
  if (!galeriaAvistamientos) return;

  if (esResultadoFiltro) {
    const termino = filtroRapido ? escapeHtml(filtroRapido.value.trim()) : '';
    galeriaAvistamientos.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="empty-state-card mx-auto" style="max-width: 580px;">
          <div class="empty-state-icon">
            <i class="bi bi-search fs-2" aria-hidden="true"></i>
          </div>
          <h3 class="h5 fw-bold text-dark mb-2">No se encontraron avistamientos</h3>
          <p class="text-muted mb-4 small">
            No encontramos coincidencias para <strong>"${termino}"</strong>. Intenta buscar por otro nombre de especie, título o localidad.
          </p>
          <button type="button" class="btn btn-outline-success btn-sm rounded-pill px-4 py-2" id="btnResetBusqueda">
            <i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i> Restablecer búsqueda
          </button>
        </div>
      </div>
    `;

    const btnReset = document.getElementById('btnResetBusqueda');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (filtroRapido) filtroRapido.value = '';
        if (btnLimpiarFiltro) btnLimpiarFiltro.classList.add('d-none');
        renderizarGaleria(listaAvistamientos);
      });
    }
  } else {
    galeriaAvistamientos.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="empty-state-card mx-auto" style="max-width: 620px;">
          <div class="empty-state-icon">
            <i class="bi bi-binoculars fs-1" aria-hidden="true"></i>
          </div>
          <h3 class="h4 fw-bold text-dark mb-2">Aún no hay avistamientos registrados</h3>
          <p class="text-muted mb-4">
            Sé la primera persona en compartir una observación ornitológica en nuestra comunidad. 
            ¡Cada registro aporta información fundamental para el monitoreo y protección de nuestras aves!
          </p>
          <button type="button" class="btn btn-success fw-semibold rounded-pill px-4 py-2 shadow-sm" data-bs-toggle="modal" data-bs-target="#modalAvistamiento">
            <i class="bi bi-plus-circle me-1" aria-hidden="true"></i> Registrar Primer Avistamiento
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Renderiza un placeholder con spinner mientras se obtienen los datos
 */
function mostrarEstadoCarga() {
  if (!galeriaAvistamientos) return;
  galeriaAvistamientos.innerHTML = `
    <div class="col-12 py-5 text-center">
      <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Cargando registros...</span>
      </div>
      <p class="text-muted small mt-3">Consultando avistamientos en el servidor...</p>
    </div>
  `;
}

/**
 * Renderiza mensaje cuando ocurre un error de red o servidor
 */
function renderizarErrorCarga() {
  if (!galeriaAvistamientos) return;
  galeriaAvistamientos.innerHTML = `
    <div class="col-12 py-5 text-center">
      <div class="empty-state-card mx-auto border-danger-subtle" style="max-width: 580px;">
        <div class="empty-state-icon text-danger" style="background-color: #fde8e8;">
          <i class="bi bi-exclamation-triangle-fill fs-2" aria-hidden="true"></i>
        </div>
        <h3 class="h5 fw-bold text-dark mb-2">Error de comunicación</h3>
        <p class="text-muted small mb-4">No se pudo cargar la galería de avistamientos desde el servidor local.</p>
        <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-4 py-2" onclick="cargarAvistamientos()">
          <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i> Reintentar conexión
        </button>
      </div>
    </div>
  `;
}

// =============================================================================
// Manejadores Auxiliares e Interacciones
// =============================================================================

/**
 * Delegación de clicks en la galería para eliminar registros
 * @param {MouseEvent} e
 */
function manejarClickGaleria(e) {
  const btnEliminar = e.target.closest('.btn-eliminar');
  if (!btnEliminar) return;

  const id = btnEliminar.getAttribute('data-id');
  const titulo = btnEliminar.getAttribute('data-titulo') || '';

  if (id) {
    eliminarRegistro(id, titulo);
  }
}

/**
 * Maneja el filtro en tiempo real en la galería
 */
function manejarFiltro() {
  const termino = filtroRapido.value.trim().toLowerCase();

  if (btnLimpiarFiltro) {
    if (termino.length > 0) {
      btnLimpiarFiltro.classList.remove('d-none');
    } else {
      btnLimpiarFiltro.classList.add('d-none');
    }
  }

  aplicarFiltro(termino);
}

/**
 * Filtra la lista en memoria según especie, título, ubicación u observador
 * @param {string} termino
 */
function aplicarFiltro(termino) {
  if (!termino) {
    renderizarGaleria(listaAvistamientos);
    return;
  }

  const filtrados = listaAvistamientos.filter((item) => {
    const especie = (item.especie || '').toLowerCase();
    const titulo = (item.titulo || '').toLowerCase();
    const ubicacion = (item.ubicacion || '').toLowerCase();
    const observador = (item.observador_nombre || '').toLowerCase();

    return (
      especie.includes(termino) ||
      titulo.includes(termino) ||
      ubicacion.includes(termino) ||
      observador.includes(termino)
    );
  });

  renderizarGaleria(filtrados);
}

/**
 * Genera previsualización cuando el usuario elige un archivo de imagen
 * @param {Event} e
 */
function manejarCambioImagen(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    limpiarPreviewImagen();
    return;
  }

  // Validación básica del tipo de archivo
  const tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (!tiposValidos.includes(file.type)) {
    mostrarAlertaToast('Formato no válido. Solo se admiten fotos JPEG, PNG o WEBP.', 'warning');
    inputImagen.value = '';
    limpiarPreviewImagen();
    return;
  }

  // Mostrar vista previa con FileReader
  const lector = new FileReader();
  lector.onload = (evento) => {
    if (previewImage && previewContainer) {
      previewImage.src = evento.target.result;
      previewContainer.classList.remove('d-none');
    }
  };
  lector.readAsDataURL(file);
}

/**
 * Oculta y limpia el contenedor de vista previa
 */
function limpiarPreviewImagen() {
  if (previewContainer && previewImage) {
    previewContainer.classList.add('d-none');
    previewImage.src = '';
  }
}

/**
 * Restablece el formulario a su estado original
 */
function resetearFormulario() {
  if (!formAvistamiento) return;
  formAvistamiento.reset();
  formAvistamiento.classList.remove('was-validated');
  limpiarPreviewImagen();
}

/**
 * Modifica el aspecto del botón de guardado mientras se procesa la solicitud
 * @param {boolean} cargando
 */
function cambiarEstadoBotonSubmit(cargando) {
  if (!btnSubmitForm) return;

  btnSubmitForm.disabled = cargando;

  if (cargando) {
    spinnerSubmit.classList.remove('d-none');
    iconoSubmit.classList.add('d-none');
    textoSubmit.textContent = 'Guardando...';
  } else {
    spinnerSubmit.classList.add('d-none');
    iconoSubmit.classList.remove('d-none');
    textoSubmit.textContent = 'Guardar Avistamiento';
  }
}

/**
 * Actualiza el indicador numérico de avistamientos registrados
 * @param {number} cantidad
 */
function actualizarContador(cantidad) {
  if (contadorAvistamientos) {
    contadorAvistamientos.textContent = cantidad;
  }
}

/**
 * Despliega un Toast flotante accesible con mensaje y color dinámico
 * @param {string} mensaje
 * @param {'success'|'danger'|'warning'|'info'} tipo
 */
function mostrarAlertaToast(mensaje, tipo = 'success') {
  if (!toastElement || !toastMensaje || !toastInstancia) return;

  // Clases de color para el toast
  toastElement.className = `toast align-items-center border-0 text-white shadow-lg bg-${tipo}`;

  // Icono según tipo
  let iconoHtml = '<i class="bi bi-check-circle-fill fs-5" aria-hidden="true"></i>';
  if (tipo === 'danger') {
    iconoHtml = '<i class="bi bi-x-circle-fill fs-5" aria-hidden="true"></i>';
  } else if (tipo === 'warning') {
    iconoHtml = '<i class="bi bi-exclamation-triangle-fill fs-5" aria-hidden="true"></i>';
  }

  toastMensaje.innerHTML = `
    ${iconoHtml}
    <span>${escapeHtml(mensaje)}</span>
  `;

  toastInstancia.show();
}

/**
 * Formatea cadenas de fecha tipo YYYY-MM-DD a formato amigable en español
 * @param {string} fechaStr
 * @returns {string}
 */
function formatearFecha(fechaStr) {
  if (!fechaStr) return 'Fecha desconocida';

  // Descomponer para evitar desfase de zona horaria UTC
  const partes = String(fechaStr).split('-');
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    const fechaObj = new Date(Number(anio), Number(mes) - 1, Number(dia));
    if (!isNaN(fechaObj.getTime())) {
      return fechaObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  const fechaObj = new Date(fechaStr);
  if (!isNaN(fechaObj.getTime())) {
    return fechaObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  return fechaStr;
}

/**
 * Escapa caracteres HTML especiales para mitigar vulnerabilidades XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
