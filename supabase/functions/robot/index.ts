// Robot de PorraDAKAR: lee la API oficial de tiempos del Dakar y dakar.com, y lo guarda en la base de datos.
// modo "api": lee de internet (y guarda una copia en archivo.respuestas).
// modo "archivo": lee la copia guardada (sirve para simular una edición pasada).
import postgres from 'npm:postgres@3.4.5';

const API = 'https://www.dakar.live.worldrallyraidchampionship.com/api/';
const WEB = 'https://www.dakar.com';
const UA = 'Mozilla/5.0 (PorraDAKAR; porra entre amigos)';
const CATS = ['GP', 'ULT', 'TRK', 'OBM'] as const;
type Cat = typeof CATS[number];

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 1 });

type Ctx = { modo: 'api' | 'archivo'; edicion: number };

async function leer(ctx: Ctx, fuente: 'api' | 'dakar.com', ruta: string): Promise<string | null> {
  if (ctx.modo === 'archivo') {
    const r = await sql`select cuerpo from archivo.respuestas where fuente = ${fuente} and ruta = ${ruta}`;
    return r.length ? r[0].cuerpo : null;
  }
  const url = (fuente === 'api' ? API : WEB) + ruta + (fuente === 'api' ? `?t=${Date.now()}` : '');
  for (let intento = 0; intento < 3; intento++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: fuente === 'api' ? 'application/json' : 'text/html' } });
      if (res.status === 204) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = await res.text();
      if (!txt) return null;
      await sql`insert into archivo.respuestas (fuente, ruta, edicion, estado, cuerpo)
        values (${fuente}, ${ruta}, ${ctx.edicion}, ${res.status}, ${txt})
        on conflict (fuente, ruta) do update set estado = excluded.estado, cuerpo = excluded.cuerpo, descargado_en = now()`;
      return txt;
    } catch (e) {
      if (intento === 2) throw new Error(`${ruta}: ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 1500 * (intento + 1)));
    }
  }
  return null;
}

async function json(ctx: Ctx, ruta: string): Promise<any[] | null> {
  const t = await leer(ctx, 'api', ruta);
  if (!t) return null;
  try { return JSON.parse(t); } catch { return null; }
}

const clean = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const piloto = (team: any) => (team?.competitors ?? []).find((c: any) => c.role === 'P') ?? team?.competitors?.[0] ?? {};

// Categoría de la porra a la que pertenece una inscripción (o null si no juega en la porra)
function catsDe(api: 'M' | 'A', ref: string, team: any, ed: number): Cat[] {
  const out: Cat[] = [];
  if (api === 'M') {
    if (ref.includes(`${ed}-M-GP`)) out.push('GP');
    if (team?.is?.obm) out.push('OBM');
  } else {
    if (ref.startsWith(`${ed}-A-T1`)) out.push('ULT');
    if (ref.startsWith(`${ed}-A-T5-1`)) out.push('TRK');
  }
  return out;
}

function ultimaClave(obj: any): string | null {
  const ks = Object.keys(obj ?? {}).filter((k) => !k.includes('penal'));
  return ks.length ? ks.sort().pop()! : null;
}

async function ejecutar(ctx: Ctx, opciones: { niveles?: 'anterior' | 'prologo' }) {
  const ed = ctx.edicion;
  const log: string[] = [];

  // Clases (id interno → referencia legible)
  const clases: Record<string, string> = {};
  for (const c of ['A', 'M']) for (const z of (await json(ctx, `allClazz-${ed}-${c}`)) ?? []) clases[z._id] = z.reference ?? '';

  // Etapas (desde la lista de motos, que comparte calendario con coches)
  const etapasM = (await json(ctx, `stage-${ed}-M`)) ?? [];
  const etapas = etapasM.map((s: any) => {
    const es = (s.stageLangs ?? []).find((l: any) => l.locale === 'es')?.text ?? (s.stageLangs ?? [])[0]?.text ?? null;
    const sect = s.sectors ?? [];
    const spe = sect.filter((x: any) => x.type === 'SPE').reduce((a: number, x: any) => a + (x.length ?? 0), 0);
    const tot = sect.reduce((a: number, x: any) => a + (x.length ?? 0), 0);
    return { edicion: ed, num: Math.round(Number(s.stage)), nombre: clean(es), fecha: s.date ? String(s.date).slice(0, 10) : null,
      km_especial: spe || null, km_total: tot || null, inicio: s.startDate ?? null, fin: s.endDate ?? null,
      maraton: !!s.marathon, cancelada: !!s.isCancelled };
  }).filter((e: any) => Number.isFinite(e.num));
  if (etapas.length) {
    await sql`insert into etapas ${sql(etapas)} on conflict (edicion, num) do update set nombre = excluded.nombre, fecha = excluded.fecha,
      km_especial = excluded.km_especial, km_total = excluded.km_total, inicio = excluded.inicio, fin = excluded.fin,
      maraton = excluded.maraton, cancelada = excluded.cancelada`;
  }
  const ultima = etapas.length ? Math.max(...etapas.map((e: any) => e.num)) : 13;

  const pilotos = new Map<string, any>();
  const prologo: Record<string, number> = {};
  let ultimaConGeneral = -1;
  const filas: any[] = [];

  for (let s = 0; s <= ultima; s++) {
    const etapa = etapas.find((e: any) => e.num === s);
    const enCurso = etapa?.fin ? new Date(etapa.fin).getTime() > Date.now() && ctx.modo === 'api' : false;
    const porCat: Record<Cat, any[]> = { GP: [], ULT: [], TRK: [], OBM: [] };
    for (const api of ['M', 'A'] as const) {
      const datos = await json(ctx, `lastScore-${ed}-${api}-${s}`);
      if (!datos || !datos.length) continue;
      for (const e of datos) {
        const team = e.team ?? {};
        const cats = catsDe(api, clases[team.clazz] ?? '', team, ed);
        if (!cats.length) continue;
        const p = piloto(team);
        for (const cat of cats) {
          const id = `${cat}:${team.bib}`;
          if (!pilotos.has(id)) {
            pilotos.set(id, { edicion: ed, cat, bib: team.bib, nombre: clean(p.name) || `#${team.bib}`,
              nombre_completo: clean(`${p.firstName ?? ''} ${p.lastName ?? ''}`) || null, nacionalidad: p.nationality ?? null,
              foto: p.profil_sm ?? p.profil ?? null, marca: team.brand ?? null, modelo: team.model ?? null });
          }
          if (s === 0 && e.dss?.position != null) prologo[id] = api === 'M' ? -e.dss.position : e.dss.position;
          porCat[cat].push(e);
        }
      }
    }
    // Posiciones dentro de cada categoría de la porra
    for (const cat of CATS) {
      const lista = porCat[cat];
      if (!lista.length) continue;
      let fk: string | null = null;
      for (const e of lista) { const k = ultimaClave(e.cg); if (k && (!fk || k > fk)) fk = k; }
      const gen = lista.map((e) => {
        let t: number | null = null, rank = 0;
        if (fk && e.cg?.[fk]?.absolute?.[0] != null) { t = e.cg[fk].absolute[0]; rank = 1e6; }
        else if (enCurso) { const k = ultimaClave(e.cg); if (k && e.cg[k]?.absolute?.[0] != null) { t = e.cg[k].absolute[0]; rank = parseInt(k, 10) || 0; } }
        return { e, t, rank };
      }).filter((x) => x.t != null).sort((a, b) => (b.rank - a.rank) || (a.t! - b.t!));
      const etp = lista.map((e) => {
        let t: number | null = e.ce?.absolute?.[0] ?? null;
        if (t == null && fk && e.cs?.[fk]?.absolute?.[0] != null) t = e.cs[fk].absolute[0];
        return { e, t };
      }).filter((x) => x.t != null && x.t > 0).sort((a, b) => a.t! - b.t!);
      const m = new Map<number, any>();
      gen.forEach((x, i) => m.set(x.e.team.bib, { pos_general: i + 1, tiempo_general: x.t }));
      etp.forEach((x, i) => m.set(x.e.team.bib, { ...(m.get(x.e.team.bib) ?? {}), pos_etapa: i + 1, tiempo_etapa: x.t }));
      for (const [bib, v] of m) {
        filas.push({ edicion: ed, cat, etapa: s, bib, pos_etapa: v.pos_etapa ?? null, tiempo_etapa: v.tiempo_etapa ?? null,
          pos_general: v.pos_general ?? null, tiempo_general: v.tiempo_general ?? null, provisional: enCurso });
      }
      if (gen.length) ultimaConGeneral = Math.max(ultimaConGeneral, s);
    }
  }

  // Leyendas (LEGEND) desde la lista de competidores de dakar.com
  const legend = new Set<string>();
  try {
    let paginas: string[] = [];
    if (ctx.modo === 'archivo') {
      paginas = (await sql`select ruta from archivo.respuestas where fuente = 'dakar.com' and ruta like '/en/ajax/competitors/%'`).map((r) => r.ruta);
    } else {
      const html = (await leer(ctx, 'dakar.com', '/en/competitors')) ?? '';
      paginas = [...new Set(html.match(/\/en\/ajax\/competitors\/[A-Z]\/[A-Z0-9]*\/[0-9a-f]{32}/g) ?? [])];
    }
    for (const ruta of paginas) {
      const api = ruta.split('/')[4];
      const html = (await leer(ctx, 'dakar.com', ruta)) ?? '';
      for (const m of html.matchAll(/leadFocus__bib[^>]*>\s*(\d+)\s*<\/span>\s*<span class="leadFocus__status statusExp ([A-Z])/g)) {
        if (m[2] === 'L') legend.add(`${api}:${m[1]}`);
      }
    }
  } catch (e) {
    log.push(`Aviso LEGEND: ${(e as Error).message}`);
  }

  const lista = [...pilotos.values()].map((p) => ({ ...p, legend: legend.has(`${p.cat === 'GP' || p.cat === 'OBM' ? 'M' : 'A'}:${p.bib}`) }));
  if (lista.length) {
    await sql`insert into pilotos ${sql(lista, 'edicion', 'cat', 'bib', 'nombre', 'nombre_completo', 'nacionalidad', 'foto', 'marca', 'modelo', 'legend')}
      on conflict (edicion, cat, bib) do update set nombre = excluded.nombre, nombre_completo = excluded.nombre_completo,
      nacionalidad = excluded.nacionalidad, foto = coalesce(excluded.foto, pilotos.foto), marca = excluded.marca,
      modelo = excluded.modelo, legend = excluded.legend`;
  }
  for (let i = 0; i < filas.length; i += 500) {
    const lote = filas.slice(i, i + 500);
    await sql`insert into clasif ${sql(lote)} on conflict (edicion, cat, etapa, bib) do update set pos_etapa = excluded.pos_etapa,
      tiempo_etapa = excluded.tiempo_etapa, pos_general = excluded.pos_general, tiempo_general = excluded.tiempo_general,
      provisional = excluded.provisional`;
  }

  // Abandonos: estaba en la general de una etapa y desaparece en la siguiente con datos
  if (ultimaConGeneral > 0) {
    await sql`insert into abandonos (edicion, cat, bib, etapa)
      select p.edicion, p.cat, p.bib,
        (select min(s.n) from generate_series(1, ${ultimaConGeneral}) s(n)
          where not exists (select 1 from clasif c where c.edicion = p.edicion and c.cat = p.cat and c.bib = p.bib and c.etapa = s.n and c.pos_general is not null))
      from pilotos p
      where p.edicion = ${ed} and not exists (select 1 from clasif c where c.edicion = p.edicion and c.cat = p.cat and c.bib = p.bib
        and c.etapa = ${ultimaConGeneral} and c.pos_general is not null and not c.provisional)
        and exists (select 1 from clasif c where c.edicion = p.edicion and c.cat = p.cat and c.bib = p.bib and c.pos_general is not null)
      on conflict (edicion, cat, bib) do update set etapa = excluded.etapa`;
  }

  // Niveles A/B/C: solo mientras los equipos están abiertos
  const cfg = (await sql`select cierre_equipos from config where id = 1`)[0];
  if (opciones.niveles && cfg && new Date(cfg.cierre_equipos).getTime() > Date.now()) {
    if (opciones.niveles === 'prologo') {
      // Simulacro: la prioridad de salida del prólogo hace de "general del año anterior"
      await sql`update pilotos set pos_anterior = null where edicion = ${ed}`;
      for (const cat of ['GP', 'ULT', 'TRK']) {
        const orden = Object.entries(prologo).filter(([id]) => id.startsWith(cat + ':')).sort((a, b) => a[1] - b[1]);
        for (let i = 0; i < orden.length; i++) {
          await sql`update pilotos set pos_anterior = ${i + 1} where edicion = ${ed} and cat = ${cat} and bib = ${Number(orden[i][0].split(':')[1])}`;
        }
      }
    }
    await sql`select privado.calcular_niveles(${ed})`;
    log.push('Niveles recalculados');
  }

  if (ultimaConGeneral >= 0) {
    await sql`update config set ultima_etapa = ${ultimaConGeneral}, actualizado = now() where id = 1 and edicion = ${ed}`;
  }
  const msg = `${ctx.modo === 'archivo' ? 'Archivo' : 'API'} ${ed}: ${lista.length} pilotos, ${filas.length} posiciones, última etapa con general ${ultimaConGeneral}, ${legend.size} LEGEND`;
  log.push(msg);
  for (const l of log) await sql`insert into robot_log (nivel, mensaje) values (${l.startsWith('Aviso') ? 'aviso' : 'info'}, ${l})`;
  return { ok: true, log };
}

Deno.serve(async (req) => {
  const fila = await sql`select valor from privado.ajustes where clave = 'robot'`;
  if (!fila.length || req.headers.get('x-robot-clave') !== fila[0].valor) return new Response(JSON.stringify({ error: 'NO_AUTORIZADO' }), { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const cfg = (await sql`select edicion from config where id = 1`)[0];
  if (!cfg) return new Response(JSON.stringify({ error: 'SIN_CONFIGURAR' }), { status: 500 });
  const ctx: Ctx = { modo: body.modo === 'archivo' ? 'archivo' : 'api', edicion: Number(body.edicion ?? cfg.edicion) };
  try {
    const r = await ejecutar(ctx, { niveles: body.niveles });
    return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    const m = (e as Error).message;
    await sql`insert into robot_log (nivel, mensaje) values ('error', ${'Fallo del robot: ' + m})`;
    return new Response(JSON.stringify({ error: m }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
});
