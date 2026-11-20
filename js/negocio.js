// App del negocio: crear la tarjeta en 3 pasos, sellar, ver clientes, imprimir el cartel y ajustar.
import { html, render, useState, useEffect, useRef } from './lib/preact-htm.js';
import { llamar, alCambiar, miNegocio, guardarMiNegocio, olvidarMiNegocio, EN_NUBE, MINUTOS_REPETIDO, limpiarCodigo } from './datos.js';
import { Tarjeta, Qr, Icono, Hoja, Avisos, avisar, golpe, confeti, enlaceTarjeta, ICONOS_NEGOCIO, COLORES } from './comun.js';
import { tn, tnn, IDIOMA } from './textos-negocio.js';

document.documentElement.lang = IDIOMA;

// Acceso desde otro teléfono del equipo: index.html#acceso=pid.clave
(() => { const m = location.hash.match(/acceso=([a-z0-9]+)\.([a-z0-9]+)/i); if (m) { guardarMiNegocio({ pid: m[1], clave: m[2] }); history.replaceState(null, '', location.pathname); } })();

const PREMIOS = tn('premios');
const hace = ms => { if (!ms) return tn('sinVisitas'); const d = Math.floor((Date.now() - ms) / 864e5); if (d < 1) { const m = Math.floor((Date.now() - ms) / 60000); return m < 1 ? tn('haceMomento') : m < 60 ? tn('haceMin', { n: m }) : tn('hoy'); } return d === 1 ? tn('ayer') : tn('haceDias', { n: d }); };
const iniciales = c => (c.nombre ? c.nombre.split(/\s+/).map(w => w[0]).join('').slice(0, 2) : c.codigo.slice(0, 2)).toUpperCase();

