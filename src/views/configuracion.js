import { supabase } from '../supabase.js'
import { mostrarAviso, esc } from '../util.js'

// Definición de los catálogos editables. Todos tienen columnas id, nombre, activo.
const CATALOGOS = [
  { tabla: 'sectores', titulo: 'Sectores del hospital', ph: 'Nuevo sector (ej: Traumatología)' },
  { tabla: 'lugares_esterilizacion', titulo: 'Lugares de esterilización', ph: 'Nuevo lugar de esterilización' },
  { tabla: 'lugares_almacenamiento', titulo: 'Lugares de almacenamiento', ph: 'Nuevo lugar de almacenamiento' },
]

export async function vistaConfiguracion(cont) {
  cont.innerHTML = `
    <h2 class="vista-titulo">Configuración</h2>
    <p class="vista-sub">Listas que alimentan los desplegables del sistema. Podés agregar, activar o desactivar elementos.</p>
    <div id="avisos"></div>
    <div id="catalogos"></div>
  `
  const avisos = cont.querySelector('#avisos')
  const contenedor = cont.querySelector('#catalogos')

  for (const cat of CATALOGOS) {
    const bloque = document.createElement('div')
    bloque.className = 'panel'
    bloque.style.marginBottom = '1.2rem'
    bloque.innerHTML = `
      <h3 style="margin-top:0">${esc(cat.titulo)}</h3>
      <div class="fila">
        <input type="text" placeholder="${esc(cat.ph)}" style="flex:1" />
        <button class="btn agregar">Agregar</button>
      </div>
      <div class="lista espacio"></div>
    `
    contenedor.appendChild(bloque)

    const input = bloque.querySelector('input')
    const lista = bloque.querySelector('.lista')

    async function cargar() {
      const { data, error } = await supabase.from(cat.tabla).select('*').order('nombre')
      if (error) { lista.innerHTML = `<p class="aviso error">${esc(error.message)}</p>`; return }
      if (!data.length) { lista.innerHTML = `<p class="meta">Vacío.</p>`; return }
      lista.innerHTML = `
        <table>
          <tbody>
            ${data.map(r => `
              <tr>
                <td>${esc(r.nombre)}</td>
                <td>${r.activo ? 'Activo' : 'Inactivo'}</td>
                <td style="text-align:right">
                  <button class="btn secundario chico toggle" data-id="${r.id}" data-activo="${r.activo}">
                    ${r.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      lista.querySelectorAll('.toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
          const { error } = await supabase.from(cat.tabla)
            .update({ activo: btn.dataset.activo !== 'true' })
            .eq('id', Number(btn.dataset.id))
          if (error) mostrarAviso(avisos, error.message, 'error')
          else cargar()
        })
      })
    }

    bloque.querySelector('.agregar').addEventListener('click', async () => {
      const nombre = input.value.trim()
      if (!nombre) { mostrarAviso(avisos, 'Escribí un nombre.', 'error'); return }
      const { error } = await supabase.from(cat.tabla).insert({ nombre })
      if (error) {
        mostrarAviso(avisos, error.message.includes('duplicate') ? 'Ese elemento ya existe.' : error.message, 'error')
      } else {
        input.value = ''
        mostrarAviso(avisos, 'Agregado.', 'ok')
        cargar()
      }
    })

    cargar()
  }
}
