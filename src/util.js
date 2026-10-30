// Utilidades de formato
export function tiempo(ms) {
  if (ms == null) return '';
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
}

export function diferencia(ms, lider) {
  if (ms == null || lider == null) return '';
  if (ms === lider) return '—';
  return '+' + tiempo(ms - lider);
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fecha(iso) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function hora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
}

export function haceCuanto(iso) {
  if (!iso) return 'sin datos';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

export function cuentaAtras(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return { d, h, m };
}

export const etapaNombre = (n) => (n === 0 ? 'Prólogo' : `Etapa ${n}`);
export const iniciales = (n) => (n || '?').replace(/[^\p{L}\s.-]/gu, '').split(/[\s.]+/).filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase() || '?';
export const puntos = (p) => (Math.round(Number(p) * 10) / 10).toString().replace('.', ',');
