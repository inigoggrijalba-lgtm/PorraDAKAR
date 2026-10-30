# PorraDAKAR

Porra del Dakar entre amigos: cada jugador elige 4 pilotos (Rally GP, Ultimate y Camiones con niveles A/B/C, y uno libre de Original by Motul) y la app sigue la carrera sola con los datos oficiales.

- App: React compilada con esbuild (`npm run build` → `dist/`), publicada en Vercel.
- Datos: Supabase (proyecto PorraDAKAR). La app solo llama a funciones de la base de datos.
- Robot: `supabase/functions/robot` lee la API oficial de tiempos del Dakar y dakar.com.
