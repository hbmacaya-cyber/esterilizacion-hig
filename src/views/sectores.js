import { supabase } from '../supabase.js'
import { mostrarAviso, esc } from '../util.js'

export async function vistaSectores(cont) {
  cont.innerHTML = `
    <h2 class="vista-titulo">Sectores</h2>
    <p class="vista-sub">Servicios del hospital a los que se entregan las cajas.</p>
    <div id="avisos"></div>
    <div class="panel" style="margin-bottom:1.2rem">
      <div class="fila">
        <input id="nuevo" type="text" placeholder="Nombre del nuevo sector" style="flex:1" />
        <button id="agregar" class="btn">Agregar</button>
      </div>
    </div>
    <div id="lista"><p class="cargando">Cargando…</p></div>
  `

  const avisos = cont.querySelector('#avisos')
  const lista = cont.querySelector('#lista')

  async function cargar() {
    const { data, error } = await supabase.from('sectores').select('*').order('nombre')
    if (error) { lista.innerHTML = `<p class="aviso error">${esc(error.message)}</p>`; return }
    if (!data.length) { lista.innerHTML = `<p class="vacio">No hay sectores.</p>`; return }

    lista.innerHTML = `
      <table>
        <thead><tr><th>Sector</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${data.map(s => `
            <tr>
              <td>${esc(s.nombre)}</td>
              <td>${s.activo ? 'Activo' : 'Inactivo'}</td>
              <td style="text-align:right">
                <button class="btn secundario chico" data-toggle="${s.id}" data-activo="${s.activo}">
                  ${s.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    lista.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.toggle)
        const activo = btn.dataset.activo === 'true'
        const { error } = await supabase.from('sectores').update({ activo: !activo }).eq('id', id)
        if (error) mostrarAviso(avisos, error.message, 'error')
        else cargar()
      })
    })
  }

  cont.querySelector('#agregar').addEventListener('click', async () => {
    const input = cont.querySelector('#nuevo')
    const nombre = input.value.trim()
    if (!nombre) { mostrarAviso(avisos, 'Escribí un nombre.', 'error'); return }
    const { error } = await supabase.from('sectores').insert({ nombre })
    if (error) {
      mostrarAviso(avisos, error.message.includes('duplicate') ? 'Ese sector ya existe.' : error.message, 'error')
    } else {
      input.value = ''
      mostrarAviso(avisos, 'Sector agregado.', 'ok')
      cargar()
    }
  })

  cargar()
}
