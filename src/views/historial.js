import { supabase } from '../supabase.js'
import { NOMBRE_TIPO, fecha, esc } from '../util.js'

export async function vistaHistorial(cont) {
  cont.innerHTML = `
    <h2 class="vista-titulo">Historial de movimientos</h2>
    <p class="vista-sub">Todos los movimientos registrados, del más reciente al más antiguo.</p>
    <div class="filtros">
      <div>
        <select id="filtro-caja"><option value="">Todas las cajas</option></select>
      </div>
      <div>
        <select id="filtro-tipo">
          <option value="">Todos los tipos</option>
          <option value="egreso">Egreso a sector</option>
          <option value="retorno">Retorno del sector</option>
          <option value="envio_esterilizacion">Envío a esterilizar</option>
          <option value="recepcion_esterilizado">Recepción esterilizado</option>
          <option value="baja">Baja definitiva</option>
        </select>
      </div>
    </div>
    <div id="tabla"><p class="cargando">Cargando…</p></div>
  `

  const tabla = cont.querySelector('#tabla')
  const filtroCaja = cont.querySelector('#filtro-caja')
  const filtroTipo = cont.querySelector('#filtro-tipo')

  const cajasRes = await supabase.from('cajas').select('id, nombre').order('nombre')
  if (cajasRes.data) {
    filtroCaja.innerHTML = `<option value="">Todas las cajas</option>` +
      cajasRes.data.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')
  }

  async function cargar() {
    tabla.innerHTML = `<p class="cargando">Cargando…</p>`
    let q = supabase
      .from('movimientos')
      .select(`
        id, tipo, fecha_hora, usuario, observaciones,
        cajas ( nombre ),
        sectores ( nombre ),
        lugares_esterilizacion ( nombre ),
        lugares_almacenamiento ( nombre ),
        metodos_esterilizacion ( nombre )
      `)
      .order('fecha_hora', { ascending: false })
      .limit(500)

    if (filtroCaja.value) q = q.eq('caja_id', Number(filtroCaja.value))
    if (filtroTipo.value) q = q.eq('tipo', filtroTipo.value)

    const { data, error } = await q
    if (error) {
      tabla.innerHTML = `<p class="aviso error">Error: ${esc(error.message)}</p>`
      return
    }
    if (!data.length) {
      tabla.innerHTML = `<p class="vacio">No hay movimientos registrados.</p>`
      return
    }

    tabla.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th><th>Caja</th><th>Movimiento</th>
            <th>Destino / Lugar</th><th>Operador</th><th>Obs.</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(m => {
            let destino = '—'
            if (m.tipo === 'egreso') destino = m.sectores?.nombre || '—'
            else if (m.tipo === 'envio_esterilizacion') {
              destino = m.lugares_esterilizacion?.nombre || '—'
              if (m.metodos_esterilizacion?.nombre) destino += ' · ' + m.metodos_esterilizacion.nombre
            }
            else if (m.tipo === 'recepcion_esterilizado') destino = m.lugares_almacenamiento?.nombre || '—'
            return `
              <tr>
                <td>${fecha(m.fecha_hora)}</td>
                <td>${esc(m.cajas?.nombre || '—')}</td>
                <td>${esc(NOMBRE_TIPO[m.tipo] || m.tipo)}</td>
                <td>${esc(destino)}</td>
                <td>${esc(m.usuario || '—')}</td>
                <td>${esc(m.observaciones || '')}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `
  }

  filtroCaja.addEventListener('change', cargar)
  filtroTipo.addEventListener('change', cargar)
  cargar()
}
