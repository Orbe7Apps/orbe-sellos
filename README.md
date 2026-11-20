# Orbe Sellos

Tarjeta de fidelidad de sellos **sin app** para negocios pequeños de cualquier país. El cliente escanea un QR y ya tiene su tarjeta; el negocio sella desde su teléfono. Sin registro y sin contraseñas.

**Demo:** https://orbe7apps.github.io/orbe-sellos/

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `index.html` + `js/negocio.js` | App del negocio: crear la tarjeta, sellar, entregar premios, clientes, cartel con QR (textos en `js/textos-negocio.js`) |
| `t.html` + `js/cliente.js` | Tarjeta del cliente (textos en `js/textos.js`) |

Todo está en español, inglés y portugués, según el idioma del teléfono. Para probar otro idioma: `?lang=en` o `?lang=pt`.
| `js/datos.js` | Reglas de los sellos. Hoy en **modo demostración**: todo se guarda en el aparato |
| `js/config.js` | Conexión a la base de datos (vacía = modo demostración) |
| `supabase/esquema.sql` | Esquema de la base en Supabase, listo pero sin conectar |
| `docs/FIDELIDAD.md` | Investigación, plan y próximos pasos |
| `docs/ESTILO.md` | Estilo de Orbe |
| `posts/reel/` | Reel de 50 s para TikTok e Instagram y su portada |

## Probarla en tu computadora

```
python3 -m http.server 8000
```

Y abre http://localhost:8000. Para ver la tarjeta llenarse en vivo, abre la tarjeta del cliente en otra pestaña.

## Publicación

Cada cambio en `main` se publica solo en GitHub Pages (`.github/workflows/publicar.yml`).

## Reglas

- Todo en español y con el estilo de Orbe.
- Lo más simple posible: sin app, sin registro, sin contraseñas.
- El cliente nunca puede sellarse solo: sellar, entregar premios y deshacer piden la clave del negocio.
- Los correos, los datos de usuarios registrados y el nombre, WhatsApp y cumpleaños del cliente van solo en Supabase, nunca en Notion.
- Antes de un cambio grande de diseño, primero una maqueta.

Plan maestro en Notion: «Orbe Sellos — Plan maestro», dentro de «Productos y apps».

Bibliotecas incluidas: Preact y htm (MIT), ZXing (Apache 2.0), con sus licencias en `js/lib/`.
