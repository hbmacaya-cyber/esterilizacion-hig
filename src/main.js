import './style.css'
import { vistaStock } from './views/stock.js'
import { vistaMovimiento } from './views/movimiento.js'
import { vistaHistorial } from './views/historial.js'
import { vistaCajas } from './views/cajas.js'
import { vistaConfiguracion } from './views/configuracion.js'

const PANTALLAS = [
  { id: 'stock', nombre: 'Stock', render: vistaStock },
  { id: 'movimiento', nombre: 'Nuevo movimiento', render: vistaMovimiento },
  { id: 'historial', nombre: 'Historial', render: vistaHistorial },
  { id: 'cajas', nombre: 'Cajas', render: vistaCajas },
  { id: 'configuracion', nombre: 'Configuración', render: vistaConfiguracion },
]

const app = document.querySelector('#app')
app.innerHTML = `
  <header class="top">
    <h1>Central de Esterilización</h1>
    <p>Hospital Itaembé Guazú · Stock y movimientos de material</p>
  </header>
  <nav class="tabs">
    ${PANTALLAS.map(p => `<button data-tab="${p.id}">${p.nombre}</button>`).join('')}
  </nav>
  <main id="contenido"></main>
`

const contenido = app.querySelector('#contenido')
const botones = app.querySelectorAll('nav.tabs button')

function ir(id) {
  const pantalla = PANTALLAS.find(p => p.id === id) || PANTALLAS[0]
  botones.forEach(b => b.classList.toggle('activo', b.dataset.tab === pantalla.id))
  contenido.innerHTML = ''
  pantalla.render(contenido)
  location.hash = pantalla.id
}

botones.forEach(b => b.addEventListener('click', () => ir(b.dataset.tab)))

// Abrir la pantalla indicada en la URL (#stock, #cajas, …) o Stock por defecto.
ir(location.hash.replace('#', '') || 'stock')
