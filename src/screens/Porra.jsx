import { useState } from 'react';
import { useDatos } from '../App.jsx';
import { CAT_COLOR, CAT_CORTO, MULT } from '../config.js';
import { Avatar, Cargando, abreFicha } from '../ui.jsx';
import { etapaNombre, puntos } from '../util.js';

export default function Porra() {
  const { porra, estado, jugador, verPiloto } = useDatos();
  const [abierto, setAbierto] = useState(jugador?.id || null);
  if (!porra || !estado) return <main className="main"><h1 className="titulo">LA PORRA</h1><Cargando /></main>;
  const js = porra.jugadores;
  const podio = [js[1], js[0], js[2]];
  const alturas = [46, 66, 34];
  const colores = ['#CFC2AE', '#E9B949', '#E07A5F'];

  return (
    <main className="main">
      <div className="cabecera">
        <div>
          <h1 className="titulo">LA PORRA</h1>
          <div className="etiqueta" style={{ marginTop: 6 }}>{js.length} jugadores · {estado.equipos_abiertos ? 'antes de la salida' : `tras ${etapaNombre(porra.etapa).toLowerCase()}`}</div>
        </div>
        <a href="#/admin" aria-label="Panel de administración" style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--linea)', display: 'grid', placeItems: 'center', color: 'var(--gris)' }}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></svg>
        </a>
      </div>

      {!estado.equipos_abiertos && js.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          {podio.map((j, i) => j && (
            <div key={j.id} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar nombre={j.nombre} color={colores[i]} size={i === 1 ? 58 : 46} /></div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{j.nombre}</div>
              <div className="mono peq arena">{puntos(j.puntos)}</div>
              <div style={{ height: alturas[i], marginTop: 6, borderRadius: '8px 8px 0 0', background: i === 1 ? '#3A2C1E' : '#2B221B', display: 'grid', placeItems: 'center' }}>
                <span className="st" style={{ fontSize: i === 1 ? 32 : 24, color: colores[i] }}>{j.pos}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {estado.equipos_abiertos && <div className="aviso">Los equipos se verán cuando salga el prólogo. Hasta entonces, solo sabes quién lo tiene completo.</div>}

      <div className="card" style={{ padding: '2px 12px' }}>
        {js.map((j) => {
          const mio = j.id === jugador?.id;
          const mv = j.pos_ant - j.pos;
          const open = abierto === j.id && j.equipo;
          return (
            <div key={j.id} style={{ borderTop: '1px solid var(--linea)' }}>
              <button onClick={() => setAbierto(abierto === j.id ? null : j.id)} aria-expanded={!!open}
                style={{ width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', gap: 10, background: mio ? 'rgba(201,138,61,.16)' : 'transparent', border: 0, borderRadius: 8, padding: '0 6px', textAlign: 'left' }}>
                <span className="mono arena" style={{ width: 22 }}>{j.pos}</span>
                <Avatar nombre={j.nombre} color={j.color} size={30} />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{j.nombre}{mio ? ' (tú)' : ''}</span>
                {estado.equipos_abiertos
                  ? <span className="peq" style={{ color: j.completo ? 'var(--ok)' : 'var(--gris)' }}>{j.completo ? 'Equipo listo' : 'Sin completar'}</span>
                  : <>
                    <span className="peq" style={{ width: 34, textAlign: 'right', color: mv > 0 ? 'var(--ok)' : mv < 0 ? 'var(--mal)' : 'var(--gris)' }}>{mv > 0 ? `▲${mv}` : mv < 0 ? `▼${-mv}` : '='}</span>
                    <span className="mono arena" style={{ width: 44, textAlign: 'right', fontSize: 15 }}>{puntos(j.puntos)}</span>
                  </>}
              </button>
              {open && (
                <div className="grid2" style={{ padding: '4px 6px 10px', gap: 6 }}>
                  {j.equipo.map((p) => (
                    <div key={p.cat} {...abreFicha(() => verPiloto(p.cat, p.cambio ? p.cambio.bib : p.bib))} style={{ cursor: 'pointer', background: 'var(--tierra2)', borderRadius: 8, padding: '6px 8px', outline: `1px solid ${CAT_COLOR[p.cat]}` }}>
                      <div className="cond" style={{ fontSize: 10, color: CAT_COLOR[p.cat] }}>{CAT_CORTO[p.cat]} · {p.nivel ? `${p.nivel} ${MULT[p.nivel]}` : 'libre'}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.cambio ? p.cambio.nombre : p.nombre}</div>
                      <div className="mono peq gris">{p.cambio ? `entra por ${p.nombre}` : p.abandono != null ? `abandono ${etapaNombre(p.abandono).toLowerCase()}` : p.pos_general ? `${p.pos_general}º` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!estado.equipos_abiertos && <p className="peq gris">Toca a un jugador para ver su equipo. Desempate: más etapas ganadas y, si sigue, mejor puesto del piloto C.</p>}
    </main>
  );
}
