import React from 'react';
import {Cam, CAMS, camara, Cuarto, EstadoChico, GloboCelular, GloboPuerta, Onomatopeya, transformCamara} from './Cuarto';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/*
 * "Mensaje a las 3 AM" — Parte 1
 * Historia interactiva para TikTok / Reels (1080x1920, 30 fps, 45 s), narrada por Edoardo (ElevenLabs).
 * Los tiempos de cada escena están sincronizados con la voz y con scripts/banda_sonora.py.
 * Zona segura TikTok: el contenido importante queda entre y≈200 y y≈1480.
 */

export const FPS = 30;
export const DURACION = 45 * FPS;
const s = (seg: number) => Math.round(seg * FPS);

const ROJO = '#ff2d55';
const DISPLAY = '"Inter Display", Inter, sans-serif';
const MONO = '"JetBrains Mono", monospace';
const SERIF = '"DejaVu Serif", serif';

// ---------- utilidades de animación ----------

const usePop = (at: number, damping = 11, stiffness = 160) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping, stiffness}});
};

/** Temblor de cámara que decae después de cada golpe */
const shake = (frame: number, hits: number[], fuerza = 28) => {
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d < 0 || d > 14) continue;
    const amp = fuerza * Math.exp(-d / 4);
    x += (random(`x${h}-${frame}`) - 0.5) * 2 * amp;
    y += (random(`y${h}-${frame}`) - 0.5) * 2 * amp;
  }
  return `translate(${x}px, ${y}px)`;
};

const flash = (frame: number, hits: number[]) =>
  Math.max(0, ...hits.map((h) => (frame >= h ? interpolate(frame - h, [0, 6], [0.55, 0], {extrapolateRight: 'clamp'}) : 0)));

/** Texto que entra subiendo, con desenfoque */
const Rise: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const p = usePop(at, 16, 120);
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * 70}px)`, filter: `blur(${(1 - p) * 12}px)`, ...style}}>
      {children}
    </div>
  );
};

/** Texto que "golpea" la pantalla: entra gigante y se clava */
const Slam: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const frame = useCurrentFrame();
  const p = usePop(at, 9, 220);
  if (frame < at) return null;
  return (
    <div style={{transform: `scale(${interpolate(p, [0, 1], [3.2, 1])})`, opacity: Math.min(1, p * 2), ...style}}>
      {children}
    </div>
  );
};

/** Texto con efecto glitch RGB */
const Glitch: React.FC<{children: string; style?: React.CSSProperties; intensidad?: number}> = ({children, style, intensidad = 1}) => {
  const frame = useCurrentFrame();
  const salto = random(`g${Math.floor(frame / 2)}`) > 0.55 ? 1 : 0.15;
  const dx = (random(`dx${frame}`) - 0.5) * 30 * salto * intensidad;
  const dy = (random(`dy${frame}`) - 0.5) * 8 * salto * intensidad;
  const capa = (color: string, ox: number, oy: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    color,
    transform: `translate(${ox}px, ${oy}px)`,
    mixBlendMode: 'screen',
  });
  return (
    <div style={{position: 'relative', ...style}}>
      <span style={{visibility: 'hidden'}}>{children}</span>
      <span style={capa('#00e5ff', -dx, dy)}>{children}</span>
      <span style={capa(ROJO, dx, -dy)}>{children}</span>
      <span style={capa('#fff', 0, 0)}>{children}</span>
    </div>
  );
};

/** Grano de película + viñeta, para todo el video */
const Grano: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.13, mixBlendMode: 'overlay'}}>
        <filter id="grano">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grano)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

const Centro: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', fontFamily: DISPLAY, color: 'white', ...style}}>
    {children}
  </AbsoluteFill>
);

const Etiqueta: React.FC<{children: React.ReactNode; at?: number}> = ({children, at = 0}) => {
  const p = usePop(at, 14);
  return (
    <div
      style={{
        position: 'absolute', top: 230, left: 0, right: 0, display: 'flex', justifyContent: 'center',
        opacity: p, transform: `translateY(${(1 - p) * -40}px)`,
      }}
    >
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 38, letterSpacing: 8, color: 'white', border: `3px solid ${ROJO}`, padding: '12px 30px', borderRadius: 100, background: 'rgba(255,45,85,0.15)'}}>
        {children}
      </div>
    </div>
  );
};

// ---------- escenas ----------

const Escena1Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const golpe = s(2.8);
  const pulso = interpolate(frame, [golpe, golpe + 20], [0.9, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#050507', transform: shake(frame, [golpe], 22)}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 55%, rgba(255,45,85,${frame >= golpe ? pulso : 0.12}) 0%, transparent 60%)`}} />
      <Etiqueta>PARTE 1</Etiqueta>
      <Centro style={{gap: 10, paddingBottom: 60}}>
        <Rise at={s(0.15)} style={{fontSize: 78, fontWeight: 700}}>Si te llega este mensaje</Rise>
        <Rise at={s(1.45)} style={{fontSize: 78, fontWeight: 700, color: '#c9c9d6'}}>a las <span style={{color: 'white'}}>3 AM</span>…</Rise>
        <Slam at={golpe} style={{fontSize: 126, fontWeight: 900, marginTop: 30, letterSpacing: -4, textShadow: `0 0 60px ${ROJO}`}}>
          ¿QUÉ HARÍAS?
        </Slam>
      </Centro>
      <AbsoluteFill style={{background: 'white', opacity: flash(frame, [golpe])}} />
    </AbsoluteFill>
  );
};

