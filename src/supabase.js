import { createClient } from '@supabase/supabase-js'

// Las credenciales se leen del archivo .env (no se suben a GitHub).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  document.body.innerHTML =
    '<p style="font-family:sans-serif;padding:2rem;color:#b91c1c">' +
    'Faltan las credenciales de Supabase. Revisá el archivo <b>.env</b>.</p>'
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env')
}

export const supabase = createClient(url, anonKey)

// Nombre del bucket de Storage donde se guardan las fotos de las cajas.
export const BUCKET_FOTOS = 'caja-fotos'
