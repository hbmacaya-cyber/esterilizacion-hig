import { supabase } from '../supabase.js'
import { claseEstado, fecha, esc } from '../util.js'

export async function vistaStock(cont) {
  cont.innerHTML = `
    <h2 class="vista-titulo">Stock de cajas</h2>
    <p class="vista-sub">Estado actual de cada caja según su último movimiento.</p>
    <div class="filtros">
      <div>
        <input id="buscar" type="text" placeholder="Buscar por nombre…" />
      </div>
      <div>
        <select id="filtro-estado">
          <option value="">Todos los estados</option>
          <option>Disponible</option>
          <option>En uso</option>
          <option>Pendiente esterilización</option>
          <option>En esterilización</option>
          <option>Dada de baja</option>
        </select>
      </div>
    </div>
    <div id="lista"><p class="cargando">Cargando…</p></div>
  `

  const lista = cont.querySelector('#lista')
  const { data, error } = await supabase
    .from('vista_estado_cajas')
    .select('*')
    .order('nombre')

  if (error) {
    lista.innerHTML = `<p class="aviso error">Error al cargar: ${esc(error.message)}</p>`
    return
  }

  const buscar = cont.querySelector('#buscar')
  const filtroEstado = cont.querySelector('#filtro-estado')

  function render() {
    const txt = buscar.value.toLowerCase().trim()
    const est = filtroEstado.value
    const filtradas = data.filter(c =>
      (!txt || c.nombre.toLowerCase().includes(txt)) &&
      (!est || c.estado === est)
    )

    if (filtradas.length === 0) {
      lista.innerHTML = `<p class="vacio">No hay cajas que coincidan.</p>`
      return
    }

    lista.innerHTML = `<div class="grid">` + filtradas.map(c => {
      let ubic = ''
      if (c.estado === 'En uso' && c.sector) ubic = `En: ${esc(c.sector)}`
      else if (c.estado === 'En esterilización' && c.lugar_esterilizacion) ubic = `En: ${esc(c.lugar_esterilizacion)}`
      else if (c.estado === 'Disponible' && c.lugar_almacenamiento) ubic = `En: ${esc(c.lugar_almacenamiento)}`
      const prep = c.prep_fecha
        ? `<p class="meta">Últ. preparación: ${fecha(c.prep_fecha)} · ${esc(c.prep_proceso || 'proceso s/d')}${c.prep_operario ? ' · ' + esc(c.prep_operario) : ''}</p>`
        : ''
      return `
        <div class="card">
          <div class="fila entre">
            <h3>${esc(c.nombre)}</h3>
            <span class="badge ${claseEstado(c.estado)}">${esc(c.estado)}</span>
          </div>
          ${ubic ? `<p class="meta">${ubic}</p>` : ''}
          <p class="meta">Último mov.: ${fecha(c.ultima_fecha)}</p>
          ${prep}
        </div>
      `
    }).join('') + `</div>`
  }

  buscar.addEventListener('input', render)
  filtroEstado.addEventListener('change', render)
  render()
}
