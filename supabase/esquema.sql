-- Orbe Sellos en Supabase. Mismas funciones y mismas reglas que el modo demostración (js/datos.js).
-- Las tablas no se leen directo: RLS activado sin políticas, todo pasa por funciones "security definer".
-- El dueño se identifica con su clave (se guarda solo su huella SHA-256). El cliente, con el id de su tarjeta (12 letras al azar).

create extension if not exists pgcrypto;

create table if not exists sellos_programas (
  pid text primary key,
  clave_hash text not null,
  nombre text not null,
  icono text not null default 'estrella',
  color text not null default '#6a5cf2',
  premio text not null,
  meta int not null check (meta between 3 and 20),
  bienvenida int not null default 2 check (bienvenida between 0 and 3),
  sorpresa boolean not null default true,
  arranque boolean not null default true,
  idioma text not null default 'es',
  creado timestamptz not null default now()
);

create table if not exists sellos_tarjetas (
  cid text primary key,
  pid text not null references sellos_programas on delete cascade,
  codigo text not null,
  sellos int not null default 0,
  canjes int not null default 0,
  visitas int not null default 0,
  creada timestamptz not null default now(),
  ultima timestamptz,
  version int not null default 0,
  nombre text not null default '',
  telefono text not null default '',
  cumple text not null default '',
  ref text not null default '',
  ref_pagado boolean not null default false,
  unique (pid, codigo)
);

create table if not exists sellos_movs (
  id bigserial primary key,
  g text not null,
  pid text not null references sellos_programas on delete cascade,
  cid text not null references sellos_tarjetas on delete cascade,
  tipo text not null,
  cantidad int not null,
  fecha timestamptz not null default now(),
  anulado boolean not null default false
);
create index if not exists sellos_movs_cid on sellos_movs (cid, id);
create index if not exists sellos_movs_g on sellos_movs (g);
create index if not exists sellos_movs_pid_fecha on sellos_movs (pid, fecha);

alter table sellos_programas enable row level security;
alter table sellos_tarjetas enable row level security;
alter table sellos_movs enable row level security;

-- ---------- Ayudas ----------
create or replace function sellos_azar(n int, abc text default 'abcdefghijkmnpqrstuvwxyz23456789') returns text
language sql volatile as $$
  select string_agg(substr(abc, (get_byte(b, i) % length(abc)) + 1, 1), '')
  from (select gen_random_bytes(n) b) x, generate_series(0, n - 1) i
$$;

create or replace function sellos_ms(t timestamptz) returns bigint language sql immutable as $$ select coalesce((extract(epoch from t) * 1000)::bigint, 0) $$;

create or replace function sellos_dueno(p_pid text, p_clave text) returns sellos_programas
language plpgsql security definer set search_path = public, extensions as $$
declare p sellos_programas;
begin
  select * into p from sellos_programas where pid = p_pid;
  if not found then raise exception 'no_existe'; end if;
  if p.clave_hash <> encode(digest(coalesce(p_clave, ''), 'sha256'), 'hex') then raise exception 'sin_permiso'; end if;
  return p;
end $$;

create or replace function sellos_vista(t sellos_tarjetas, dueno boolean) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'cid', t.cid, 'pid', t.pid, 'codigo', t.codigo, 'sellos', t.sellos, 'canjes', t.canjes, 'visitas', t.visitas, 'nombre', t.nombre,
    'creada', sellos_ms(t.creada), 'ultima', sellos_ms(t.ultima), 'version', t.version,
    'ultimo', (select json_build_object('id', m.id::text, 'g', m.g, 'tipo', m.tipo, 'cantidad', m.cantidad, 'fecha', sellos_ms(m.fecha))
               from sellos_movs m where m.cid = t.cid and not m.anulado order by m.id desc limit 1),
    'telefono', case when dueno then t.telefono end, 'cumple', case when dueno then t.cumple end, 'ref', case when dueno then t.ref end)
$$;

create or replace function sellos_programa_json(p sellos_programas, completo boolean) returns json language sql immutable as $$
  select case when completo then
    json_build_object('pid', p.pid, 'nombre', p.nombre, 'icono', p.icono, 'color', p.color, 'premio', p.premio, 'meta', p.meta, 'bienvenida', p.bienvenida,
                      'sorpresa', p.sorpresa, 'arranque', p.arranque, 'idioma', p.idioma, 'creado', sellos_ms(p.creado))
  else
    json_build_object('pid', p.pid, 'nombre', p.nombre, 'icono', p.icono, 'color', p.color, 'premio', p.premio, 'meta', p.meta, 'bienvenida', p.bienvenida, 'idioma', p.idioma)
  end
