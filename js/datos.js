// Datos de Orbe Sellos. Las mismas funciones existen en dos lugares:
// - en este aparato (modo demostración), aquí abajo;
// - en la nube (Supabase), en supabase/esquema.sql, con los mismos nombres y las mismas reglas.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const EN_NUBE = !!(SUPABASE_URL && SUPABASE_KEY);
export const MINUTOS_DESHACER = 10;      // se puede deshacer un sello o un premio durante 10 minutos
export const MINUTOS_REPETIDO = 10;      // si se vuelve a sellar antes de esto, se pregunta
export const PROB_SORPRESA = 0.1;        // 1 de cada 10 sellos sencillos sale doble (si está activado)

// ---------- Utilidades ----------
const LETRAS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';   // sin 0/O ni 1/I/L: se dictan sin confusión
export function aleatorio(n, abc = 'abcdefghijkmnpqrstuvwxyz23456789') {
  const b = crypto.getRandomValues(new Uint8Array(n)); let s = '';
  for (const x of b) s += abc[x % abc.length];
  return s;
}
export const limpiarCodigo = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
const ahora = () => Date.now();
const error = (codigo) => { const e = new Error(codigo); e.codigo = codigo; throw e; };

// ---------- Lo que guarda cada aparato (no la base) ----------
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin espacio o bloqueado */ } };
export const miNegocio = () => leer('orbe-sellos-negocio', null);                 // { pid, clave } del dueño en este teléfono
export const guardarMiNegocio = v => escribir('orbe-sellos-negocio', v);
export const olvidarMiNegocio = () => { try { localStorage.removeItem('orbe-sellos-negocio'); } catch (e) { /* nada */ } };
export const misTarjetas = () => leer('orbe-sellos-tarjetas', {});                // { pid: cid } del cliente en este teléfono
export const guardarMiTarjeta = (pid, cid) => { const t = misTarjetas(); t[pid] = cid; escribir('orbe-sellos-tarjetas', t); };

// ---------- Modo demostración: la "base" vive en este navegador ----------
const DB = 'orbe-sellos-db';
const base = () => leer(DB, { programas: {}, tarjetas: {}, movs: [] });
const oyentes = new Set();
const guardarBase = db => { escribir(DB, db); oyentes.forEach(f => f()); };
window.addEventListener('storage', e => { if (e.key === DB) oyentes.forEach(f => f()); });

const sha = async s => { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); };
async function dueno(db, pid, clave) {
  const p = db.programas[pid]; if (!p) error('no_existe');
  if (p.claveHash !== await sha(clave || '')) error('sin_permiso');
  return p;
}
const publico = p => ({ pid: p.pid, nombre: p.nombre, icono: p.icono, color: p.color, premio: p.premio, meta: p.meta, bienvenida: p.bienvenida, idioma: p.idioma });
const vistaTarjeta = (db, t) => {
  const ult = db.movs.filter(m => m.cid === t.cid && !m.anulado).slice(-1)[0] || null;
  return { cid: t.cid, pid: t.pid, codigo: t.codigo, sellos: t.sellos, canjes: t.canjes, visitas: t.visitas, nombre: t.nombre || '', creada: t.creada, ultima: t.ultima, version: t.version,
    ultimo: ult && { id: ult.id, g: ult.g, tipo: ult.tipo, cantidad: ult.cantidad, fecha: ult.fecha } };
};
const vistaDueno = (db, t) => ({ ...vistaTarjeta(db, t), telefono: t.telefono || '', cumple: t.cumple || '', ref: t.ref || '' });
const mov = (db, g, t, tipo, cantidad) => { const m = { id: aleatorio(10), g, pid: t.pid, cid: t.cid, tipo, cantidad, fecha: ahora(), anulado: false }; db.movs.push(m); return m; };
const tocar = t => { t.version = (t.version || 0) + 1; };

