# Esterilización — Hospital Itaembé Guazú

Sistema web para gestionar el stock y los movimientos de material esterilizado (cajas de
instrumental) en la central de esterilización del hospital.

**App en vivo:** https://hbmacaya-cyber.github.io/esterilizacion-hig/

## Puesta en marcha en una PC nueva

Requisitos: [Node.js](https://nodejs.org), [Git](https://git-scm.com).

```bash
# 1. Descargar el proyecto
git clone https://github.com/hbmacaya-cyber/esterilizacion-hig.git
cd esterilizacion-hig

# 2. Crear el archivo .env a partir del ejemplo y completar las credenciales de Supabase
#    (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)

# 3. Instalar dependencias
npm install

# 4. Correr en modo desarrollo
npm run dev
```

## Publicar cambios

Cada `git push` a la rama `master` publica automáticamente la app en GitHub Pages
(vía GitHub Actions). Tarda 1–2 minutos.

## Tecnologías

Vite + JavaScript vanilla · Supabase (base de datos + almacenamiento de fotos) · GitHub Pages.

Documentación completa del proyecto para desarrollo asistido: ver [`CLAUDE.md`](CLAUDE.md).
