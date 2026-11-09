import React from 'react';
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
 * Historia interactiva para TikTok / Reels (1080x1920, 30 fps, 34 s).
 * Los tiempos de cada escena están sincronizados con scripts/banda_sonora.py.
 * Zona segura TikTok: el contenido importante queda entre y≈200 y y≈1480.
 */

export const FPS = 30;
export const DURACION = 34 * FPS;
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

// ---------- celular ----------

const Celular: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      width: 760, height: 1480, borderRadius: 110, background: '#0b0b0f', padding: 22,
      boxShadow: '0 0 0 4px #2a2a33, 0 60px 160px rgba(255,45,85,0.25)', position: 'relative', ...style,
    }}
  >
    <div style={{width: '100%', height: '100%', borderRadius: 90, overflow: 'hidden', position: 'relative', background: 'linear-gradient(170deg,#1b1530 0%,#0a0a12 60%,#140812 100%)'}}>
      <div style={{position: 'absolute', top: 26, left: '50%', marginLeft: -110, width: 220, height: 64, borderRadius: 40, background: '#000', zIndex: 5}} />
      {children}
    </div>
  </div>
);

const Notificacion: React.FC<{at: number}> = ({at}) => {
  const p = usePop(at, 13, 170);
  return (
    <div
      style={{
        position: 'absolute', top: 470, left: 30, right: 30, padding: '30px 34px', borderRadius: 44,
        background: 'rgba(40,40,52,0.82)', backdropFilter: 'blur(20px)', fontFamily: DISPLAY, color: 'white',
        transform: `translateY(${(1 - p) * -380}px) scale(${0.9 + p * 0.1})`, opacity: p,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 20, fontSize: 30, color: '#b9b9c6'}}>
        <div style={{width: 58, height: 58, borderRadius: 16, background: '#34c759', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34}}>💬</div>
        <span style={{flex: 1, textAlign: 'left', fontWeight: 600, letterSpacing: 1}}>MENSAJES</span>
        <span>ahora</span>
      </div>
      <div style={{textAlign: 'left', marginTop: 18, fontSize: 44, fontWeight: 800}}>
        Yo <span style={{fontSize: 30, fontWeight: 500, color: ROJO}}>· tu número</span>
      </div>
      <div style={{textAlign: 'left', marginTop: 8, fontSize: 46, fontWeight: 500}}>No abras la puerta.</div>
    </div>
  );
};

// ---------- escenas ----------

const Escena1Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const golpe = s(1.6);
  const pulso = interpolate(frame, [golpe, golpe + 20], [0.9, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#050507', transform: shake(frame, [golpe], 22)}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 55%, rgba(255,45,85,${frame >= golpe ? pulso : 0.12}) 0%, transparent 60%)`}} />
      <Etiqueta>PARTE 1</Etiqueta>
      <Centro style={{gap: 10, paddingBottom: 60}}>
        <Rise at={4} style={{fontSize: 78, fontWeight: 700}}>Si te llega este mensaje</Rise>
        <Rise at={20} style={{fontSize: 78, fontWeight: 700, color: '#c9c9d6'}}>a las <span style={{color: 'white'}}>3 AM</span>…</Rise>
        <Slam at={golpe} style={{fontSize: 138, fontWeight: 900, marginTop: 30, letterSpacing: -4, textShadow: `0 0 60px ${ROJO}`}}>
          ¿QUÉ HACÉS?
        </Slam>
      </Centro>
      <AbsoluteFill style={{background: 'white', opacity: flash(frame, [golpe])}} />
    </AbsoluteFill>
  );
};

const Escena2Reloj: React.FC = () => {
  const frame = useCurrentFrame();
  const parpadeo = random(`f${Math.floor(frame / 3)}`) > 0.9 ? 0.35 : 1;
  const dosPuntos = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.15;
  const zoom = interpolate(frame, [0, s(3.5)], [1, 1.1]);
  return (
    <AbsoluteFill style={{background: '#030304'}}>
      <Centro style={{transform: `scale(${zoom})`, paddingBottom: 120}}>
        <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 290, color: ROJO, opacity: parpadeo, textShadow: `0 0 40px ${ROJO}, 0 0 120px ${ROJO}`, letterSpacing: -10}}>
          3<span style={{opacity: dosPuntos}}>:</span>07
          <span style={{fontSize: 90, marginLeft: 20, letterSpacing: 0}}>AM</span>
        </div>
        <Rise at={18} style={{fontSize: 66, fontWeight: 700, marginTop: 70}}>No podés dormir.</Rise>
        <Rise at={50} style={{fontSize: 66, fontWeight: 700, color: '#8d8d9c', marginTop: 16}}>Todo está en silencio.</Rise>
      </Centro>
    </AbsoluteFill>
  );
};