function App() {
  const [neg, setNeg] = useState(miNegocio());
  const [prog, setProg] = useState(null);
  const [falla, setFalla] = useState(false);
  useEffect(() => { if (!neg) return; llamar('programa', neg).then(setProg).catch(e => { if (e.codigo === 'no_existe' || e.codigo === 'sin_permiso') { olvidarMiNegocio(); setNeg(null); } else setFalla(true); }); }, [neg]);
  if (!neg) return html`<${Crear} listo=${n => { guardarMiNegocio(n); setNeg(n); }}/>`;
  if (falla) return html`<div class="app"><div class="vacio">${tn('sinConexion')}</div></div>`;
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
    const r = await llamar('crear_programa', { nombre: f.nombre.trim(), icono: f.icono, color: f.color, premio: premio.trim(), meta, bienvenida: f.bienvenida, idioma: IDIOMA });
    golpe(true); confeti(f.color); listo(r);
  }

  if (paso === 0) return html`<div class="app anima">
    <div class="fila" style="gap:10px;margin-bottom:22px"><img src="icono.svg" width="32" height="32" alt=""/><b style="font-size:17px">${tn('marca')}</b></div>
    <h1 class="titulo">${tn('portadaA')}<br/>${tn('portadaB')}</h1>
    <p class="sub">${tn('portadaSub')}</p>
    <div style="margin:24px 0"><${Demo}/></div>
    <div class="pila">
      <button class="b-pri" onClick=${() => setPaso(1)}>${tn('crearGratis')}</button>
      <p class="pista" style="justify-content:center"><${Icono} n="reloj" t=${15}/>${tn('toma2')}</p>
    </div>
  </div>`;

  const vista = html`<div style="margin:6px 0 20px"><${Tarjeta} nombre=${f.nombre || tn('tuNegocio')} icono=${f.icono} color=${f.color} premio=${premio || tn('tuPremio')} meta=${meta} sellos=${f.bienvenida} bienvenida=${f.bienvenida}/></div>`;
  const listoPaso = paso === 1 ? f.nombre.trim().length > 1 : paso === 2 ? (premio || '').trim().length > 1 : true;
  return html`<div class="app">
    <div class="fila" style="justify-content:space-between;margin-bottom:12px">
      <button class="b-icono" onClick=${() => setPaso(paso - 1)} aria-label=${tn('atras')}><${Icono} n="atras" t=${20}/></button>
      <span class="muted num" style="font-size:14px;font-weight:600">${tn('paso', { n: paso })}</span>
      <span style="width:44px"></span>
    </div>
    ${vista}
    <div class="anima" key=${paso}>
    ${paso === 1 && html`<div class="pila">
      <h2>${tn('comoSeLlama')}</h2>
      <input value=${f.nombre} onInput=${e => set('nombre', e.target.value)} placeholder=${tn('ejNombre')} maxlength="40" autocomplete="organization"/>
      <span class="etq" style="margin-top:6px">${tn('eligeIcono')}</span>
      <div class="iconos">${ICONOS_NEGOCIO.map(n => html`<button class=${f.icono === n ? 'si' : ''} onClick=${() => set('icono', n)} aria-label=${n}><${Icono} n=${n}/></button>`)}</div>
    </div>`}
    ${paso === 2 && html`<div class="pila">
      <h2>${tn('queRegalas')}</h2>
      <input value=${premio} onInput=${e => { setPremioTocado(true); set('premio', e.target.value); }} placeholder=${tn('ejPremio')} maxlength="40"/>
      <span class="etq" style="margin-top:6px">${tn('cadaCuantas')}</span>
      <div class="chips">${[5, 6, 8, 10, 12].map(n => html`<button class=${'chip' + (f.visitas === n ? ' si' : '')} onClick=${() => set('visitas', n)}>${n}${n === 8 ? html`<small class="muted" style="font-weight:500">${tn('recomendado')}</small>` : ''}</button>`)}</div>
      <p class="pista"><${Icono} n="ok" t=${15}/><span>${tnn(semanas, 'pistaSemana1', 'pistaSemanas')}</span></p>
      <p class="pista"><${Icono} n="regalo" t=${15}/><span>${tn('pistaRegalo', { n: f.bienvenida })}</span></p>
    </div>`}
    ${paso === 3 && html`<div class="pila">
      <h2>${tn('eligeColor')}</h2>
      <div class="colores">${COLORES.map(c => html`<button class=${f.color === c ? 'si' : ''} style=${`--c:${c}`} onClick=${() => set('color', c)} aria-label=${tn('color') + ' ' + c}></button>`)}</div>
      <p class="pista"><${Icono} n="ok" t=${15}/>${tn('cambiarDespues')}</p>
    </div>`}
    </div>
    <div style="margin-top:26px">
      <button class="b-pri" disabled=${!listoPaso} onClick=${() => paso < 3 ? setPaso(paso + 1) : crear()}>${paso < 3 ? tn('seguir') : tn('crearMiTarjeta')}</button>
    </div>
  </div>`;
}

