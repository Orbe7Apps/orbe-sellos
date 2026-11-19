// Piezas que comparten la app del negocio y la tarjeta del cliente.
import { html, useState, useEffect, useRef } from '../../js/lib/preact-htm.js';
import qrcode from './lib/qrcode.js';

// ---------- Íconos de línea (grosor 2, puntas redondeadas) ----------
const P = {
  // Negocios
  cafe: 'M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 9.5h1.5a2.5 2.5 0 0 1 0 5H16M8 2.5v2.5M12 2.5v2.5M5 21h10',
  pan: 'M4 12a8 5 0 0 1 16 0v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM9 11l1.5 3M13 10.5l1.5 3.5',
  tijeras: 'M6 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8 7.5 20 19M8 16.5 20 5',
  helado: 'M7.5 11 12 21.5 16.5 11M7 11a5 5 0 0 1 10 0z',
  pizza: 'M3.5 6.5c5.5-3 11.5-3 17 0L12 21.5zM9.5 9.5h.01M13.5 12.5h.01M11 15.5h.01',
  copa: 'M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v7M8 21h8',
  auto: 'M4.5 16v-4l2-5h11l2 5v4zM4.5 12h15M7.5 16v2.5M16.5 16v2.5M8 13.5h.01M16 13.5h.01',
  pesa: 'M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11',
  flor: 'M12 21.5V13M12 13a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 6V3M8.5 9.5H6M18 9.5h-2.5M12 16c-2.5-2-5-2-6.5-1 1.5 2.5 4 3 6.5 1M12 16c2.5-2 5-2 6.5-1-1.5 2.5-4 3-6.5 1',
  bolsa: 'M5 8h14l-1 12.5H6zM9 8V6.5a3 3 0 0 1 6 0V8',
  estrella: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  corazon: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  // Interfaz
  regalo: 'M4 11h16v9.5H4zM3 7h18v4H3zM12 7v13.5M12 7c-1.5-4-6-4-5.5-.5M12 7c1.5-4 6-4 5.5-.5',
  sello: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM8.5 12.3l2.4 2.4 4.6-5',
  mas: 'M12 5v14M5 12h14', menos: 'M5 12h14', ok: 'M5 12.5l4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6 6 18',
  escanear: 'M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16',
  personas: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.5a6.5 6.5 0 0 1 3.5 5.5',
  cartel: 'M6 3h12v18H6zM9 7h6M9 17h6M10 10h4v4h-4z',
  ajustes: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  compartir: 'M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12',
  chat: 'M4 19.5l1.3-3.9A8 8 0 1 1 8.4 18.7z',
  telefono: 'M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM11 18.5h2',
  deshacer: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  imprimir: 'M7 9V3h10v6M7 17H4.5V9h15v8H17M7 14h10v7H7z',
  bajar: 'M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14',
  chispa: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  flecha: 'M9 6l6 6-6 6', atras: 'M15 6l-6 6 6 6',
  reloj: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2',
  tecla: 'M3 6.5h18v11H3zM7 10h.01M11 10h.01M15 10h.01M8 14h8'
};
export const ICONOS_NEGOCIO = ['cafe', 'pan', 'tijeras', 'helado', 'pizza', 'copa', 'auto', 'pesa', 'flor', 'bolsa', 'estrella', 'corazon'];
export const Icono = ({ n, t = 22, cls = '' }) => html`<svg class=${'ic ' + cls} width=${t} height=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${P[n] || P.estrella}/></svg>`;

