// App del negocio: crear la tarjeta en 3 pasos, sellar, ver clientes, imprimir el cartel y ajustar.
import { html, render, useState, useEffect, useRef } from '../../js/lib/preact-htm.js';
import { llamar, alCambiar, miNegocio, guardarMiNegocio, olvidarMiNegocio, EN_NUBE, MINUTOS_REPETIDO, limpiarCodigo } from './datos.js';
import { Tarjeta, Qr, Icono, Hoja, Avisos, avisar, golpe, confeti, enlaceTarjeta, ICONOS_NEGOCIO, COLORES } from './comun.js';

// Acceso desde otro teléfono del equipo: index.html#acceso=pid.clave
(() => { const m = location.hash.match(/acceso=([a-z0-9]+)\.([a-z0-9]+)/i); if (m) { guardarMiNegocio({ pid: m[1], clave: m[2] }); history.replaceState(null, '', location.pathname); } })();

const PREMIOS = { cafe: 'Café gratis', pan: 'Pan dulce gratis', tijeras: 'Corte gratis', helado: 'Helado gratis', pizza: 'Pizza personal gratis', copa: 'Bebida gratis',
  auto: 'Lavado gratis', pesa: 'Clase gratis', flor: 'Ramo gratis', bolsa: '20 % de descuento', estrella: 'Regalo sorpresa', corazon: 'Regalo sorpresa' };
const plural = (n, a, b) => n === 1 ? a : b;
const hace = ms => { if (!ms) return 'sin visitas aún'; const d = Math.floor((Date.now() - ms) / 864e5); if (d < 1) { const m = Math.floor((Date.now() - ms) / 60000); return m < 1 ? 'hace un momento' : m < 60 ? `hace ${m} min` : 'hoy'; } return d === 1 ? 'ayer' : `hace ${d} días`; };
const iniciales = c => (c.nombre ? c.nombre.split(/\s+/).map(w => w[0]).join('').slice(0, 2) : c.codigo.slice(0, 2)).toUpperCase();

function App() {
  const [neg, setNeg] = useState(miNegocio());
  const [prog, setProg] = useState(null);
  const [falla, setFalla] = useState(false);
  useEffect(() => { if (!neg) return; llamar('programa', neg).then(setProg).catch(e => { if (e.codigo === 'no_existe' || e.codigo === 'sin_permiso') { olvidarMiNegocio(); setNeg(null); } else setFalla(true); }); }, [neg]);
  if (!neg) return html`<${Crear} listo=${n => { guardarMiNegocio(n); setNeg(n); }}/>`;
  if (falla) return html`<div class="app"><div class="vacio">Sin conexión. Vuelve a intentarlo.</div></div>`;
  if (!prog) return html`<div class="app"></div>`;
  return html`<${Panel} neg=${neg} prog=${prog} setProg=${setProg} salir=${() => { olvidarMiNegocio(); setNeg(null); setProg(null); }}/>`;
}

