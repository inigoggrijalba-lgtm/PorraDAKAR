import { useState } from 'react';
import { useDatos } from '../App.jsx';
import { mensaje, rpc } from '../api.js';
import { COLORES } from '../config.js';
import { codigoGuardado, guardarCodigo, guardarJugador, jugadores } from '../store.js';
import { Avatar, Dunas } from '../ui.jsx';

export default function Entrar({ params }) {
  const { recargar, estado } = useDatos();
  const [paso, setPaso] = useState('codigo');
  const [codigo, setCodigo] = useState((params.get('c') || codigoGuardado() || '').toUpperCase());
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(0);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [info, setInfo] = useState(null);
  const [nuevo, setNuevo] = useState(null);
  const yaHay = jugadores().length > 0;

  async function comprobar(e) {
    e.preventDefault();
    setError('');
    setOcupado(true);
    try {
      const r = await rpc('comprobar_codigo', { p_codigo: codigo });
      guardarCodigo(codigo.toUpperCase());
      setInfo(r);
      setPaso('nombre');
    } catch (err) {
      setError(mensaje(err));
    } finally {
      setOcupado(false);
    }
  }

  async function unirse(e) {
    e.preventDefault();
    setError('');
    setOcupado(true);
    try {
      const j = await rpc('unirse', { p_codigo: codigo, p_nombre: nombre, p_color: COLORES[color][0] });
      guardarJugador(j);
      setNuevo(j);
      setPaso('dentro');
      recargar();
    } catch (err) {
      setError(mensaje(err));
    } finally {
      setOcupado(false);
    }
  }

  if (paso === 'dentro' && nuevo) {
    return (
      <main className="main sin-nav">
        <div className="hero" style={{ textAlign: 'center', paddingBottom: 90 }}>
          <Dunas alto={120} />
          <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar nombre={nuevo.nombre} color={nuevo.color} size={84} /></div>
          <div className="etiqueta" style={{ color: 'var(--duna)', marginTop: 14 }}>Jugador {nuevo.num} de la porra</div>
          <h1 className="st" style={{ fontSize: 42, lineHeight: 0.95, marginTop: 6 }}>BIENVENIDO,<br /><span className="arena">{nuevo.nombre.toUpperCase()}</span></h1>
        </div>
        <div className="etiqueta">La porra en 30 segundos</div>
        {[
          ['Elige 4 pilotos:', 'Rally GP, Ultimate y camión (uno A, uno B y uno C) y uno libre de Original by Motul.'],
          ['Suman por la general final', '(×1, ×1,5 o ×2 según su nivel) y +3 por cada etapa ganada.'],
          ['En Agadir', 'puedes cambiar un piloto; el nuevo puntúa al 50%.'],
        ].map(([b, t], i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 12 }}>
            <span className="st arena" style={{ fontSize: 26, width: 20 }}>{i + 1}</span>
            <p style={{ lineHeight: 1.4 }}><b style={{ fontWeight: 600 }}>{b}</b> {t}</p>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <a className="btn" href="#/equipo">Hacer mi equipo</a>
        <a className="btn link" href="#/">Ahora no, ir al inicio</a>
      </main>
    );
  }

  if (paso === 'nombre') {
    const ok = nombre.trim().length >= 2;
    return (
      <main className="main sin-nav">
        <button className="volver" onClick={() => setPaso('codigo')}>‹ Código</button>
        <div className="cond" style={{ fontSize: 13, color: 'var(--ok)' }}>✓ Porra {codigo.toUpperCase()} · {info?.jugadores ?? 0} jugadores dentro</div>
        <h1 className="titulo" style={{ fontSize: 46, lineHeight: 0.95 }}>¿CÓMO TE<br />LLAMAMOS?</h1>
        <p style={{ color: 'var(--gris2)', lineHeight: 1.4 }}>Es el nombre que verán todos en la clasificación.</p>
        <form onSubmit={unirse} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <label htmlFor="nombre" className="etiqueta">Tu nombre</label>
          <input id="nombre" className={'input' + (error ? ' error' : '')} value={nombre} maxLength={14} autoComplete="nickname"
            onChange={(e) => { setNombre(e.target.value); setError(''); }} autoFocus />
          <div className="cab peq gris"><span>Máximo 14 letras</span><span className="mono">{nombre.length}/14</span></div>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="etiqueta" id="color-l" style={{ marginTop: 12 }}>Tu color</div>
          <div role="radiogroup" aria-labelledby="color-l" style={{ display: 'flex', gap: 12 }}>
            {COLORES.map(([hex, nom], i) => (
              <button key={hex} type="button" role="radio" aria-checked={i === color} aria-label={nom} onClick={() => setColor(i)}
                style={{ width: 44, height: 44, borderRadius: '50%', background: hex, border: i === color ? '3px solid #F4ECDF' : '2px solid #17130F' }} />
            ))}
          </div>
          <div className="etiqueta" style={{ marginTop: 16 }}>Así te verán</div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono arena" style={{ width: 22 }}>{(info?.jugadores ?? 0) + 1}</span>
            <Avatar nombre={nombre || '?'} color={COLORES[color][0]} size={40} />
            <span style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>{nombre || 'Tu nombre'}</span>
            <span className="mono arena">0</span>
          </div>
          <div style={{ height: 12 }} />
          <button className="btn" disabled={!ok || ocupado}>{ocupado ? 'Entrando…' : 'Unirme a la porra'}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="main sin-nav" style={{ paddingTop: 0 }}>
      <div className="hero" style={{ paddingBottom: 150 }}>
        <div className="sol" />
        <Dunas />
        <div className="cond" style={{ fontSize: 14, color: 'var(--duna)', letterSpacing: 4 }}>Dakar {estado?.edicion ?? 2027}</div>
        <div className="st" style={{ fontSize: 72, lineHeight: 0.86, color: 'var(--arena)', marginTop: 12 }}>PORRA<br /><span style={{ color: 'var(--terra)' }}>DAKAR</span></div>
        <p style={{ fontSize: 16, color: '#E8DDCD', marginTop: 14, maxWidth: 240, lineHeight: 1.35 }}>Elige 4 pilotos, olvídate y sigue el Dakar con el grupo.</p>
      </div>
      <form onSubmit={comprobar} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 8px' }}>
        <label htmlFor="codigo" className="etiqueta">Código de la porra</label>
        <input id="codigo" className={'input codigo' + (error ? ' error' : '')} value={codigo} autoComplete="off" autoCapitalize="characters"
          spellCheck="false" placeholder="CÓDIGO" onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setError(''); }} />
        {error ? <div className="error" role="alert">{error}</div>
          : <div className="peq gris" style={{ fontSize: 14 }}>Te lo pasa el organizador por WhatsApp. Si entras desde su enlace, ya viene puesto.</div>}
        <div style={{ height: 8 }} />
        <button className="btn" disabled={codigo.trim().length < 4 || ocupado}>{ocupado ? 'Comprobando…' : 'Entrar en la porra'}</button>
        {yaHay && <a className="btn link" href="#/usuarios">Ya juego en este móvil</a>}
        <p className="peq" style={{ color: '#8C8378', textAlign: 'center', marginTop: 12 }}>Sin contraseñas ni registros: solo el código y tu nombre.</p>
      </form>
    </main>
  );
}