$$;

-- ---------- Dueño ----------
create or replace function crear_programa(p_nombre text, p_icono text, p_color text, p_premio text, p_meta int, p_bienvenida int default 2, p_idioma text default 'es')
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_pid text := sellos_azar(8); v_clave text := sellos_azar(24);
begin
  insert into sellos_programas (pid, clave_hash, nombre, icono, color, premio, meta, bienvenida, idioma)
  values (v_pid, encode(digest(v_clave, 'sha256'), 'hex'), left(p_nombre, 40), p_icono, p_color, left(p_premio, 40),
          greatest(3, least(20, p_meta)), greatest(0, least(3, p_bienvenida)), coalesce(p_idioma, 'es'));
  return json_build_object('pid', v_pid, 'clave', v_clave);
end $$;

create or replace function programa(p_pid text, p_clave text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin return sellos_programa_json(sellos_dueno(p_pid, p_clave), true); end $$;

create or replace function ajustar(p_pid text, p_clave text, p_cambios json) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare p sellos_programas := sellos_dueno(p_pid, p_clave);
begin
  update sellos_programas set
    nombre = coalesce(left(p_cambios->>'nombre', 40), nombre),
    icono = coalesce(p_cambios->>'icono', icono),
    color = coalesce(p_cambios->>'color', color),
    premio = coalesce(left(p_cambios->>'premio', 40), premio),
    meta = greatest(3, least(20, coalesce((p_cambios->>'meta')::int, meta))),
    bienvenida = greatest(0, least(3, coalesce((p_cambios->>'bienvenida')::int, bienvenida))),
    sorpresa = coalesce((p_cambios->>'sorpresa')::boolean, sorpresa),
    arranque = coalesce((p_cambios->>'arranque')::boolean, arranque),
    idioma = coalesce(p_cambios->>'idioma', idioma)
  where pid = p_pid returning * into p;
  return sellos_programa_json(p, true);
end $$;

create or replace function buscar(p_pid text, p_clave text, p_q text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare t sellos_tarjetas; v text := trim(coalesce(p_q, '')); v_cid text;
begin
  perform sellos_dueno(p_pid, p_clave);
  v_cid := coalesce(substring(v from '^OS1:([a-z0-9]+)$'), substring(v from '[?&]c=([a-z0-9]+)'), v);
  select * into t from sellos_tarjetas where pid = p_pid and cid = v_cid;
  if not found then
    select * into t from sellos_tarjetas where pid = p_pid
      and codigo = translate(regexp_replace(upper(v), '[^A-Z0-9]', '', 'g'), 'OIL', '011');
  end if;
  if not found then return null; end if;
  return sellos_vista(t, true);
end $$;

create or replace function sellar(p_pid text, p_clave text, p_cid text, p_n int default 1) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare p sellos_programas := sellos_dueno(p_pid, p_clave); t sellos_tarjetas; r sellos_tarjetas;
        v_g text := sellos_azar(10); v_n int := greatest(1, least(20, coalesce(p_n, 1)));
        v_sorpresa boolean := false; v_amigo json := null; v_pagar boolean;
begin
  select * into t from sellos_tarjetas where cid = p_cid and pid = p_pid for update;
  if not found then raise exception 'no_existe'; end if;
  v_pagar := t.ref <> '' and not t.ref_pagado;
  insert into sellos_movs (g, pid, cid, tipo, cantidad) values (v_g, p_pid, p_cid, 'sello', v_n);
  if p.sorpresa and v_n = 1 and random() < 0.1 then
    v_sorpresa := true;
    insert into sellos_movs (g, pid, cid, tipo, cantidad) values (v_g, p_pid, p_cid, 'sorpresa', 1);
  end if;
  update sellos_tarjetas set sellos = sellos + v_n + (case when v_sorpresa then 1 else 0 end), visitas = visitas + 1, ultima = now(), version = version + 1,
         ref_pagado = ref_pagado or v_pagar
    where cid = p_cid returning * into t;
  -- Quien invitó gana su sello cuando el amigo compra por primera vez.
  if v_pagar then
    update sellos_tarjetas set sellos = sellos + 1, version = version + 1 where cid = t.ref and pid = p_pid returning * into r;
    if found then
      insert into sellos_movs (g, pid, cid, tipo, cantidad) values (v_g, p_pid, r.cid, 'amigo', 1);
      v_amigo := json_build_object('codigo', r.codigo, 'nombre', r.nombre);
    end if;
  end if;
  return json_build_object('g', v_g, 'tarjeta', sellos_vista(t, true), 'sorpresa', v_sorpresa, 'amigo', v_amigo);
end $$;

create or replace function canjear(p_pid text, p_clave text, p_cid text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare p sellos_programas := sellos_dueno(p_pid, p_clave); t sellos_tarjetas; v_g text := sellos_azar(10);
begin
  select * into t from sellos_tarjetas where cid = p_cid and pid = p_pid for update;
  if not found then raise exception 'no_existe'; end if;
  if t.sellos < p.meta then raise exception 'faltan_sellos'; end if;
  insert into sellos_movs (g, pid, cid, tipo, cantidad) values (v_g, p_pid, p_cid, 'canje', p.meta);
  if p.arranque then insert into sellos_movs (g, pid, cid, tipo, cantidad) values (v_g, p_pid, p_cid, 'arranque', 1); end if;
  update sellos_tarjetas set sellos = sellos - p.meta + (case when p.arranque then 1 else 0 end), canjes = canjes + 1, version = version + 1
    where cid = p_cid returning * into t;
  return json_build_object('g', v_g, 'tarjeta', sellos_vista(t, true));
end $$;

create or replace function deshacer(p_pid text, p_clave text, p_g text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare m record; t sellos_tarjetas; v_principal text; v_primera timestamptz;
begin
  perform sellos_dueno(p_pid, p_clave);
  select min(fecha) into v_primera from sellos_movs where g = p_g and pid = p_pid and not anulado;
  if v_primera is null then raise exception 'no_existe'; end if;
  if now() - v_primera > interval '10 minutes' then raise exception 'muy_tarde'; end if;
  for m in select * from sellos_movs where g = p_g and pid = p_pid and not anulado order by id desc loop
    update sellos_movs set anulado = true where id = m.id;
    if m.tipo = 'canje' then
      update sellos_tarjetas set sellos = sellos + m.cantidad, canjes = canjes - 1, version = version + 1 where cid = m.cid;
      v_principal := m.cid;
    else
      update sellos_tarjetas set sellos = greatest(0, sellos - m.cantidad), version = version + 1,
             visitas = visitas - (case when m.tipo = 'sello' then 1 else 0 end) where cid = m.cid;
      if m.tipo = 'sello' then v_principal := m.cid; end if;
    end if;
  end loop;
  if v_principal is not null then
    update sellos_tarjetas set
      ultima = (select max(fecha) from sellos_movs where cid = v_principal and tipo = 'sello' and not anulado),
      ref_pagado = case when ref <> '' then exists (select 1 from sellos_movs a join sellos_movs s on s.g = a.g
                     where a.tipo = 'amigo' and not a.anulado and s.cid = v_principal and s.tipo = 'sello' and not s.anulado) else ref_pagado end
      where cid = v_principal returning * into t;
    return json_build_object('tarjeta', sellos_vista(t, true));
  end if;
  return json_build_object('tarjeta', null);
end $$;

create or replace function clientes(p_pid text, p_clave text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform sellos_dueno(p_pid, p_clave);
  return coalesce((select json_agg(sellos_vista(t, true) order by coalesce(t.ultima, t.creada) desc) from sellos_tarjetas t where t.pid = p_pid), '[]'::json);
end $$;

-- "Hoy" según la zona horaria del navegador: p_desde es la medianoche local en milisegundos (si no llega, medianoche UTC).
create or replace function resumen(p_pid text, p_clave text, p_desde bigint default null) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare p sellos_programas := sellos_dueno(p_pid, p_clave);
        h0 timestamptz := coalesce(to_timestamp(p_desde / 1000.0), date_trunc('day', now()));
        v_con int; v_vuelven int;
begin
  select count(*) filter (where visitas >= 1), count(*) filter (where visitas >= 2) into v_con, v_vuelven from sellos_tarjetas where pid = p_pid;
  return json_build_object(
    'clientes', (select count(*) from sellos_tarjetas where pid = p_pid),
    'nuevosHoy', (select count(*) from sellos_tarjetas where pid = p_pid and creada >= h0),
    'sellosHoy', (select coalesce(sum(cantidad), 0) from sellos_movs where pid = p_pid and not anulado and tipo = 'sello' and fecha >= h0),
    'visitasHoy', (select count(*) from sellos_movs where pid = p_pid and not anulado and tipo = 'sello' and fecha >= h0),
    'premiosHoy', (select count(*) from sellos_movs where pid = p_pid and not anulado and tipo = 'canje' and fecha >= h0),
    'premios', (select count(*) from sellos_movs where pid = p_pid and not anulado and tipo = 'canje'),
    'activos', (select count(*) from sellos_tarjetas where pid = p_pid and ultima >= now() - interval '30 days'),
    'vuelven', case when v_con > 0 then round(100.0 * v_vuelven / v_con) else 0 end,
    'listos', (select count(*) from sellos_tarjetas where pid = p_pid and sellos >= p.meta),
    'cerca', (select count(*) from sellos_tarjetas where pid = p_pid and sellos < p.meta and p.meta - sellos <= 2));
end $$;

-- ---------- Cliente ----------
create or replace function programa_publico(p_pid text) returns json
language plpgsql security definer set search_path = public as $$
declare p sellos_programas;
begin
  select * into p from sellos_programas where pid = p_pid;
  if not found then raise exception 'no_existe'; end if;
  return sellos_programa_json(p, false);
end $$;

create or replace function unirse(p_pid text, p_ref text default '') returns json
language plpgsql security definer set search_path = public, extensions as $$
declare p sellos_programas; t sellos_tarjetas; v_padrino text; v_codigo text; v_g text := sellos_azar(10);
begin
  select * into p from sellos_programas where pid = p_pid;
  if not found then raise exception 'no_existe'; end if;
  loop
    v_codigo := sellos_azar(4, '23456789ABCDEFGHJKLMNPQRSTUVWXYZ');
    exit when not exists (select 1 from sellos_tarjetas where pid = p_pid and codigo = v_codigo);
  end loop;
  if coalesce(p_ref, '') <> '' then
    select cid into v_padrino from sellos_tarjetas where pid = p_pid
      and codigo = translate(regexp_replace(upper(p_ref), '[^A-Z0-9]', '', 'g'), 'OIL', '011');
  end if;
  insert into sellos_tarjetas (cid, pid, codigo, sellos, ref, version)
    values (sellos_azar(12), p_pid, v_codigo, p.bienvenida + (case when v_padrino is not null then 1 else 0 end), coalesce(v_padrino, ''), 1)
    returning * into t;
  if p.bienvenida > 0 then insert into sellos_movs (g, pid, cid, tipo, cantidad) values (v_g, p_pid, t.cid, 'bienvenida', p.bienvenida); end if;
  if v_padrino is not null then insert into sellos_movs (g, pid, cid, tipo, cantidad) values (v_g, p_pid, t.cid, 'invitado', 1); end if;
  return sellos_vista(t, false);
end $$;

create or replace function ver_tarjeta(p_pid text, p_cid text) returns json
language plpgsql security definer set search_path = public as $$
declare t sellos_tarjetas;
begin
  select * into t from sellos_tarjetas where cid = p_cid and pid = p_pid;
  if not found then raise exception 'no_existe'; end if;
  return sellos_vista(t, false);
end $$;

create or replace function datos_cliente(p_pid text, p_cid text, p_nombre text, p_telefono text, p_cumple text) returns json
language plpgsql security definer set search_path = public as $$
declare t sellos_tarjetas;
begin
  update sellos_tarjetas set nombre = left(coalesce(p_nombre, ''), 40), telefono = left(regexp_replace(coalesce(p_telefono, ''), '[^0-9+]', '', 'g'), 20),
         cumple = left(coalesce(p_cumple, ''), 5), version = version + 1
    where cid = p_cid and pid = p_pid returning * into t;
  if not found then raise exception 'no_existe'; end if;
  return sellos_vista(t, false);
end $$;

-- Solo estas funciones se pueden llamar desde la web (con la clave pública "anon").
revoke all on function sellos_dueno(text, text), sellos_vista(sellos_tarjetas, boolean), sellos_azar(int, text) from public, anon, authenticated;
grant execute on function crear_programa(text, text, text, text, int, int, text), programa(text, text), ajustar(text, text, json), buscar(text, text, text),
  sellar(text, text, text, int), canjear(text, text, text), deshacer(text, text, text), clientes(text, text), resumen(text, text, bigint),
  programa_publico(text), unirse(text, text), ver_tarjeta(text, text), datos_cliente(text, text, text, text, text) to anon, authenticated;
