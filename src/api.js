import { SUPABASE_KEY, SUPABASE_URL } from './config.js';

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// Llama a una función de la base de datos. Si falla, lanza ApiError con el código del fallo.
export async function rpc(name, args = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(args),
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError('SIN_CONEXION');
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) throw new ApiError((data && data.message) || `HTTP_${res.status}`);
  return data;
}

const MENSAJES = {
  SIN_CONEXION: 'No hay conexión. Comprueba la cobertura y vuelve a intentarlo.',
  SIN_CONFIGURAR: 'La porra todavía no está configurada.',
  CODIGO_INCORRECTO: 'Ese código no existe. Revisa el mensaje del grupo o pídeselo al organizador.',
  PORRA_CERRADA: 'Esta porra ya ha arrancado: la entrada de jugadores se cerró con la salida del prólogo.',
  NOMBRE_NO_VALIDO: 'El nombre tiene que tener entre 2 y 14 letras.',
  NOMBRE_REPETIDO: 'Ya hay alguien con ese nombre en la porra. Prueba con una inicial.',
  NO_AUTORIZADO: 'No se ha podido comprobar quién eres. Vuelve a entrar.',
  EQUIPOS_CERRADOS: 'Los equipos ya están cerrados.',
  FALTA_PILOTO: 'Te falta algún piloto.',
  PILOTO_NO_VALIDO: 'Ese piloto no está en la lista.',
  NIVELES_NO_VALIDOS: 'Necesitas un piloto A, uno B y uno C entre Motos, Ultimate y Camiones.',
  AGADIR_CERRADO: 'El mercado de Agadir no está abierto.',
  SIN_EQUIPO: 'No tienes piloto en esa categoría.',
  MISMO_PILOTO: 'Elige un piloto distinto.',
  MISMO_PILOTO_DOS_VECES: 'Ese piloto ya lo llevas en otra categoría.',
  OTRO_NIVEL: 'El sustituto tiene que ser del mismo nivel.',
};

export const mensaje = (e) => MENSAJES[e && e.code] || 'Algo ha fallado. Vuelve a intentarlo.';