// ---------------- Crear en 3 pasos ----------------
function Crear({ listo }) {
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState({ nombre: '', icono: 'cafe', premio: '', visitas: 8, bienvenida: 2, color: COLORES[0] });
  const [premioTocado, setPremioTocado] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const premio = premioTocado ? f.premio : PREMIOS[f.icono];
  const meta = f.visitas + f.bienvenida;
  const semanas = Math.max(1, Math.round(f.visitas / 2));
  async function crear() {
    const r = await llamar('crear_programa', { nombre: f.nombre.trim(), icono: f.icono, color: f.color, premio: premio.trim(), meta, bienvenida: f.bienvenida, idioma: 'es' });
    golpe(true); confeti(f.color); listo(r);
  }

  if (paso === 0) return html`<div class="app anima">
    <div class="fila" style="gap:10px;margin-bottom:22px"><img src="icono.svg" width="32" height="32" alt=""/><b style="font-size:17px">Orbe Sellos</b></div>
    <h1 class="titulo">Tus clientes vuelven.<br/>Sin app y sin tarjetas de cartón.</h1>
    <p class="sub">Tu cliente escanea un QR y ya tiene su tarjeta de sellos en el teléfono. Tú sellas con el tuyo.</p>
    <div style="margin:24px 0"><${Demo}/></div>
    <div class="pila">
      <button class="b-pri" onClick=${() => setPaso(1)}>Crear mi tarjeta gratis</button>
      <p class="pista" style="justify-content:center"><${Icono} n="reloj" t=${15}/>Toma 2 minutos. No pide correo ni contraseña.</p>
    </div>
  </div>`;

  const vista = html`<div style="margin:6px 0 20px"><${Tarjeta} nombre=${f.nombre || 'Tu negocio'} icono=${f.icono} color=${f.color} premio=${premio || 'Tu premio'} meta=${meta} sellos=${f.bienvenida} bienvenida=${f.bienvenida}/></div>`;
  const listoPaso = paso === 1 ? f.nombre.trim().length > 1 : paso === 2 ? (premio || '').trim().length > 1 : true;
  return html`<div class="app">
    <div class="fila" style="justify-content:space-between;margin-bottom:12px">
      <button class="b-icono" onClick=${() => setPaso(paso - 1)} aria-label="Atrás"><${Icono} n="atras" t=${20}/></button>
      <span class="muted num" style="font-size:14px;font-weight:600">Paso ${paso} de 3</span>
      <span style="width:44px"></span>
    </div>
    ${vista}
    <div class="anima" key=${paso}>
    ${paso === 1 && html`<div class="pila">
      <h2>¿Cómo se llama tu negocio?</h2>
      <input value=${f.nombre} onInput=${e => set('nombre', e.target.value)} placeholder="Ej.: Café Luna" maxlength="40" autocomplete="organization"/>
      <span class="etq" style="margin-top:6px">Elige un ícono</span>
      <div class="iconos">${ICONOS_NEGOCIO.map(n => html`<button class=${f.icono === n ? 'si' : ''} onClick=${() => set('icono', n)} aria-label=${n}><${Icono} n=${n}/></button>`)}</div>
    </div>`}
    ${paso === 2 && html`<div class="pila">
      <h2>¿Qué regalas?</h2>
      <input value=${premio} onInput=${e => { setPremioTocado(true); set('premio', e.target.value); }} placeholder="Ej.: Café gratis" maxlength="40"/>
      <span class="etq" style="margin-top:6px">¿Cada cuántas compras?</span>
      <div class="chips">${[5, 6, 8, 10, 12].map(n => html`<button class=${'chip' + (f.visitas === n ? ' si' : '')} onClick=${() => set('visitas', n)}>${n}${n === 8 ? html`<small class="muted" style="font-weight:500">recomendado</small>` : ''}</button>`)}</div>
      <p class="pista"><${Icono} n="ok" t=${15}/><span>Si tu cliente viene 2 veces por semana, gana su premio en unas ${semanas} ${plural(semanas, 'semana', 'semanas')}. Las tarjetas que se llenan en 2 a 4 semanas se completan casi 3 veces más.</span></p>
      <p class="pista"><${Icono} n="regalo" t=${15}/><span>Le regalamos ${f.bienvenida} sellos al unirse. En los estudios, una tarjeta que empieza con sellos de regalo se completa casi el doble de veces.</span></p>
    </div>`}
    ${paso === 3 && html`<div class="pila">
      <h2>Elige el color</h2>
      <div class="colores">${COLORES.map(c => html`<button class=${f.color === c ? 'si' : ''} style=${`--c:${c}`} onClick=${() => set('color', c)} aria-label=${'Color ' + c}></button>`)}</div>
      <p class="pista"><${Icono} n="ok" t=${15}/>Todo esto se puede cambiar después.</p>
    </div>`}
    </div>
    <div style="margin-top:26px">
      <button class="b-pri" disabled=${!listoPaso} onClick=${() => paso < 3 ? setPaso(paso + 1) : crear()}>${paso < 3 ? 'Seguir' : 'Crear mi tarjeta'}</button>
    </div>
  </div>`;
}

