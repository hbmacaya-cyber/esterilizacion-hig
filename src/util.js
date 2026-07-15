// Funciones auxiliares compartidas por todas las pantallas.

// Traduce el estado de una caja a la clase CSS de su etiqueta de color.
export function claseEstado(estado) {
  switch (estado) {
    case 'Disponible': return 'disponible'
    case 'En uso': return 'en-uso'
    case 'Pendiente esterilización': return 'pendiente'
    case 'En esterilización': return 'esterilizacion'
    case 'Dada de baja': return 'baja'
    default: return 'baja'
  }
}

// Nombres legibles de los tipos de movimiento.
export const NOMBRE_TIPO = {
  egreso: 'Egreso a sector',
  retorno: 'Retorno del sector',
  envio_esterilizacion: 'Envío a esterilizar',
  recepcion_esterilizado: 'Recepción esterilizado',
  baja: 'Baja definitiva',
}

// Formatea una fecha ISO a algo legible en español.
export function fecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Muestra un aviso (éxito o error) durante unos segundos dentro de un contenedor.
export function mostrarAviso(contenedor, texto, tipo = 'ok') {
  const div = document.createElement('div')
  div.className = 'aviso ' + tipo
  div.textContent = texto
  contenedor.prepend(div)
  setTimeout(() => div.remove(), 4000)
}

// Recuerda el nombre del operador entre sesiones (se usa en los movimientos).
export function getUsuario() {
  return localStorage.getItem('usuario') || ''
}
export function setUsuario(nombre) {
  localStorage.setItem('usuario', nombre || '')
}

// Escapa texto para insertarlo con seguridad dentro de HTML.
export function esc(txt) {
  const d = document.createElement('div')
  d.textContent = txt == null ? '' : String(txt)
  return d.innerHTML
}
