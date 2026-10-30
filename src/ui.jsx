import { useEffect, useState } from 'react';
import { CAT_COLOR, CAT_CORTO, NIVEL_COLOR } from './config.js';
import { iniciales } from './util.js';

export function Avatar({ foto, nombre, color, size = 38 }) {
  const [roto, setRoto] = useState(false);
  return (
    <span className="avatar" style={{ width: size, height: size, borderColor: color || undefined, color: color || undefined, fontSize: Math.round(size * 0.36) }}>
      {foto && !roto ? <img src={foto} alt="" loading="lazy" onError={() => setRoto(true)} /> : iniciales(nombre)}
    </span>
  );
}

export function Dunas({ alto = 160 }) {
  return (
    <svg className="dunas" aria-hidden="true" viewBox="0 0 390 160" preserveAspectRatio="none" style={{ height: alto }}>
      <path d="M0 70 Q80 24 170 60 T320 46 T390 40 V160 H0Z" fill="#C98A3D" opacity=".3" />
      <path d="M0 104 Q120 64 230 96 T390 84 V160 H0Z" fill="#B8532B" opacity=".4" />
      <path d="M0 136 Q150 112 270 132 T390 128 V160 H0Z" fill="#17130F" />
    </svg>
  );
}

export function Tabs({ items, valor, onCambio, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map(([k, t]) => (
        <button key={k} role="tab" aria-selected={k === valor} className={'tab' + (k === valor ? ' on' : '')} onClick={() => onCambio(k)}>{t}</button>
      ))}
    </div>
  );
}

export const tabsCat = (cats) => cats.map((c) => [c, CAT_CORTO[c]]);

export function Nivel({ nivel }) {
  if (!nivel) return <span className="badge" style={{ background: '#8C8378' }}>libre</span>;
  return <span className="badge" style={{ background: NIVEL_COLOR[nivel] }}>{nivel}</span>;
}

export function Legend({ si }) {
  return si ? <span className="badge legend">Legend</span> : null;
}

export function CatTag({ cat }) {
  return <span className="cond" style={{ fontSize: 11, color: CAT_COLOR[cat] }}>{CAT_CORTO[cat]}</span>;
}

const ICONOS = {
  inicio: <path d="M3 11l9-7 9 7v9H3z" />,
  equipo: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 1-4 3-4s3 2 3 4" /></>,
  etapa: <path d="M5 21V4M5 4h12l-2 4 2 4H5" />,
  clasif: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  porra: <path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M9 20h6M12 14v6" />,
};

export function Nav({ ruta }) {
  const items = [['inicio', '#/', 'Inicio'], ['equipo', '#/equipo', 'Equipo'], ['etapa', '#/etapa', 'Etapa'], ['clasif', '#/clasificacion', 'Clasif.'], ['porra', '#/porra', 'Porra']];
  return (
    <nav className="nav" aria-label="Secciones">
      <div className="nav-in">
        {items.map(([k, href, t]) => (
          <a key={k} href={href} className={ruta === k ? 'on' : ''} aria-current={ruta === k ? 'page' : undefined}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{ICONOS[k]}</svg>
            {t}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function useAhora(ms = 30000) {
  const [t, setT] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

export function Toast({ texto }) {
  return texto ? <div className="toast" role="status">{texto}</div> : null;
}

export function Cargando({ texto = 'Cargando…' }) {
  return <div className="cargando">{texto}</div>;
}