// Tarjeta de muestra que se llena sola en la portada.
function Demo() {
  const [s, setS] = useState(2);
  useEffect(() => { const id = setInterval(() => setS(x => x >= 10 ? 2 : x + 1), 900); return () => clearInterval(id); }, []);
  return html`<${Tarjeta} nombre="Café Luna" icono="cafe" color="#8a5a3c" premio="Café gratis" meta=${10} sellos=${s} bienvenida=${2} nuevos=${s > 2 ? 1 : 2} codigo="K7Q2"/>`;
}

// ---------------- Panel ----------------
function Panel({ neg, prog, setProg, salir }) {
  const [tab, setTab] = useState('sellar');
  const [cliente, setCliente] = useState(null);
  const [res, setRes] = useState(null);
  const [lista, setLista] = useState([]);
  const recargar = () => { llamar('resumen', { ...neg, desde: new Date().setHours(0, 0, 0, 0) }).then(setRes).catch(() => {}); llamar('clientes', neg).then(setLista).catch(() => {}); };
  useEffect(() => { recargar(); return alCambiar(recargar); }, []);
  const abrir = c => setCliente(c);

  return html`<div class="app">
    ${!EN_NUBE && html`<div class="alerta" style="margin-bottom:14px"><${Icono} n="telefono" t=${18}/><span><b>Modo demostración:</b> todo se guarda en este aparato. Abre el cartel como cliente en otra pestaña y mira cómo se llena la tarjeta en vivo.</span></div>`}
    <div class="fila" style="justify-content:space-between;margin-bottom:16px">
      <div class="fila" style="min-width:0"><span class="t-logo" style=${`background:${prog.color};color:#fff;width:40px;height:40px;border-radius:13px;display:grid;place-items:center`}><${Icono} n=${prog.icono}/></span>
        <div style="min-width:0"><b style="display:block;font-size:18px;letter-spacing:-.02em">${prog.nombre}</b><small class="muted">${prog.meta - prog.bienvenida} compras = ${prog.premio}</small></div></div>
    </div>
    <div class="anima" key=${tab}>
      ${tab === 'sellar' && html`<${Sellar} neg=${neg} prog=${prog} res=${res} abrir=${abrir}/>`}
      ${tab === 'clientes' && html`<${Clientes} prog=${prog} lista=${lista} res=${res} abrir=${abrir}/>`}
      ${tab === 'cartel' && html`<${Cartel} prog=${prog}/>`}
      ${tab === 'ajustes' && html`<${Ajustes} neg=${neg} prog=${prog} setProg=${setProg} salir=${salir}/>`}
    </div>
    ${cliente && html`<${Cliente} neg=${neg} prog=${prog} c=${cliente} cerrar=${() => setCliente(null)} cambio=${recargar}/>`}
    <nav class="barra">
      ${[['sellar', 'sello', 'Sellar'], ['clientes', 'personas', 'Clientes'], ['cartel', 'cartel', 'Cartel'], ['ajustes', 'ajustes', 'Ajustes']].map(([k, i, n]) =>
        html`<button class=${tab === k ? 'si' : ''} onClick=${() => setTab(k)} aria-current=${tab === k ? 'page' : null}><${Icono} n=${i} t=${22}/>${n}</button>`)}
    </nav>
    <${Avisos}/>
  </div>`;
}

// ---------------- Sellar ----------------
function Sellar({ neg, prog, res, abrir }) {
  const [cod, setCod] = useState('');
  const [camara, setCamara] = useState(false);
  async function buscar(q) {
    const c = await llamar('buscar', { ...neg, q }).catch(() => null);
    if (!c) { avisar('No encontramos esa tarjeta'); return false; }
    golpe(); setCod(''); setCamara(false); abrir(c); return true;
  }
  const r = res || {};
  return html`<div class="pila">
    <div class="cifras">
      <div class="cifra"><b>${r.visitasHoy ?? '–'}</b><span>Visitas hoy</span></div>
      <div class="cifra"><b>${r.nuevosHoy ?? '–'}</b><span>Clientes nuevos hoy</span></div>
      <div class="cifra"><b>${r.premiosHoy ?? '–'}</b><span>Premios entregados hoy</span></div>
      <div class="cifra"><b>${r.vuelven != null ? r.vuelven + ' %' : '–'}</b><span>Clientes que vuelven</span></div>
    </div>
    ${camara ? html`<${Escaner} leer=${buscar} cerrar=${() => setCamara(false)}/>`
      : html`<button class="b-pri" style="min-height:64px;font-size:18px" onClick=${() => setCamara(true)}><${Icono} n="escanear" t=${24}/>Escanear tarjeta</button>`}
    <div class="caja">
      <span class="etq">O escribe el código de 4 letras de la tarjeta</span>
      <form class="fila" onSubmit=${e => { e.preventDefault(); cod.length >= 4 && buscar(cod); }}>
        <input class="codigo-in" value=${cod} maxlength="4" onInput=${e => setCod(limpiarCodigo(e.target.value).slice(0, 4))} placeholder="K7Q2" autocapitalize="characters" autocomplete="off" spellcheck="false" aria-label="Código de la tarjeta"/>
        <button class="b-icono" style="width:58px;height:58px;background:var(--accent);color:#fff;flex:none" disabled=${cod.length < 4} aria-label="Buscar"><${Icono} n="flecha"/></button>
      </form>
    </div>
    ${r.listos > 0 && html`<p class="pista"><${Icono} n="regalo" t=${15}/>${r.listos} ${plural(r.listos, 'cliente tiene', 'clientes tienen')} el premio listo para entregar.</p>`}
  </div>`;
}

// Lector de QR con la cámara: el del sistema (Android) o ZXing (iPhone y el resto).
const cargar = src => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
async function crearLector() {
  if ('BarcodeDetector' in window) {
    try { if ((await BarcodeDetector.getSupportedFormats()).includes('qr_code')) { const d = new BarcodeDetector({ formats: ['qr_code'] }); return async v => ((await d.detect(v))[0] || {}).rawValue || ''; } } catch (e) { /* sigue con ZXing */ }
  }
  if (!window.ZXing) await cargar(new URL('../../js/lib/zxing.min.js', import.meta.url).href);
  const Z = window.ZXing, h = new Map(); h.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.QR_CODE]);
  const lector = new Z.MultiFormatReader(); lector.setHints(h);
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  return async v => {
    const w = v.videoWidth, hh = v.videoHeight; if (!w) return '';
    const k = Math.min(1, 800 / w); cv.width = w * k; cv.height = hh * k; cx.drawImage(v, 0, 0, cv.width, cv.height);
    try { return lector.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(cv)))).getText(); } catch (e) { return ''; } finally { lector.reset(); }
  };
}
function Escaner({ leer, cerrar }) {
  const v = useRef(null); const [err, setErr] = useState('');
  useEffect(() => {
    let vivo = true, flujo = null;
    (async () => {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
        if (!vivo) return flujo.getTracks().forEach(x => x.stop());
        v.current.srcObject = flujo; await v.current.play();
        const lee = await crearLector(); let ocupado = false;
        const vuelta = async () => {
          if (!vivo) return;
          if (!ocupado && v.current && v.current.readyState >= 2) { ocupado = true; const txt = await lee(v.current).catch(() => ''); if (txt && vivo) { const ok = await leer(txt); if (ok) return; } ocupado = false; }
          setTimeout(vuelta, 160);
        };
        vuelta();
      } catch (e) { setErr('No se pudo abrir la cámara. Revisa el permiso o escribe el código.'); }
    })();
    return () => { vivo = false; flujo && flujo.getTracks().forEach(x => x.stop()); };
  }, []);
  return html`<div class="pila">
    <div class="visor"><video ref=${v} playsinline muted></video><div class="marco"></div><div class="v-texto">${err || 'Apunta al QR de la tarjeta del cliente'}</div></div>
    <button class="b-sec ancho" onClick=${cerrar}><${Icono} n="x" t=${18}/>Cerrar cámara</button>
  </div>`;
}

// ---------------- Un cliente: sellar o entregar el premio ----------------
function Cliente({ neg, prog, c: inicial, cerrar, cambio }) {
  const [c, setC] = useState(inicial);
  const [n, setN] = useState(1);
  const [ocupado, setOcupado] = useState(false);
  const listo = c.sellos >= prog.meta, faltan = Math.max(0, prog.meta - c.sellos);
  const reciente = !!c.ultima && Date.now() - c.ultima < MINUTOS_REPETIDO * 60000;
  async function hacer(fn, extra) {
    setOcupado(true);
    try {
      const r = await llamar(fn, { ...neg, cid: c.cid, ...extra });
      setC(r.tarjeta); cambio();
      const deshacer = { texto: 'Deshacer', f: async () => { try { const d = await llamar('deshacer', { ...neg, g: r.g }); cambio(); avisar('Listo, se deshizo'); } catch (e) { avisar('Ya no se puede deshacer'); } } };
      if (fn === 'canjear') { golpe(true); avisar('Premio entregado', deshacer); cerrar(); return; }
      golpe(r.tarjeta.sellos >= prog.meta);
      const partes = [`${n === 1 ? '1 sello' : n + ' sellos'} para ${c.nombre || c.codigo}.`, r.sorpresa && '¡Salió sello doble sorpresa!', r.amigo && `${r.amigo.nombre || r.amigo.codigo} ganó 1 sello por invitarlo.`];
      avisar(partes.filter(Boolean).join(' '), deshacer);
      if (r.tarjeta.sellos >= prog.meta && c.sellos < prog.meta) confeti(prog.color);
      cerrar();
    } catch (e) { avisar('No se pudo. Vuelve a intentarlo.'); } finally { setOcupado(false); }
  }
  const msj = c.telefono && mensajeWhatsApp(c, prog);
  return html`<${Hoja} titulo=${c.nombre || 'Cliente ' + c.codigo} cerrar=${cerrar} pie=${html`<div class="pila">
      ${listo && html`<button class="b-pri" style="background:var(--in)" disabled=${ocupado} onClick=${() => hacer('canjear')}><${Icono} n="regalo"/>Entregar ${prog.premio.toLowerCase()}</button>`}
      <button class=${listo ? 'b-sec ancho' : 'b-pri'} disabled=${ocupado} onClick=${() => hacer('sellar', { n })}><${Icono} n="sello"/>Sellar ${n === 1 ? '+1' : '+' + n}</button>
    </div>`}>
    <div class="pila">
      <${Tarjeta} chica ...${prog} sellos=${c.sellos} codigo=${c.codigo}/>
      <p style="margin:0;text-align:center;font-weight:600">${listo ? `¡Tiene ${prog.premio.toLowerCase()} listo!` : `Le ${plural(faltan, 'falta', 'faltan')} ${faltan} para ${prog.premio.toLowerCase()}`}</p>
      <p class="muted" style="margin:-6px 0 0;text-align:center;font-size:14px">${c.visitas} ${plural(c.visitas, 'visita', 'visitas')} · ${c.canjes} ${plural(c.canjes, 'premio', 'premios')} · última ${hace(c.ultima)}</p>
      ${reciente && html`<div class="alerta"><${Icono} n="reloj" t=${18}/><span>Ya recibió un sello ${hace(c.ultima)}. ¿Seguro que es otra compra?</span></div>`}
      <div><span class="etq" style="text-align:center">¿Cuántas compras hizo?</span>
        <div class="contador"><button onClick=${() => setN(Math.max(1, n - 1))} aria-label="Menos"><${Icono} n="menos"/></button><b class="num">${n}</b><button onClick=${() => setN(Math.min(20, n + 1))} aria-label="Más"><${Icono} n="mas"/></button></div></div>
      ${msj && html`<a class="b-sec ancho" href=${msj} target="_blank" rel="noopener"><${Icono} n="chat" t=${18}/>Escribirle por WhatsApp</a>`}
    </div>
  </${Hoja}>`;
}

function mensajeWhatsApp(c, prog) {
  const nombre = c.nombre ? ' ' + c.nombre.split(' ')[0] : '', faltan = prog.meta - c.sellos, p = prog.premio.toLowerCase();
  const dias = c.ultima ? (Date.now() - c.ultima) / 864e5 : 99;
  const texto = faltan <= 0 ? `¡Hola${nombre}! Tu ${p} te espera en ${prog.nombre}. Pásate cuando quieras.`
    : dias > 21 ? `¡Hola${nombre}! Te extrañamos en ${prog.nombre}. Tienes ${c.sellos} sellos: te ${plural(faltan, 'falta', 'faltan')} ${faltan} para tu ${p}.`
    : `¡Hola${nombre}! Te ${plural(faltan, 'falta', 'faltan')} ${faltan} ${plural(faltan, 'sello', 'sellos')} para tu ${p} en ${prog.nombre}. ¡Te esperamos!`;
  return 'https://wa.me/' + c.telefono.replace(/\D/g, '') + '?text=' + encodeURIComponent(texto);
}

// ---------------- Clientes ----------------
function Clientes({ prog, lista, res, abrir }) {
  const [filtro, setFiltro] = useState('todos');
  const faltan = c => prog.meta - c.sellos, dias = c => (Date.now() - (c.ultima || c.creada)) / 864e5;
  const F = {
    todos: ['Todos', () => true],
    listos: ['Premio listo', c => faltan(c) <= 0],
    cerca: ['Les falta poco', c => faltan(c) > 0 && faltan(c) <= 2],
    extranar: ['No han vuelto', c => dias(c) > 21]
  };
  const vista = lista.filter(F[filtro][1]);
  function exportar() {
    const filas = [['codigo', 'nombre', 'whatsapp', 'cumpleanos', 'sellos', 'premios', 'visitas', 'se_unio', 'ultima_visita']]
      .concat(lista.map(c => [c.codigo, c.nombre, c.telefono, c.cumple, c.sellos, c.canjes, c.visitas, new Date(c.creada).toISOString().slice(0, 10), c.ultima ? new Date(c.ultima).toISOString().slice(0, 10) : '']));
    const csv = filas.map(f => f.map(x => /[",\n]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'clientes-' + prog.nombre.toLowerCase().replace(/\W+/g, '-') + '.csv'; a.click();
  }
  return html`<div class="pila">
    <div class="cifras">
      <div class="cifra"><b>${res ? res.clientes : '–'}</b><span>Clientes con tarjeta</span></div>
      <div class="cifra"><b>${res ? res.activos : '–'}</b><span>Vinieron en 30 días</span></div>
    </div>
    <div class="filtros">${Object.entries(F).map(([k, [n, f]]) => html`<button class=${'chip' + (filtro === k ? ' si' : '')} onClick=${() => setFiltro(k)}>${n} <span class="muted num">${lista.filter(f).length}</span></button>`)}</div>
    ${filtro !== 'todos' && vista.length > 0 && html`<p class="pista" style="margin:0"><${Icono} n="chat" t=${15}/>Toca un cliente con WhatsApp para enviarle un mensaje ya escrito.</p>`}
    ${vista.length ? html`<div class="lista">${vista.map((c, i) => html`<button class="cli" key=${c.cid} style=${`animation-delay:${Math.min(i, 12) * 25}ms`} onClick=${() => abrir(c)}>
        <span class="av">${iniciales(c)}</span>
        <span class="info"><b>${c.nombre || 'Cliente ' + c.codigo}</b><small>${c.sellos}/${prog.meta} sellos · ${hace(c.ultima)}${c.telefono ? ' · WhatsApp' : ''}</small>
          <span class="barrita"><i style=${`width:${Math.min(100, 100 * c.sellos / prog.meta)}%`}></i></span></span>
        ${faltan(c) <= 0 ? html`<span class="pildora ok">Listo</span>` : faltan(c) <= 2 ? html`<span class="pildora ya">Falta${faltan(c) > 1 ? 'n' : ''} ${faltan(c)}</span>` : null}
      </button>`)}</div>`
      : html`<div class="vacio caja">${lista.length ? 'Nadie en este grupo por ahora.' : 'Aún no hay clientes. Pon el cartel en tu mostrador y se unirán solos.'}</div>`}
    ${lista.length > 0 && html`<button class="b-sec ancho" onClick=${exportar}><${Icono} n="bajar" t=${18}/>Descargar mis clientes (CSV)</button>`}
  </div>`;
}

// ---------------- Cartel para el mostrador ----------------
function Cartel({ prog }) {
  const url = enlaceTarjeta(prog.pid), regalo = prog.bienvenida;
  async function compartir() {
    const texto = `Únete a la tarjeta de ${prog.nombre}${regalo ? ` y llévate ${regalo} ${plural(regalo, 'sello', 'sellos')} de regalo` : ''}:`;
    try { if (navigator.share) return await navigator.share({ title: prog.nombre, text: texto, url }); } catch (e) { return; }
    try { await navigator.clipboard.writeText(texto + ' ' + url); avisar('Enlace copiado'); } catch (e) { prompt('Copia el enlace', url); }
  }
  return html`<div class="pila">
    <div class="cartel" style=${`--c:${prog.color}`}>
      <span class="c-logo"><${Icono} n=${prog.icono} t=${34}/></span>
      <h2>${prog.nombre}</h2>
      <div class="c-gran">${regalo ? `Escanea y llévate ${regalo} ${plural(regalo, 'sello', 'sellos')} de regalo` : 'Escanea y únete a nuestra tarjeta'}</div>
      <${Qr} texto=${url} t=${230}/>
      <div style="font-weight:600">${prog.meta - prog.bienvenida} compras = ${prog.premio}</div>
      <div class="c-pasos"><span><b>1</b>Escanea</span><span><b>2</b>Muestra tu código al pagar</span><span><b>3</b>Gana</span></div>
      <small style="color:#625f7d">Sin descargar nada. Sin registro.</small>
    </div>
    <button class="b-pri" onClick=${() => print()}><${Icono} n="imprimir"/>Imprimir el cartel</button>
    <div class="fila">
      <button class="b-sec ancho" onClick=${compartir}><${Icono} n="compartir" t=${18}/>Compartir enlace</button>
      <a class="b-sec ancho" href=${url} target="_blank" rel="noopener"><${Icono} n="telefono" t=${18}/>Verla como cliente</a>
    </div>
    <p class="pista"><${Icono} n="ok" t=${15}/>Ponlo junto a la caja. También puedes compartir el enlace en tus redes y en tu estado de WhatsApp.</p>
  </div>`;
}

// ---------------- Ajustes ----------------
function Interruptor({ si, cambiar, titulo, texto }) {
  return html`<button class="fila caja" style="text-align:left;align-items:flex-start;width:100%" role="switch" aria-checked=${si} onClick=${() => cambiar(!si)}>
    <span style="flex:1"><b style="display:block">${titulo}</b><small class="muted">${texto}</small></span>
    <span style=${`flex:none;width:50px;height:30px;border-radius:15px;padding:3px;background:${si ? 'var(--in)' : 'var(--line)'};transition:background .3s`}>
      <span style=${`display:block;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .3s var(--spring);transform:translateX(${si ? 20 : 0}px)`}></span></span>
  </button>`;
}
function Ajustes({ neg, prog, setProg, salir }) {
  const [f, setF] = useState({ nombre: prog.nombre, premio: prog.premio, visitas: prog.meta - prog.bienvenida });
  const [equipo, setEquipo] = useState(false);
  const guardar = async cambios => { try { setProg(await llamar('ajustar', { ...neg, cambios })); avisar('Guardado'); } catch (e) { avisar('No se pudo guardar'); } };
  const cambiado = f.nombre !== prog.nombre || f.premio !== prog.premio || f.visitas !== prog.meta - prog.bienvenida;
  return html`<div class="pila">
    <div class="caja pila">
      <label><span class="etq">Nombre del negocio</span><input value=${f.nombre} maxlength="40" onInput=${e => setF({ ...f, nombre: e.target.value })}/></label>
      <label><span class="etq">Premio</span><input value=${f.premio} maxlength="40" onInput=${e => setF({ ...f, premio: e.target.value })}/></label>
      <div><span class="etq">Compras para el premio</span>
        <div class="chips">${[5, 6, 8, 10, 12].map(n => html`<button class=${'chip' + (f.visitas === n ? ' si' : '')} onClick=${() => setF({ ...f, visitas: n })}>${n}</button>`)}</div></div>
      ${cambiado && html`<button class="b-pri" onClick=${() => guardar({ nombre: f.nombre.trim(), premio: f.premio.trim(), meta: f.visitas + prog.bienvenida })}>Guardar cambios</button>`}
    </div>
    <div class="caja"><span class="etq">Ícono</span>
      <div class="iconos">${ICONOS_NEGOCIO.map(n => html`<button class=${prog.icono === n ? 'si' : ''} onClick=${() => guardar({ icono: n })} aria-label=${n}><${Icono} n=${n}/></button>`)}</div>
      <span class="etq" style="margin-top:14px">Color</span>
      <div class="colores">${COLORES.map(c => html`<button class=${prog.color === c ? 'si' : ''} style=${`--c:${c}`} onClick=${() => guardar({ color: c })} aria-label=${'Color ' + c}></button>`)}</div>
    </div>
    <${Interruptor} si=${prog.bienvenida > 0} cambiar=${v => guardar({ bienvenida: v ? 2 : 0, meta: prog.meta - prog.bienvenida + (v ? 2 : 0) })} titulo="2 sellos de regalo al unirse" texto="Con sellos de regalo, casi el doble de clientes termina la tarjeta."/>
    <${Interruptor} si=${prog.arranque} cambiar=${v => guardar({ arranque: v })} titulo="Sello de arranque" texto="Después del premio, la tarjeta nueva empieza con 1 sello para que no se enfríe."/>
    <${Interruptor} si=${prog.sorpresa} cambiar=${v => guardar({ sorpresa: v })} titulo="Sello doble sorpresa" texto="De vez en cuando (1 de cada 10) un sello vale doble. Se nota y se comenta."/>
    <button class="b-sec ancho" onClick=${() => setEquipo(true)}><${Icono} n="personas" t=${18}/>Sellar desde otro teléfono</button>
    <button class="b-texto" style="color:var(--out)" onClick=${() => confirm('¿Quitar esta tarjeta de este teléfono? En modo demostración se pierden los datos.') && salir()}>Quitar de este teléfono</button>
    ${equipo && html`<${Hoja} titulo="Sellar desde otro teléfono" cerrar=${() => setEquipo(false)}>
      <div class="pila" style="justify-items:center;text-align:center">
        <p class="sub" style="margin:0">Escanea este código con el teléfono de tu empleado. Podrá sellar y entregar premios.</p>
        <${Qr} texto=${new URL('index.html#acceso=' + neg.pid + '.' + neg.clave, location.href).href} t=${210}/>
        ${!EN_NUBE && html`<div class="alerta"><${Icono} n="telefono" t=${18}/><span>En modo demostración los datos están solo en este aparato. Al conectar la nube, los dos teléfonos verán lo mismo.</span></div>`}
        <p class="pista">No compartas este código fuera de tu equipo.</p>
      </div>
    </${Hoja}>`}
  </div>`;
}

render(html`<${App}/>`, document.getElementById('app'));
