import { useEffect, useMemo, useState } from 'react';
import { useDatos } from '../App.jsx';
import { rpc } from '../api.js';
import { CAT_COLOR } from '../config.js';
import { Cargando } from '../ui.jsx';
import { etapaNombre, fecha, hora } from '../util.js';

// Bibs de mis pilotos, con la "API" de la que vienen (M = motos, A = coches y camiones)
export function misBibs(yo) {
  const s = new Set();
  for (const p of yo?.equipo || []) {
    for (const bib of [p.bib, p.cambio?.bib]) {
      if (bib == null) continue;
      s.add(`${p.cat === 'GP' || p.cat === 'OBM' ? 'M' : 'A'}:${bib}`);
    }
  }
  return s;
}
export const esMia = (n, mios) => (n.bibs || []).some((b) => mios.has(`${b.api}:${b.bib}`));

const ETIQ = { GP: 'Motos', ULT: 'Ultimate', TRK: 'Camiones', OBM: 'OBM', GEN: 'General' };
const FILTROS = [['todo', 'Todo'], ['mios', 'Mis pilotos'], ['GP', 'Motos'], ['ULT', 'Ultimate'], ['TRK', 'Camiones'], ['video', 'Vídeos'], ['OTRA', 'Otras']];

export function EtiquetaNoticia({ n, mia }) {
  const color = CAT_COLOR[n.cat] || 'var(--gris)';
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {n.tipo === 'flm' && !n.enCronica && <span className="badge" style={{ background: 'var(--arena)' }}>Crónica</span>}
      {n.tipo === 'video' && <span className="badge" style={{ background: 'var(--linea)', color: 'var(--hueso)' }}>▶ Vídeo</span>}
      {n.tipo === 'liv' && <span className="cond" style={{ fontSize: 11, color }}>{n.cat === 'OTRA' ? n.grupo_nombre : ETIQ[n.cat]}</span>}
      {mia && <span className="badge" style={{ background: 'var(--duna)' }}>Tu piloto</span>}
    </span>
  );
}

export function Noticia({ n, mia, abierta: abiertaIni = false }) {
  const [abierta, setAbierta] = useState(abiertaIni);
  if (n.tipo === 'video') {
    return (
      <a href={n.enlace} target="_blank" rel="noopener noreferrer" className="fila" style={{ color: 'inherit', textDecoration: 'none', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flex: 'none', width: 112, height: 63, borderRadius: 8, overflow: 'hidden', background: 'var(--linea)' }}>
          {n.imagen && <img src={n.imagen} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 22, color: '#fff', textShadow: '0 1px 4px #000' }}>▶</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="peq gris">{hora(n.publicada)} · {etapaNombre(n.etapa)}</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{n.titulo}</div>
        </div>
      </a>
    );
  }
  return (
    <div className="fila" style={{ display: 'block', cursor: 'pointer' }} onClick={() => setAbierta(!abierta)} role="button" tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setAbierta(!abierta)} aria-expanded={abierta}>
      <div className="cab" style={{ alignItems: 'center' }}>
        <EtiquetaNoticia n={n} mia={mia} />
        <span className="mono peq gris">{hora(n.publicada)}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{n.titulo}</div>
      {abierta && n.imagen && <img src={n.imagen} alt="" loading="lazy" style={{ width: '100%', borderRadius: 10, marginTop: 8 }} />}
      {n.texto && (
        <div className={abierta ? '' : 'gris'} style={{ fontSize: 14, lineHeight: 1.45, marginTop: 4, whiteSpace: 'pre-line',
          ...(abierta ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }) }}>
          {n.texto}
        </div>
      )}
    </div>
  );
}

