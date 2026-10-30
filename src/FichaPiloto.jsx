import { useEffect, useState } from 'react';
import { mensaje, rpc } from './api.js';
import { CAT_COLOR, CAT_NOMBRE, MULT, NIVEL_COLOR } from './config.js';
import { Avatar } from './ui.jsx';
import { etapaNombre, fecha } from './util.js';

const VEH = { Mark: 'Marca', Model: 'Modelo', Engine: 'Motor', Frame: 'Chasis', Power: 'Potencia', Weight: 'Peso', Length: 'Longitud',
  'Tank capacity': 'Depósito', 'Performance tuner': 'Preparador', Assistance: 'Asistencia', Class: 'Clase', Gearbox: 'Caja de cambios',
  Transmission: 'Transmisión', Suspension: 'Suspensión', Tyres: 'Neumáticos', Width: 'Anchura', Height: 'Altura' };
const GRUPO = { GP: 'Rally GP', R2: 'Rally 2', ULT: 'Ultimate', T1: 'T1', T2: 'T2', T3: 'T3', T4: 'SSV', T5: 'Camión', OP: 'Open', G2: 'Élite', M1: 'Original by Motul' };
const titulo = (s) => (s || '').toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

function edad(iso) {
  if (!iso) return null;
  const n = new Date(iso + 'T12:00:00'), h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) e--;
  return e;
}
function fisico(s) {
  const m = /([\d.]+)\s*m\s*\/\s*(\d+)\s*kg/i.exec(s || '');
  return m ? `${Number(m[1]).toFixed(2).replace('.', ',')} m · ${m[2]} kg` : s;
}
const nota = (r) => (r.remarks || []).find((x) => x.locale === 'es')?.text;

// Resumen del palmarés en el Dakar (como piloto)
function resumen(dakar) {
  const fin = dakar.filter((d) => d.finisher);
  const pos = fin.map((d) => d.rank).filter((r) => r > 0);
  return {
    part: dakar.length,
    victorias: dakar.filter((d) => d.rank === 1).length,
    podios: dakar.filter((d) => d.rank >= 1 && d.rank <= 3).length,
    etapas: dakar.reduce((a, d) => a + (d.stageVictories || 0), 0),
    abandonos: dakar.filter((d) => !d.finisher).length,
    mejor: pos.length ? Math.min(...pos) : null,
  };
}

