import { useEffect, useState } from 'react';
import { useDatos } from '../App.jsx';
import { rpc } from '../api.js';
import { CATS } from '../config.js';
import { Avatar, Cargando, Legend, Nivel, Tabs, tabsCat } from '../ui.jsx';
import { diferencia, etapaNombre, fecha, haceCuanto, tiempo } from '../util.js';

export default function Etapa({ params }) {
  const { estado, yo } = useDatos();
  const [cat, setCat] = useState('GP');
  const [num, setNum] = useState(params.get('n') != null ? Number(params.get('n')) : null);
  const [datos, setDatos] = useState(null);

  const etapas = estado?.etapas || [];
  const conDatos = etapas.filter((e) => e.con_datos);
  const n = num ?? estado?.ultima_etapa ?? 0;

  useEffect(() => {
    if (!estado) return;
    let vivo = true;
    setDatos(null);
    rpc('clasificacion', { p_cat: cat, p_etapa: n }).then((d) => vivo && setDatos(d)).catch(() => vivo && setDatos({ filas: [] }));
    return () => { vivo = false; };
  }, [cat, n, estado]);

  if (!estado) return <main className="main"><Cargando /></main>;
  const e = etapas.find((x) => x.num === n);
  const mios = new Set((yo?.equipo || []).flatMap((p) => [`${p.cat}:${p.bib}`, p.cambio ? `${p.cat}:${p.cambio.bib}` : null]).filter(Boolean));
  const filas = (datos?.filas || []).filter((f) => f.pos_etapa != null).sort((a, b) => a.pos_etapa - b.pos_etapa);
  const lider = filas[0]?.tiempo_etapa;
  const provisional = filas.some((f) => f.provisional);

  return (
    <main className="main">
      <div>
        <div className="cab">
          <span className={'badge' + (provisional ? ' directo' : '')} style={provisional ? {} : { background: 'var(--linea)', color: 'var(--gris2)' }}>{provisional ? 'En directo' : 'Resultado'}</span>
          <span className="etiqueta">{fecha(e?.fecha)}{e?.maraton ? ' · maratón' : ''}</span>
        </div>
        <div className="st" style={{ fontSize: 52, lineHeight: 0.9, marginTop: 10 }}>{etapaNombre(n).toUpperCase()}</div>
        <div className="gris" style={{ marginTop: 4 }}>{e?.nombre}</div>
        {e && (e.km || e.cancelada) ? (
          <div className="grid3" style={{ marginTop: 12 }}>
            <div className="card" style={{ padding: 8 }}><div className="mono arena" style={{ fontSize: 18 }}>{e.km ?? '—'}</div><div className="peq gris">km especial</div></div>
            <div className="card" style={{ padding: 8 }}><div className="mono arena" style={{ fontSize: 18 }}>{filas.length}</div><div className="peq gris">en meta</div></div>
            <div className="card" style={{ padding: 8 }}><div className="mono arena" style={{ fontSize: 14, paddingTop: 3 }}>{e.cancelada ? 'Anulada' : haceCuanto(estado.actualizado)}</div><div className="peq gris">{e.cancelada ? '' : 'actualizado'}</div></div>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, margin: '0 -16px', padding: '0 16px 4px' }}>
        {conDatos.map((x) => (
          <button key={x.num} className={'chip' + (x.num === n ? ' on' : '')} style={{ flex: 'none' }} onClick={() => setNum(x.num)}>{x.num === 0 ? 'Prólogo' : `E${x.num}`}</button>
        ))}
      </div>

      <Tabs items={tabsCat(CATS)} valor={cat} onCambio={setCat} label="Categoría" />

      {!datos ? <Cargando /> : (
        <div className="card" style={{ padding: '4px 12px' }}>
          <div className="etiqueta" style={{ display: 'flex', gap: 10, padding: '6px 0', fontSize: 11 }}>
            <span style={{ width: 22 }}>Pos</span><span style={{ flex: 1 }}>Piloto</span><span>Tiempo</span>{estado.equipos_abiertos ? null : <span style={{ width: 30, textAlign: 'right' }}>Porra</span>}
          </div>
          {filas.length === 0 && <p className="gris" style={{ padding: '12px 0' }}>Sin resultados todavía.</p>}
          {filas.map((f) => {
            const mio = mios.has(`${cat}:${f.bib}`);
            return (
              <div key={f.bib} className={'fila' + (mio ? ' mia' : '')}>
                <span className="mono arena" style={{ width: 22 }}>{f.pos_etapa}</span>
                <Avatar foto={f.foto} nombre={f.nombre} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {f.nombre}{mio && <span className="badge" style={{ background: 'var(--arena)' }}>Tuyo</span>}<Legend si={f.legend} />
                  </div>
                  <div className="mono peq gris">{f.pos_etapa === 1 ? tiempo(f.tiempo_etapa) : diferencia(f.tiempo_etapa, lider)}</div>
                </div>
                {cat !== 'OBM' && <Nivel nivel={f.nivel} />}
                {estado.equipos_abiertos ? null : <span className="mono" style={{ width: 30, textAlign: 'right' }}>{f.elegido ?? ''}</span>}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