export default function Noticias({ params }) {
  const { estado, yo } = useDatos();
  const [etapa, setEtapa] = useState(params.get('etapa') != null ? Number(params.get('etapa')) : null);
  const [filtro, setFiltro] = useState('todo');
  const [lista, setLista] = useState(null);
  const [cuantas, setCuantas] = useState(40);

  useEffect(() => {
    let vivo = true;
    setLista(null);
    setCuantas(40);
    rpc('noticias', { p_etapa: etapa, p_limite: 300 }).then((d) => vivo && setLista(d || [])).catch(() => vivo && setLista([]));
    return () => { vivo = false; };
  }, [etapa, estado?.actualizado]);

  const mios = useMemo(() => misBibs(yo), [yo]);
  const filtradas = (lista || []).filter((n) => {
    if (filtro === 'video') return n.tipo === 'video';
    if (n.tipo === 'video') return false;
    if (filtro === 'todo') return n.cat !== 'OTRA';
    if (filtro === 'mios') return esMia(n, mios);
    return n.cat === filtro;
  });
  // La crónica del día, arriba del todo
  const cronicas = filtro === 'todo' ? filtradas.filter((n) => n.tipo === 'flm') : [];
  const resto = filtradas.filter((n) => !cronicas.includes(n));
  const etapas = (estado?.etapas || []).filter((e) => e.con_datos);

  let dia = null;
  return (
    <main className="main">
      <div className="cab" style={{ alignItems: 'center' }}>
        <a href="#/" className="gris" style={{ textDecoration: 'none', fontSize: 14 }}>← Inicio</a>
        <span className="etiqueta">Dakar en español · fuente oficial</span>
      </div>
      <div className="st" style={{ fontSize: 46, lineHeight: 0.9 }}>NOTICIAS</div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '0 -16px', padding: '0 16px 4px' }}>
        <button className={'chip' + (etapa == null ? ' on' : '')} style={{ flex: 'none' }} onClick={() => setEtapa(null)}>Todas</button>
        {etapas.map((x) => (
          <button key={x.num} className={'chip' + (x.num === etapa ? ' on' : '')} style={{ flex: 'none' }} onClick={() => setEtapa(x.num)}>{x.num === 0 ? 'Prólogo' : `E${x.num}`}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '0 -16px', padding: '0 16px 4px' }}>
        {FILTROS.map(([k, t]) => (
          <button key={k} className={'chip' + (k === filtro ? ' on' : '')} style={{ flex: 'none', minHeight: 32 }} onClick={() => { setFiltro(k); setCuantas(40); }}>{t}</button>
        ))}
      </div>

      {!lista ? <Cargando /> : filtradas.length === 0 ? (
        <div className="card gris" style={{ textAlign: 'center', padding: 24 }}>
          {lista.length === 0 ? 'Aún no hay noticias. En cuanto la organización empiece a publicar (con el prólogo, el 9 de enero), aparecerán aquí solas.' : filtro === 'mios' ? 'No hay noticias que mencionen a tus pilotos.' : 'No hay noticias con este filtro.'}
        </div>
      ) : (
        <>
          {cronicas.map((n) => (
            <div key={n.id} className="card destacada" style={{ padding: 0, overflow: 'hidden' }}>
              {n.imagen && <img src={n.imagen} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '2.4', objectFit: 'cover', display: 'block' }} />}
              <div style={{ padding: '10px 14px 12px' }}>
                <div className="etiqueta">Crónica · {etapaNombre(n.etapa)}</div>
                <Noticia n={{ ...n, imagen: null, enCronica: true }} mia={esMia(n, mios)} />
              </div>
            </div>
          ))}
          <div className="card" style={{ padding: '2px 14px' }}>
            {resto.slice(0, cuantas).map((n) => {
              const d = fecha(n.publicada);
              const cab = d !== dia ? (dia = d) : null;
              return (
                <div key={n.id}>
                  {cab && <div className="etiqueta" style={{ padding: '10px 0 2px', color: 'var(--arena)' }}>{cab}</div>}
                  <Noticia n={n} mia={esMia(n, mios)} />
                </div>
              );
            })}
          </div>
          {resto.length > cuantas && <button className="chip" style={{ alignSelf: 'center' }} onClick={() => setCuantas(cuantas + 40)}>Ver más ({resto.length - cuantas})</button>}
        </>
      )}
    </main>
  );
}

// Tarjeta compacta para Inicio y Etapa: lo último (o la crónica de una etapa) y enlace a todas
export function UltimasNoticias({ etapa = null, max = 3, titulo = 'Lo último' }) {
  const { yo, estado } = useDatos();
  const [lista, setLista] = useState(null);
  useEffect(() => {
    let vivo = true;
    rpc('noticias', { p_etapa: etapa, p_limite: 60 }).then((d) => vivo && setLista(d || [])).catch(() => vivo && setLista([]));
    return () => { vivo = false; };
  }, [etapa, estado?.actualizado]);
  const mios = useMemo(() => misBibs(yo), [yo]);
  const textos = (lista || []).filter((n) => n.tipo !== 'video' && n.cat !== 'OTRA');
  if (!textos.length) return null;
  const cronica = etapa != null ? textos.find((n) => n.tipo === 'flm') : null;
  const items = (cronica ? [cronica, ...textos.filter((n) => n !== cronica)] : textos).slice(0, max);
  return (
    <div className="card" style={{ padding: '10px 14px 6px' }}>
      <div className="cab">
        <h2 className="h2">{titulo}</h2>
        <a href={`#/noticias${etapa != null ? `?etapa=${etapa}` : ''}`} className="peq" style={{ color: 'var(--arena)', fontSize: 13 }}>Ver todas →</a>
      </div>
      <div style={{ marginTop: 4 }}>
        {items.map((n) => <Noticia key={n.id} n={n} mia={esMia(n, mios)} />)}
      </div>
    </div>
  );
}
