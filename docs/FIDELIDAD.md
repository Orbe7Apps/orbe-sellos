# Orbe Sellos: tarjeta de fidelidad sin app

Microapp para vender en cualquier país. El cliente escanea un QR y ya tiene su tarjeta de sellos: no descarga nada, no se registra y no escribe una contraseña. El negocio sella desde su propio teléfono.

Investigación del 19 nov 2026. Código en este repositorio (`Orbe7Apps/orbe-sellos`); antes vivía en la carpeta `fidelidad/` de `orbe-negocios`.

---

## 1. Qué dice la investigación

### Estudios sobre cómo se comporta la gente

- **Regalar sellos al empezar hace que se termine la tarjeta.** Nunes y Drèze (2006) lo probaron en un lavado de autos:
  - Tarjeta de 8 sellos vacía: el 19 % la completó.
  - Tarjeta de 10 sellos con 2 ya puestos: el 34 % la completó.
  - Las dos pedían 8 compras. El efecto funciona mejor si se da una razón, aunque sea simple, como «regalo por unirte».
- **La gente compra más seguido cuando está cerca del premio.** Kivetz, Urminsky y Zheng (2006) lo vieron en un café real:
  - El tiempo entre compras bajó un 20 % a lo largo de la tarjeta.
  - Con la tarjeta de 12 sellos y 2 de regalo, se terminó en 10 días (mediana) en vez de 15.
  - **Después de cobrar el premio, el ritmo vuelve a empezar desde cero.** Por eso conviene que la tarjeta nueva no arranque vacía.
- **El premio tiene que estar cerca.** En un estudio de FaveCard:
  - Las tarjetas que se llenan en 2 a 4 semanas se completaron el 11,4 % de las veces.
  - Las que tardan de 8 a 16 semanas, solo el 4 %.
- **Las sorpresas ayudan, pero solo como extra.** En Nueva Zelanda (2025):
  - El 58 % de la gente dice que lo que más la fideliza es una experiencia constante.
  - Solo el 8 % dice que son las sorpresas.
  - Conclusión: un sello doble de vez en cuando, nunca como regla.

### Lo que el mercado ya probó

- **Las apps propias no se instalan.** En negocios pequeños, menos del 5 % de los clientes instala la app. Las tarjetas que van en la billetera del teléfono o en una página web llegan a muchos más clientes.
  - Las cifras exactas vienen de los propios vendedores y cambian mucho entre ellos: hay que tomarlas como orientación.
- **Quejas comunes contra la competencia:**

  | Producto | Queja |
  |---|---|
  | Loopy Loyalty | No tiene plan gratis (desde 25 USD al mes) y para exportar los clientes hay que pagar el plan de 95 USD |
  | Stamp Me | Hay que bajar su app o comprar su aparato (StampPod) |
  | Boomerangme | Caro para un solo local, cobra aparte los SMS y le faltan funciones en Android |

- **Belly y Fivestars:** sus clientes perdieron su lista de clientes cuando estas empresas fueron compradas y cambiaron de rumbo. **La lista de clientes tiene que ser del negocio y poder exportarse gratis.**
- **Por qué fallan los programas:**
  - Están pensados para el dueño y no para el cliente.
  - El cliente no entiende cómo funcionan.
  - El premio se ve lejos.
  - Los empleados se olvidan de ofrecerlos.

### Límites de las billeteras del teléfono (para la fase 2)

- **Apple Wallet:**
  - Hace falta una cuenta de Apple Developer (99 USD al año) y un certificado para firmar las tarjetas.
  - Una tarjeta actualizada solo muestra un aviso si ese campo tiene «mensaje de cambio».
  - Hasta 10 lugares por tarjeta. Cerca de esos lugares, la tarjeta aparece en la pantalla bloqueada sin sonido; no es un aviso garantizado.
- **Google Wallet:**
  - Hace falta una cuenta de emisor y una cuenta de servicio de Google Cloud.
  - Máximo 3 avisos por tarjeta cada 24 horas. Si se pasa, la tarjeta se actualiza igual, pero sin aviso.
  - Los avisos por cercanía estuvieron apagados para la mayoría de los usuarios. Hay que confirmarlo antes de prometerlos.

