import { supabase } from '../supabase.js'
import { NOMBRE_TIPO, claseEstado, getUsuario, setUsuario, mostrarAviso, esc } from '../util.js'

// Sugerencia del próximo movimiento lógico según el estado actual de la caja.
const SUGERENCIA = {
  'Disponible': 'egreso',
  'En uso': 'retorno',
  'Pendiente esterilización': 'envio_esterilizacion',
  'En esterilización': 'recepcion_esterilizado',
}

export async function vistaMovimiento(cont) {
  cont.innerHTML = `
    <h2 class="vista-titulo">Nuevo movimiento</h2>
    <p class="vista-sub">Registrá un egreso, retorno, envío/recepción de esterilización o baja.</p>
    <div id="avisos"></div>
    <div class="panel">
      <label>Caja</label>
      <select id="caja"><option value="">Cargando…</option></select>
      <p id="estado-actual" class="meta"></p>

      <label>Tipo de movimiento</label>
      <select id="tipo">
        <option value="egreso">Egreso a sector</option>
        <option value="retorno">Retorno del sector</option>
        <option value="envio_esterilizacion">Envío a esterilizar</option>
        <option value="recepcion_esterilizado">Recepción esterilizado</option>
        <option value="baja">Baja definitiva</option>
      </select>

      <div id="campo-sector" style="display:none">
        <label>Sector de destino</label>
        <select id="sector"></select>
      </div>

      <div id="campo-esterilizacion" style="display:none">
        <label>Lugar de esterilización</label>
        <select id="lugar-esterilizacion"></select>
        <label>Tipo de proceso</label>
        <select id="proceso"></select>
      </div>

      <div id="campo-almacenamiento" style="display:none">
        <label>Lugar de almacenamiento</label>
        <select id="lugar-almacenamiento"></select>
      </div>

      <label>Operador</label>
      <input id="usuario" type="text" placeholder="Tu nombre" value="${esc(getUsuario())}" />

      <label>Observaciones (opcional)</label>
      <textarea id="observaciones" placeholder="Notas del movimiento…"></textarea>

      <div class="espacio">
        <button id="guardar" class="btn">Registrar movimiento</button>
      </div>
    </div>
  `

  const avisos = cont.querySelector('#avisos')
  const selCaja = cont.querySelector('#caja')
  const estadoActual = cont.querySelector('#estado-actual')
  const selTipo = cont.querySelector('#tipo')
  const selSector = cont.querySelector('#sector')
  const selEster = cont.querySelector('#lugar-esterilizacion')
  const selProceso = cont.querySelector('#proceso')
  const selAlmac = cont.querySelector('#lugar-almacenamiento')

  // Cargar catálogos y cajas en paralelo.
  const [cajasRes, sectoresRes, esterRes, procesoRes, almacRes] = await Promise.all([
    supabase.from('vista_estado_cajas').select('*').eq('activa', true).order('nombre'),
    supabase.from('sectores').select('*').eq('activo', true).order('nombre'),
    supabase.from('lugares_esterilizacion').select('*').eq('activo', true).order('nombre'),
    supabase.from('metodos_esterilizacion').select('*').order('nombre'),
    supabase.from('lugares_almacenamiento').select('*').eq('activo', true).order('nombre'),
  ])

  if (cajasRes.error) {
    mostrarAviso(avisos, 'Error al cargar cajas: ' + cajasRes.error.message, 'error')
    return
  }

  const cajas = cajasRes.data
  selCaja.innerHTML = `<option value="">Elegí una caja…</option>` +
    cajas.map(c => `<option value="${c.id}">${esc(c.nombre)} — ${esc(c.estado)}</option>`).join('')

  selSector.innerHTML = (sectoresRes.data || [])
    .map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join('')
  selEster.innerHTML = (esterRes.data || [])
    .map(l => `<option value="${l.id}">${esc(l.nombre)}</option>`).join('')
  selProceso.innerHTML = (procesoRes.data || [])
    .map(m => `<option value="${m.id}">${esc(m.nombre)}</option>`).join('')
  selAlmac.innerHTML = (almacRes.data || [])
    .map(l => `<option value="${l.id}">${esc(l.nombre)}</option>`).join('')

  function actualizarCamposTipo() {
    const t = selTipo.value
    cont.querySelector('#campo-sector').style.display = t === 'egreso' ? 'block' : 'none'
    cont.querySelector('#campo-esterilizacion').style.display = t === 'envio_esterilizacion' ? 'block' : 'none'
    cont.querySelector('#campo-almacenamiento').style.display = t === 'recepcion_esterilizado' ? 'block' : 'none'
  }

  selCaja.addEventListener('change', () => {
    const c = cajas.find(x => String(x.id) === selCaja.value)
    if (!c) { estadoActual.innerHTML = ''; return }
    estadoActual.innerHTML =
      `Estado actual: <span class="badge ${claseEstado(c.estado)}">${esc(c.estado)}</span>`
    // Sugerir el próximo movimiento lógico.
    const sug = SUGERENCIA[c.estado]
    if (sug) { selTipo.value = sug; actualizarCamposTipo() }
  })

  selTipo.addEventListener('change', actualizarCamposTipo)
  actualizarCamposTipo()

  cont.querySelector('#guardar').addEventListener('click', async () => {
    const cajaId = selCaja.value
    const tipo = selTipo.value
    const usuario = cont.querySelector('#usuario').value.trim()
    const observaciones = cont.querySelector('#observaciones').value.trim()

    if (!cajaId) { mostrarAviso(avisos, 'Elegí una caja.', 'error'); return }
    if (!usuario) { mostrarAviso(avisos, 'Ingresá tu nombre como operador.', 'error'); return }
    if (tipo === 'egreso' && !selSector.value) { mostrarAviso(avisos, 'Elegí el sector de destino.', 'error'); return }
    if (tipo === 'envio_esterilizacion' && !selEster.value) { mostrarAviso(avisos, 'Elegí el lugar de esterilización.', 'error'); return }
    if (tipo === 'envio_esterilizacion' && !selProceso.value) { mostrarAviso(avisos, 'Elegí el tipo de proceso.', 'error'); return }
    if (tipo === 'recepcion_esterilizado' && !selAlmac.value) { mostrarAviso(avisos, 'Elegí el lugar de almacenamiento.', 'error'); return }

    setUsuario(usuario)

    const registro = {
      caja_id: Number(cajaId),
      tipo,
      usuario,
      observaciones: observaciones || null,
      sector_id: tipo === 'egreso' ? Number(selSector.value) : null,
      lugar_esterilizacion_id: tipo === 'envio_esterilizacion' ? Number(selEster.value) : null,
      metodo_esterilizacion_id: tipo === 'envio_esterilizacion' ? Number(selProceso.value) : null,
      lugar_almacenamiento_id: tipo === 'recepcion_esterilizado' ? Number(selAlmac.value) : null,
    }

    const btn = cont.querySelector('#guardar')
    btn.disabled = true
    const { error } = await supabase.from('movimientos').insert(registro)

    // Si es baja, además marcamos la caja como inactiva.
    if (!error && tipo === 'baja') {
      await supabase.from('cajas').update({ activa: false }).eq('id', Number(cajaId))
    }

    btn.disabled = false

    if (error) {
      mostrarAviso(avisos, 'Error al guardar: ' + error.message, 'error')
    } else {
      // Recargar la vista para reflejar el nuevo estado y mostrar el aviso en el contenedor nuevo.
      await vistaMovimiento(cont)
      mostrarAviso(cont.querySelector('#avisos'),
        `Movimiento "${NOMBRE_TIPO[tipo]}" registrado correctamente.`, 'ok')
    }
  })
}
