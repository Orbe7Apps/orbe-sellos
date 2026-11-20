# Orbe Sellos — instrucciones para Claude

- Lee primero `docs/FIDELIDAD.md` y la página de Notion «Orbe Sellos — Plan maestro» (dentro de «Productos y apps»). Las reglas generales están en «Inicio · Guillermo».
- Todo en español y con el estilo de Orbe (`docs/ESTILO.md`, y `sellos.css` como código de referencia).
- Lo más simple posible: sin app, sin registro, sin contraseñas. Apple y Google Wallet no son obligatorios.
- El cliente nunca puede sellarse solo. Sellar, entregar premios y deshacer piden la clave del negocio.
- **Base de datos: por decidir; la decide Guillermo.** Hoy la app está en modo demostración (`js/datos.js`).
  - Los correos y los datos de usuarios registrados van solo en Supabase, nunca en Notion.
  - El nombre, el WhatsApp y el cumpleaños del cliente también van solo en Supabase.
  - Notion como base de la app solo si Guillermo lo indica, y solo con información de la app.
- Antes de un cambio grande de diseño, primero una maqueta.
- Al avanzar, actualiza el plan maestro y la base «Pendientes» de Notion (tareas que empiezan con «Orbe Sellos:»).
- Sin pasos de compilación: son archivos estáticos. Para probar: `python3 -m http.server` en la raíz.