Fuentes:
- [Kivetz, Urminsky y Zheng (Columbia)](https://business.columbia.edu/sites/default/files-efs/pubfiles/1200/goalgradient.pdf)
- [Resumen de Nunes y Drèze](https://www.stackedmarketer.com/psychology-of-marketing/endowed-progress-effect/)
- [FaveCard: sellos o puntos](https://www.favecard.co/en/blog/coffee-shop-loyalty-program/)
- [Sorpresas en fidelidad](https://loyalcustomer.app/blog/surprise-and-delight)
- [LoyaltyPass: billetera, app o tarjeta física](https://www.loyaltypass.co/blog/guide/wallet-pass-vs-app-vs-physical-loyalty-card)
- [Reseña de Loopy Loyalty](https://www.favecard.co/en/blog/loopy-loyalty-review/)
- [Alternativas a Stamp Me](https://www.loyaltypass.co/blog/comparison/stamp-me-alternatives)
- [Reseña de Boomerangme](https://www.notfazedreviews.com/boomerangme-review/)
- [Qué pasó con Belly](https://loop.fans/blog/belly-loyalty-program)
- [Por qué fallan los programas (HBR)](https://hbr.org/2024/09/why-loyalty-programs-fail)
- [Avisos en Apple Wallet y Google Wallet (PassKit)](https://help.passkit.com/en/articles/11905171-understanding-push-notifications-for-apple-and-google-wallet-passes)
- [Límites de Google Wallet (PassKit)](https://help.passkit.com/en/articles/12527916-understanding-google-wallet-pass-notifications)
- [Avisos por cercanía en Google Wallet (Splio)](https://helpcenter.splio.com/kb/guide/en/geofenced-messages-5y55KPdMRZ/Steps/3381904)

---

## 2. Cómo lo aplica Orbe Sellos

| Hallazgo | Qué hace la app |
|---|---|
| Regalar sellos con una razón | Al unirse, el cliente recibe 2 sellos «de regalo por unirte». La tarjeta tiene 10 casillas: le faltan 8 |
| Premio en 2 a 4 semanas | Al crearla se recomiendan 8 visitas, y se muestra cuánto tardaría en llenarse |
| El ritmo baja después del premio | Al cobrar el premio, la tarjeta nueva empieza con 1 sello de arranque |
| Sorpresa solo como extra | De vez en cuando (1 de cada 10 sellos) sale un sello doble. El negocio lo puede apagar |
| Las apps no se instalan | Todo es una página web: se escanea un QR y listo |
| El cliente no entiende el programa | Una sola frase grande: «Te faltan 3 para tu café gratis» |
| El empleado se olvida | Cartel imprimible con QR para el mostrador: el cliente se une solo |
| La lista de clientes es del negocio | Exportar a CSV gratis, siempre |
| Sin aparatos extra | El negocio sella con su teléfono: escanea el QR del cliente o escribe su código de 4 letras |

### Lo nuevo frente a la competencia

1. **El sello se ve en vivo.** Cuando el negocio sella, la tarjeta abierta en el teléfono del cliente se llena con una animación y vibra.
2. **«Trae a un amigo» que no se puede engañar.** El cliente comparte su enlace y el amigo recibe un sello extra al unirse. Quien invitó gana su sello solo cuando el amigo hace su primera compra de verdad, no al registrarse.
3. **«Te extrañamos» por WhatsApp sin pagar SMS.** La lista muestra a quién le falta poco o quién lleva tiempo sin venir, con el mensaje listo para enviar.
4. **Sello de arranque y sello doble sorpresa**, basados en los estudios de arriba.
5. **Aviso de sello repetido.** Si se sella dos veces la misma tarjeta en pocos minutos, la app pregunta antes. Además, se puede deshacer al momento.
6. **Varios sellos de una vez.** Si el cliente compró 3 cafés, recibe 3 sellos con un toque.
7. **En el idioma del cliente.** La tarjeta sale en español, inglés o portugués según el idioma de su teléfono.
8. **Sin datos personales obligatorios.** Nombre, WhatsApp y cumpleaños son opcionales. Sirve con las leyes de privacidad de cualquier país (GDPR, LGPD, CCPA).

---

## 3. Cómo se usa

**Dueño (2 minutos, una sola vez):**
1. Nombre del negocio y un ícono.
2. El premio y cuántas visitas pide.
3. El color. Se ve la tarjeta mientras se arma, y luego «Crear».

Después imprime el cartel o comparte el enlace.

**Cliente:** escanea el QR del cartel, toca «Quiero mi tarjeta» y ya tiene 2 sellos.

**En caja:** el empleado toca «Sellar», escanea el QR de la tarjeta del cliente (o escribe su código) y toca «+1». Cuando la tarjeta está llena aparece «Entregar premio».

---

## 4. Estado y próximos pasos

- ✅ **Fase 1 (hecha):** app del negocio (`index.html`) y tarjeta del cliente (`t.html`).
  - Funciona en modo demostración: todo se guarda en el aparato, y si la tarjeta se abre en otra pestaña se ve sellarse en vivo.
  - La app del negocio y la tarjeta del cliente están en español, inglés y portugués, según el idioma del teléfono (se puede forzar con `?lang=en`). Textos del negocio en `js/textos-negocio.js`.
- ✅ **Repositorio propio (20 nov 2026):** `Orbe7Apps/orbe-sellos`, con publicación automática en GitHub Pages.
- **Fase 1b: base de datos (por decidir, la decide Guillermo).**
  - **Regla:** los correos y los datos de los usuarios registrados van solo en **Supabase**, nunca en Notion. Si Notion se usa, guarda solo información de la app (programas, tarjetas, sellos, premios).
  - Notion como base de la app solo si Guillermo lo indica.
  - El esquema de Supabase ya está en `supabase/esquema.sql` (sin probar en una base real). Para conectarlo se pegan la URL y la clave pública en `js/config.js`.
  - **Decidido (20 nov 2026):** el nombre, el WhatsApp y el cumpleaños opcionales del cliente van en **Supabase**, con los demás datos personales (tabla `sellos_tarjetas` de `supabase/esquema.sql`; el WhatsApp y el cumpleaños solo los ve el negocio con su clave). Nunca en Notion.
- **Fase 2: Apple Wallet y Google Wallet.**
  - Necesita una cuenta de Apple Developer (99 USD al año), un emisor de Google Wallet y una función en el servidor que firme las tarjetas.
  - La tarjeta web ya tiene el mismo diseño: el QR, el código y los campos pasan tal cual.
- **Fase 3: cobrar.** Con Paddle, que cobra el IVA de cada país:
  - Gratis hasta 50 clientes.
  - Plan Local, 9 USD al mes: clientes ilimitados.
  - Plan Cadena, 19 USD al mes por cada sucursal más.

  Los precios conviene ajustarlos según el poder de compra de cada país, como dice `docs/MUNDIAL.md` del repositorio `orbe-negocios`.
- **Fase 4:** avisos en la billetera (3 al día en Google), varias sucursales con una sola tarjeta y premios por niveles.
