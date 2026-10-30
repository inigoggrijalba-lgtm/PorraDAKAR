import { useEffect, useMemo, useState } from 'react';
import { useDatos } from '../App.jsx';
import { mensaje, rpc } from '../api.js';
import { CAT_COLOR, CAT_CORTO, CAT_NOMBRE, CATS, MULT, NIVEL_COLOR } from '../config.js';
import { Avatar, Cargando, Legend, Tabs, tabsCat } from '../ui.jsx';

const TITULO = { A: 'Nivel A · ×1 · los favoritos', B: 'Nivel B · ×1,5 · siguientes y Legends', C: 'Nivel C · ×2 · el resto', L: 'Libre · ×1' };

export default function Equipo() {
  const { estado, pilotos, yo, jugador, recargar, avisar } = useDatos();
  const [cat, setCat] = useState('GP');
  const [picks, setPicks] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => {
    if (picks === null && yo) setPicks(Object.fromEntries((yo.equipo || []).map((p) => [p.cat, p.bib])));
  }, [yo, picks]);

  const porCat = useMemo(() => {
    const m = { GP: [], ULT: [], TRK: [], OBM: [] };
    for (const p of pilotos || []) m[p.cat]?.push(p);
    return m;
  }, [pilotos]);

  if (!estado || !pilotos || picks === null) return <main className="main"><h1 className="titulo">MI EQUIPO</h1><Cargando /></main>;

  const piloto = (c, bib) => porCat[c].find((p) => p.bib === bib);
  const nivelDe = (c) => (picks[c] != null ? piloto(c, picks[c])?.nivel : null);
  const usadoFuera = (n) => ['GP', 'ULT', 'TRK'].some((k) => k !== cat && nivelDe(k) === n);
  const faltan = ['A', 'B', 'C'].filter((n) => !['GP', 'ULT', 'TRK'].some((k) => nivelDe(k) === n));
  const completo = CATS.every((k) => picks[k] != null) && faltan.length === 0;
  const abierto = estado.equipos_abiertos;

  if (!abierto) {
    return (
      <main className="main">
        <h1 className="titulo">MI EQUIPO</h1>
        <p className="gris">Los equipos se cerraron con la salida del prólogo.</p>
        {(yo?.equipo || []).map((p) => (
          <div key={p.cat} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, borderColor: CAT_COLOR[p.cat] }}>
            <Avatar foto={p.foto} nombre={p.nombre} size={48} />
            <div style={{ flex: 1 }}>
              <div className="cond" style={{ fontSize: 11, color: CAT_COLOR[p.cat] }}>{CAT_NOMBRE[p.cat]} · {p.nivel ? `nivel ${p.nivel} ${MULT[p.nivel]}` : 'libre ×1'}</div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{p.nombre}</div>
              {p.cambio && <div className="peq gris">Cambiado en Agadir por {p.cambio.nombre} (al 50%)</div>}
            </div>
            <div className="st" style={{ fontSize: 26 }}>{p.pos_general ? `${p.pos_general}º` : p.abandono != null ? '—' : ''}</div>
          </div>
        ))}
        {estado.agadir_abierto && <a className="btn" href="#/agadir">Ir al mercado de Agadir</a>}
      </main>
    );
  }

  async function guardar() {
    setError('');
    setOcupado(true);
    try {
      await rpc('guardar_equipo', { p_id: jugador.id, p_token: jugador.token, p_picks: picks });
      await recargar();
      avisar('Equipo guardado');
    } catch (e) {
      setError(mensaje(e));
    } finally {
      setOcupado(false);
    }
  }

  const lista = porCat[cat];
  const grupos = cat === 'OBM' ? [['L', lista]] : ['A', 'B', 'C'].map((n) => [n, lista.filter((p) => p.nivel === n)]);
  const hint = cat === 'OBM' ? 'Original by Motul es libre: elige a quien quieras, puntúa a ×1.'
    : faltan.length ? `Necesitas un A, un B y un C entre Rally GP, Ultimate y Camiones. Te falta: ${faltan.join(', ')}.`
      : 'Tienes un A, un B y un C. Puedes cambiar a quien quieras hasta el prólogo.';

  return (
    <main className="main" style={{ paddingBottom: 'calc(230px + var(--safe-bottom))' }}>
      <div>
        <h1 className="titulo">MI EQUIPO</h1>
        <div className="etiqueta" style={{ marginTop: 6 }}>Se puede cambiar hasta la salida del prólogo</div>
      </div>
      <Tabs items={tabsCat(CATS)} valor={cat} onCambio={(c) => { setCat(c); setVerTodos(false); }} label="Categoría" />
      <div className="aviso">{hint}</div>
      {grupos.map(([n, ps]) => {
        const bloqueado = n !== 'L' && usadoFuera(n);
        const visibles = n === 'C' && !verTodos ? ps.slice(0, 12) : ps;
        return (
          <div key={n}>
            <div className="etiqueta" style={{ color: bloqueado ? '#6B5E50' : (NIVEL_COLOR[n] || 'var(--gris)'), margin: '4px 0' }}>
              {TITULO[n]}{bloqueado ? ' · ya usado en otra categoría' : ''}
            </div>
            <div className="card" style={{ padding: '2px 8px' }}>
              {visibles.map((p) => {
                const sel = picks[cat] === p.bib;
                return (
                  <button key={p.bib} className={'piloto-btn' + (sel ? ' sel' : '')} disabled={bloqueado} aria-pressed={sel}
                    onClick={() => setPicks({ ...picks, [cat]: p.bib })}>
                    <Avatar foto={p.foto} nombre={p.nombre} size={36} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{p.nombre}</span>
                      <span className="peq gris" style={{ display: 'block', fontSize: 11 }}>#{p.bib}{p.marca ? ` · ${p.marca}` : ''}{p.nac ? ` · ${p.nac}` : ''}</span>
                    </span>
                    <Legend si={p.legend} />
                  </button>
                );
              })}
              {visibles.length < ps.length && (
                <button className="btn link" onClick={() => setVerTodos(true)}>Ver los {ps.length} pilotos</button>
              )}
              {ps.length === 0 && <p className="peq gris" style={{ padding: 8 }}>Sin pilotos todavía.</p>}
            </div>
          </div>
        );
      })}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(73px + var(--safe-bottom))', background: '#110E0B', borderTop: '1px solid var(--linea)', padding: '10px 16px', zIndex: 9 }}>
        <div style={{ maxWidth: 528, margin: '0 auto' }}>
          <div className="grid4">
            {CATS.map((k) => {
              const p = picks[k] != null ? piloto(k, picks[k]) : null;
              return (
                <button key={k} onClick={() => setCat(k)} style={{ border: `1px ${p ? 'solid' : 'dashed'} ${CAT_COLOR[k]}`, borderRadius: 8, padding: '5px 6px', minHeight: 42, background: 'transparent', textAlign: 'left' }}>
                  <div className="cond" style={{ fontSize: 10, color: CAT_COLOR[k] }}>{CAT_CORTO[k]}{p?.nivel ? ` · ${p.nivel}` : ''}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: p ? 'var(--hueso)' : 'var(--gris)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p ? p.nombre : 'Falta'}</div>
                </button>
              );
            })}
          </div>
          {error && <div className="error" role="alert" style={{ marginTop: 6 }}>{error}</div>}
          <button className="btn" style={{ marginTop: 8, minHeight: 48 }} disabled={!completo || ocupado} onClick={guardar}>
            {ocupado ? 'Guardando…' : completo ? 'Guardar equipo' : 'Completa los 4 pilotos'}
          </button>
        </div>
      </div>
    </main>
  );
}

