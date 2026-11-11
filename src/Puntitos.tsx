import React from 'react';
import {AbsoluteFill, Audio, interpolate, interpolateColors, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import T from './puntitos-tiempos.json';

/*
 * "Tu vida en 100 puntitos" — TikTok / Reels (1080x1920, 30 fps).
 * Todos los tiempos salen de src/puntitos-tiempos.json (los comparte con scripts/puntitos_musica.py),
 * así que para sincronizar con una voz nueva solo hay que tocar ese archivo.
 */

export const PUNTITOS_FPS = 30;
export const PUNTITOS_DURACION = Math.round(T.dur * PUNTITOS_FPS);

const DISPLAY = '"Inter Display", Inter, sans-serif';
const PASO = 84;
const X0 = 540 - 4.5 * PASO;
const Y0 = 610;
const TAM = 54;

const BLOQUES = [
  {desde: 0, hasta: 33, color: '#7c8cff', n: 33, texto: 'durmiendo', emoji: '😴', chiste: 'Algunos en clase de matemática, no te voy a mentir.'},
  {desde: 33, hasta: 48, color: '#ff5d8f', n: 15, texto: 'mirando el celular', emoji: '📱', chiste: 'Sí, este momento también cuenta.'},
  {desde: 48, hasta: 62, color: '#3ddc97', n: 14, texto: 'trabajando o estudiando', emoji: '📚', chiste: null},
  {desde: 62, hasta: 80, color: '#ffa94d', n: 18, texto: 'comer, viajar, hacer filas…', emoji: '🍝', chiste: '…y buscar el control remoto.'},
];
const CALIDOS = ['#ffb347', '#ff8c61', '#ffd166', '#ff6f91'];
const GRIS = '#3a3d4d';
const APAGADO = '#232530';
const ORO = '#ffd166';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const paso = (t: number, desde: number, dur: number) => clamp01((t - desde) / dur);
const mezcla = (k: number, a: string, b: string) => (k <= 0 ? a : k >= 1 ? b : interpolateColors(k, [0, 1], [a, b]));
const pop = (t: number, desde: number, fuerza = 0.35) => (t >= desde ? fuerza * Math.exp(-(t - desde) / 0.12) : 0);

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

  let color = '#ffffff';
  let escala = spring({frame: frame - Math.round((T.aparecen + random(`a${i}`) * 0.55) * fps), fps, config: {damping: 9, stiffness: 180}});
  let brillo = 0.45;

  // 2. se apagan los primeros 25
  if (i < 25) {
    const tOff = T.apagarDesde + (i / 25) * (T.apagarHasta - T.apagarDesde);
    const k = paso(t, tOff, 0.22);
    color = mezcla(k, color, GRIS);
    escala *= 1 - 0.22 * k + pop(t, tOff, 0.25);
    brillo *= 1 - k;
  }
  // 3. bloques de colores
  if (b >= 0) {
    const tb = T.bloques[b] + (i - BLOQUES[b].desde) * 0.025;
    const k = paso(t, tb, 0.18);
    color = mezcla(k, color, BLOQUES[b].color);
    if (i < 25) escala += 0.22 * k;
    escala += pop(t, tb);
    brillo = interpolate(k, [0, 1], [brillo, 0.55]);
  }
  // 4. el silencio: quedan 20 dorados
  const kS = paso(t, T.silencio, 0.9);
  if (b >= 0) {
    color = mezcla(kS, color, APAGADO);
    escala *= 1 - 0.3 * kS;
    brillo *= 1 - kS;
    // 5. se vuelven a encender, con colores cálidos
    const tr = T.lineas[grupoGiro(b)] + random(`r${i}`) * 1.2;
    const kR = paso(t, tr, 0.45);
    color = mezcla(kR, color, CALIDOS[i % 4]);
    escala = escala / (1 - 0.3 * kS * kR) * (1 - 0.3 * kS) + pop(t, tr, 0.4);
    escala = interpolate(kR, [0, 1], [escala, 1 + pop(t, tr, 0.4)]);
    brillo = interpolate(kR, [0, 1], [brillo, 0.75]);
  } else {
    const tg = T.silencio + 0.9 + (i - 80) * 0.04;
    const kG = paso(t, tg, 0.3);
    color = mezcla(kG, color, ORO);
    escala += pop(t, tg, 0.3) + 0.06 * kG * Math.sin(t * 3 + i);
    brillo = interpolate(kG, [0, 1], [brillo, 1.1]);
  }
  // frase: todo brilla un poco más
  brillo += 0.25 * paso(t, T.frase, 0.6);
  // 6. cierre: toda la grilla late en onda desde el centro
  const kC = paso(t, T.cierre, 1.0);
  if (kC > 0) {
    const dist = Math.hypot(col - 4.5, fila - 4.5);
    const onda = Math.sin((t - T.cierre) * 3.2 - dist * 0.7);
    escala *= 1 + 0.13 * kC * onda;
    color = mezcla(kC * (0.35 + 0.25 * onda), color, '#fff6d6');
    brillo += 0.6 * kC * (0.6 + 0.4 * onda);
  }

  return (
    <div
      style={{
        position: 'absolute', left: X0 + col * PASO - TAM / 2, top: Y0 + fila * PASO - TAM / 2, width: TAM, height: TAM,
        borderRadius: TAM, background: color, transform: `scale(${Math.max(0, escala)})`,
        boxShadow: brillo > 0.02 ? `0 0 ${10 + brillo * 22}px ${brillo * 3}px ${color}` : undefined,
        opacity: 0.35 + 0.65 * Math.min(1, brillo + 0.55),
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
    <div style={{position: 'absolute', top: 1418, left: 40, right: 40, display: 'flex', justifyContent: 'center', gap: 14, opacity: out}}>
      {BLOQUES.map((b, k) => {
        const p = spring({frame: frame - Math.round((T.bloques[k] + 0.5) * fps), fps, config: {damping: 12}});
        if (t < T.bloques[k] + 0.5) return null;
        return (
          <div key={k} style={{transform: `scale(${p})`, display: 'flex', alignItems: 'center', gap: 10, fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, color: 'white', background: 'rgba(255,255,255,0.08)', border: `3px solid ${b.color}`, borderRadius: 100, padding: '8px 20px'}}>
            <span style={{color: b.color}}>{b.n}</span>
            <span style={{fontSize: 36}}>{b.emoji}</span>
          </div>
        );
      })}
    </div>
  );
};

export const Puntitos: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const kS = paso(t, T.silencio, 0.9);
  const calor = paso(t, T.giro + 0.8, 7) * 0.5 + paso(t, T.cierre, 1) * 0.35;
  const oscuro = kS * (1 - paso(t, T.giro + 0.8, 4));
  const zoom = 1 + 0.035 * Math.sin(t / 3) + 0.02 * paso(t, T.cierre, 5);
  const finBloque = (k: number) => (k < 3 ? T.bloques[k + 1] - 0.1 : T.silencio - 0.1);

  return (
    <AbsoluteFill style={{background: '#07080f', fontFamily: DISPLAY, color: 'white'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, #1a1f45 0%, #07080f 70%)', opacity: 1 - oscuro * 0.8}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #ff9d4d 0%, #7a2f3a 45%, transparent 75%)', opacity: calor}} />
      {/* polvo de luz flotando */}
      {Array.from({length: 26}).map((_, k) => {
        const x = random(`px${k}`) * 1080;
        const y = (random(`py${k}`) * 1920 - t * (12 + random(`pv${k}`) * 22) + 1920 * 4) % 1920;
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * (0.6 + random(`pt${k}`)) + k));
        return <div key={k} style={{position: 'absolute', left: x, top: y, width: 6, height: 6, borderRadius: 6, background: calor > 0.2 ? '#ffe2a8' : '#aab4ff', opacity: 0.35 * tw * (1 - oscuro)}} />;
      })}

      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '540px 990px'}}>
        {Array.from({length: 100}).map((_, i) => (
          <Punto key={i} i={i} />
        ))}
      </div>
      <Leyenda />

      {/* textos (zona segura de TikTok: entre y≈220 y y≈1480) */}
      <div style={{position: 'absolute', top: 235, left: 60, right: 60, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={0.15} hasta={T.apagarDesde - 0.1} style={{fontSize: 62, fontWeight: 700, color: '#c9cdf0'}}>Si tu vida fueran</Cap>
          <Cap desde={T.aparecen} hasta={T.apagarDesde - 0.1} golpe style={{fontSize: 128, fontWeight: 900, letterSpacing: -4, lineHeight: 1.05}}>100 puntitos</Cap>
          <Cap desde={T.subtitulo} hasta={T.apagarDesde - 0.1} style={{fontSize: 46, fontWeight: 600, color: '#9aa0c8', marginTop: 12}}>cada uno sería casi un año</Cap>
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={T.apagarDesde} hasta={T.bloques[0] - 0.15} style={{fontSize: 66, fontWeight: 700, color: '#c9cdf0'}}>Si tenés 20…</Cap>
          <Cap desde={T.apagarDesde + 1.6} hasta={T.bloques[0] - 0.15} style={{fontSize: 96, fontWeight: 900, letterSpacing: -3, marginTop: 6}}>estos ya pasaron.</Cap>
        </div>
        {BLOQUES.map((b, k) => (
          <div key={k} style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <Cap desde={T.bloques[k]} hasta={finBloque(k)} golpe style={{display: 'flex', alignItems: 'center', gap: 26}}>
              <span style={{fontSize: 170, fontWeight: 900, letterSpacing: -6, color: b.color, lineHeight: 1, textShadow: `0 0 50px ${b.color}88`}}>{b.n}</span>
              <span style={{fontSize: 100}}>{b.emoji}</span>
            </Cap>
            <Cap desde={T.bloques[k] + 0.25} hasta={finBloque(k)} style={{fontSize: b.texto.length > 20 ? 54 : 64, fontWeight: 800, marginTop: 4}}>{b.texto}</Cap>
            {b.chiste && T.chistes[k] !== null && (
              <Cap desde={T.chistes[k] as number} hasta={finBloque(k)} style={{fontSize: 38, fontWeight: 600, fontStyle: 'italic', color: '#b9bedf', marginTop: 12}}>{b.chiste}</Cap>
            )}
          </div>
        ))}
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={T.silencio + 0.6} hasta={T.giro - 0.15} style={{fontSize: 84, fontWeight: 800}}>
            Y quedan <span style={{color: ORO, fontSize: 130, fontWeight: 900, textShadow: `0 0 50px ${ORO}`}}>20</span>.
          </Cap>
          <Cap desde={T.pocos} hasta={T.giro - 0.15} style={{fontSize: 54, fontWeight: 600, color: '#9aa0c8', marginTop: 8}}>Veinte que parecen pocos…</Cap>
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Cap desde={T.giro} hasta={T.lineas[0] - 0.1} golpe style={{fontSize: 112, fontWeight: 900, letterSpacing: -3}}>Pero esperá.</Cap>
          {['Esas cenas eran con tu familia. 🍝', 'En esos viajes te reías con amigos. 🚗', 'Y algunas noches sin dormir valieron la pena. 🌙'].map((txt, k) => (
            <div key={k} style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Cap desde={T.lineas[k]} hasta={k < 2 ? T.lineas[k + 1] - 0.1 : T.frase - 0.15} style={{fontSize: 62, fontWeight: 800, lineHeight: 1.2, textShadow: '0 4px 30px rgba(0,0,0,0.6)'}}>{txt}</Cap>
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textShadow: '0 4px 30px rgba(0,0,0,0.55)'}}>
          <Cap desde={T.frase} hasta={T.cierre - 0.15} style={{fontSize: 70, fontWeight: 700, color: '#ffe9c7'}}>No perdiste el tiempo.</Cap>
          <Cap desde={T.frase + 1.3} hasta={T.cierre - 0.15} golpe style={{fontSize: 104, fontWeight: 900, letterSpacing: -3, marginTop: 6}}>Estuviste viviendo.</Cap>
        </div>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textShadow: '0 4px 30px rgba(0,0,0,0.55)'}}>
          <Cap desde={T.cierre} hasta={T.dur + 1} style={{fontSize: 50, fontWeight: 600, color: '#ffe9c7', lineHeight: 1.2}}>No te preocupes tanto por cuántos puntos te quedan…</Cap>
          <Cap desde={T.cierre2} hasta={T.dur + 1} style={{fontSize: 70, fontWeight: 900, letterSpacing: -2, lineHeight: 1.1, marginTop: 16}}>Preocupate por con quién los pasás.</Cap>
        </div>
      </div>

      {/* llamado a la acción */}
      <div style={{position: 'absolute', top: 1436, left: 30, right: 30, display: 'flex', justifyContent: 'center'}}>
        <Cap desde={T.cta} hasta={T.dur + 1} golpe style={{fontSize: 35, fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.2, color: '#1a1020', background: 'linear-gradient(90deg,#ffd166,#ffb347)', padding: '12px 26px', borderRadius: 30, boxShadow: '0 0 60px rgba(255,190,90,0.7)'}}>
          Mandáselo a alguien que hace brillar tus puntos ✨
        </Cap>
      </div>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#000', opacity: interpolate(t, [T.dur - 0.5, T.dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), pointerEvents: 'none'}} />
      <Audio src={staticFile(T_AUDIO)} />
    </AbsoluteFill>
  );
};

const T_AUDIO = 'puntitos-musica.wav';