// ---------- Colores de tarjeta ----------
export const COLORES = ['#6a5cf2', '#1a1733', '#8a5a3c', '#12a37a', '#0f8fa6', '#2f6fe0', '#e8436a', '#e07b00'];
const mezclar = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = c => Math.round(c * (1 - k)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

// ---------- La tarjeta ----------
// sellos: cuántos tiene; meta: casillas; nuevos: cuántos de los últimos se animan como recién puestos.
export function Tarjeta({ nombre, icono, color = COLORES[0], premio, meta, sellos, bienvenida = 0, nuevos = 0, codigo, chica }) {
  const lleno = Math.min(sellos, meta);
  const cols = meta <= 6 ? meta : meta <= 10 ? 5 : meta <= 12 ? 6 : 5;
  return html`<div class=${'tarjeta' + (chica ? ' chica' : '') + (sellos >= meta ? ' completa' : '')} style=${`--c:${color};--c2:${mezclar(color, 0.35)}`}>
    <div class="t-brillo"></div>
    <div class="t-cab">
      <span class="t-logo"><${Icono} n=${icono} t=${chica ? 18 : 22}/></span>
      <span class="t-nombre">${nombre || ' '}</span>
      ${codigo && html`<span class="t-cod">${codigo}</span>`}
    </div>
    <div class="t-sellos" style=${`grid-template-columns:repeat(${cols},1fr)`}>
      ${Array.from({ length: meta }, (_, i) => {
        const puesto = i < lleno, ultimo = i === meta - 1, nuevo = puesto && i >= lleno - nuevos;
        return html`<span key=${i} class=${'t-c' + (puesto ? ' si' : '') + (nuevo ? ' nuevo' : '') + (ultimo ? ' premio' : '') + (i < bienvenida && puesto ? ' regalo' : '')}
          style=${nuevo ? `animation-delay:${(i - (lleno - nuevos)) * 140}ms` : ''}>
          ${puesto ? html`<${Icono} n=${icono} t=${chica ? 13 : 18}/>` : ultimo ? html`<${Icono} n="regalo" t=${chica ? 13 : 18}/>` : null}
        </span>`;
      })}
    </div>
    <div class="t-pie"><${Icono} n="regalo" t=${chica ? 13 : 15}/><span>${premio || ' '}</span></div>
  </div>`;
}

// ---------- QR en SVG (se ve nítido en pantalla y al imprimir) ----------
export function Qr({ texto, t = 220, cls = '' }) {
  const q = qrcode(0, 'M'); q.addData(texto); q.make();
  const n = q.getModuleCount(), m = 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return html`<svg class=${'qr ' + cls} width=${t} height=${t} viewBox=${`0 0 ${n + 2 * m} ${n + 2 * m}`} shape-rendering="crispEdges" role="img" aria-label="QR"><rect width="100%" height="100%" fill="#fff"/><path d=${d} fill="#111"/></svg>`;
}

// ---------- Avisos cortos ----------
let pintarAviso = null;
export function avisar(texto, accion) { pintarAviso && pintarAviso({ texto, accion, id: Math.random() }); }
export function Avisos() {
  const [a, setA] = useState(null);
  useEffect(() => { pintarAviso = setA; return () => { pintarAviso = null; }; }, []);
  useEffect(() => { if (!a) return; const id = setTimeout(() => setA(null), a.accion ? 6000 : 2600); return () => clearTimeout(id); }, [a]);
  return a && html`<div class="aviso" key=${a.id} role="status"><span>${a.texto}</span>${a.accion && html`<button onClick=${() => { a.accion.f(); setA(null); }}>${a.accion.texto}</button>`}</div>`;
}

// ---------- Hoja que sube desde abajo ----------
export function Hoja({ titulo, cerrar, children, pie }) {
  const ref = useRef(null);
  useEffect(() => { const k = e => e.key === 'Escape' && cerrar(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return html`<div class="velo" onClick=${e => e.target === e.currentTarget && cerrar()}>
    <div class="hoja" ref=${ref} role="dialog" aria-modal="true" aria-label=${titulo}>
      <div class="h-raya"></div>
      <div class="h-cab"><h2>${titulo}</h2><button class="b-icono" onClick=${cerrar} aria-label="Cerrar"><${Icono} n="x" t=${20}/></button></div>
      <div class="h-cuerpo">${children}</div>
      ${pie && html`<div class="h-pie">${pie}</div>`}
    </div>
  </div>`;
}

// ---------- Vibración y sonido de sello ----------
let ctx = null;
export function golpe(fuerte) {
  try { navigator.vibrate && navigator.vibrate(fuerte ? [30, 60, 30, 60, 80] : 35); } catch (e) { /* sin vibración */ }
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    ctx = ctx || new A(); if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime;
    o.type = 'triangle'; o.frequency.setValueAtTime(fuerte ? 660 : 520, t0); o.frequency.exponentialRampToValueAtTime(fuerte ? 1320 : 260, t0 + 0.12);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + 0.2);
  } catch (e) { /* sin sonido */ }
}

// ---------- Confeti cuando el premio está listo ----------
export function confeti(color) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'); cv.className = 'confeti'; document.body.appendChild(cv);
  const dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
  const x = cv.getContext('2d'); x.scale(dpr, dpr);
  const cs = [color, '#3ddc9f', '#f0a020', '#8f84ff', '#ff6b8b'];
  const ps = Array.from({ length: 110 }, () => ({ x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: cs[(Math.random() * cs.length) | 0] }));
  let f = 0;
  (function paso() {
    x.clearRect(0, 0, W, H);
    for (const p of ps) { p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }
    if (++f < 150) requestAnimationFrame(paso); else cv.remove();
  })();
}

// Enlace de la tarjeta del cliente (lo que lleva el QR del cartel y el de cada tarjeta).
export const enlaceTarjeta = (pid, extra = '') => new URL('t.html?p=' + pid + extra, location.href.replace(/[^/]*$/, '')).href;
