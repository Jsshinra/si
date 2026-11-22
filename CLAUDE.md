# Videos para TikTok / Reels

- Con cada video terminado, entregar también la descripción lista para copiar (texto + pregunta para comentarios + hashtags).
- Formato: vertical 1080x1920, 30 fps, hecho con Remotion. Textos dentro de la zona segura (y entre 220 y 1480).
- La voz la graba el usuario en ElevenLabs: armar primero el video sin voz y pasarle el guion; después sincronizar con el MP3 que mande.
- Cada video guarda sus tiempos en un JSON (`src/*-tiempos.json`) compartido entre la animación y el script de música.
- Después de renderizar con voz, medir el volumen y llevarlo a unos -14 LUFS (`ffmpeg -af loudnorm=I=-14:TP=-1:LRA=9 -c:v copy`).

## Serie "películas y series explicadas" — estilo Tinta (`src/tinta/`)

Estética (reemplaza la anterior de colores brillantes):
- Papel envejecido de fondo, nada de fondos brillantes ni degradés saturados.
- Trazo de tinta que "hierve" (filtro `hervir`, cambia cada 3 cuadros) y movimiento de a dos cuadros.
- Manchas de acuarela (filtro `acuarela`) con 3-4 colores apagados por película + un solo color de acento.
- Sombreado con rayado a mano (`rayado`, `rayadoFino`).
- Notas manuscritas en tiras de papel con cinta (Caveat) para los subtítulos; tarjeta a máquina de escribir (Special Elite) para el título.
- Personas en tinta (`Figura`): proporciones de adulto, un rasgo fijo para seguir al protagonista (ej. bufanda roja).

Estructura de cada video (70-85 s con voz):
1. Gancho en segunda persona: "Imaginate que…" (sin nombrar la obra).
2. Las reglas del mundo, numeradas (1, 2, 3).
3. La trampa: qué sale mal cuando la gente juega con esas reglas.
4. La lección en una frase.
5. Recién al final: "Esto es <TÍTULO>" en la tarjeta a máquina + pregunta binaria para comentar.
- Solo la premisa, sin finales ni spoilers. Personajes y escenarios propios, nada de imágenes ni música de la obra.
