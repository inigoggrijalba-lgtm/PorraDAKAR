import { useDatos } from '../App.jsx';
import { jugadores, setActivo } from '../store.js';
import { Avatar } from '../ui.jsx';

export default function Usuarios() {
  const { porra, recargar } = useDatos();
  const lista = jugadores();
  const info = (id) => porra?.jugadores?.find((j) => j.id === id);

  function elegir(id) {
    setActivo(id);
    recargar();
    window.location.hash = '#/';
  }

  return (
    <main className="main sin-nav" style={{ textAlign: 'center' }}>
      <div className="logo" style={{ fontSize: 28, marginTop: 40 }}>PORRA<span>DAKAR</span></div>
      <h1 className="st" style={{ fontSize: 46, lineHeight: 0.95, marginTop: 24 }}>¿QUIÉN JUEGA?</h1>
      <p style={{ color: 'var(--gris2)' }}>Jugadores guardados en este móvil</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20, textAlign: 'left' }}>
        {lista.map((j) => {
          const i = info(j.id);
          return (
            <button key={j.id} onClick={() => elegir(j.id)} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 76, color: 'var(--hueso)' }}>
              <Avatar nombre={j.nombre} color={j.color} size={52} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 19, fontWeight: 600 }}>{j.nombre}</span>
                <span className="peq" style={{ display: 'block', fontSize: 13, color: i && !i.completo ? 'var(--mal)' : 'var(--gris)' }}>
                  {i ? (i.completo ? `${i.pos}º · equipo completo` : 'Le faltan pilotos') : ''}
                </span>
              </span>
              <span aria-hidden="true" className="gris" style={{ fontSize: 22 }}>›</span>
            </button>
          );
        })}
        <a href="#/entrar" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 76, border: '2px dashed #6B5E50', borderRadius: 16, padding: '0 16px' }}>
          <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: '50%', border: '2px dashed var(--duna)', display: 'grid', placeItems: 'center', fontSize: 28, color: 'var(--duna)' }}>+</span>
          <span><span style={{ display: 'block', fontSize: 17, fontWeight: 600 }}>Añadir otro jugador</span>
            <span className="peq gris" style={{ display: 'block', fontSize: 13 }}>En este móvil</span></span>
        </a>
      </div>
      <p className="peq" style={{ color: '#8C8378', marginTop: 24 }}>Sin contraseña: cualquiera con este móvil puede entrar como estos jugadores.</p>
    </main>
  );
}
