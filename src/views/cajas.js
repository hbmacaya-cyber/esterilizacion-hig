import { supabase, BUCKET_FOTOS } from '../supabase.js'
import { mostrarAviso, esc } from '../util.js'

let metodos = []

export async function vistaCajas(cont) {
  cont.innerHTML = `
    <div class="fila entre">
      <div>
        <h2 class="vista-titulo">Cajas</h2>
        <p class="vista-sub">Catálogo de cajas, sus componentes, método de esterilización y fotos.</p>
      </div>
      <button id="nueva" class="btn">+ Nueva caja</button>
    </div>
    <div id="avisos"></div>
    <div id="lista"><p class="cargando">Cargando…</p></div>
  `

  const avisos = cont.querySelector('#avisos')
  const lista = cont.querySelector('#lista')

  const metRes = await supabase.from('metodos_esterilizacion').select('*').order('nombre')
  metodos = metRes.data || []

  async function cargar() {
    const { data, error } = await supabase
      .from('cajas')
      .select('*, metodos_esterilizacion(nombre), caja_items(id), caja_fotos(id)')
      .order('nombre')
    if (error) { lista.innerHTML = `<p class="aviso error">${esc(error.message)}</p>`; return }
    if (!data.length) { lista.innerHTML = `<p class="vacio">No hay cajas.</p>`; return }

    lista.innerHTML = `<div class="grid">` + data.map(c => `
      <div class="card">
        <h3>${esc(c.nombre)}${c.activa ? '' : ' (baja)'}</h3>
        <p class="meta">Método: ${esc(c.metodos_esterilizacion?.nombre || 'sin asignar')}</p>
        <p class="meta">${c.caja_items.length} componente(s) · ${c.caja_fotos.length} foto(s)</p>
        <div class="espacio">
          <button class="btn secundario chico" data-editar="${c.id}">Ver / Editar</button>
        </div>
      </div>
    `).join('') + `</div>`

    lista.querySelectorAll('[data-editar]').forEach(btn => {
      btn.addEventListener('click', () => abrirDetalle(Number(btn.dataset.editar), cargar, avisos))
    })
  }

  cont.querySelector('#nueva').addEventListener('click', () => abrirNueva(cargar, avisos))
  cargar()
}

// ---------- Crear nueva caja ----------
function abrirNueva(recargar, avisos) {
  const fondo = crearModal(`
    <h2>Nueva caja</h2>
    <label>Nombre</label>
    <input id="m-nombre" type="text" placeholder="Ej: Caja Cirugía N° 2" />
    <label>Descripción (opcional)</label>
    <input id="m-desc" type="text" />
    <label>Método de esterilización (se puede asignar después)</label>
    <select id="m-metodo">
      <option value="">Sin asignar</option>
      ${metodos.map(m => `<option value="${m.id}">${esc(m.nombre)}</option>`).join('')}
    </select>
    <div class="espacio fila">
      <button id="m-guardar" class="btn">Crear caja</button>
      <button id="m-cancelar" class="btn secundario">Cancelar</button>
    </div>
  `)

  fondo.querySelector('#m-cancelar').addEventListener('click', () => fondo.remove())
  fondo.querySelector('#m-guardar').addEventListener('click', async () => {
    const nombre = fondo.querySelector('#m-nombre').value.trim()
    if (!nombre) { alert('Escribí un nombre.'); return }
    const metodo = fondo.querySelector('#m-metodo').value
    const { error } = await supabase.from('cajas').insert({
      nombre,
      descripcion: fondo.querySelector('#m-desc').value.trim() || null,
      metodo_esterilizacion_id: metodo ? Number(metodo) : null,
    })
    if (error) {
      alert(error.message.includes('duplicate') ? 'Ya existe una caja con ese nombre.' : error.message)
    } else {
      fondo.remove()
      mostrarAviso(avisos, 'Caja creada.', 'ok')
      recargar()
    }
  })
}

// ---------- Ver / editar una caja ----------
async function abrirDetalle(cajaId, recargar, avisos) {
  const { data: caja, error } = await supabase.from('cajas').select('*').eq('id', cajaId).single()
  if (error) { mostrarAviso(avisos, error.message, 'error'); return }

  const fondo = crearModal(`<p class="cargando">Cargando…</p>`)
  await pintarDetalle(fondo, caja, recargar, avisos)
}

