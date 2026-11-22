import React from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/*
 * Kit de estilo "Tinta": cuaderno de storyboard dibujado a mano.
 * - Papel envejecido de fondo (nada de fondos brillantes).
 * - Trazo de tinta que "hierve" (cambia levemente cada 3 cuadros, como la animación a mano).
 * - Manchas de acuarela con pocos colores, un poco corridas del trazo.
 * - Movimiento "de a dos" (12-15 dibujos por segundo) para que se sienta dibujado.
 * - Letra manuscrita (Caveat) para notas y subtítulos; máquina de escribir (Special Elite) para títulos.
 */

export const TINTA = '#2b2622';
export const PAPEL = '#e8dcc2';
export const PAPEL_CLARO = '#f3ead6';
export const SEPIA = '#7a6a55';

export const MANO = '"Caveat", cursive';
export const MAQUINA = '"Special Elite", monospace';
export const MARCADOR = '"Permanent Marker", cursive';

// ---------- fuentes locales (public/fonts) ----------
const FUENTES: [string, string, string][] = [
  ['Caveat', 'caveat-latin-400-normal.woff2', '400'],
  ['Caveat', 'caveat-latin-700-normal.woff2', '700'],
  ['Special Elite', 'special-elite-latin-400-normal.woff2', '400'],
  ['Permanent Marker', 'permanent-marker-latin-400-normal.woff2', '400'],
];
if (typeof window !== 'undefined' && typeof FontFace !== 'undefined') {
  const h = delayRender('fuentes tinta');
  Promise.all(
    FUENTES.map(([fam, file, weight]) =>
      new FontFace(fam, `url(${staticFile(`fonts/${file}`)})`, {weight}).load().then((f) => {
        document.fonts.add(f);
      }),
    ),
  )
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
}

// ---------- tiempo "de a dos" ----------
/** frame cuantizado: el movimiento avanza cada `cada` cuadros, como animación a mano */
export const useFrameDibujado = (cada = 2) => {
  const frame = useCurrentFrame();
  return frame - (frame % cada);
};

// ---------- filtros SVG compartidos ----------
export const FiltrosTinta: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 3) % 4;
  return (
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <defs>
        {/* trazo que hierve */}
        <filter id="hervir" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves={2} seed={seed} result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale={4.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* borde irregular de acuarela */}
        <filter id="acuarela" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={3} seed={seed + 7} result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale={16} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={0.8} />
        </filter>
        {/* desenfoque vertical para caídas rápidas */}
        <filter id="caida" x="0" y="-20%" width="100%" height="140%">
          <feGaussianBlur stdDeviation="0 22" />
        </filter>
        {/* sombreado con rayas a mano */}
        <pattern id="rayado" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1={0} y1={0} x2={0} y2={14} stroke={TINTA} strokeWidth={2.6} opacity={0.55} />
        </pattern>
        <pattern id="rayadoFino" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
          <line x1={0} y1={0} x2={0} y2={9} stroke={TINTA} strokeWidth={1.6} opacity={0.4} />
        </pattern>
      </defs>
    </svg>
  );
};

// ---------- papel ----------
export const Papel: React.FC<{tono?: string; manchas?: number}> = ({tono = PAPEL, manchas = 1}) => (
  <AbsoluteFill style={{background: tono}}>
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <filter id="fibra">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={3} />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 0.55 0" />
      </filter>
      <filter id="manchasPapel">
        <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves={4} seed={11} />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.2  0 0 0 0.9 -0.32" />
      </filter>
      <rect width="100%" height="100%" filter="url(#fibra)" opacity={0.45} />
      <rect width="100%" height="100%" filter="url(#manchasPapel)" opacity={0.55 * manchas} />
    </svg>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(70,50,30,0.38) 100%)'}} />
  </AbsoluteFill>
);

/** Capa que aplica el temblor de tinta a todo lo que contiene */
export const Hervir: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', inset: 0, filter: 'url(#hervir)', ...style}}>{children}</div>
);