const Escena3Notificacion: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = usePop(0, 15, 110);
  const notif = s(1.0);
  const zoomAt = s(3.0);
  const z = interpolate(frame, [zoomAt, zoomAt + 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const vibra = frame >= notif && frame < notif + 12 ? Math.sin(frame * 3) * 10 : 0;
  return (
    <AbsoluteFill style={{background: '#050507'}}>
      <Centro>
        <div style={{transform: `translateY(${(1 - entra) * 900 - z * 170}px) scale(${1 + z * 0.45}) rotate(${vibra * 0.2}deg) translateX(${vibra}px)`}}>
          <Celular>
            <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', color: 'white', fontFamily: DISPLAY}}>
              <div style={{fontSize: 34, fontWeight: 600, color: '#c9c9d6'}}>lunes 9 de noviembre</div>
              <div style={{fontSize: 190, fontWeight: 700, letterSpacing: -6, lineHeight: 1}}>3:07</div>
            </div>
            <Notificacion at={notif} />
          </Celular>
        </div>
      </Centro>
      <AbsoluteFill style={{background: 'white', opacity: flash(frame, [zoomAt]) * 0.4}} />
      <Sequence from={zoomAt}>
        <AbsoluteFill style={{background: 'linear-gradient(transparent 55%, rgba(0,0,0,0.92) 72%)'}} />
        <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, color: 'white'}}>
          <Rise at={4} style={{fontSize: 64, fontWeight: 700}}>El mensaje viene de</Rise>
          <Slam at={14} style={{display: 'inline-block', marginTop: 18, fontSize: 96, fontWeight: 900, background: ROJO, padding: '6px 28px', borderRadius: 18, transform: 'rotate(-2deg)'}}>
            TU PROPIO NÚMERO
          </Slam>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

const Escena4Golpes: React.FC = () => {
  const frame = useCurrentFrame();
  const golpes = [s(0.5), s(1.1), s(1.7)];
  // luz por debajo de la puerta, con una sombra (pies) que se mueve
  const sombraX = interpolate(frame, [0, s(4)], [-220, 120]);
  return (
    <AbsoluteFill style={{background: '#000', transform: shake(frame, golpes, 34)}}>
      <Centro style={{paddingBottom: 260, gap: 0}}>
        {golpes.map((g, i) => (
          <Slam key={g} at={g} style={{fontSize: 210, fontWeight: 900, lineHeight: 1.05, letterSpacing: -6, color: i === 2 ? ROJO : 'white', marginLeft: (i - 1) * 140}}>
            TOC.
          </Slam>
        ))}
      </Centro>
      <div style={{position: 'absolute', top: 1360, left: 140, right: 140, height: 10, borderRadius: 10, background: '#ffd9a0', boxShadow: '0 0 40px 14px rgba(255,190,110,0.55)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: `calc(50% + ${sombraX}px)`, width: 90, top: 0, bottom: 0, background: '#000'}} />
        <div style={{position: 'absolute', left: `calc(50% + ${sombraX + 140}px)`, width: 90, top: 0, bottom: 0, background: '#000'}} />
      </div>
      <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, color: '#d8d8e2'}}>
        <Rise at={s(2.7)} style={{fontSize: 62, fontWeight: 700}}>Alguien golpea tu puerta.</Rise>
      </div>
      <AbsoluteFill style={{background: 'white', opacity: flash(frame, golpes)}} />
    </AbsoluteFill>
  );
};

const Burbuja: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const p = usePop(at, 12, 180);
  return (
    <div style={{alignSelf: 'flex-start', maxWidth: 560, background: '#2c2c36', color: 'white', fontSize: 46, fontWeight: 500, padding: '24px 32px', borderRadius: 40, borderBottomLeftRadius: 10, textAlign: 'left', transform: `scale(${p})`, transformOrigin: 'bottom left', opacity: p}}>
      {children}
    </div>
  );
};

const Escribiendo: React.FC<{desde: number; hasta: number}> = ({desde, hasta}) => {
  const frame = useCurrentFrame();
  if (frame < desde || frame >= hasta) return null;
  return (
    <div style={{alignSelf: 'flex-start', background: '#2c2c36', padding: '28px 34px', borderRadius: 40, display: 'flex', gap: 14}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 20, height: 20, borderRadius: 20, background: '#9a9aa8', transform: `translateY(${Math.sin((frame - i * 4) / 3) * 7}px)`}} />
      ))}
    </div>
  );
};

