# Proyecto: Sistema de Esterilización — Hospital Itaembé Guazú

App web para gestionar el **stock y los movimientos de material esterilizado** (cajas de
instrumental) en la central de esterilización del hospital. La usa el personal de farmacia.

> **El usuario NO es técnico.** Explicar todo paso a paso ("para dummies"), sin asumir
> conocimientos de git, terminal, npm ni VS Code. Confirmar antes de pasos irreversibles
> (git push, deploy, borrar datos). Responder en español.

## Enlaces y datos clave

- **App publicada:** https://hbmacaya-cyber.github.io/esterilizacion-hig/
- **Repositorio GitHub:** https://github.com/hbmacaya-cyber/esterilizacion-hig (público)
- **Supabase project id:** `gylifoocathexthmgosf` (org `zkcxkwvzrtzcnxeyyxjj`, cuenta hbmacaya@gmail.com)

## Stack

- Frontend estático: **Vite + JavaScript vanilla** (sin frameworks).
- Backend: **Supabase** (base de datos Postgres + Storage para fotos).
- Hosting: **GitHub Pages**, desplegado automáticamente por **GitHub Actions** en cada push a `master`.

## Cómo correr el proyecto en una PC

1. Requisitos instalados: **Node.js**, **Git**, y opcionalmente **VS Code**.
2. Clonar: `git clone https://github.com/hbmacaya-cyber/esterilizacion-hig.git`
3. Crear el archivo **`.env`** en la raíz (NO está en el repo por seguridad). Ver `.env.example`.
   Contiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Si falta, Claude puede
   regenerarlo con las herramientas MCP de Supabase (get_project_url + get_publishable_keys).
4. Instalar dependencias: `npm install`
5. Correr en local: `npm run dev` → abre en `http://localhost:5173/esterilizacion-hig/`
   (la subcarpeta viene del `base` en `vite.config.js`).

## Cómo se publica en internet

- Cualquier `git push` a `master` dispara el workflow `.github/workflows/deploy.yml`, que
  construye la app y la publica en GitHub Pages (1-2 min).
- Las credenciales de Supabase se inyectan desde **GitHub Secrets** (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`) — el `.env` local no se sube.
- Tras publicar, si el navegador muestra la versión vieja: **Ctrl + F5** (recarga sin caché).

## Estructura de la app (`src/`)

- `main.js` — navegación por pestañas (hash routing).
- `supabase.js` — cliente de Supabase + nombre del bucket de fotos.
- `util.js` — helpers (formato de fecha, avisos, escape HTML, operador en localStorage).
- `views/stock.js` — estado actual de cada caja (lee la vista `vista_estado_cajas`).
- `views/movimiento.js` — registrar movimiento; campos contextuales según el tipo.
- `views/historial.js` — movimientos filtrables por caja y tipo.
- `views/cajas.js` — ABM de cajas: componentes, fotos (Storage) y última preparación.
- `views/configuracion.js` — ABM de sectores y lugares (esterilización / almacenamiento).

## Modelo de datos (Supabase, esquema `public`)

- `cajas` (id, nombre ÚNICO, descripcion, metodo_esterilizacion_id [en desuso], activa, creada_en)
- `caja_items` (id, caja_id, item_nombre, cantidad) — componentes esperados de la caja.
- `caja_fotos` (id, caja_id, foto_url, descripcion, orden, subida_en) — bucket `caja-fotos`.
- `movimientos` (id, caja_id, **tipo**, sector_id, lugar_esterilizacion_id,
  **metodo_esterilizacion_id**, lugar_almacenamiento_id, fecha_hora, usuario, observaciones).
  `tipo` ∈ `egreso` | `retorno` | `envio_esterilizacion` | `recepcion_esterilizado` | `baja`.
- Catálogos: `metodos_esterilizacion`, `lugares_esterilizacion` (activo),
  `lugares_almacenamiento` (activo), `sectores` (activo).
- **Vista** `vista_estado_cajas` (`security_invoker`): estado derivado del último movimiento +
  datos de la última "preparación" (último `envio_esterilizacion`: fecha, operario, proceso, lugar).

### Ciclo de vida de una caja (estado = derivado del último movimiento)

`Disponible → egreso → En uso → retorno → Pendiente esterilización → envio_esterilizacion →
En esterilización → recepcion_esterilizado → Disponible`. Una `baja` la marca inactiva.

## Convenciones y decisiones importantes

- **Cajas repetidas = unidades físicas individuales.** Cada unidad es una fila propia en `cajas`,
  con el nombre terminado en un número de unidad: `... - 01`, `... - 02`, `... - 03`.
- **El tipo de proceso (método de esterilización) se registra en cada "preparación"**
  (movimiento `envio_esterilizacion`), NO fijo por caja. Métodos: Autoclave, Calor seco,
  Óxido de etileno.
- **Seguridad = "opción A": sin login.** RLS activado con políticas de acceso abierto
  (anon/authenticated). Cualquiera con el link ve y edita los datos. Los warnings
  `rls_policy_always_true` de Supabase son intencionales. Si el usuario pide login = "opción B" =
  agregar Supabase Auth y endurecer las políticas RLS.

## Gotchas (¡importante!)

- **Windows PowerShell + `gh secret set`:** NUNCA usar `"valor" | gh secret set NOMBRE`
  (el pipe agrega BOM y corrompe el secreto → error runtime "Failed to execute 'set' on
  'Headers': String contains non ISO-8859-1 code point"). Usar SIEMPRE
  `gh secret set NOMBRE --body "valor"`.
- Cambios de esquema en Supabase: preferir `apply_migration` (DDL) sobre `execute_sql`.
- `CREATE OR REPLACE VIEW` no permite insertar columnas en el medio → hacer `DROP VIEW` + `CREATE`.