const local = {
  async crear_programa({ nombre, icono, color, premio, meta, bienvenida = 2, idioma = 'es' }) {
    const db = base(), pid = aleatorio(8), clave = aleatorio(24);
    db.programas[pid] = { pid, claveHash: await sha(clave), nombre: String(nombre).slice(0, 40), icono, color, premio: String(premio).slice(0, 40),
      meta: Math.max(3, Math.min(20, meta | 0)), bienvenida: Math.max(0, Math.min(3, bienvenida | 0)), sorpresa: true, arranque: true, idioma, creado: ahora() };
    guardarBase(db);
    return { pid, clave };
  },
  async programa_publico({ pid }) { const p = base().programas[pid]; if (!p) error('no_existe'); return publico(p); },
  async programa({ pid, clave }) { const db = base(), p = await dueno(db, pid, clave); const { claveHash, ...resto } = p; return resto; },
  async ajustar({ pid, clave, cambios }) {
    const db = base(), p = await dueno(db, pid, clave);
    for (const k of ['nombre', 'icono', 'color', 'premio', 'meta', 'bienvenida', 'sorpresa', 'arranque', 'idioma']) if (k in cambios) p[k] = cambios[k];
    p.meta = Math.max(3, Math.min(20, p.meta | 0)); p.bienvenida = Math.max(0, Math.min(3, p.bienvenida | 0));
    guardarBase(db); const { claveHash, ...resto } = p; return resto;
  },
  async unirse({ pid, ref }) {
    const db = base(), p = db.programas[pid]; if (!p) error('no_existe');
    const usados = new Set(Object.values(db.tarjetas).filter(t => t.pid === pid).map(t => t.codigo));
    let codigo; do codigo = aleatorio(4, LETRAS); while (usados.has(codigo));
    const padrino = ref && Object.values(db.tarjetas).find(t => t.pid === pid && t.codigo === limpiarCodigo(ref));
    const t = { cid: aleatorio(12), pid, codigo, sellos: 0, canjes: 0, visitas: 0, creada: ahora(), ultima: 0, version: 0, ref: padrino ? padrino.cid : '', refPagado: false };
    db.tarjetas[t.cid] = t;
    const g = aleatorio(10);
    if (p.bienvenida) { t.sellos += p.bienvenida; mov(db, g, t, 'bienvenida', p.bienvenida); }
    if (padrino) { t.sellos += 1; mov(db, g, t, 'invitado', 1); }
    tocar(t); guardarBase(db);
    return vistaTarjeta(db, t);
  },
  async ver_tarjeta({ pid, cid }) { const db = base(), t = db.tarjetas[cid]; if (!t || t.pid !== pid) error('no_existe'); return vistaTarjeta(db, t); },
  async datos_cliente({ pid, cid, nombre, telefono, cumple }) {
    const db = base(), t = db.tarjetas[cid]; if (!t || t.pid !== pid) error('no_existe');
    t.nombre = String(nombre || '').slice(0, 40); t.telefono = String(telefono || '').replace(/[^\d+]/g, '').slice(0, 20); t.cumple = String(cumple || '').slice(0, 5);
    tocar(t); guardarBase(db); return vistaTarjeta(db, t);
  },
  async buscar({ pid, clave, q }) {
    const db = base(); await dueno(db, pid, clave);
    const s = String(q || '').trim();
    // Puede llegar el enlace completo leído del QR, el id de la tarjeta o el código de 4 letras.
    const cidQr = (s.match(/^OS1:([a-z0-9]+)$/i) || s.match(/[?&]c=([a-z0-9]+)/i) || [])[1];
    const t = db.tarjetas[cidQr || s] || Object.values(db.tarjetas).find(x => x.pid === pid && x.codigo === limpiarCodigo(s));
    return t && t.pid === pid ? vistaDueno(db, t) : null;
  },
  async sellar({ pid, clave, cid, n = 1 }) {
    const db = base(), p = await dueno(db, pid, clave), t = db.tarjetas[cid]; if (!t || t.pid !== pid) error('no_existe');
    n = Math.max(1, Math.min(20, n | 0));
    const g = aleatorio(10);
    t.sellos += n; t.visitas += 1; t.ultima = ahora(); mov(db, g, t, 'sello', n);
    let sorpresa = false, amigo = null;
    if (p.sorpresa && n === 1 && Math.random() < PROB_SORPRESA) { t.sellos += 1; mov(db, g, t, 'sorpresa', 1); sorpresa = true; }
    // Quien invitó gana su sello cuando el amigo compra por primera vez (no al registrarse).
    if (t.ref && !t.refPagado) {
      const r = db.tarjetas[t.ref];
      if (r) { r.sellos += 1; mov(db, g, r, 'amigo', 1); tocar(r); amigo = { codigo: r.codigo, nombre: r.nombre || '' }; }
      t.refPagado = true;
    }
    tocar(t); guardarBase(db);
    return { g, tarjeta: vistaDueno(db, t), sorpresa, amigo };
  },
  async canjear({ pid, clave, cid }) {
    const db = base(), p = await dueno(db, pid, clave), t = db.tarjetas[cid]; if (!t || t.pid !== pid) error('no_existe');
    if (t.sellos < p.meta) error('faltan_sellos');
    const g = aleatorio(10);
    t.sellos -= p.meta; t.canjes += 1; mov(db, g, t, 'canje', p.meta);
    // La tarjeta nueva no empieza vacía: después del premio el ritmo de compra baja, y un sello lo levanta.
    if (p.arranque) { t.sellos += 1; mov(db, g, t, 'arranque', 1); }
    tocar(t); guardarBase(db);
    return { g, tarjeta: vistaDueno(db, t) };
  },
  async deshacer({ pid, clave, g }) {
    const db = base(); await dueno(db, pid, clave);
    const ms = db.movs.filter(m => m.g === g && m.pid === pid && !m.anulado);
    if (!ms.length) error('no_existe');
    if (ahora() - ms[0].fecha > MINUTOS_DESHACER * 60000) error('muy_tarde');
    let principal = null;
    for (const m of ms.reverse()) {
      const t = db.tarjetas[m.cid]; m.anulado = true;
      if (m.tipo === 'canje') { t.sellos += m.cantidad; t.canjes -= 1; } else t.sellos -= m.cantidad;
      if (m.tipo === 'sello') { t.visitas -= 1; principal = t; }
      if (m.tipo === 'canje') principal = t;
      if (m.tipo === 'amigo') { const hijo = db.tarjetas[ms.find(x => x.tipo === 'sello')?.cid]; if (hijo) hijo.refPagado = false; }
      t.sellos = Math.max(0, t.sellos); tocar(t);
    }
    if (principal) { const prev = db.movs.filter(m => m.cid === principal.cid && m.tipo === 'sello' && !m.anulado).slice(-1)[0]; principal.ultima = prev ? prev.fecha : 0; }
    guardarBase(db);
    return { tarjeta: principal && vistaDueno(db, principal) };
  },
  async clientes({ pid, clave }) {
    const db = base(); await dueno(db, pid, clave);
    return Object.values(db.tarjetas).filter(t => t.pid === pid).map(t => vistaDueno(db, t)).sort((a, b) => (b.ultima || b.creada) - (a.ultima || a.creada));
  },
  async resumen({ pid, clave }) {
    const db = base(), p = await dueno(db, pid, clave);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0); const h0 = hoy.getTime(), d30 = ahora() - 30 * 864e5;
    const ts = Object.values(db.tarjetas).filter(t => t.pid === pid), ms = db.movs.filter(m => m.pid === pid && !m.anulado);
    const vuelven = ts.filter(t => t.visitas >= 2).length, conVisita = ts.filter(t => t.visitas >= 1).length;
    return {
      clientes: ts.length,
      nuevosHoy: ts.filter(t => t.creada >= h0).length,
      sellosHoy: ms.filter(m => m.fecha >= h0 && m.tipo === 'sello').reduce((s, m) => s + m.cantidad, 0),
      visitasHoy: ms.filter(m => m.fecha >= h0 && m.tipo === 'sello').length,
      premiosHoy: ms.filter(m => m.fecha >= h0 && m.tipo === 'canje').length,
      premios: ms.filter(m => m.tipo === 'canje').length,
      activos: ts.filter(t => t.ultima >= d30).length,
      vuelven: conVisita ? Math.round(100 * vuelven / conVisita) : 0,
      listos: ts.filter(t => t.sellos >= p.meta).length,
      cerca: ts.filter(t => t.sellos < p.meta && p.meta - t.sellos <= 2).length
    };
  }
};

// ---------- En la nube: las mismas funciones en Supabase ----------
async function nube(fn, args) {
  const cuerpo = {}; for (const k in args) cuerpo['p_' + k] = args[k];
  const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) error((j && j.message) || 'sin_conexion');
  return j;
}

export const llamar = (fn, args = {}) => EN_NUBE ? nube(fn, args) : local[fn](args);

// Avisa cuando cambia algo (para que la tarjeta del cliente se llene en vivo).
// En este aparato: al instante. En la nube: revisa cada 3 segundos mientras la pantalla está visible.
export function alCambiar(f) {
  if (!EN_NUBE) { oyentes.add(f); return () => oyentes.delete(f); }
  const id = setInterval(() => { if (document.visibilityState === 'visible') f(); }, 3000);
  const vis = () => document.visibilityState === 'visible' && f();
  document.addEventListener('visibilitychange', vis);
  return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
}
