import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { rpc } from './api.js';
import { activo, jugadores } from './store.js';
import { Nav, Toast } from './ui.jsx';
import Entrar from './screens/Entrar.jsx';
import Usuarios from './screens/Usuarios.jsx';
import Inicio from './screens/Inicio.jsx';
import Equipo from './screens/Equipo.jsx';
import Etapa from './screens/Etapa.jsx';
import Clasificacion from './screens/Clasificacion.jsx';
import Porra from './screens/Porra.jsx';
import Agadir from './screens/Agadir.jsx';
import Admin from './screens/Admin.jsx';
import Noticias from './screens/Noticias.jsx';
import Chat from './Chat.jsx';
import FichaPiloto from './FichaPiloto.jsx';

const Datos = createContext(null);
export const useDatos = () => useContext(Datos);

function leerRuta() {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [path, q] = h.split('?');
  return { ruta: path.split('/')[0] || 'inicio', params: new URLSearchParams(q || '') };
}

export default function App() {
  const [{ ruta, params }, setRuta] = useState(leerRuta());
  const [jug, setJug] = useState(activo());
  const [datos, setDatos] = useState({ estado: null, pilotos: null, porra: null, yo: null, error: null });
  const [toast, setToast] = useState('');
  const [ficha, setFicha] = useState(null);
  const verPiloto = useCallback((cat, bib, accion) => setFicha({ cat, bib, accion }), []);
  const cerrarFicha = useCallback(() => setFicha(null), []);

  useEffect(() => {
    const f = () => { setRuta(leerRuta()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);

  const avisar = useCallback((t) => {
    setToast(t);
    setTimeout(() => setToast(''), 2600);
  }, []);

  const recargar = useCallback(async () => {
    const j = activo();
    setJug(j);
    try {
      const [estado, pilotos, porra, yo] = await Promise.all([
        rpc('estado'), rpc('pilotos'), rpc('porra'),
        j ? rpc('yo', { p_id: j.id, p_token: j.token }).catch(() => null) : Promise.resolve(null),
      ]);
      setDatos({ estado, pilotos, porra, yo, error: null });
    } catch (e) {
      setDatos((d) => ({ ...d, error: e }));
    }
  }, []);

  useEffect(() => {
    recargar();
    // Durante la carrera se refresca cada 2 minutos mientras la app está abierta
    const id = setInterval(() => { if (document.visibilityState === 'visible') recargar(); }, 120000);
    const vis = () => { if (document.visibilityState === 'visible') recargar(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, [recargar]);

  const hay = jugadores().length > 0;
  let pantalla;
  if (ruta === 'entrar' || !hay) pantalla = <Entrar params={params} />;
  else if (ruta === 'usuarios' || !jug) pantalla = <Usuarios />;
  else if (ruta === 'equipo') pantalla = <Equipo />;
  else if (ruta === 'etapa') pantalla = <Etapa params={params} />;
  else if (ruta === 'clasificacion') pantalla = <Clasificacion />;
  else if (ruta === 'porra') pantalla = <Porra />;
  else if (ruta === 'agadir') pantalla = <Agadir />;
  else if (ruta === 'admin') pantalla = <Admin />;
  else if (ruta === 'noticias') pantalla = <Noticias params={params} />;
  else pantalla = <Inicio />;

  const conNav = hay && jug && !['entrar', 'usuarios', 'admin', 'agadir'].includes(ruta);
  return (
    <Datos.Provider value={{ ...datos, jugador: jug, recargar, avisar, verPiloto }}>
      <div className="app">
        {pantalla}
        {conNav && <Nav ruta={ruta === 'clasificacion' ? 'clasif' : ruta === 'noticias' ? 'inicio' : ruta} />}
        {conNav && <Chat jugador={jug} pulso={datos.estado} oculto={ruta === 'equipo' && datos.estado?.equipos_abiertos} />}
        {ficha && <FichaPiloto cat={ficha.cat} bib={ficha.bib} accion={ficha.accion} cerrar={cerrarFicha} />}
        <Toast texto={toast} />
      </div>
    </Datos.Provider>
  );
}
