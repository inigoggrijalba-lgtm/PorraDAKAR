import { useEffect, useState } from 'react';
import { mensaje, rpc } from '../api.js';
import { hora, haceCuanto } from '../util.js';

export default function Admin() {
  const [clave, setClave] = useState(sessionStorage.getItem('porradakar.admin') || '');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  async function entrar(e) {
    e?.preventDefault();
    setError('');
    try {
      const d = await rpc('admin_estado', { p_clave: clave });
      sessionStorage.setItem('porradakar.admin', clave);
      setDatos(d);
    } catch (err) {
      setError(err.code === 'NO_AUTORIZADO' ? 'Clave incorrecta.' : mensaje(err));
    }
  }

  if (!datos) {
    return (
      <main className="main sin-nav">
        <a className="volver" href="#/porra">‹ La porra</a>
        <h1 className="titulo">ADMIN</h1>
        <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="clave" className="etiqueta">Clave de administrador</label>
          <input id="clave" type="password" className="input" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" />
          {error && <div className="error" role="alert">{error}</div>}
          <button className="btn" disabled={!clave}>Entrar</button>
        </form>
      </main>
    );
  }

  const c = datos.config;
  const ultimoOk = datos.log.find((l) => l.nivel !== 'error');
  const errorReciente = datos.log[0]?.nivel === 'error';
  return (
    <main className="main sin-nav">
      <a className="volver" href="#/porra">‹ La porra</a>
      <div>
        <h1 className="titulo">ADMIN</h1>
        <div className="etiqueta" style={{ marginTop: 6 }}>Solo supervisión · todo se carga solo</div>
      </div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, background: errorReciente ? '#2A1A16' : '#1C2416', borderColor: errorReciente ? 'var(--mal)' : '#6E8A4A' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: errorReciente ? 'var(--mal)' : 'var(--ok)', flex: 'none' }} />
        <div>
          <div style={{ fontWeight: 600 }}>{errorReciente ? 'La última lectura falló' : 'Todo al día'}</div>
          <div className="peq gris">Última lectura correcta {haceCuanto(ultimoOk?.ts)}</div>
        </div>
      </div>
      <div className="card">
        {[['Edición', c.edicion], ['Código de la porra', c.codigo], ['Cierre de equipos', new Date(c.cierre_equipos).toLocaleString('es-ES')],
          ['Mercado de Agadir', c.agadir_abre ? `${new Date(c.agadir_abre).toLocaleString('es-ES')} → ${new Date(c.agadir_cierra).toLocaleString('es-ES')}` : 'Sin fechas'],
          ['Última etapa con datos', c.ultima_etapa],
          ['Pilotos', Object.entries(datos.pilotos || {}).map(([k, v]) => `${k} ${v}`).join(' · ')]].map(([k, v]) => (
          <div key={k} className="fila" style={{ justifyContent: 'space-between' }}><span className="gris">{k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span></div>
        ))}
      </div>
      <div className="card">
        <div className="etiqueta" style={{ marginBottom: 4 }}>Registro del robot</div>
        {datos.log.map((l, i) => (
          <div key={i} className="mono peq" style={{ lineHeight: 1.6, color: l.nivel === 'error' ? 'var(--mal)' : 'var(--gris2)' }}>
            {new Date(l.ts).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {l.mensaje}
          </div>
        ))}
      </div>
      <ChatAdmin clave={clave} />
      <button className="btn sec" onClick={entrar}>Actualizar</button>
    </main>
  );
}

// Últimos mensajes del chat, con opción de ocultarlos
function ChatAdmin({ clave }) {
  const [msgs, setMsgs] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { rpc('chat_leer', { p_desde: null }).then((m) => setMsgs((m || []).filter((x) => !x.robot).slice(-30).reverse())).catch(() => setMsgs([])); }, []);
  async function ocultar(m) {
    try {
      await rpc('admin_ocultar_mensaje', { p_clave: clave, p_mensaje: m.id });
      setMsgs((l) => l.filter((x) => x.id !== m.id));
    } catch (e) {
      setError(mensaje(e));
    }
  }
  return (
    <div className="card">
      <div className="etiqueta" style={{ marginBottom: 4 }}>Chat · últimos mensajes</div>
      {error && <div className="error peq">{error}</div>}
      {msgs && msgs.length === 0 && <div className="peq gris">Nadie ha escrito todavía.</div>}
      {(msgs || []).map((m) => (
        <div key={m.id} className="fila" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
            <span className="cond" style={{ color: m.color }}>{m.nombre}</span> <span className="mono peq gris">{hora(m.creado)}</span>
            <div style={{ overflowWrap: 'anywhere' }}>{m.texto}</div>
          </div>
          <button className="chat-borrar" onClick={() => ocultar(m)}>Ocultar</button>
        </div>
      ))}
    </div>
  );
}
