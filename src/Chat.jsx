import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { mensaje, rpc } from './api.js';
import { Avatar } from './ui.jsx';
import { fecha, hora } from './util.js';

const claveVisto = (j) => `porradakar.chat.visto.${j?.id}`;
const visto = (j) => Number(localStorage.getItem(claveVisto(j)) || 0);
const marcarVisto = (j, id) => { if (id > visto(j)) localStorage.setItem(claveVisto(j), String(id)); };

// Bola flotante + panel de chat de la porra
export default function Chat({ jugador, oculto, pulso }) {
  const [abierto, setAbierto] = useState(false);
  const [nuevos, setNuevos] = useState(0);

  const comprobar = useCallback(async () => {
    if (!jugador) return;
    try {
      const r = await rpc('chat_pendientes', { p_desde: visto(jugador), p_jugador: jugador.id });
      setNuevos(r?.nuevos || 0);
    } catch { /* sin conexión: ya se verá */ }
  }, [jugador]);

  // Se comprueba al arrancar y cada vez que la app refresca datos (cada 2 min)
  useEffect(() => { comprobar(); }, [comprobar, pulso]);

  useEffect(() => {
    if (!abierto) return;
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = 'hidden';
    const esc = (e) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', esc);
    return () => { html.style.overflow = antes; window.removeEventListener('keydown', esc); };
  }, [abierto]);

  if (!jugador) return null;
  return (
    <>
      {!oculto && !abierto && (
        <button className="chat-bola" onClick={() => setAbierto(true)} aria-label={nuevos ? `Abrir chat, ${nuevos} mensajes nuevos` : 'Abrir chat'}>
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
          {nuevos > 0 && <span className="chat-num">{nuevos > 99 ? '99+' : nuevos}</span>}
        </button>
      )}
      {abierto && <Panel jugador={jugador} cerrar={() => { setAbierto(false); setNuevos(0); }} />}
    </>
  );
}

function Panel({ jugador, cerrar }) {
  const [msgs, setMsgs] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [elegido, setElegido] = useState(null);
  const lista = useRef(null);
  const abajo = useRef(true);
  const ultimo = useRef(0);

  const traer = useCallback(async (inicio = false) => {
    try {
      const nuevos = await rpc('chat_leer', { p_desde: inicio ? null : ultimo.current });
      if (!nuevos?.length) { if (inicio) setMsgs([]); return; }
      ultimo.current = Math.max(ultimo.current, ...nuevos.map((m) => m.id));
      marcarVisto(jugador, ultimo.current);
      setMsgs((ant) => {
        const base = inicio ? [] : ant || [];
        const ids = new Set(base.map((m) => m.id));
        return [...base, ...nuevos.filter((m) => !ids.has(m.id))];
      });
    } catch (e) {
      if (inicio) { setMsgs([]); setError(mensaje(e)); }
    }
  }, [jugador]);

  useEffect(() => {
    traer(true);
    const id = setInterval(() => { if (document.visibilityState === 'visible') traer(); }, 5000);
    return () => clearInterval(id);
  }, [traer]);

  // Baja al final al abrir y cuando llegan mensajes (si ya estabas abajo)
  useLayoutEffect(() => {
    const el = lista.current;
    if (el && abajo.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  async function enviar(e) {
    e?.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setError('');
    try {
      await rpc('chat_enviar', { p_id: jugador.id, p_token: jugador.token, p_texto: t });
      setTexto('');
      abajo.current = true;
      await traer();
    } catch (err) {
      setError(mensaje(err));
    } finally {
      setEnviando(false);
    }
  }

  async function borrar(m) {
    try {
      await rpc('chat_borrar', { p_id: jugador.id, p_token: jugador.token, p_mensaje: m.id });
      setMsgs((l) => l.filter((x) => x.id !== m.id));
    } catch (err) {
      setError(mensaje(err));
    }
    setElegido(null);
  }

  let dia = null;
  return (
    <div className="chat-fondo" onClick={cerrar}>
      <section className="chat-panel" role="dialog" aria-modal="true" aria-label="Chat de la porra" onClick={(e) => e.stopPropagation()}>
        <header className="chat-cab">
          <div>
            <div className="h2" style={{ fontSize: 22 }}>El chat</div>
            <div className="peq gris">Solo para los de la porra</div>
          </div>
          <button className="chat-x" onClick={cerrar} aria-label="Cerrar chat">✕</button>
        </header>

        <div className="chat-lista" ref={lista} onScroll={(e) => { const el = e.currentTarget; abajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }}>
          {msgs == null && <div className="gris" style={{ textAlign: 'center', padding: 24 }}>Cargando…</div>}
          {msgs && msgs.length === 0 && (
            <div className="gris" style={{ textAlign: 'center', padding: '40px 24px' }}>Aún no hay mensajes. ¡Rompe el hielo!</div>
          )}
          {(msgs || []).map((m, i) => {
            const d = fecha(m.creado);
            const sep = d !== dia ? (dia = d) : null;
            const mio = m.jugador_id === jugador.id;
            const seguido = !sep && i > 0 && msgs[i - 1].jugador_id === m.jugador_id && !m.robot && !msgs[i - 1].robot;
            return (
              <div key={m.id}>
                {sep && <div className="chat-dia">{sep}</div>}
                {m.robot ? (
                  <div className="chat-robot">
                    <div className="etiqueta" style={{ fontSize: 10, color: 'var(--duna)' }}>PorraDAKAR · {hora(m.creado)}</div>
                    <div style={{ whiteSpace: 'pre-line', marginTop: 2 }}>{m.texto}</div>
                  </div>
                ) : (
                  <div className={'chat-fila' + (mio ? ' mio' : '')} style={{ marginTop: seguido ? 2 : 10 }}>
                    {!mio && <span style={{ width: 30, flex: 'none' }}>{!seguido && <Avatar nombre={m.nombre} color={m.color} size={30} />}</span>}
                    <div className="chat-burbuja" onClick={() => mio && setElegido(elegido === m.id ? null : m.id)}
                      style={mio ? {} : { borderTopLeftRadius: seguido ? 14 : 4 }}>
                      {!mio && !seguido && <div className="cond" style={{ fontSize: 12, color: m.color || 'var(--arena)' }}>{m.nombre}</div>}
                      <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.texto}</span>
                      <span className="chat-hora">{hora(m.creado)}</span>
                    </div>
                  </div>
                )}
                {elegido === m.id && (
                  <div style={{ textAlign: 'right', marginTop: 4 }}>
                    <button className="chat-borrar" onClick={() => borrar(m)}>Borrar mensaje</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form className="chat-pie" onSubmit={enviar}>
          {error && <div className="error peq" role="alert" style={{ width: '100%' }}>{error}</div>}
          <textarea className="chat-input" rows={1} value={texto} maxLength={500} placeholder={`Escribe como ${jugador.nombre}…`}
            aria-label="Mensaje" onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); enviar(); } }} />
          <button className="chat-enviar" disabled={!texto.trim() || enviando} aria-label="Enviar">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
          </button>
        </form>
      </section>
    </div>
  );
}