const Escena5Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = usePop(0, 16, 120);
  const typingDesde = s(0.5);
  const msg2 = s(2.0);
  const oscuro = s(4.0);
  const voz = s(4.8);
  const tuVoz = s(5.8);
  const dim = interpolate(frame, [oscuro, oscuro + 12], [0, 0.96], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const temblor = frame >= voz ? (random(`t${frame}`) - 0.5) * 6 : 0;
  return (
    <AbsoluteFill style={{background: '#050507'}}>
      <Centro>
        <div style={{transform: `translateY(${(1 - entra) * 120}px) scale(${0.96 + entra * 0.04})`, opacity: entra}}>
          <Celular>
            <div style={{position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 120, paddingBottom: 26, background: 'rgba(30,30,40,0.9)', textAlign: 'center', fontFamily: DISPLAY, color: 'white'}}>
              <div style={{width: 96, height: 96, borderRadius: 96, background: ROJO, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, fontWeight: 800}}>Y</div>
              <div style={{fontSize: 40, fontWeight: 700, marginTop: 12}}>Yo</div>
              <div style={{fontSize: 28, color: ROJO}}>tu número</div>
            </div>
            <div style={{position: 'absolute', top: 420, left: 36, right: 36, display: 'flex', flexDirection: 'column', gap: 22, fontFamily: DISPLAY}}>
              <div style={{fontSize: 26, color: '#777785', textAlign: 'center'}}>Hoy 3:07</div>
              <Burbuja at={-30}>No abras la puerta.</Burbuja>
              <Escribiendo desde={typingDesde} hasta={msg2} />
              {frame >= msg2 && <Burbuja at={msg2}>Lo que está del otro lado <b style={{color: ROJO}}>no es quien parece.</b></Burbuja>}
            </div>
          </Celular>
        </div>
      </Centro>
      <AbsoluteFill style={{background: '#000', opacity: dim, backdropFilter: `blur(${dim * 14}px)`}} />
      <Centro style={{paddingBottom: 160}}>
        <Rise at={oscuro + 4} style={{fontSize: 56, fontWeight: 600, color: '#a5a5b3'}}>Desde la puerta, una voz:</Rise>
        <Rise at={voz} style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 104, marginTop: 40, transform: `translate(${temblor}px, ${-temblor}px)`}}>
          “Abrí… soy yo.”
        </Rise>
        {frame >= tuVoz && (
          <Slam at={tuVoz} style={{marginTop: 70}}>
            <Glitch style={{fontSize: 130, fontWeight: 900, letterSpacing: -3}}>Es TU voz.</Glitch>
          </Slam>
        )}
      </Centro>
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
  const latidoBase = s(1.8);
  const fase = Math.max(0, frame - latidoBase) / 21; // un latido cada 0.7 s, igual que el audio
  const pulsoA = frame > latidoBase ? 1 + 0.035 * Math.exp(-((fase % 2) * 21) / 4) : 1;
  const pulsoB = frame > latidoBase + 21 ? 1 + 0.035 * Math.exp(-(((fase + 1) % 2) * 21) / 4) : 1;
  const fondo = 0.25 + 0.12 * Math.exp(-((fase % 1) * 21) / 5);
  return (
    <AbsoluteFill style={{background: '#070205', transform: shake(frame, [titulo], 24)}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(255,45,85,${fondo}) 0%, transparent 65%)`}} />
      <Centro style={{gap: 34, paddingBottom: 120}}>
        <Slam at={titulo} style={{fontSize: 136, fontWeight: 900, letterSpacing: -4, marginBottom: 20, textShadow: `0 0 50px ${ROJO}`}}>¿QUÉ HACÉS?</Slam>
        <Opcion at={s(1.0)} letra="A" texto="Abrís la puerta" latido={pulsoA} />
        <Opcion at={s(1.5)} letra="B" texto="Le contestás al mensaje" latido={pulsoB} />
        <Rise at={s(2.8)} style={{fontSize: 64, fontWeight: 800, marginTop: 36}}>
          Comentá <span style={{color: ROJO}}>A</span> o <span style={{color: ROJO}}>B</span> 👇
        </Rise>
        <Rise at={s(3.6)} style={{fontSize: 48, fontWeight: 600, color: '#c9c9d6'}}>
          Lo más votado decide la <b style={{color: 'white'}}>PARTE 2</b>
        </Rise>
        <Rise at={s(6.7)} style={{fontSize: 40, fontWeight: 600, color: '#8d8d9c', marginTop: 10}}>
          Seguime para no perderte el final
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
  [0, 3.0, Escena1Gancho],
  [3.0, 6.5, Escena2Reloj],
  [6.5, 12.5, Escena3Notificacion],
  [12.5, 16.5, Escena4Golpes],
  [16.5, 23.0, Escena5Chat],
  [23.0, 34.0, Escena6Eleccion],
];

export const Historia: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {ESCENAS.map(([desde, hasta, Comp]) => (
      <Sequence key={desde} from={s(desde)} durationInFrames={s(hasta) - s(desde)}>
        <Comp />
      </Sequence>
    ))}
    {[3.0, 6.5, 16.5].map((t) => (
      <Sequence key={t} from={s(t) - 2} durationInFrames={10}>
        <Corte />
      </Sequence>
    ))}
    <Grano />
    <Audio src={staticFile('banda-3am.wav')} />
  </AbsoluteFill>
);