// ---------- escritura a mano ----------
/** Revela el texto de izquierda a derecha, como si se escribiera en el momento */
export const Escrito: React.FC<{desde: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({desde, dur, children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const largo = typeof children === 'string' ? children.length : 24;
  const d = dur ?? Math.min(1.6, 0.25 + largo * 0.035);
  const k = interpolate(frame / fps, [desde, desde + d], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame / fps < desde) return null;
  return <div style={{clipPath: `inset(-20% ${100 - k}% -20% -5%)`, ...style}}>{children}</div>;
};

/** Tira de papel con cinta, para subtítulos y notas */
export const Nota: React.FC<{
  desde: number;
  hasta: number;
  children: React.ReactNode;
  giro?: number;
  ancho?: number | string;
  tamano?: number;
  tono?: string;
  style?: React.CSSProperties;
  escribir?: boolean;
}> = ({desde, hasta, children, giro = -1.5, ancho = 'auto', tamano = 66, tono = PAPEL_CLARO, style, escribir = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < desde || t > hasta) return null;
  const f2 = frame - (frame % 2);
  const p = spring({frame: f2 - Math.round(desde * fps), fps, config: {damping: 14, stiffness: 160}});
  const out = interpolate(t, [hasta - 0.2, hasta], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const semilla = `${desde}`;
  return (
    <div
      style={{
        position: 'relative', display: 'inline-block', width: ancho, padding: '14px 34px 18px', background: tono,
        transform: `translateY(${(1 - p) * 40}px) rotate(${giro}deg)`, opacity: Math.min(1, p * 1.5) * out,
        boxShadow: '3px 6px 0 rgba(43,38,34,0.18)', fontFamily: MANO, fontWeight: 700, fontSize: tamano, lineHeight: 1.08, color: TINTA,
        clipPath: `polygon(0% ${2 + random(semilla) * 3}%, 6% 0%, 14% ${random(semilla + 'a') * 3}%, 30% 1%, 48% ${random(semilla + 'b') * 3}%, 66% 0%, 82% ${random(semilla + 'c') * 3}%, 100% 2%, 99% 40%, 100% 97%, 84% ${97 + random(semilla + 'd') * 3}%, 62% 100%, 40% 97%, 22% 100%, 6% 97%, 0% 99%, 1% 50%)`,
        ...style,
      }}
    >
      {/* cinta */}
      <div style={{position: 'absolute', left: '50%', top: -16, width: 120, height: 34, marginLeft: -60, background: 'rgba(214,196,150,0.75)', transform: `rotate(${3 - giro}deg)`}} />
      {escribir ? <Escrito desde={desde + 0.12}>{children}</Escrito> : children}
    </div>
  );
};

/** Texto manuscrito suelto sobre el papel (sin tira), que se escribe en el momento */
export const Mano: React.FC<{desde: number; hasta: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number}> = ({desde, hasta, children, style, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < desde || t > hasta) return null;
  const out = interpolate(t, [hasta - 0.2, hasta], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{fontFamily: MANO, fontWeight: 700, color: TINTA, opacity: out, ...style}}>
      <Escrito desde={desde} dur={dur}>
        {children}
      </Escrito>
    </div>
  );
};

/** Círculo dibujado a mano que se traza alrededor de algo */
export const Rodear: React.FC<{desde: number; hasta?: number; x: number; y: number; w: number; h: number; color?: string; dur?: number}> = ({desde, hasta = Infinity, x, y, w, h, color = '#a3271d', dur = 0.5}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = interpolate(frame / fps, [desde, desde + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(frame / fps, [hasta - 0.25, hasta], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (k <= 0 || out <= 0) return null;
  const L = 2000;
  const d = `M ${x + w * 0.05} ${y + h * 0.2} C ${x + w * 0.2} ${y - h * 0.08}, ${x + w * 0.9} ${y - h * 0.1}, ${x + w * 1.02} ${y + h * 0.45} C ${x + w * 1.08} ${y + h * 0.95}, ${x + w * 0.2} ${y + h * 1.12}, ${x - w * 0.02} ${y + h * 0.6} C ${x - w * 0.08} ${y + h * 0.3}, ${x + w * 0.25} ${y + h * 0.02}, ${x + w * 0.4} ${y - h * 0.02}`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', opacity: out}}>
      <path d={d} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - k)} />
    </svg>
  );
};

/** Tarjeta de título a máquina de escribir, con sello */
export const TarjetaTitulo: React.FC<{desde: number; antetitulo: string; titulo: string; anio: string; detalle: string; sello?: string}> = ({desde, antetitulo, titulo, anio, detalle, sello}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < desde) return null;
  const f2 = frame - (frame % 2);
  const p = spring({frame: f2 - Math.round(desde * fps), fps, config: {damping: 15, stiffness: 120}});
  const tipear = (txt: string, ini: number, cps = 16) => txt.slice(0, Math.max(0, Math.floor((t - ini) * cps)));
  const tT = desde + 0.5 + antetitulo.length / 22;
  const tD = tT + titulo.length / 10 + 0.2;
  const tS = tD + detalle.length / 26 + 0.15;
  const pS = spring({frame: frame - Math.round(tS * fps), fps, config: {damping: 8, stiffness: 260}});
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 520, transform: `translateY(${(1 - p) * 900}px) rotate(-1.2deg)`}}>
      <div style={{background: '#f6efdd', padding: '54px 56px 60px', boxShadow: '6px 10px 0 rgba(43,38,34,0.25)', position: 'relative', border: `3px solid ${TINTA}`}}>
        <div style={{position: 'absolute', left: 34, right: 34, top: 120, height: 3, background: 'rgba(163,39,29,0.35)'}} />
        <div style={{fontFamily: MAQUINA, fontSize: 40, color: SEPIA, minHeight: 54}}>{tipear(antetitulo, desde + 0.5, 22)}</div>
        <div style={{fontFamily: MAQUINA, fontSize: 132, color: TINTA, lineHeight: 1.05, marginTop: 34, minHeight: 140, letterSpacing: 2}}>{tipear(titulo, tT, 10)}</div>
        <div style={{fontFamily: MAQUINA, fontSize: 40, color: TINTA, marginTop: 22, minHeight: 54}}>{tipear(detalle, tD, 26)}</div>
        {t >= tS && sello && (
          <div style={{position: 'absolute', right: 36, bottom: -40, fontFamily: MAQUINA, fontSize: 56, color: '#a3271d', border: '6px solid #a3271d', padding: '4px 22px', transform: `rotate(-12deg) scale(${interpolate(pS, [0, 1], [2.6, 1])})`, opacity: 0.85 * Math.min(1, pS * 2), mixBlendMode: 'multiply'}}>
            {sello}
          </div>
        )}
        <div style={{position: 'absolute', right: 52, top: 40, fontFamily: MAQUINA, fontSize: 40, color: SEPIA}}>{t >= tD ? anio : ''}</div>
      </div>
    </div>
  );
};

/** Viñeta de cine: bordes oscuros y leve parpadeo de proyector */
export const Proyector: React.FC = () => {
  const frame = useCurrentFrame();
  const parpadeo = 0.04 * random(`p${Math.floor(frame / 2)}`);
  return <AbsoluteFill style={{pointerEvents: 'none', background: `rgba(40,28,18,${parpadeo})`}} />;
};
