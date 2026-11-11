import React from 'react';
import {AbsoluteFill, Audio, interpolate, interpolateColors, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import T from './puntitos-tiempos.json';

/*
 * "Tu vida en 100 puntitos" — TikTok / Reels (1080x1920, 30 fps).
 * Todos los tiempos salen de src/puntitos-tiempos.json (los comparte con scripts/puntitos_musica.py),
 * así que para sincronizar con una voz nueva solo hay que tocar ese archivo.
 *
 * Estética: el color cuenta la historia. Arranca de día (fondo crema, puntos tipo sticker),
 * en "el silencio" se hace de noche (violeta) y en "el giro" amanece (sol, rayos y papel picado).
 */

export const PUNTITOS_FPS = 30;
export const PUNTITOS_DURACION = Math.round(T.dur * PUNTITOS_FPS);

const DISPLAY = '"Inter Display", Inter, sans-serif';
const PASO = 84;
const X0 = 540 - 4.5 * PASO;
const Y0 = 610;
const TAM = 64;
const CENTRO_Y = Y0 + 4.5 * PASO;

const TINTA = '#1f1b4b';
const BLOQUES = [
  {desde: 0, hasta: 33, color: '#5b6cff', n: 33, texto: 'durmiendo', emoji: '😴', chiste: 'Algunos en clase de matemática, no te voy a mentir.'},
  {desde: 33, hasta: 48, color: '#ff4f8b', n: 15, texto: 'mirando el celular', emoji: '📱', chiste: 'Sí, este momento también cuenta.'},
  {desde: 48, hasta: 62, color: '#12b886', n: 14, texto: 'trabajando o estudiando', emoji: '📚', chiste: null},
  {desde: 62, hasta: 80, color: '#ff922b', n: 18, texto: 'comer, viajar, hacer filas…', emoji: '🍝', chiste: '…y buscar el control remoto.'},
];
const CALIDOS = ['#ff4f6d', '#ff7a1a', '#e6399b', '#7c4dff'];
const PASADO = '#dccfbb';
const DORMIDO = '#4f4391';
const ORO = '#ffc400';
const CONFETI = ['#5b6cff', '#ff4f8b', '#12b886', '#ffd23f', '#ffffff', '#7c4dff'];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const paso = (t: number, desde: number, dur: number) => clamp01((t - desde) / dur);
const mezcla = (k: number, a: string, b: string) => (k <= 0 ? a : k >= 1 ? b : interpolateColors(k, [0, 1], [a, b]));
const pop = (t: number, desde: number, fuerza = 0.35) => (t >= desde ? fuerza * Math.exp(-(t - desde) / 0.12) : 0);

/** 0 = de día, 1 = de noche (el silencio) */
const noche = (t: number) => paso(t, T.silencio, 0.9) * (1 - paso(t, T.giro + 0.2, 1.3));
/** 0 → 1 a medida que amanece (el giro) */
const amanecer = (t: number) => paso(t, T.giro + 0.3, 5);

const bloqueDe = (i: number) => BLOQUES.findIndex((b) => i >= b.desde && i < b.hasta);
/** qué grupo de puntos se enciende con cada frase del giro: cenas/viajes → comer y viajar; amigos → celu y trabajo; noches sin dormir → durmiendo */
const grupoGiro = (b: number) => (b === 3 ? 0 : b === 0 ? 2 : 1);

const Punto: React.FC<{i: number}> = ({i}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const col = i % 10;
  const fila = Math.floor(i / 10);
  const b = bloqueDe(i);
  const dark = noche(t);

  let color = TINTA;
  let escala = spring({frame: frame - Math.round((T.aparecen + random(`a${i}`) * 0.55) * fps), fps, config: {damping: 8, stiffness: 180}});
  let glow = 0;
  let borde = 1;

  // 2. se apagan los primeros 25
  if (i < 25) {
    const tOff = T.apagarDesde + (i / 25) * (T.apagarHasta - T.apagarDesde);
    const k = paso(t, tOff, 0.22);
    color = mezcla(k, color, PASADO);
    escala *= 1 - 0.25 * k + pop(t, tOff, 0.25);
    borde = 1 - k;
  }
  // 3. bloques de colores
  if (b >= 0) {
    const tb = T.bloques[b] + (i - BLOQUES[b].desde) * 0.025;
    const k = paso(t, tb, 0.18);
    color = mezcla(k, color, BLOQUES[b].color);
    if (i < 25) escala += 0.25 * k;
    escala += pop(t, tb, 0.4);
    borde = Math.max(borde, k);
  }
  // 4. el silencio: se hace de noche y quedan 20 dorados
  const kS = paso(t, T.silencio, 0.9);
  if (b >= 0) {
    // 5. se vuelven a encender, con colores cálidos
    const tr = T.lineas[grupoGiro(b)] + random(`r${i}`) * 1.2;
    const kR = paso(t, tr, 0.45);
    const dormido = kS * (1 - kR);
    color = mezcla(kS, color, DORMIDO);
    color = mezcla(kR, color, CALIDOS[i % 4]);
    escala = escala * (1 - 0.28 * dormido) + pop(t, tr, 0.45);
    borde *= 1 - dormido;
  } else {
    const tg = T.silencio + 0.9 + (i - 80) * 0.04;
    const kG = paso(t, tg, 0.3);
    color = mezcla(kG, color, ORO);
    escala += pop(t, tg, 0.35) + 0.05 * kG * Math.sin(t * 3 + i);
    glow = kG * (0.5 + 0.5 * dark);
  }
  // 6. cierre: toda la grilla late en onda desde el centro
  const kC = paso(t, T.cierre, 1.0);
  if (kC > 0) {
    const dist = Math.hypot(col - 4.5, fila - 4.5);
    const onda = Math.sin((t - T.cierre) * 3.2 - dist * 0.7);
    escala *= 1 + 0.14 * kC * onda;
    glow = Math.max(glow, 0.45 * kC * (0.6 + 0.4 * onda));
  }

  const sombra = 0.2 * (1 - dark);
  return (
    <div
      style={{
        position: 'absolute', left: X0 + col * PASO - TAM / 2, top: Y0 + fila * PASO - TAM / 2, width: TAM, height: TAM,
        boxSizing: 'border-box', borderRadius: TAM, background: color, transform: `scale(${Math.max(0, escala)})`,
        border: `4px solid rgba(255,255,255,${borde * (1 - dark * 0.85)})`,
        boxShadow: `0 6px 0 rgba(31,27,75,${sombra})${glow > 0.02 ? `, 0 0 ${16 + glow * 30}px ${glow * 8}px ${color}` : ''}`,
      }}
    />
  );
};

/** Bloque de texto visible entre dos segundos, que entra subiendo y sale desvaneciéndose */
const Cap: React.FC<{desde: number; hasta: number; children: React.ReactNode; style?: React.CSSProperties; golpe?: boolean}> = ({desde, hasta, children, style, golpe}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < desde || t > hasta) return null;
  const p = spring({frame: frame - Math.round(desde * fps), fps, config: golpe ? {damping: 9, stiffness: 220} : {damping: 16, stiffness: 120}});
  const out = interpolate(t, [hasta - 0.25, hasta], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tr = golpe ? `scale(${interpolate(p, [0, 1], [2.2, 1])})` : `translateY(${(1 - p) * 50}px)`;
  return <div style={{opacity: Math.min(1, p * 1.6) * out, transform: tr, filter: golpe ? undefined : `blur(${(1 - p) * 10}px)`, ...style}}>{children}</div>;
};

const Leyenda: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const out = 1 - paso(t, T.silencio, 0.6);
  if (out <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 1420, left: 40, right: 40, display: 'flex', justifyContent: 'center', gap: 14, opacity: out}}>
      {BLOQUES.map((b, k) => {
        const p = spring({frame: frame - Math.round((T.bloques[k] + 0.5) * fps), fps, config: {damping: 10}});
        if (t < T.bloques[k] + 0.5) return null;
        return (
          <div key={k} style={{transform: `scale(${p}) rotate(${(k % 2 ? 1 : -1) * 2}deg)`, display: 'flex', alignItems: 'center', gap: 10, fontFamily: DISPLAY, fontWeight: 900, fontSize: 36, color: 'white', background: b.color, border: '5px solid white', borderRadius: 100, padding: '6px 22px', boxShadow: '0 6px 0 rgba(31,27,75,0.2)'}}>
            {b.n}
            <span style={{fontSize: 36}}>{b.emoji}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Manchas de color que flotan en el fondo de día */
const Manchas: React.FC<{t: number; opacidad: number}> = ({t, opacidad}) => (
  <AbsoluteFill style={{opacity: opacidad}}>
    {[
      {c: '#ffc2d9', x: 180, y: 330, r: 520, v: 0.23},
      {c: '#bfd4ff', x: 930, y: 760, r: 600, v: 0.17},
      {c: '#ffe39a', x: 260, y: 1500, r: 640, v: 0.2},
      {c: '#c9f2dd', x: 900, y: 1750, r: 480, v: 0.26},
    ].map((m, k) => (
      <div
        key={k}
        style={{
          position: 'absolute', width: m.r * 2, height: m.r * 2, borderRadius: '50%',
          left: m.x - m.r + Math.sin(t * m.v + k) * 90, top: m.y - m.r + Math.cos(t * m.v * 1.3 + k * 2) * 110,
          background: `radial-gradient(circle, ${m.c} 0%, ${m.c}00 68%)`,
        }}
      />
    ))}
  </AbsoluteFill>
);

const Confeti: React.FC<{t: number}> = ({t}) => {
  if (t < T.cierre) return null;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {Array.from({length: 70}).map((_, k) => {
        const inicio = T.cierre + random(`ci${k}`) * 3.5;
        const d = t - inicio;
        if (d < 0) return null;
        const y = ((d * (320 + random(`cv${k}`) * 380)) % 2040) - 60;
        const x = random(`cx${k}`) * 1080 + Math.sin(d * 2.4 + k) * 46;
        const w = 14 + random(`cw${k}`) * 16;
        return (
          <div
            key={k}
            style={{
              position: 'absolute', left: x, top: y, width: w, height: k % 3 === 0 ? w : w * 0.45, borderRadius: k % 3 === 0 ? w : 4,
              background: CONFETI[k % CONFETI.length], transform: `rotate(${d * (160 + random(`cr${k}`) * 300)}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Puntitos: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const dark = noche(t);
  const sol = amanecer(t);
  const kC = paso(t, T.cierre, 1.2);
  const zoom = 1 + 0.03 * Math.sin(t / 3) + 0.02 * paso(t, T.cierre, 5);
  const finBloque = (k: number) => (k < 3 ? T.bloques[k + 1] - 0.1 : T.silencio - 0.1);
  const tinta = mezcla(clamp01((dark - 0.3) / 0.3), TINTA, '#ffffff');
  const sticker = `0 5px 0 rgba(31,27,75,${0.14 * (1 - dark)})`;
  const solY = interpolate(sol, [0, 1], [2500, CENTRO_Y + 760]);

  return (
    <AbsoluteFill style={{background: '#fff4e3', fontFamily: DISPLAY, color: tinta}}>
      {/* día */}
      <Manchas t={t} opacidad={1 - sol} />
      {/* amanecer */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #ff7fb0 0%, #ff9a5c 50%, #ffb45a 100%)', opacity: sol}} />
      <div style={{position: 'absolute', left: 540 - 900, top: solY - 900, width: 1800, height: 1800, borderRadius: '50%', background: 'radial-gradient(circle, #fffbe0 0%, #fff1a8 22%, #fff1a800 62%)', opacity: sol}} />
      <div
        style={{
          position: 'absolute', left: 540 - 1500, top: CENTRO_Y - 1500, width: 3000, height: 3000, opacity: kC * 0.55,
          background: `repeating-conic-gradient(from ${t * 7}deg, rgba(255,255,255,0.42) 0deg 8deg, rgba(255,255,255,0) 8deg 20deg)`,
          WebkitMaskImage: 'radial-gradient(circle, black 12%, transparent 62%)', maskImage: 'radial-gradient(circle, black 12%, transparent 62%)',
        }}
      />
      {/* noche */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #1d1650 0%, #3a2a80 60%, #5a3a8f 100%)', opacity: dark}} />
      {/* estrellitas / chispas flotando */}
      {Array.from({length: 30}).map((_, k) => {
        const x = random(`px${k}`) * 1080;
        const y = (random(`py${k}`) * 1920 - t * (14 + random(`pv${k}`) * 26) + 1920 * 4) % 1920;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.6 + random(`pt${k}`)) + k));
        const r = 6 + random(`pr${k}`) * 8;
        return <div key={k} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, background: 'white', opacity: tw * (0.25 + 0.6 * Math.max(dark, sol))}} />;
      })}
      <Confeti t={t} />

      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `540px ${CENTRO_Y}px`}}>
        {Array.from({length: 100}).map((_, i) => (
          <Punto key={i} i={i} />
        ))}
      </div>
      <Leyenda />

      {/* textos (zona segura de TikTok: entre y≈220 y y≈1480) */}
      <div style={{position: 'absolute', top: 235, left: 60, right: 60, height: 300, textAlign: 'center'}}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={0.15} hasta={T.apagarDesde - 0.1} style={{fontSize: 62, fontWeight: 700, opacity: 0.75}}>Si tu vida fueran</Cap>
          <Cap desde={T.aparecen} hasta={T.apagarDesde - 0.1} golpe style={{fontSize: 128, fontWeight: 900, letterSpacing: -4, lineHeight: 1.05}}>
            <span style={{color: '#ff4f8b', textShadow: sticker}}>100</span> puntitos
          </Cap>
          <Cap desde={T.subtitulo} hasta={T.apagarDesde - 0.1} style={{fontSize: 46, fontWeight: 700, marginTop: 14, background: TINTA, color: 'white', padding: '6px 26px', borderRadius: 100, transform: 'rotate(-1.5deg)'}}>cada uno sería casi un año</Cap>
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={T.apagarDesde} hasta={T.bloques[0] - 0.15} style={{fontSize: 66, fontWeight: 700, opacity: 0.75}}>Si tenés 20…</Cap>
          <Cap desde={T.apagarDesde + 1.84} hasta={T.bloques[0] - 0.15} style={{fontSize: 96, fontWeight: 900, letterSpacing: -3, marginTop: 6}}>estos ya pasaron.</Cap>
        </div>
        {BLOQUES.map((b, k) => (
          <div key={k} style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <Cap desde={T.bloques[k]} hasta={finBloque(k)} golpe style={{display: 'flex', alignItems: 'center', gap: 26}}>
              <span style={{fontSize: 176, fontWeight: 900, letterSpacing: -6, color: b.color, lineHeight: 1, textShadow: '0 8px 0 rgba(31,27,75,0.16)'}}>{b.n}</span>
              <span style={{fontSize: 104}}>{b.emoji}</span>
            </Cap>
            <Cap desde={T.bloques[k] + 0.25} hasta={finBloque(k)} style={{fontSize: b.texto.length > 20 ? 54 : 64, fontWeight: 900, marginTop: 4}}>{b.texto}</Cap>
            {b.chiste && T.chistes[k] !== null && (
              <Cap desde={T.chistes[k] as number} hasta={finBloque(k)} style={{fontSize: 38, fontWeight: 700, fontStyle: 'italic', marginTop: 12, opacity: 0.7}}>{b.chiste}</Cap>
            )}
          </div>
        ))}
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={T.silencio + 0.6} hasta={T.giro - 0.15} style={{fontSize: 84, fontWeight: 800}}>
            Y quedan <span style={{color: ORO, fontSize: 136, fontWeight: 900, textShadow: `0 0 50px ${ORO}`}}>20</span>.
          </Cap>
          <Cap desde={T.pocos} hasta={T.giro - 0.15} style={{fontSize: 54, fontWeight: 600, opacity: 0.7, marginTop: 8}}>Veinte que parecen pocos…</Cap>
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={T.giro} hasta={T.lineas[0] - 0.1} golpe style={{fontSize: 116, fontWeight: 900, letterSpacing: -3}}>Pero esperá.</Cap>
          {['Esas cenas eran con tu familia. 🍝', 'En esos viajes te reías con amigos. 🚗', 'Y algunas noches sin dormir valieron la pena. 🌙'].map((txt, k) => (
            <div key={k} style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Cap desde={T.lineas[k]} hasta={k < 2 ? T.lineas[k + 1] - 0.1 : T.frase - 0.15} style={{fontSize: 64, fontWeight: 900, lineHeight: 1.2}}>{txt}</Cap>
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={T.frase} hasta={T.cierre - 0.15} style={{fontSize: 70, fontWeight: 800}}>No perdiste el tiempo.</Cap>
          <Cap desde={T.frase2} hasta={T.cierre - 0.15} golpe style={{fontSize: 100, fontWeight: 900, letterSpacing: -3, marginTop: 10, background: 'white', color: '#ff4f6d', padding: '4px 34px', borderRadius: 30, transform: 'rotate(-2deg)', boxShadow: '0 8px 0 rgba(31,27,75,0.18)'}}>Estuviste viviendo.</Cap>
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={T.cierre} hasta={T.dur + 1} style={{fontSize: 50, fontWeight: 700, lineHeight: 1.2}}>No te preocupes tanto por cuántos puntos te quedan…</Cap>
          <Cap desde={T.cierre2} hasta={T.dur + 1} style={{fontSize: 72, fontWeight: 900, letterSpacing: -2, lineHeight: 1.1, marginTop: 16}}>Preocupate por con quién los pasás.</Cap>
        </div>
      </div>

      {/* llamado a la acción */}
      <div style={{position: 'absolute', top: 1432, left: 30, right: 30, display: 'flex', justifyContent: 'center'}}>
        <Cap desde={T.cta} hasta={T.dur + 1} golpe style={{fontSize: 35, fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.2, color: 'white', background: TINTA, padding: '14px 28px', borderRadius: 100, border: '5px solid white', boxShadow: '0 8px 0 rgba(31,27,75,0.25)'}}>
          Mandáselo a alguien que hace brillar tus puntos ✨
        </Cap>
      </div>

      <Audio src={staticFile('puntitos-mezcla.wav')} />
    </AbsoluteFill>
  );
};