/*
 * Escena continua del cuarto (4.6 s → 31.9 s). Todo se programa en segundos ABSOLUTOS
 * del video, que coinciden con la narración.
 */
const T0 = 4.6;
const GOLPES = [17.75, 18.35, 18.95];

const CAM_KEYS: [number, Cam][] = [
  [4.6, CAMS.reloj],
  [5.9, CAMS.reloj],
  [6.7, CAMS.general],
  [9.5, {...CAMS.general, s: 1.06}],
  [10.5, CAMS.mesita],
  [11.25, CAMS.mesita],
  [11.9, CAMS.lectura],
  [13.3, CAMS.lectura],
  [13.8, {...CAMS.lectura, s: 1.72}],
  [17.4, {...CAMS.lectura, s: 1.72}],
  [17.7, CAMS.puerta],
  [19.6, {...CAMS.puerta, s: 1.5}],
  [20.1, CAMS.general],
  [21.6, CAMS.general],
  [22.2, CAMS.lectura],
  [26.3, CAMS.lectura],
  [26.9, CAMS.puerta],
  [30.7, {...CAMS.puerta, s: 1.55}],
  [30.85, CAMS.cara],
  [31.9, {...CAMS.cara, s: 2.1}],
];

/** Subtítulo fijo arriba de la pantalla, visible entre dos segundos absolutos */
const Texto: React.FC<{desde: number; hasta: number; children: React.ReactNode}> = ({desde, hasta, children}) => {
  const frame = useCurrentFrame();
  const t = T0 + frame / FPS;
  if (t < desde || t > hasta) return null;
  const salida = interpolate(t, [hasta - 0.15, hasta], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <div style={{opacity: salida}}>{children}</div>;
};

const EscenaCuarto: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = T0 + frame / fps;
  const f = (seg: number) => s(seg - T0);

  const estado: EstadoChico = t < 11.3 ? 'despierto' : t < 17.75 ? 'leyendo' : t < 21.6 ? 'asustado' : t < 26.45 ? 'leyendo' : 'asustado';
  const enMano = interpolate(t, [11.25, 11.75], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const brillo = t < 10.8 ? 0 : interpolate(t, [10.8, 11.0, 26.45, 27], [0, 1, 0.9, 0.35], {extrapolateRight: 'clamp'});
  const vibra = t >= 10.8 && t < 11.25 ? 16 : 0;

  let puertaShake = 0;
  let destello = 0;
  let rayos = 1;
  for (const g of GOLPES) {
    const d = t - g;
    if (d < 0 || d > 0.5) continue;
    puertaShake += 16 * Math.exp(-d / 0.08) * Math.sin(d * 70);
    const fl = interpolate(d, [0, 0.35], [1, 0], {extrapolateRight: 'clamp'});
    if (fl > destello) {
      destello = fl;
      rayos = 1 + d * 0.8;
    }
  }
  const parpadeoLuz = random(`l${Math.floor(frame / 4)}`) > 0.85 ? 0.6 : 1;
  const luzPuerta = (t < 17.35 ? 0.35 : 0.85) * parpadeoLuz;
  const sombra = t < 26.45 ? interpolate(t, [17.35, 21.6], [-160, 80], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : interpolate(t, [26.45, 31.9], [80, -20]);
  const oscuro = interpolate(t, [26.45, 27.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const cam = camara(t, CAM_KEYS);
  const glitch = t >= 30.85;
  const gx = glitch ? (random(`gx${frame}`) - 0.5) * 24 : 0;
  const golpesF = GOLPES.map(f);

  return (
    <AbsoluteFill style={{background: '#05060d', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute', width: 1080, height: 1920, transformOrigin: '0 0',
          transform: `${shake(frame, golpesF, 20)} translateX(${gx}px) ${transformCamara(cam)}`,
          filter: glitch && random(`gh${Math.floor(frame / 2)}`) > 0.5 ? 'hue-rotate(-30deg) saturate(1.6)' : undefined,
        }}
      >
        <Cuarto
          frame={frame} estado={estado} celularEnMano={enMano} brillo={brillo} vibra={vibra}
          puertaShake={puertaShake} destello={destello} rayos={rayos} luzPuerta={luzPuerta} sombra={sombra} oscuro={oscuro}
        />
        <GloboCelular frame={frame} fps={fps} entra={f(12.16)} sale={f(17.5)} textoDesde={f(15.88)} resaltarDesde={f(13.3)} texto="No abras la puerta." />
        <GloboCelular
          frame={frame} fps={fps} entra={f(21.9)} sale={f(26.4)} textoDesde={f(23.3)}
          texto={<>Lo que está del otro lado <b style={{color: ROJO}}>no es quien parece.</b></>}
        />
        <Onomatopeya frame={frame} fps={fps} at={golpesF[0]} hasta={f(20.0)} x={680} y={700} rot={-12} />
        <Onomatopeya frame={frame} fps={fps} at={golpesF[1]} hasta={f(20.0)} x={900} y={840} rot={10} />
        <Onomatopeya frame={frame} fps={fps} at={golpesF[2]} hasta={f(20.0)} x={700} y={1080} rot={-6} />
        <GloboPuerta frame={frame} fps={fps} entra={f(28.4)}>“Abre… soy yo.”</GloboPuerta>
      </div>

      <AbsoluteFill style={{background: 'white', opacity: flash(frame, golpesF) * 0.45}} />

      {/* subtítulos arriba (zona segura de TikTok) */}
      <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 22%, transparent 32%)', pointerEvents: 'none'}} />
      <div style={{position: 'absolute', top: 240, left: 60, right: 60, textAlign: 'center', fontFamily: DISPLAY, color: 'white'}}>
        <Texto desde={4.6} hasta={6.5}>
          <Rise at={f(4.75)} style={{fontSize: 60, fontWeight: 700, color: '#c9c9d6'}}>Son las 3:07 AM.</Rise>
        </Texto>
        <Texto desde={6.6} hasta={9.45}>
          <Rise at={f(6.6)} style={{fontSize: 64, fontWeight: 800}}>No puedo dormir.</Rise>
          <Rise at={f(8.0)} style={{fontSize: 56, fontWeight: 700, color: '#a5a5b3', marginTop: 10}}>Todo está en silencio.</Rise>
        </Texto>
        <Texto desde={10.75} hasta={13.2}>
          <Rise at={f(10.75)} style={{fontSize: 64, fontWeight: 800}}>*bzzz* *bzzz*</Rise>
        </Texto>
        <Texto desde={13.3} hasta={17.3}>
          <Rise at={f(13.3)} style={{fontSize: 58, fontWeight: 700}}>El mensaje viene de</Rise>
          <Slam at={f(13.6)} style={{display: 'inline-block', marginTop: 14, fontSize: 84, fontWeight: 900, background: ROJO, padding: '4px 26px', borderRadius: 16, transform: 'rotate(-2deg)'}}>
            MI PROPIO NÚMERO
          </Slam>
        </Texto>
        <Texto desde={19.96} hasta={21.55}>
          <Rise at={f(19.96)} style={{fontSize: 64, fontWeight: 800}}>Alguien está golpeando.</Rise>
        </Texto>
        <Texto desde={26.45} hasta={28.35}>
          <Rise at={f(26.5)} style={{fontSize: 58, fontWeight: 700, color: '#d8d8e2'}}>Desde la puerta, una voz:</Rise>
        </Texto>
        <Texto desde={30.85} hasta={31.9}>
          <Slam at={f(30.85)}>
            <Glitch style={{fontSize: 124, fontWeight: 900, letterSpacing: -3}}>Es MI voz.</Glitch>
          </Slam>
        </Texto>
      </div>
    </AbsoluteFill>
  );
};

const Opcion: React.FC<{at: number; letra: string; texto: string; latido: number}> = ({at, letra, texto, latido}) => {
  const p = usePop(at, 10, 200);
  return (
    <div
      style={{
        width: 860, display: 'flex', alignItems: 'center', gap: 34, padding: '30px 40px', borderRadius: 36,
        background: 'rgba(255,255,255,0.07)', border: '3px solid rgba(255,255,255,0.18)',
        transform: `scale(${p * latido}) translateX(${(1 - p) * (letra === 'A' ? -400 : 400)}px)`, opacity: p,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{width: 120, height: 120, flexShrink: 0, borderRadius: 30, background: letra === 'A' ? ROJO : 'white', color: letra === 'A' ? 'white' : '#111', fontSize: 84, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {letra}
      </div>
      <div style={{fontSize: 58, fontWeight: 800, textAlign: 'left', lineHeight: 1.1}}>{texto}</div>
    </div>
  );
};

const Escena6Eleccion: React.FC = () => {
  const frame = useCurrentFrame();
  const titulo = s(0.2);
  const latidoBase = s(4.0);
  const fase = Math.max(0, frame - latidoBase) / 21; // un latido cada 0.7 s, igual que el audio
  const pulsoA = frame > latidoBase ? 1 + 0.035 * Math.exp(-((fase % 2) * 21) / 4) : 1;
  const pulsoB = frame > latidoBase + 21 ? 1 + 0.035 * Math.exp(-(((fase + 1) % 2) * 21) / 4) : 1;
  const fondo = 0.25 + 0.12 * Math.exp(-((fase % 1) * 21) / 5);
  return (
    <AbsoluteFill style={{background: '#070205', transform: shake(frame, [titulo], 24)}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(255,45,85,${fondo}) 0%, transparent 65%)`}} />
      <Centro style={{gap: 34, paddingBottom: 120}}>
        <Slam at={titulo} style={{fontSize: 126, fontWeight: 900, letterSpacing: -4, marginBottom: 20, textShadow: `0 0 50px ${ROJO}`}}>¿QUÉ HARÍAS?</Slam>
        <Opcion at={s(1.6)} letra="A" texto="Abres la puerta" latido={pulsoA} />
        <Opcion at={s(3.65)} letra="B" texto="Le contestas al mensaje" latido={pulsoB} />
        <Rise at={s(5.95)} style={{fontSize: 64, fontWeight: 800, marginTop: 36}}>
          Comenta <span style={{color: ROJO}}>A</span> o <span style={{color: ROJO}}>B</span> 👇
        </Rise>
        <Rise at={s(7.45)} style={{fontSize: 48, fontWeight: 600, color: '#c9c9d6'}}>
          Lo más votado decide la <b style={{color: 'white'}}>PARTE 2</b>
        </Rise>
        <Rise at={s(10.3)} style={{fontSize: 40, fontWeight: 600, color: '#8d8d9c', marginTop: 10}}>
          Sígueme para no perderte el final
        </Rise>
      </Centro>
      <AbsoluteFill style={{background: 'white', opacity: flash(frame, [titulo])}} />
    </AbsoluteFill>
  );
};

/** Transición: corte con barrido de luz */
const Corte: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 8], [-1200, 1200], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: -200, bottom: -200, width: 260, left: '50%', transform: `translateX(${x}px) skewX(-18deg)`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)'}} />
    </AbsoluteFill>
  );
};

// ---------- composición ----------

const ESCENAS: [number, number, React.FC][] = [
  [0, 4.6, Escena1Gancho],
  [4.6, 31.9, EscenaCuarto],
  [31.9, 45.0, Escena6Eleccion],
];

export const Historia: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {ESCENAS.map(([desde, hasta, Comp]) => (
      <Sequence key={desde} from={s(desde)} durationInFrames={s(hasta) - s(desde)}>
        <Comp />
      </Sequence>
    ))}
    {[4.6, 31.9].map((t) => (
      <Sequence key={t} from={s(t) - 2} durationInFrames={10}>
        <Corte />
      </Sequence>
    ))}
    <Grano />
    <Audio src={staticFile('banda-3am-voz.wav')} />
  </AbsoluteFill>
);
