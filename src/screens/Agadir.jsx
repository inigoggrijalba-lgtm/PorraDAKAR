import { useState } from 'react';
import { useDatos } from '../App.jsx';
import { mensaje, rpc } from '../api.js';
import { CAT_COLOR, CAT_CORTO, MULT } from '../config.js';
import { Avatar, Cargando } from '../ui.jsx';
import { cuentaAtras, fecha } from '../util.js';

export default function Agadir() {
  const { estado, pilotos, yo, jugador, recargar, avisar } = useDatos();
  const [sale, setSale] = useState(null);
  const [entra, setEntra] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  if (!estado || !pilotos) return <main className="main sin-nav"><Cargando /></main>;

  const eq = yo?.equipo || [];
  const yaCambio = eq.find((p) => p.cambio);
  const ca = estado.agadir_cierra ? cuentaAtras(estado.agadir_cierra) : null;

  if (!estado.agadir_abierto) {
    return (
      <main className="main sin-nav">
        <a className="volver" href="#/">‹ Inicio</a>
        <h1 className="titulo" style={{ fontSize: 40 }}>MERCADO<br />DE AGADIR</h1>
        <p className="gris">{estado.agadir_abre ? `Abre el ${fecha(estado.agadir_abre)}, en el día de descanso.` : 'Se abre en el día de descanso, al acabar la etapa ' + estado.etapa_descanso + '.'}</p>
      </main>
    );
  }

  const pSale = eq.find((p) => p.cat === sale);
  const candidatos = pSale ? pilotos.filter((p) => p.cat === sale && p.bib !== pSale.bib && (sale === 'OBM' || p.nivel === pSale.nivel) && p.abandono == null)
    .sort((a, b) => (a.pos_general ?? 999) - (b.pos_general ?? 999)) : [];

  async function confirmar() {
    setError('');
    setOcupado(true);
    try {
      await rpc('cambio_agadir', { p_id: jugador.id, p_token: jugador.token, p_cat: sale, p_bib: entra });
      await recargar();
      avisar('Cambio hecho');
      setSale(null);
      setEntra(null);
    } catch (e) {
      setError(mensaje(e));
    } finally {
      setOcupado(false);
    }
  }

  const nEntra = candidatos.find((p) => p.bib === entra);
  return (
    <main className="main sin-nav" style={{ paddingBottom: 'calc(110px + var(--safe-bottom))' }}>
      <div className="card punteada" style={{ margin: '0 -4px' }}>
        <a className="volver" href="#/">‹ Inicio</a>
        <div className="st arena" style={{ fontSize: 40, lineHeight: 0.95 }}>MERCADO<br />DE AGADIR</div>
        <div className="cab" style={{ marginTop: 8 }}>
          <span className="etiqueta" style={{ color: 'var(--hueso)' }}>Día de descanso</span>
          {ca && <span className="mono peq arena" style={{ background: 'var(--noche)', borderRadius: 6, padding: '3px 8px' }}>Cierra en {ca.d ? `${ca.d}d ` : ''}{ca.h}h {ca.m}min</span>}
        </div>
        <p className="peq" style={{ color: 'var(--gris2)', marginTop: 8, fontSize: 13, lineHeight: 1.35 }}>Cambia un piloto por otro de su misma categoría y nivel. El nuevo puntúa la general al 50%; los bonus de etapa del que sale se quedan.</p>
      </div>
      {yaCambio && <div className="aviso">Ya has cambiado a {yaCambio.nombre} por {yaCambio.cambio.nombre}. Puedes rehacerlo mientras el mercado siga abierto.</div>}
      <div className="etiqueta">1 · ¿A quién sacas?</div>
      <div className="grid2">
        {eq.map((p) => (
          <button key={p.cat} aria-pressed={sale === p.cat} onClick={() => { setSale(p.cat); setEntra(null); }}
            style={{ minHeight: 62, textAlign: 'left', borderRadius: 10, border: sale === p.cat ? `2px solid ${CAT_COLOR[p.cat]}` : '1px solid var(--linea)', background: sale === p.cat ? 'rgba(201,138,61,.16)' : 'var(--tierra)', padding: '6px 8px' }}>
            <span className="cond" style={{ display: 'block', fontSize: 10, color: CAT_COLOR[p.cat] }}>{CAT_CORTO[p.cat]} · {p.nivel ? `${p.nivel} ${MULT[p.nivel]}` : 'libre'}</span>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{p.nombre}</span>
            <span className="mono peq" style={{ display: 'block', color: p.abandono != null || !p.pos_general || p.pos_general > 15 ? 'var(--mal)' : 'var(--gris)' }}>
              {p.abandono != null ? 'Abandono' : p.pos_general ? `${p.pos_general}º en la general` : '—'}
            </span>
          </button>
        ))}
      </div>
      {sale && (
        <>
          <div className="etiqueta">2 · ¿Quién entra?</div>
          <div className="card" style={{ padding: '2px 8px' }}>
            {candidatos.slice(0, 15).map((p) => (
              <button key={p.bib} className={'piloto-btn' + (entra === p.bib ? ' sel' : '')} aria-pressed={entra === p.bib} onClick={() => setEntra(p.bib)}>
                <span className="mono arena" style={{ width: 30 }}>{p.pos_general ? `${p.pos_general}º` : '–'}</span>
                <Avatar foto={p.foto} nombre={p.nombre} size={32} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.nombre}</span>
              </button>
            ))}
            {candidatos.length === 0 && <p className="gris peq" style={{ padding: 8 }}>No hay pilotos disponibles de ese nivel.</p>}
          </div>
        </>
      )}
      {error && <div className="error" role="alert">{error}</div>}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#110E0B', borderTop: '1px solid var(--linea)', padding: '10px 16px calc(14px + var(--safe-bottom))' }}>
        <button className="btn" style={{ maxWidth: 528, margin: '0 auto' }} disabled={!nEntra || ocupado} onClick={confirmar}>
          {ocupado ? 'Guardando…' : nEntra ? `Cambiar ${pSale.nombre} por ${nEntra.nombre}` : 'Elige quién sale y quién entra'}
        </button>
      </div>
    </main>
  );
}
