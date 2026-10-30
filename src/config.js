// Dirección y clave pública del proyecto de Supabase. La clave es pública a propósito:
// solo permite llamar a las funciones de la porra, y cada función comprueba quién llama.
export const SUPABASE_URL = 'https://hvqfcgatuiqoezhnlvfl.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_yW1E_4WwQXv0ho85MvU4Ww_0Bqp_Skx';

export const CATS = ['GP', 'ULT', 'TRK', 'OBM'];
export const CAT_NOMBRE = { GP: 'Motos (Rally GP y Rally 2)', ULT: 'Ultimate', TRK: 'Camiones', OBM: 'Original by Motul' };
export const CAT_CORTO = { GP: 'Motos', ULT: 'Ultimate', TRK: 'Camiones', OBM: 'OBM' };
export const CAT_COLOR = { GP: '#E07A2E', ULT: '#5FB0C0', TRK: '#B5BE5C', OBM: '#CFC2AE' };
export const NIVEL_COLOR = { A: '#E9B949', B: '#CFC2AE', C: '#E07A5F' };
export const MULT = { A: '×1', B: '×1,5', C: '×2' };
export const COLORES = [['#E9C58B', 'Arena'], ['#E07A2E', 'Naranja'], ['#5FB0C0', 'Turquesa'], ['#B5BE5C', 'Oliva'], ['#E07A5F', 'Terracota'], ['#CFC2AE', 'Hueso']];

// Recorrido oficial Dakar 2027 (presentado el 30-10-2026). [num, fecha, tramo, km especial, km total]
export const RECORRIDO_2027 = {
  total: 7824,
  especial: 4341,
  dias: [
    { num: 0, f: '2027-01-09', tramo: 'Loulé / Faro (Portugal)', esp: 29, tot: 129 },
    { num: 1, f: '2027-01-10', tramo: 'Loulé / Faro (Portugal)', esp: 100, tot: 300 },
    { tipo: 'ferri', f: '2027-01-11', tramo: 'Ferri nocturno a Nador (Marruecos)' },
    { num: 2, f: '2027-01-12', tramo: 'Bouarfa', esp: 390, tot: 490 },
    { num: 3, f: '2027-01-13', tramo: 'Bouarfa (bucle)', esp: 410, tot: 490 },
    { num: 4, f: '2027-01-14', tramo: 'Bouarfa → Zagora', esp: 490, tot: 750 },
    { num: 5, f: '2027-01-15', tramo: 'Zagora (bucle)', esp: 365, tot: 540 },
    { num: 6, f: '2027-01-16', tramo: 'Zagora → Agadir', esp: 365, tot: 760 },
    { tipo: 'descanso', f: '2027-01-17', tramo: 'Agadir · mercado de cambios' },
    { num: 7, f: '2027-01-18', tramo: 'Agadir → Smara', esp: 500, tot: 790 },
    { num: 8, f: '2027-01-19', tramo: 'Smara → vivac refugio', esp: 355, tot: 525 },
    { num: 9, f: '2027-01-20', tramo: 'Vivac refugio → Smara', esp: 390, tot: 625 },
    { num: 10, f: '2027-01-21', tramo: 'Smara (bucle)', esp: 470, tot: 560 },
    { num: 11, f: '2027-01-22', tramo: 'Smara → Marrakech', esp: 455, tot: 1035 },
    { num: 12, f: '2027-01-23', tramo: 'Marrakech · llegada', esp: 22, tot: 240 },
  ],
};