// Tarjeta de muestra que se llena sola en la portada.
function Demo() {
  const [s, setS] = useState(2);
  useEffect(() => { const id = setInterval(() => setS(x => x >= 10 ? 2 : x + 1), 900); return () => clearInterval(id); }, []);
  return html`<${Tarjeta} nombre=${tn('demoNombre')} icono="cafe" color="#8a5a3c" premio=${tn('demoPremio')} meta=${10} sellos=${s} bienvenida=${2} nuevos=${s > 2 ? 1 : 2} codigo="K7Q2"/>`;
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
    ${!EN_NUBE && html`<div class="alerta" style="margin-bottom:14px"><${Icono} n="telefono" t=${18}/><span><b>${tn('modoDemoB')}</b> ${tn('modoDemo')}</span></div>`}
    <div class="fila" style="justify-content:space-between;margin-bottom:16px">
      <div class="fila" style="min-width:0"><span class="t-logo" style=${`background:${prog.color};color:#fff;width:40px;height:40px;border-radius:13px;display:grid;place-items:center`}><${Icono} n=${prog.icono}/></span>
        <div style="min-width:0"><b style="display:block;font-size:18px;letter-spacing:-.02em">${prog.nombre}</b><small class="muted">${tn('comprasIgual', { n: prog.meta - prog.bienvenida, premio: prog.premio })}</small></div></div>
    </div>
    <div class="anima" key=${tab}>
      ${tab === 'sellar' && html`<${Sellar} neg=${neg} prog=${prog} res=${res} abrir=${abrir}/>`}
      ${tab === 'clientes' && html`<${Clientes} prog=${prog} lista=${lista} res=${res} abrir=${abrir}/>`}
      ${tab === 'cartel' && html`<${Cartel} prog=${prog}/>`}
      ${tab === 'ajustes' && html`<${Ajustes} neg=${neg} prog=${prog} setProg=${setProg} salir=${salir}/>`}
    </div>
    ${cliente && html`<${Cliente} neg=${neg} prog=${prog} c=${cliente} cerrar=${() => setCliente(null)} cambio=${recargar}/>`}
    <nav class="barra">
      ${[['sellar', 'sello', tn('tabSellar')], ['clientes', 'personas', tn('tabClientes')], ['cartel', 'cartel', tn('tabCartel')], ['ajustes', 'ajustes', tn('tabAjustes')]].map(([k, i, n]) =>
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
    if (!c) { avisar(tn('noEncontramos')); return false; }
    golpe(); setCod(''); setCamara(false); abrir(c); return true;
  }
  const r = res || {};
  return html`<div class="pila">
    <div class="cifras">
      <div class="cifra"><b>${r.visitasHoy ?? '–'}</b><span>${tn('visitasHoy')}</span></div>
      <div class="cifra"><b>${r.nuevosHoy ?? '–'}</b><span>${tn('nuevosHoy')}</span></div>
      <div class="cifra"><b>${r.premiosHoy ?? '–'}</b><span>${tn('premiosHoy')}</span></div>
      <div class="cifra"><b>${r.vuelven != null ? r.vuelven + ' %' : '–'}</b><span>${tn('vuelven')}</span></div>
    </div>
    ${camara ? html`<${Escaner} leer=${buscar} cerrar=${() => setCamara(false)}/>`
      : html`<button class="b-pri" style="min-height:64px;font-size:18px" onClick=${() => setCamara(true)}><${Icono} n="escanear" t=${24}/>${tn('escanear')}</button>`}
    <div class="caja">
      <span class="etq">${tn('oEscribe')}</span>
      <form class="fila" onSubmit=${e => { e.preventDefault(); cod.length >= 4 && buscar(cod); }}>
        <input class="codigo-in" value=${cod} maxlength="4" onInput=${e => setCod(limpiarCodigo(e.target.value).slice(0, 4))} placeholder="K7Q2" autocapitalize="characters" autocomplete="off" spellcheck="false" aria-label=${tn('codigoTarjeta')}/>
        <button class="b-icono" style="width:58px;height:58px;background:var(--accent);color:#fff;flex:none" disabled=${cod.length < 4} aria-label=${tn('buscar')}><${Icono} n="flecha"/></button>
      </form>
    </div>
    ${r.listos > 0 && html`<p class="pista"><${Icono} n="regalo" t=${15}/>${tnn(r.listos, 'listos1', 'listos')}</p>`}
  </div>`;
}

// Lector de QR con la cámara: el del sistema (Android) o ZXing (iPhone y el resto).
const cargar = src => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
async function crearLector() {
  if ('BarcodeDetector' in window) {
    try { if ((await BarcodeDetector.getSupportedFormats()).includes('qr_code')) { const d = new BarcodeDetector({ formats: ['qr_code'] }); return async v => ((await d.detect(v))[0] || {}).rawValue || ''; } } catch (e) { /* sigue con ZXing */ }
  }
  if (!window.ZXing) await cargar(new URL('./lib/zxing.min.js', import.meta.url).href);
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
      } catch (e) { setErr(tn('errCamara')); }
    })();
    return () => { vivo = false; flujo && flujo.getTracks().forEach(x => x.stop()); };
  }, []);
  return html`<div class="pila">
    <div class="visor"><video ref=${v} playsinline muted></video><div class="marco"></div><div class="v-texto">${err || tn('apunta')}</div></div>
    <button class="b-sec ancho" onClick=${cerrar}><${Icono} n="x" t=${18}/>${tn('cerrarCamara')}</button>
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
      const deshacer = { texto: tn('deshacer'), f: async () => { try { await llamar('deshacer', { ...neg, g: r.g }); cambio(); avisar(tn('seDeshizo')); } catch (e) { avisar(tn('yaNoDeshacer')); } } };
      if (fn === 'canjear') { golpe(true); avisar(tn('premioEntregado'), deshacer); cerrar(); return; }
      golpe(r.tarjeta.sellos >= prog.meta);
      const partes = [tnn(n, 'sello1Para', 'sellosPara', { quien: c.nombre || c.codigo }), r.sorpresa && tn('salioDoble'), r.amigo && tn('amigoGano', { quien: r.amigo.nombre || r.amigo.codigo })];
      avisar(partes.filter(Boolean).join(' '), deshacer);
      if (r.tarjeta.sellos >= prog.meta && c.sellos < prog.meta) confeti(prog.color);
      cerrar();
    } catch (e) { avisar(tn('noSePudo')); } finally { setOcupado(false); }
  }
  const msj = c.telefono && mensajeWhatsApp(c, prog);
  return html`<${Hoja} titulo=${c.nombre || tn('clienteCod', { c: c.codigo })} cerrar=${cerrar} pie=${html`<div class="pila">
      ${listo && html`<button class="b-pri" style="background:var(--in)" disabled=${ocupado} onClick=${() => hacer('canjear')}><${Icono} n="regalo"/>${tn('entregar', { premio: prog.premio.toLowerCase() })}</button>`}
      <button class=${listo ? 'b-sec ancho' : 'b-pri'} disabled=${ocupado} onClick=${() => hacer('sellar', { n })}><${Icono} n="sello"/>${tn('sellarN', { n })}</button>
    </div>`}>
    <div class="pila">
      <${Tarjeta} chica ...${prog} sellos=${c.sellos} codigo=${c.codigo}/>
      <p style="margin:0;text-align:center;font-weight:600">${listo ? tn('tieneListo', { premio: prog.premio.toLowerCase() }) : tnn(faltan, 'leFalta1', 'leFaltan', { premio: prog.premio.toLowerCase() })}</p>
      <p class="muted" style="margin:-6px 0 0;text-align:center;font-size:14px">${tnn(c.visitas, 'visita1', 'visitas')} · ${tnn(c.canjes, 'premio1', 'premiosN')} · ${c.ultima ? tn('ultima', { hace: hace(c.ultima) }) : tn('sinVisitas')}</p>
      ${reciente && html`<div class="alerta"><${Icono} n="reloj" t=${18}/><span>${tn('yaRecibio', { hace: hace(c.ultima) })}</span></div>`}
      <div><span class="etq" style="text-align:center">${tn('cuantasCompras')}</span>
        <div class="contador"><button onClick=${() => setN(Math.max(1, n - 1))} aria-label=${tn('menos')}><${Icono} n="menos"/></button><b class="num">${n}</b><button onClick=${() => setN(Math.min(20, n + 1))} aria-label=${tn('mas')}><${Icono} n="mas"/></button></div></div>
      ${msj && html`<a class="b-sec ancho" href=${msj} target="_blank" rel="noopener"><${Icono} n="chat" t=${18}/>${tn('escribirWa')}</a>`}
    </div>
  </${Hoja}>`;
}

function mensajeWhatsApp(c, prog) {
  const nombre = c.nombre ? ' ' + c.nombre.split(' ')[0] : '', faltan = prog.meta - c.sellos, p = prog.premio.toLowerCase();
  const dias = c.ultima ? (Date.now() - c.ultima) / 864e5 : 99;
  const v = { nombre, premio: p, negocio: prog.nombre, s: c.sellos };
  const texto = faltan <= 0 ? tn('waListo', v) : dias > 21 ? tnn(faltan, 'waExtrana1', 'waExtrana', v) : tnn(faltan, 'waFalta1', 'waFalta', v);
  return 'https://wa.me/' + c.telefono.replace(/\D/g, '') + '?text=' + encodeURIComponent(texto);
}

// ---------------- Clientes ----------------
function Clientes({ prog, lista, res, abrir }) {
  const [filtro, setFiltro] = useState('todos');
  const faltan = c => prog.meta - c.sellos, dias = c => (Date.now() - (c.ultima || c.creada)) / 864e5;
  const F = {
    todos: [tn('fTodos'), () => true],
    listos: [tn('fListos'), c => faltan(c) <= 0],
    cerca: [tn('fCerca'), c => faltan(c) > 0 && faltan(c) <= 2],
    extranar: [tn('fExtranar'), c => dias(c) > 21]
  };
  const vista = lista.filter(F[filtro][1]);
  function exportar() {
    const filas = [tn('csv')]
      .concat(lista.map(c => [c.codigo, c.nombre, c.telefono, c.cumple, c.sellos, c.canjes, c.visitas, new Date(c.creada).toISOString().slice(0, 10), c.ultima ? new Date(c.ultima).toISOString().slice(0, 10) : '']));
    const csv = filas.map(f => f.map(x => /[",\n]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = tn('csvArchivo') + '-' + prog.nombre.toLowerCase().replace(/\W+/g, '-') + '.csv'; a.click();
  }
  return html`<div class="pila">
    <div class="cifras">
      <div class="cifra"><b>${res ? res.clientes : '–'}</b><span>${tn('conTarjeta')}</span></div>
      <div class="cifra"><b>${res ? res.activos : '–'}</b><span>${tn('vinieron30')}</span></div>
    </div>
    <div class="filtros">${Object.entries(F).map(([k, [n, f]]) => html`<button class=${'chip' + (filtro === k ? ' si' : '')} onClick=${() => setFiltro(k)}>${n} <span class="muted num">${lista.filter(f).length}</span></button>`)}</div>
    ${filtro !== 'todos' && vista.length > 0 && html`<p class="pista" style="margin:0"><${Icono} n="chat" t=${15}/>${tn('tocaWa')}</p>`}
    ${vista.length ? html`<div class="lista">${vista.map((c, i) => html`<button class="cli" key=${c.cid} style=${`animation-delay:${Math.min(i, 12) * 25}ms`} onClick=${() => abrir(c)}>
        <span class="av">${iniciales(c)}</span>
        <span class="info"><b>${c.nombre || tn('clienteCod', { c: c.codigo })}</b><small>${tn('sellosDe', { s: c.sellos, meta: prog.meta })} · ${hace(c.ultima)}${c.telefono ? ' · WhatsApp' : ''}</small>
          <span class="barrita"><i style=${`width:${Math.min(100, 100 * c.sellos / prog.meta)}%`}></i></span></span>
        ${faltan(c) <= 0 ? html`<span class="pildora ok">${tn('pListo')}</span>` : faltan(c) <= 2 ? html`<span class="pildora ya">${tnn(faltan(c), 'pFalta1', 'pFaltan')}</span>` : null}
      </button>`)}</div>`
      : html`<div class="vacio caja">${lista.length ? tn('nadieGrupo') : tn('sinClientes')}</div>`}
    ${lista.length > 0 && html`<button class="b-sec ancho" onClick=${exportar}><${Icono} n="bajar" t=${18}/>${tn('descargarCsv')}</button>`}
  </div>`;
}

// ---------------- Cartel para el mostrador ----------------
function Cartel({ prog }) {
  const url = enlaceTarjeta(prog.pid), regalo = prog.bienvenida;
  async function compartir() {
    const texto = regalo ? tnn(regalo, 'unirseRegalo1', 'unirseRegalo', { negocio: prog.nombre }) : tn('unirse', { negocio: prog.nombre });
    try { if (navigator.share) return await navigator.share({ title: prog.nombre, text: texto, url }); } catch (e) { return; }
    try { await navigator.clipboard.writeText(texto + ' ' + url); avisar(tn('copiado')); } catch (e) { prompt(tn('copiaEnlace'), url); }
  }
  return html`<div class="pila">
    <div class="cartel" style=${`--c:${prog.color}`}>
      <span class="c-logo"><${Icono} n=${prog.icono} t=${34}/></span>
      <h2>${prog.nombre}</h2>
      <div class="c-gran">${regalo ? tnn(regalo, 'escaneaRegalo1', 'escaneaRegalo') : tn('escaneaUnete')}</div>
      <${Qr} texto=${url} t=${230}/>
      <div style="font-weight:600">${tn('comprasIgual', { n: prog.meta - prog.bienvenida, premio: prog.premio })}</div>
      <div class="c-pasos"><span><b>1</b>${tn('paso1')}</span><span><b>2</b>${tn('paso2')}</span><span><b>3</b>${tn('paso3')}</span></div>
      <small style="color:#625f7d">${tn('sinApp')}</small>
    </div>
    <button class="b-pri" onClick=${() => print()}><${Icono} n="imprimir"/>${tn('imprimir')}</button>
    <div class="fila">
      <button class="b-sec ancho" onClick=${compartir}><${Icono} n="compartir" t=${18}/>${tn('compartir')}</button>
      <a class="b-sec ancho" href=${url} target="_blank" rel="noopener"><${Icono} n="telefono" t=${18}/>${tn('verCliente')}</a>
    </div>
    <p class="pista"><${Icono} n="ok" t=${15}/>${tn('pistaCartel')}</p>
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
  const guardar = async cambios => { try { setProg(await llamar('ajustar', { ...neg, cambios })); avisar(tn('guardado')); } catch (e) { avisar(tn('noGuardar')); } };
  const cambiado = f.nombre !== prog.nombre || f.premio !== prog.premio || f.visitas !== prog.meta - prog.bienvenida;
  return html`<div class="pila">
    <div class="caja pila">
      <label><span class="etq">${tn('nombreNegocio')}</span><input value=${f.nombre} maxlength="40" onInput=${e => setF({ ...f, nombre: e.target.value })}/></label>
      <label><span class="etq">${tn('premio')}</span><input value=${f.premio} maxlength="40" onInput=${e => setF({ ...f, premio: e.target.value })}/></label>
      <div><span class="etq">${tn('comprasPremio')}</span>
        <div class="chips">${[5, 6, 8, 10, 12].map(n => html`<button class=${'chip' + (f.visitas === n ? ' si' : '')} onClick=${() => setF({ ...f, visitas: n })}>${n}</button>`)}</div></div>
      ${cambiado && html`<button class="b-pri" onClick=${() => guardar({ nombre: f.nombre.trim(), premio: f.premio.trim(), meta: f.visitas + prog.bienvenida })}>${tn('guardarCambios')}</button>`}
    </div>
    <div class="caja"><span class="etq">${tn('icono')}</span>
      <div class="iconos">${ICONOS_NEGOCIO.map(n => html`<button class=${prog.icono === n ? 'si' : ''} onClick=${() => guardar({ icono: n })} aria-label=${n}><${Icono} n=${n}/></button>`)}</div>
      <span class="etq" style="margin-top:14px">${tn('color')}</span>
      <div class="colores">${COLORES.map(c => html`<button class=${prog.color === c ? 'si' : ''} style=${`--c:${c}`} onClick=${() => guardar({ color: c })} aria-label=${tn('color') + ' ' + c}></button>`)}</div>
    </div>
    <${Interruptor} si=${prog.bienvenida > 0} cambiar=${v => guardar({ bienvenida: v ? 2 : 0, meta: prog.meta - prog.bienvenida + (v ? 2 : 0) })} titulo=${tn('regaloT')} texto=${tn('regaloX')}/>
    <${Interruptor} si=${prog.arranque} cambiar=${v => guardar({ arranque: v })} titulo=${tn('arranqueT')} texto=${tn('arranqueX')}/>
    <${Interruptor} si=${prog.sorpresa} cambiar=${v => guardar({ sorpresa: v })} titulo=${tn('sorpresaT')} texto=${tn('sorpresaX')}/>
    <button class="b-sec ancho" onClick=${() => setEquipo(true)}><${Icono} n="personas" t=${18}/>${tn('otroTel')}</button>
    <button class="b-texto" style="color:var(--out)" onClick=${() => confirm(tn('quitarSeguro')) && salir()}>${tn('quitar')}</button>
    ${equipo && html`<${Hoja} titulo=${tn('otroTel')} cerrar=${() => setEquipo(false)}>
      <div class="pila" style="justify-items:center;text-align:center">
        <p class="sub" style="margin:0">${tn('otroTelTexto')}</p>
        <${Qr} texto=${new URL('index.html#acceso=' + neg.pid + '.' + neg.clave, location.href).href} t=${210}/>
        ${!EN_NUBE && html`<div class="alerta"><${Icono} n="telefono" t=${18}/><span>${tn('otroTelDemo')}</span></div>`}
        <p class="pista">${tn('noCompartir')}</p>
      </div>
    </${Hoja}>`}
  </div>`;
}

render(html`<${App}/>`, document.getElementById('app'));