export default function FichaPiloto({ cat, bib, cerrar, accion }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [verOtras, setVerOtras] = useState(false);

  useEffect(() => {
    let vivo = true;
    rpc('ficha', { p_cat: cat, p_bib: bib }).then((x) => vivo && setD(x)).catch((e) => vivo && setError(mensaje(e)));
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = 'hidden';
    const esc = (e) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', esc);
    return () => { vivo = false; html.style.overflow = antes; window.removeEventListener('keydown', esc); };
  }, [cat, bib, cerrar]);

  const color = CAT_COLOR[cat];
  const f = d?.ficha;
  const dakar = (f?.dakar || []).slice().sort((a, b) => b.season - a.season);
  const otras = (f?.otras || []).filter((r) => r.race && r.season > 0).slice().sort((a, b) => b.season - a.season || (a.rank || 99) - (b.rank || 99));
  const res = resumen(dakar);
  const car = d?.carrera;
  const ed = edad(f?.nacimiento);

  return (
    <div className="chat-fondo" onClick={cerrar}>
      <section className="chat-panel" role="dialog" aria-modal="true" aria-label={d ? `Ficha de ${d.nombre}` : 'Ficha del piloto'} onClick={(e) => e.stopPropagation()}>
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {/* Cabecera con foto */}
          <div style={{ position: 'relative', background: `linear-gradient(160deg, ${color}55, #211812 60%)`, padding: '16px 16px 14px', display: 'flex', gap: 14, alignItems: 'flex-end', minHeight: 170 }}>
            <button className="chat-x" onClick={cerrar} aria-label="Cerrar ficha" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(17,14,11,.6)' }}>✕</button>
            {f?.foto_podio
              ? <img src={f.foto_podio} alt="" style={{ width: 118, height: 153, objectFit: 'cover', borderRadius: 12, flex: 'none', background: '#3A2F25' }} />
              : <Avatar foto={d?.foto} nombre={d?.nombre} color={color} size={96} />}
            <div style={{ minWidth: 0, paddingBottom: 2 }}>
              <div className="cond" style={{ fontSize: 12, color }}>#{bib} · {CAT_NOMBRE[cat]}</div>
              <div className="st" style={{ fontSize: 30, lineHeight: 0.95, marginTop: 4 }}>{d ? titulo(d.nombre_completo || d.nombre).toUpperCase() : '…'}</div>
              {d && (
                <div className="peq gris" style={{ fontSize: 13, marginTop: 6 }}>
                  {[d.nacionalidad?.toUpperCase(), ed != null ? `${ed} años` : null, f?.equipo ? titulo(f.equipo) : d.marca].filter(Boolean).join(' · ')}
                </div>
              )}
              {d && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {cat !== 'OBM' && d.nivel && <span className="badge" style={{ background: NIVEL_COLOR[d.nivel] }}>Nivel {d.nivel} · {MULT[d.nivel]}</span>}
                  {cat === 'OBM' && <span className="badge" style={{ background: 'var(--hueso)' }}>Libre · ×1</span>}
                  {d.legend && <span className="badge legend">Legend</span>}
                  {d.pos_anterior && <span className="badge" style={{ background: 'var(--linea)', color: 'var(--gris2)' }}>Año pasado: {d.pos_anterior}º</span>}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '12px 14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && <div className="error">{error}</div>}
            {!d && !error && <div className="gris" style={{ textAlign: 'center', padding: 30 }}>Cargando ficha…</div>}

            {d && car && (car.pos_general || car.victorias > 0 || car.abandono != null) && (
              <div className="card">
                <h2 className="h2" style={{ fontSize: 17 }}>En este Dakar</h2>
                <div className="grid3" style={{ marginTop: 8, gap: 6 }}>
                  <Dato v={car.abandono != null ? '—' : car.pos_general ? `${car.pos_general}º` : '–'} t={car.abandono != null ? `abandono (${etapaNombre(car.abandono).toLowerCase()})` : 'en la general'} rojo={car.abandono != null} />
                  <Dato v={car.victorias} t={car.victorias === 1 ? 'etapa ganada' : 'etapas ganadas'} />
                  <Dato v={car.elegido ?? '?'} t={car.elegido != null ? (car.elegido === 1 ? 'lo lleva 1 jugador' : 'jugadores lo llevan') : 'se sabrá al cerrar'} />
                </div>
                {car.etapas?.some((e) => e.pos_etapa) && (
                  <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>
                    {car.etapas.filter((e) => e.pos_etapa).map((e) => (
                      <div key={e.etapa} style={{ flex: 'none', textAlign: 'center', minWidth: 34, padding: '4px 2px', borderRadius: 8, background: e.pos_etapa === 1 ? 'var(--arena)' : 'var(--tierra2)', color: e.pos_etapa === 1 ? '#17130F' : undefined }}>
                        <div className="cond" style={{ fontSize: 9, opacity: 0.7 }}>{e.etapa === 0 ? 'PRÓL' : `E${e.etapa}`}</div>
                        <div className="mono" style={{ fontSize: 13 }}>{e.pos_etapa}º</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {d && !f && (
              <div className="card gris peq">La ficha completa (palmarés, vehículo…) se está descargando de dakar.com. Vuelve a abrirla en unos minutos.</div>
            )}

            {f && (
              <div className="card">
                <h2 className="h2" style={{ fontSize: 17 }}>Palmarés en el Dakar</h2>
                {dakar.length === 0 ? (
                  <p className="gris peq" style={{ marginTop: 6 }}>Primer Dakar: no tiene participaciones anteriores registradas.</p>
                ) : (
                  <>
                    <div className="grid3" style={{ marginTop: 8, gap: 6 }}>
                      <Dato v={res.part} t={res.part === 1 ? 'participación' : 'participaciones'} />
                      <Dato v={res.victorias ? `🏆 ${res.victorias}` : res.podios ? res.podios : res.mejor ? `${res.mejor}º` : '–'}
                        t={res.victorias ? (res.victorias === 1 ? 'victoria' : 'victorias') : res.podios ? 'podios' : 'mejor puesto'} />
                      <Dato v={res.etapas} t={res.etapas === 1 ? 'etapa ganada' : 'etapas ganadas'} />
                    </div>
                    <div className="peq gris" style={{ marginTop: 8 }}>
                      {[res.victorias && res.podios > res.victorias ? `${res.podios} podios` : null, res.mejor && res.victorias === 0 && res.podios ? `mejor puesto ${res.mejor}º` : null,
                        res.abandonos ? `${res.abandonos} ${res.abandonos === 1 ? 'abandono' : 'abandonos'}` : 'siempre ha terminado'].filter(Boolean).join(' · ')}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {dakar.map((r) => (
                        <div key={r.season + (r.group || '')} className="fila" style={{ padding: '6px 0', fontSize: 14 }}>
                          <span className="mono arena" style={{ width: 40 }}>{r.season}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 600 }}>{r.finisher ? (r.rank ? `${r.rank}º` : 'Terminó') : <span style={{ color: 'var(--mal)' }}>Abandono</span>}</span>
                            <span className="gris peq">{[GRUPO[r.group], r.mark && titulo(r.mark)].filter(Boolean).length ? ' · ' + [GRUPO[r.group], r.mark && titulo(r.mark)].filter(Boolean).join(' · ') : ''}</span>
                            {nota(r) && <span className="badge" style={{ marginLeft: 6, background: 'var(--duna)', fontSize: 9 }}>{nota(r)}</span>}
                          </span>
                          {r.stageVictories > 0 && <span className="mono peq" title="Etapas ganadas">🏁 {r.stageVictories}</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {f?.tripulacion?.length > 0 && (
              <div className="card">
                <h2 className="h2" style={{ fontSize: 17 }}>Tripulación</h2>
                {f.tripulacion.map((t) => (
                  <div key={t.nombre} className="fila">
                    <Avatar foto={t.foto} nombre={t.nombre} size={34} />
                    <span style={{ flex: 1, fontWeight: 600 }}>{t.nombre}</span>
                    <span className="peq gris">{t.rol === 'C' ? 'Copiloto' : t.rol === 'M' ? 'Mecánico' : 'Tripulante'}{t.pais ? ` · ${t.pais.toUpperCase()}` : ''}</span>
                  </div>
                ))}
              </div>
            )}

            {f?.vehiculo?.length > 0 && (
              <div className="card">
                <h2 className="h2" style={{ fontSize: 17 }}>El vehículo</h2>
                {f.vehiculo.filter((x) => x.v).map((x) => (
                  <div key={x.k} className="fila" style={{ padding: '6px 0', justifyContent: 'space-between', fontSize: 14 }}>
                    <span className="gris">{VEH[x.k] || x.k}</span>
                    <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '62%' }}>{x.v}</span>
                  </div>
                ))}
              </div>
            )}

            {otras.length > 0 && (
              <div className="card">
                <h2 className="h2" style={{ fontSize: 17 }}>Otras carreras</h2>
                {(verOtras ? otras : otras.slice(0, 6)).map((r, i) => (
                  <div key={i} className="fila" style={{ padding: '6px 0', fontSize: 14 }}>
                    <span className="mono arena" style={{ width: 40 }}>{r.season}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{titulo(r.race)}</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{r.rank > 0 ? `${r.rank}º` : r.finisher === false ? 'Ab.' : '–'}</span>
                  </div>
                ))}
                {otras.length > 6 && !verOtras && <button className="btn link" onClick={() => setVerOtras(true)}>Ver las {otras.length}</button>}
              </div>
            )}

            {f && (f.nacimiento || f.fisico || f.aficiones || f.patrocinadores) && (
              <div className="card">
                <h2 className="h2" style={{ fontSize: 17 }}>Fuera de la pista</h2>
                {[['Nacimiento', f.nacimiento ? `${new Date(f.nacimiento + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}` : null],
                  ['Altura y peso', fisico(f.fisico)], ['Aficiones', f.aficiones], ['Patrocinadores', f.patrocinadores]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="fila" style={{ padding: '6px 0', display: 'block', fontSize: 14 }}>
                    <div className="etiqueta" style={{ fontSize: 10 }}>{k}</div>
                    <div>{v}</div>
                  </div>
                ))}
              </div>
            )}

            {d?.noticias?.length > 0 && (
              <div className="card">
                <h2 className="h2" style={{ fontSize: 17 }}>Últimas noticias</h2>
                {d.noticias.map((n) => (
                  <details key={n.id} className="fila" style={{ display: 'block', padding: '8px 0' }}>
                    <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
                      <div className="mono peq gris">{fecha(n.publicada)} · {etapaNombre(n.etapa)}</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{n.titulo}</div>
                    </summary>
                    {n.texto && <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 4, whiteSpace: 'pre-line' }}>{n.texto.replace(/^\s*•\s*/, '')}</div>}
                  </details>
                ))}
              </div>
            )}

            {d && (
              <a href={`https://www.dakar.com/en/competitor/${bib}`} target="_blank" rel="noopener noreferrer" className="peq" style={{ textAlign: 'center', color: 'var(--gris)' }}>
                Datos de dakar.com · ver la ficha oficial ↗
              </a>
            )}
          </div>
        </div>
        {accion && d && (
          <div className="chat-pie">
            <button className="btn" style={{ minHeight: 48 }} disabled={accion.deshabilitado} onClick={() => { accion.hacer(); cerrar(); }}>{accion.texto}</button>
          </div>
        )}
      </section>
    </div>
  );
}

function Dato({ v, t, rojo }) {
  return (
    <div style={{ background: 'var(--tierra2)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
      <div className="st" style={{ fontSize: 24, lineHeight: 1, color: rojo ? 'var(--mal)' : 'var(--arena)' }}>{v}</div>
      <div className="peq gris" style={{ fontSize: 11, marginTop: 3, lineHeight: 1.15 }}>{t}</div>
    </div>
  );
}
