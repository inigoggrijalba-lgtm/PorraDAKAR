import { useEffect, useState } from 'react';
import { useDatos } from '../App.jsx';
import { rpc } from '../api.js';
import { CATS } from '../config.js';
import { Avatar, Cargando, Legend, Nivel, Tabs, tabsCat } from '../ui.jsx';
import { diferencia, etapaNombre, haceCuanto, tiempo } from '../util.js';

export default function Clasificacion() {
  const { estado, yo } = useDatos();
  const [cat, setCat] = useState('GP');
  const [vista, setVista] = useState('general');
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    if (!estado) return;
    let vivo = true;
    setDatos(null);
    rpc('clasificacion', { p_cat: cat }).then((d) => vivo && setDatos(d)).catch(() => vivo && setDatos({ filas: [], abandonos: [] }));
    return () => { vivo = false; };
  }, [cat, estado]);

  if (!estado) return <main className="main"><Cargando /></main>;
  const mios = new Set((yo?.equipo || []).flatMap((p) => [`${p.cat}:${p.bib}`, p.cambio ? `${p.cat}:${p.cambio.bib}` : null]).filter(Boolean));
  const filas = (datos?.filas || []).filter((f) => f.pos_general != null);
  const lider = filas[0]?.tiempo_general;

  return (
    <main className="main">
      <div>
        <h1 className="titulo">CLASIFICACIONES</h1>
        <div className="etiqueta" style={{ marginTop: 6 }}>General tras {etapaNombre(estado.ultima_etapa).toLowerCase()} · {haceCuanto(estado.actualizado)}</div>
      </div>
      <Tabs items={tabsCat(CATS)} valor={cat} onCambio={setCat} label="Categoría" />
      <div className="chips">
        {[['general', 'General'], ['abandonos', 'Abandonos']].map(([k, t]) => (
          <button key={k} className={'chip' + (k === vista ? ' on' : '')} aria-pressed={k === vista} onClick={() => setVista(k)}>{t}</button>
        ))}
      </div>
      {!datos ? <Cargando /> : vista === 'abandonos' ? (
        <div className="card" style={{ padding: '4px 12px' }}>
          {datos.abandonos.length === 0 && <p className="gris" style={{ padding: '12px 0' }}>Nadie ha abandonado.</p>}
          {datos.abandonos.map((a) => (
            <div key={a.bib} className={'fila' + (mios.has(`${cat}:${a.bib}`) ? ' mia' : '')}>
              <span style={{ flex: 1, fontWeight: 600 }}>{a.nombre}</span>
              <span className="peq gris">{etapaNombre(a.etapa)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '4px 12px' }}>
          {filas.length === 0 && <p className="gris" style={{ padding: '12px 0' }}>Sin clasificación todavía.</p>}
          {filas.map((f) => {
            const mio = mios.has(`${cat}:${f.bib}`);
            return (
              <div key={f.bib} className={'fila' + (mio ? ' mia' : '')}>
                <span className="mono arena" style={{ width: 22 }}>{f.pos_general}</span>
                <Avatar foto={f.foto} nombre={f.nombre} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {f.nombre}{mio && <span className="badge" style={{ background: 'var(--arena)' }}>Tuyo</span>}<Legend si={f.legend} />
                  </div>
                  <div className="mono peq gris">{f.pos_general === 1 ? tiempo(f.tiempo_general) : diferencia(f.tiempo_general, lider)}{f.pos_general <= 15 ? '' : ' · sin puntos'}</div>
                </div>
                {cat !== 'OBM' && <Nivel nivel={f.nivel} />}
                {f.elegido != null && <span className="mono" style={{ width: 26, textAlign: 'right' }}>{f.elegido}</span>}
              </div>
            );
          })}
        </div>
      )}
      <p className="peq gris" style={{ padding: '0 4px' }}>Puntúan los 15 primeros de la general de cada categoría. {estado.equipos_abiertos ? '' : 'La última columna es cuántos jugadores llevan a ese piloto.'}</p>
    </main>
  );
}
