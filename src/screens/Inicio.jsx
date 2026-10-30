import { useDatos } from '../App.jsx';
import { CAT_COLOR, CAT_CORTO, CATS, MULT } from '../config.js';
import { Avatar, Cargando, Dunas, useAhora } from '../ui.jsx';
import { cuentaAtras, etapaNombre, fecha, haceCuanto, puntos } from '../util.js';

function Cabecera({ jugador, sub }) {
  return (
    <div className="cabecera">
      <div>
        <div className="logo" style={{ fontSize: 38 }}>PORRA<span>DAKAR</span></div>
        <div className="etiqueta" style={{ fontSize: 13, marginTop: 6 }}>{sub}</div>
      </div>
      <a href="#/usuarios" aria-label="Cambiar de jugador"><Avatar nombre={jugador?.nombre} color={jugador?.color} size={44} /></a>
    </div>
  );
}

function MiEquipo({ yo, enCarrera }) {
  const eq = yo?.equipo || [];
  const por = Object.fromEntries(eq.map((p) => [p.cat, p]));
  if (!enCarrera) {
    return (
      <div className="card punteada">
        <div className="cab"><h2 className="h2">Tu equipo</h2><span className="mono">{eq.length} / 4</span></div>
        <div className="grid4" style={{ marginTop: 10 }}>
          {CATS.map((c) => (
            <div key={c} style={{ border: `1px ${por[c] ? 'solid' : 'dashed'} ${por[c] ? CAT_COLOR[c] : '#6B5E50'}`, borderRadius: 8, padding: 6, textAlign: 'center', minHeight: 48 }}>
              <div className="cond" style={{ fontSize: 10, color: CAT_COLOR[c] }}>{CAT_CORTO[c]}{por[c]?.nivel ? ' · ' + por[c].nivel : ''}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: por[c] ? 'var(--hueso)' : 'var(--gris)' }}>{por[c] ? por[c].nombre.split(' ').slice(-1)[0] : 'Falta'}</div>
            </div>
          ))}
        </div>
        <a className="btn" href="#/equipo" style={{ marginTop: 12, minHeight: 48 }}>{eq.length === 4 ? 'Cambiar equipo' : eq.length ? 'Completar equipo' : 'Hacer mi equipo'}</a>
        <p className="peq gris" style={{ textAlign: 'center', marginTop: 8 }}>Hasta la salida del prólogo nadie ve tu equipo.</p>
      </div>
    );
  }
  return (
    <section className="card" aria-label="Mi equipo">
      <div className="cab"><h2 className="h2">Mi equipo</h2></div>
      {eq.length === 0 && <p className="gris" style={{ padding: '8px 0' }}>No hiciste equipo a tiempo.</p>}
      {eq.map((p) => {
        const act = p.cambio && yo ? p.cambio : null;
        return (
          <div key={p.cat} className="fila">
            <div style={{ width: 5, height: 36, borderRadius: 3, background: CAT_COLOR[p.cat] }} />
            <Avatar foto={p.foto} nombre={p.nombre} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.nombre} {act && <span className="gris peq">→ {act.nombre}</span>}</div>
              <div className="peq gris">{CAT_CORTO[p.cat]} · {p.nivel ? `nivel ${p.nivel} · ${MULT[p.nivel]}` : 'libre · ×1'}{p.legend ? ' · Legend' : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {p.abandono != null && !act ? <span className="peq" style={{ color: 'var(--mal)' }}>Abandono</span>
                : <div className="st" style={{ fontSize: 22, lineHeight: 1 }}>{(act ? act.pos_general : p.pos_general) ? `${act ? act.pos_general : p.pos_general}º` : '–'}</div>}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function MiniPorra({ porra, jugador }) {
  const js = porra?.jugadores || [];
  const yo = js.find((j) => j.id === jugador?.id);
  const top = js.slice(0, 3);
  return (
    <a href="#/porra" className="card" style={{ display: 'block', color: 'var(--hueso)' }}>
      <div className="cab"><h2 className="h2">La porra</h2><span className="etiqueta">Ver todo ›</span></div>
      {top.map((j) => (
        <div key={j.id} className={'fila' + (j.id === jugador?.id ? ' mia' : '')}>
          <span className="mono arena" style={{ width: 20 }}>{j.pos}</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{j.nombre}{j.id === jugador?.id ? ' (tú)' : ''}</span>
          <span className="mono arena">{puntos(j.puntos)}</span>
        </div>
      ))}
      {yo && yo.pos > 3 && (
        <div className="fila mia">
          <span className="mono" style={{ width: 20 }}>{yo.pos}</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{yo.nombre} (tú)</span>
          <span className="mono arena">{puntos(yo.puntos)}</span>
        </div>
      )}
    </a>
  );
}

export default function Inicio() {
  const { estado, pilotos, porra, yo, jugador, error } = useDatos();
  useAhora(30000);
  if (!estado) return <main className="main"><Cabecera jugador={jugador} sub="Cargando" />{error ? <p className="error">No se han podido cargar los datos.</p> : <Cargando />}</main>;

  const etapas = estado.etapas || [];
  const ahora = Date.now();
  const enCurso = etapas.find((e) => e.inicio && e.fin && new Date(e.inicio).getTime() <= ahora && new Date(e.fin).getTime() >= ahora);

  if (estado.equipos_abiertos) {
    const ca = cuentaAtras(estado.cierre_equipos);
    const completos = (porra?.jugadores || []).filter((j) => j.completo).length;
    const desc = estado.etapa_descanso;
    const hitos = [etapas.find((e) => e.num === 0), etapas.find((e) => e.num === 1), etapas.find((e) => e.num === desc + 1), etapas[etapas.length - 1]].filter(Boolean);
    return (
      <main className="main">
        <div className="hero" style={{ paddingBottom: 96, paddingTop: 'calc(22px + var(--safe-top))' }}>
          <div className="sol" style={{ width: 96, height: 96, top: 'calc(56px + var(--safe-top))', right: 28 }} />
          <Dunas alto={90} />
          <Cabecera jugador={jugador} sub={`Hola, ${jugador?.nombre}`} />
          <div className="etiqueta" style={{ fontSize: 13, marginTop: 18 }}>Se cierran los equipos en</div>
          {ca ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {[[ca.d, 'días'], [ca.h, 'horas'], [ca.m, 'min']].map(([n, t], i) => (
                <div key={t} style={{ display: 'flex', gap: 10 }}>
                  {i > 0 && <span className="st" style={{ fontSize: 54, lineHeight: 0.9, color: 'var(--duna)' }}>:</span>}
                  <div><div className="st" style={{ fontSize: 54, lineHeight: 0.9 }}>{String(n).padStart(2, '0')}</div><div className="etiqueta" style={{ fontSize: 11 }}>{t}</div></div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <MiEquipo yo={yo} enCarrera={false} />
        <div className="card">
          <div className="cab"><h2 className="h2">El grupo</h2><span className="peq gris" style={{ fontSize: 13 }}>{completos} de {estado.jugadores} con equipo</span></div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--linea)', marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${estado.jugadores ? (100 * completos) / estado.jugadores : 0}%`, height: 8, background: 'var(--duna)' }} />
          </div>
        </div>
        {hitos.length > 0 && (
          <div className="card">
            <h2 className="h2" style={{ marginBottom: 6 }}>El recorrido</h2>
            {hitos.map((e) => (
              <div key={e.num} className="fila" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                <span>{fecha(e.fecha)} · {etapaNombre(e.num)}{e.num === desc + 1 ? ' (tras Agadir)' : ''}</span>
                <span className="gris" style={{ textAlign: 'right' }}>{e.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  const ult = estado.ultima_etapa;
  const etapa = enCurso || etapas.find((e) => e.num === ult) || etapas[0];
  const lideres = ['GP', 'ULT', 'TRK'].map((c) => [c, (pilotos || []).find((p) => p.cat === c && p.pos_general === 1)]);
  return (
    <main className="main">
      <Cabecera jugador={jugador} sub={`Hola, ${jugador?.nombre} · ${enCurso ? 'etapa en marcha' : `tras ${etapaNombre(ult).toLowerCase()}`}`} />
      {estado.agadir_abierto && (
        <a href="#/agadir" className="card punteada" style={{ display: 'block', color: 'var(--hueso)' }}>
          <div className="st arena" style={{ fontSize: 26 }}>MERCADO DE AGADIR ABIERTO</div>
          <p className="peq gris" style={{ marginTop: 4, fontSize: 13 }}>Puedes cambiar un piloto. Toca para entrar ›</p>
        </a>
      )}
      {etapa && (
        <a href={`#/etapa?n=${etapa.num}`} className="card destacada" style={{ display: 'block', color: 'var(--hueso)' }}>
          <div className="cab">
            <span className={'badge' + (enCurso ? ' directo' : '')} style={enCurso ? {} : { background: 'var(--linea)', color: 'var(--gris2)' }}>{enCurso ? 'En directo' : 'Última etapa'} · {etapaNombre(etapa.num)}</span>
            <span className="mono peq gris">{fecha(etapa.fecha)}</span>
          </div>
          <div className="cab" style={{ alignItems: 'flex-end', marginTop: 8 }}>
            <div>
              <div className="st" style={{ fontSize: 40, lineHeight: 0.9 }}>{etapaNombre(etapa.num).toUpperCase()}</div>
              <div className="peq gris" style={{ marginTop: 4, fontSize: 13 }}>{etapa.nombre}</div>
            </div>
            {etapa.km ? <div style={{ textAlign: 'right' }}><div className="mono arena" style={{ fontSize: 20 }}>{etapa.km} km</div><div className="peq gris">de especial</div></div> : null}
          </div>
          <div className="grid3" style={{ marginTop: 12, gap: 6 }}>
            {lideres.map(([c, p]) => (
              <div key={c} style={{ background: 'var(--tierra2)', borderRadius: 8, padding: '6px 8px' }}>
                <div className="cond" style={{ fontSize: 11, color: CAT_COLOR[c] }}>{CAT_CORTO[c]}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p ? p.nombre : '—'}</div>
              </div>
            ))}
          </div>
        </a>
      )}
      <MiEquipo yo={yo} enCarrera />
      <MiniPorra porra={porra} jugador={jugador} />
      <p className="peq gris" style={{ textAlign: 'center' }}>Datos oficiales · actualizado {haceCuanto(estado.actualizado)}</p>
    </main>
  );
}

