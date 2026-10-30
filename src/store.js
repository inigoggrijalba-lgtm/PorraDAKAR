// Jugadores guardados en este móvil (pueden jugar varios desde el mismo teléfono, sin contraseña).
const KEY = 'porradakar.jugadores';
const ACTIVO = 'porradakar.activo';

export function jugadores() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function guardarJugador(j) {
  const lista = jugadores().filter((x) => x.id !== j.id);
  lista.push({ id: j.id, token: j.token, nombre: j.nombre, color: j.color });
  localStorage.setItem(KEY, JSON.stringify(lista));
  setActivo(j.id);
}

export function quitarJugador(id) {
  localStorage.setItem(KEY, JSON.stringify(jugadores().filter((x) => x.id !== id)));
  if (activoId() === id) localStorage.removeItem(ACTIVO);
}

export const activoId = () => localStorage.getItem(ACTIVO);
export const setActivo = (id) => localStorage.setItem(ACTIVO, id);
export const activo = () => jugadores().find((j) => j.id === activoId()) || null;

export const codigoGuardado = () => localStorage.getItem('porradakar.codigo') || '';
export const guardarCodigo = (c) => localStorage.setItem('porradakar.codigo', c);
