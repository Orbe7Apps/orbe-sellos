// Tarjeta del cliente: se abre al escanear el QR del cartel. Sin app, sin registro.
import { html, render, useState, useEffect, useRef } from '../../js/lib/preact-htm.js';
import { llamar, alCambiar, misTarjetas, guardarMiTarjeta } from './datos.js';
import { t, IDIOMA } from './textos.js';
import { Tarjeta, Qr, Icono, Hoja, Avisos, avisar, golpe, confeti, enlaceTarjeta } from './comun.js';

const q = new URLSearchParams(location.search);
const PID = q.get('p') || '';
const REF = q.get('r') || '';
document.documentElement.lang = IDIOMA;

function App() {
  const [prog, setProg] = useState(null);
  const [tar, setTar] = useState(null);
  const [estado, setEstado] = useState('cargando');   // cargando | unirse | tarjeta | error
  const [nuevos, setNuevos] = useState(0);
  const [toast, setToast] = useState(null);
  const [hoja, setHoja] = useState(null);
  const previa = useRef(null);

  // Primera carga: el programa y, si este teléfono ya tiene tarjeta, la tarjeta.
  useEffect(() => { (async () => {
    try {
      const p = await llamar('programa_publico', { pid: PID }); setProg(p);
      document.title = p.nombre + ' · ' + t('marca');
      const cid = q.get('c') || misTarjetas()[PID];
      if (cid) {
        try { const x = await llamar('ver_tarjeta', { pid: PID, cid }); guardarMiTarjeta(PID, cid); fijarUrl(cid); previa.current = x; setTar(x); setEstado('tarjeta'); return; }
        catch (e) { /* la tarjeta ya no existe: se ofrece una nueva */ }
      }
      setEstado('unirse');
    } catch (e) { setEstado(e.codigo === 'no_existe' ? 'error' : 'sin_conexion'); }
  })(); }, []);

  // En vivo: cuando el negocio sella, la tarjeta se llena aquí.
  useEffect(() => {
    if (estado !== 'tarjeta') return;
    return alCambiar(async () => {
      try {
        const x = await llamar('ver_tarjeta', { pid: PID, cid: previa.current.cid });
        const antes = previa.current; if (x.version === antes.version) return;
        previa.current = x; setTar(x);
        const u = x.ultimo; if (!u || (antes.ultimo && u.id === antes.ultimo.id)) return;
        if (u.tipo === 'canje' || u.tipo === 'arranque') { setNuevos(x.sellos); mostrar(t('canje'), 'regalo'); golpe(true); return; }
        const dif = x.sellos - antes.sellos; if (dif <= 0) return;
        setNuevos(dif);
        mostrar(u.tipo === 'sorpresa' ? t('sorpresa') : u.tipo === 'amigo' ? t('amigo') : t(dif === 1 ? 'sello' : 'sellos', { n: dif }), u.tipo === 'sorpresa' ? 'chispa' : 'sello');
        golpe(x.sellos >= prog.meta);
        if (x.sellos >= prog.meta && antes.sellos < prog.meta) setTimeout(() => confeti(prog.color), 500);
      } catch (e) { /* sin conexión: se vuelve a intentar */ }
    });
  }, [estado]);

  function mostrar(texto, icono) { setToast({ texto, icono, id: Math.random() }); setTimeout(() => setToast(s => s && s.texto === texto ? null : s), 3200); }

  async function unirme() {
    try {
      const x = await llamar('unirse', { pid: PID, ref: REF });
      guardarMiTarjeta(PID, x.cid); fijarUrl(x.cid);
      previa.current = x; setTar(x); setNuevos(x.sellos); setEstado('tarjeta');
      golpe(); mostrar(x.sellos === 1 ? t('regaloTituloUno') : t('regaloTitulo', { n: x.sellos }), 'regalo');
    } catch (e) { avisar(t('sinConexion')); }
  }

  if (estado === 'cargando') return html`<div class="app cliente"></div>`;
  if (estado === 'error' || estado === 'sin_conexion') return html`<div class="app cliente anima"><div class="vacio"><${Icono} n="sello" t=${40}/><p>${t(estado === 'error' ? 'noExiste' : 'sinConexion')}</p></div></div>`;

  const p = prog;
  if (estado === 'unirse') {
    const regalo = p.bienvenida + (REF ? 1 : 0);
    return html`<div class="app cliente anima">
      <${Tarjeta} ...${p} sellos=${regalo} bienvenida=${regalo} nuevos=${regalo}/>
      <div class="c-mensaje"><h1>${regalo === 0 ? t('unete0') : regalo === 1 ? t('uneteUno') : t('unete', { n: regalo })}</h1><p>${t('sinApp')}</p></div>
      <button class="b-pri" style="margin-top:18px" onClick=${unirme}><${Icono} n="sello"/>${t('quiero')}</button>
      <p class="pie-marca">${t('hecho')}</p>
      <${Avisos}/>
    </div>`;
  }

  const faltan = Math.max(0, p.meta - tar.sellos);
  const enlaceInvitar = enlaceTarjeta(PID, '&r=' + tar.codigo);
  async function invitar() {
    const texto = t('invitarTexto', { negocio: p.nombre, meta: p.meta - p.bienvenida, premio: p.premio });
    try { if (navigator.share) { await navigator.share({ title: p.nombre, text: texto, url: enlaceInvitar }); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(texto + ' ' + enlaceInvitar); avisar(t('copiado')); } catch (e) { location.href = 'https://wa.me/?text=' + encodeURIComponent(texto + ' ' + enlaceInvitar); }
  }

  return html`<div class="app cliente anima" style=${`--c:${p.color}`}>
    ${toast && html`<div class="toast-sello" key=${toast.id}><span class="ic-c"><${Icono} n=${toast.icono} t=${18}/></span>${toast.texto}</div>`}
    <${Tarjeta} ...${p} sellos=${tar.sellos} bienvenida=${tar.canjes ? 0 : p.bienvenida} nuevos=${nuevos} codigo=${tar.codigo}/>
    <div class="c-mensaje">
      <h1>${faltan === 0 ? t('listo', { premio: p.premio }) : faltan === 1 ? t('falta1', { premio: p.premio }) : t('faltan', { n: faltan, premio: p.premio })}</h1>
      <p>${faltan === 0 ? t('listoSub') : tar.canjes ? (tar.canjes === 1 ? t('premio1') : t('premios', { n: tar.canjes })) : t('muestra')}</p>
    </div>
    <div class="c-qr" style="margin-top:16px">
      <${Qr} texto=${'OS1:' + tar.cid} t=${196}/>
      <span class="etq" style="margin:0">${t('tuCodigo')}</span>
      <span class="codigo">${tar.codigo}</span>
    </div>
    <div class="pila" style="margin-top:14px">
      <button class="b-sec ancho" onClick=${invitar}><${Icono} n="compartir" t=${20}/>${t('invitar')}</button>
      <div class="fila">
        <button class="b-sec ancho" onClick=${() => setHoja('guardar')}><${Icono} n="telefono" t=${20}/>${t('guardar')}</button>
        <button class="b-sec ancho" onClick=${() => setHoja('datos')}><${Icono} n="chat" t=${20}/>${t('avisame')}</button>
      </div>
      <p class="pista" style="justify-content:center;text-align:center">${t('invitarSub')}</p>
    </div>
    <p class="pie-marca">${t('perdiste')}<br/>${t('hecho')}</p>
    ${hoja === 'guardar' && html`<${Hoja} titulo=${t('guardar')} cerrar=${() => setHoja(null)}>
      <p style="margin:0 0 8px">${/iPhone|iPad|Macintosh/.test(navigator.userAgent) ? t('guardarIos') : t('guardarAndroid')}</p>
    </${Hoja}>`}
    ${hoja === 'datos' && html`<${Datos} tar=${tar} cerrar=${() => setHoja(null)} listo=${x => { previa.current = x; setTar(x); setHoja(null); avisar(t('datosOk')); }}/>`}
    <${Avisos}/>
  </div>`;
}

function Datos({ tar, cerrar, listo }) {
  const [f, setF] = useState({ nombre: tar.nombre || '', telefono: '', cumple: '' });
  const cambiar = k => e => setF({ ...f, [k]: e.target.value });
  async function guardar() { try { listo(await llamar('datos_cliente', { pid: PID, cid: tar.cid, ...f })); } catch (e) { avisar(t('sinConexion')); } }
  return html`<${Hoja} titulo=${t('avisame')} cerrar=${cerrar} pie=${html`<button class="b-pri" onClick=${guardar}>${t('guardarDatos')}</button>`}>
    <p class="sub" style="margin:0 0 14px">${t('avisameSub')}</p>
    <div class="pila">
      <label><span class="etq">${t('nombre')}</span><input value=${f.nombre} onInput=${cambiar('nombre')} autocomplete="given-name"/></label>
      <label><span class="etq">${t('whatsapp')}</span><input value=${f.telefono} onInput=${cambiar('telefono')} inputmode="tel" autocomplete="tel" placeholder="+1 555 123 4567"/></label>
      <label><span class="etq">${t('cumple')}</span><input value=${f.cumple} onInput=${cambiar('cumple')} inputmode="numeric" placeholder="24/12" maxlength="5"/></label>
    </div>
  </${Hoja}>`;
}

// Deja el id de la tarjeta en la dirección: así, si se guarda en la pantalla de inicio, abre siempre esta tarjeta.
function fijarUrl(cid) { const u = new URL(location.href); u.searchParams.set('c', cid); u.searchParams.delete('r'); history.replaceState(null, '', u); }

render(html`<${App}/>`, document.getElementById('app'));