async function pintarDetalle(fondo, caja, recargar, avisos) {
  const [itemsRes, fotosRes] = await Promise.all([
    supabase.from('caja_items').select('*').eq('caja_id', caja.id).order('id'),
    supabase.from('caja_fotos').select('*').eq('caja_id', caja.id).order('orden'),
  ])
  const items = itemsRes.data || []
  const fotos = fotosRes.data || []

  fondo.querySelector('.modal').innerHTML = `
    <button class="modal-cerrar" id="cerrar">&times;</button>
    <h2>${esc(caja.nombre)}</h2>

    <label>Método de esterilización</label>
    <select id="d-metodo">
      <option value="">Sin asignar</option>
      ${metodos.map(m => `<option value="${m.id}" ${m.id === caja.metodo_esterilizacion_id ? 'selected' : ''}>${esc(m.nombre)}</option>`).join('')}
    </select>
    <div class="espacio">
      <button id="d-guardar-metodo" class="btn chico">Guardar método</button>
    </div>

    <h3 class="espacio">Componentes (${items.length})</h3>
    <table>
      <tbody id="d-items">
        ${items.map(it => `
          <tr>
            <td style="width:60px">${it.cantidad}×</td>
            <td>${esc(it.item_nombre)}</td>
            <td style="text-align:right"><button class="btn peligro chico" data-del-item="${it.id}">Quitar</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="fila espacio">
      <input id="d-item-cant" type="number" min="1" value="1" style="width:70px" />
      <input id="d-item-nombre" type="text" placeholder="Nombre del componente" style="flex:1" />
      <button id="d-add-item" class="btn secundario chico">Agregar</button>
    </div>

    <h3 class="espacio">Fotos (${fotos.length})</h3>
    <div class="fotos-mini" id="d-fotos">
      ${fotos.map(f => `
        <div style="text-align:center">
          <img src="${esc(f.foto_url)}" alt="${esc(f.descripcion || '')}" />
          <br><button class="btn peligro chico" data-del-foto="${f.id}" data-url="${esc(f.foto_url)}">Borrar</button>
        </div>
      `).join('') || '<p class="meta">Sin fotos aún.</p>'}
    </div>
    <div class="fila espacio">
      <input id="d-foto-desc" type="text" placeholder="Descripción (ej: General)" style="flex:1" />
      <input id="d-foto-file" type="file" accept="image/*" style="flex:1" />
    </div>
    <div class="espacio"><button id="d-subir-foto" class="btn secundario chico">Subir foto</button></div>

    <div class="espacio fila entre">
      <button id="d-baja" class="btn ${caja.activa ? 'peligro' : 'secundario'} chico">
        ${caja.activa ? 'Dar de baja esta caja' : 'Reactivar esta caja'}
      </button>
      <button id="cerrar2" class="btn secundario">Cerrar</button>
    </div>
  `

  const recargarDetalle = async () => {
    const { data } = await supabase.from('cajas').select('*').eq('id', caja.id).single()
    await pintarDetalle(fondo, data, recargar, avisos)
  }

  fondo.querySelector('#cerrar').addEventListener('click', () => { fondo.remove(); recargar() })
  fondo.querySelector('#cerrar2').addEventListener('click', () => { fondo.remove(); recargar() })

  // Guardar método
  fondo.querySelector('#d-guardar-metodo').addEventListener('click', async () => {
    const v = fondo.querySelector('#d-metodo').value
    const { error } = await supabase.from('cajas')
      .update({ metodo_esterilizacion_id: v ? Number(v) : null }).eq('id', caja.id)
    if (error) alert(error.message)
    else mostrarAviso(avisos, 'Método actualizado.', 'ok')
  })

  // Agregar componente
  fondo.querySelector('#d-add-item').addEventListener('click', async () => {
    const nombre = fondo.querySelector('#d-item-nombre').value.trim()
    const cant = Number(fondo.querySelector('#d-item-cant').value) || 1
    if (!nombre) { alert('Escribí el nombre del componente.'); return }
    const { error } = await supabase.from('caja_items')
      .insert({ caja_id: caja.id, item_nombre: nombre, cantidad: cant })
    if (error) alert(error.message)
    else recargarDetalle()
  })

  // Quitar componente
  fondo.querySelectorAll('[data-del-item]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { error } = await supabase.from('caja_items').delete().eq('id', Number(btn.dataset.delItem))
      if (error) alert(error.message)
      else recargarDetalle()
    })
  })

  // Subir foto
  fondo.querySelector('#d-subir-foto').addEventListener('click', async () => {
    const fileInput = fondo.querySelector('#d-foto-file')
    const file = fileInput.files[0]
    if (!file) { alert('Elegí un archivo de imagen.'); return }
    const desc = fondo.querySelector('#d-foto-desc').value.trim()
    const btn = fondo.querySelector('#d-subir-foto')
    btn.disabled = true
    btn.textContent = 'Subiendo…'

    const nombreArchivo = `${caja.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const up = await supabase.storage.from(BUCKET_FOTOS).upload(nombreArchivo, file)
    if (up.error) { alert('Error al subir: ' + up.error.message); btn.disabled = false; btn.textContent = 'Subir foto'; return }

    const { data: pub } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(nombreArchivo)
    const { error } = await supabase.from('caja_fotos').insert({
      caja_id: caja.id, foto_url: pub.publicUrl, descripcion: desc || null,
    })
    if (error) alert(error.message)
    else recargarDetalle()
  })

  // Borrar foto
  fondo.querySelectorAll('[data-del-foto]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.delFoto)
      // Extraer la ruta del archivo dentro del bucket a partir de la URL pública.
      const url = btn.dataset.url
      const marca = `/${BUCKET_FOTOS}/`
      const ruta = url.includes(marca) ? url.split(marca)[1] : null
      if (ruta) await supabase.storage.from(BUCKET_FOTOS).remove([ruta])
      const { error } = await supabase.from('caja_fotos').delete().eq('id', id)
      if (error) alert(error.message)
      else recargarDetalle()
    })
  })

  // Baja / reactivación
  fondo.querySelector('#d-baja').addEventListener('click', async () => {
    const nueva = !caja.activa
    if (nueva === false && !confirm('¿Dar de baja esta caja? Dejará de aparecer para nuevos movimientos.')) return
    const { error } = await supabase.from('cajas').update({ activa: nueva }).eq('id', caja.id)
    if (error) alert(error.message)
    else { mostrarAviso(avisos, nueva ? 'Caja reactivada.' : 'Caja dada de baja.', 'ok'); recargarDetalle() }
  })
}

// ---------- Utilidad para crear un modal ----------
function crearModal(htmlInterno) {
  const fondo = document.createElement('div')
  fondo.className = 'modal-fondo'
  fondo.innerHTML = `<div class="modal">${htmlInterno}</div>`
  fondo.addEventListener('click', e => { if (e.target === fondo) fondo.remove() })
  document.body.appendChild(fondo)
  return fondo
}
