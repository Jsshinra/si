import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, interpolateColors, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import T from './contrato-tiempos.json';

/*
 * "El contrato" — el dilema de la serie Severance, contado con nuestros propios personajes.
 * TikTok / Reels (1080x1920, 30 fps). Tiempos en src/contrato-tiempos.json (compartidos con scripts/contrato_musica.py).
 *
 * Metáfora: la pantalla se divide en dos mundos unidos por un ascensor.
 * Arriba = AFUERA (el que firma). Abajo = ADENTRO (el que trabaja). Cada uno no recuerda la mitad del otro.
 */

export const CONTRATO_FPS = 30;
export const CONTRATO_DURACION = Math.round(T.dur * CONTRATO_FPS);

const DISPLAY = '"Inter Display", Inter, sans-serif';
const MONO = '"JetBrains Mono", monospace';
const TINTA = '#1f1b4b';
const ROSA = '#ff4f8b';
const CELESTE = '#3fb6d9';
const VERDE = '#12b886';
const ROJO = '#e03131';
const ORO = '#ffc400';

const MID = 1000; // suelo de afuera
const PISO = 1400; // suelo de adentro
const ASC_X = 850; // centro del ascensor
const CASA_X = 390; // donde se para cada uno en su mundo

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const paso = (t: number, desde: number, dur: number) => clamp01((t - desde) / dur);
const suave = Easing.inOut(Easing.cubic);
const mezcla = (k: number, a: string, b: string) => (k <= 0 ? a : k >= 1 ? b : interpolateColors(k, [0, 1], [a, b]));

/** Un viaje de ida y vuelta en ascensor. u va de 0 a 1. */
const viaje = (u: number) => {
  if (u <= 0 || u >= 1) return {x: CASA_X, lejos: 0, dentro: false, parpadeo: 0};
  const x = u < 0.28 ? interpolate(suave(u / 0.28), [0, 1], [CASA_X, ASC_X]) : u > 0.72 ? interpolate(suave((u - 0.72) / 0.28), [0, 1], [ASC_X, CASA_X]) : ASC_X;
  const lejos = u < 0.28 ? 0 : u < 0.45 ? suave((u - 0.28) / 0.17) : u < 0.55 ? 1 : u < 0.72 ? 1 - suave((u - 0.55) / 0.17) : 0;
  const parpadeo = u > 0.43 && u < 0.57 ? Math.sin(((u - 0.43) / 0.14) * Math.PI) : 0;
  return {x, lejos, dentro: u >= 0.28 && u <= 0.72, parpadeo};
};

const CICLOS = [3.0, 1.4, 0.9];
const FIN_CICLOS = T.ciclo + CICLOS.reduce((a, b) => a + b, 0);

/** viaje del papel de renuncia: sube, lo sellan, vuelve */
const TRAMO = Math.min(0.8, (T.no - T.renuncia - 0.4) / 3);
const P1 = T.renuncia + TRAMO;
const P2 = P1 + TRAMO;
const P3 = P2 + TRAMO;
const R0 = T.no + 0.9;
const VUELTA = Math.min(0.7, (T.leccion - R0 - 0.2) / 3);
const R1 = R0 + VUELTA;
const R2 = R1 + VUELTA;
const R3 = R2 + VUELTA;

const Persona: React.FC<{x: number; y: number; color: string; mira: number; animo: number; escala?: number; tiembla?: boolean}> = ({x, y, color, mira, animo, escala = 1.12, tiembla}) => {
  const frame = useCurrentFrame();
  const parpado = (frame + Math.round(x)) % 90 < 4;
  const respira = Math.sin(frame / 14 + x) * 3;
  const tx = tiembla ? (random(`tp${frame}`) - 0.5) * 5 : 0;
  return (
    <div style={{position: 'absolute', left: x - 90 + tx, top: y - 230, width: 180, height: 240, transform: `scale(${escala})`, transformOrigin: '90px 230px'}}>
      <svg width={180} height={240} viewBox="0 0 180 240" style={{overflow: 'visible'}}>
        <rect x={58} y={196} width={22} height={36} rx={10} fill={TINTA} />
        <rect x={100} y={196} width={22} height={36} rx={10} fill={TINTA} />
        <rect x={28} y={60 - respira} width={124} height={150 + respira} rx={58} fill={color} stroke="white" strokeWidth={7} />
        <path d={`M30 ${130 - respira} q-26 ${10 - Math.max(0, animo) * 50} -30 ${34 - Math.max(0, animo) * 80}`} stroke={color} strokeWidth={18} strokeLinecap="round" fill="none" />
        <path d={`M150 ${130 - respira} q26 ${10 - Math.max(0, animo) * 50} 30 ${34 - Math.max(0, animo) * 80}`} stroke={color} strokeWidth={18} strokeLinecap="round" fill="none" />
        {[70, 110].map((ex) => (
          <g key={ex}>
            <ellipse cx={ex} cy={112 - respira} rx={15} ry={parpado ? 2 : 17} fill="white" />
            {!parpado && <circle cx={ex + mira * 6} cy={114 - respira + (animo < 0 ? 4 : 0)} r={7.5} fill={TINTA} />}
          </g>
        ))}
        <path d={`M72 ${152 - respira} Q90 ${152 - respira + 4 + animo * 20} 108 ${152 - respira}`} stroke={TINTA} strokeWidth={6} strokeLinecap="round" fill={animo > 0.6 ? TINTA : 'none'} />
      </svg>
    </div>
  );
};

/** Bloque de texto visible entre dos segundos */
const Cap: React.FC<{desde: number; hasta: number; children: React.ReactNode; style?: React.CSSProperties; golpe?: boolean}> = ({desde, hasta, children, style, golpe}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < desde || t > hasta) return null;
  const p = spring({frame: frame - Math.round(desde * fps), fps, config: golpe ? {damping: 9, stiffness: 220} : {damping: 16, stiffness: 120}});
  const out = interpolate(t, [hasta - 0.25, hasta], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tr = golpe ? `scale(${interpolate(p, [0, 1], [2.2, 1])})` : `translateY(${(1 - p) * 50}px)`;
  return <div style={{...style, opacity: Math.min(1, p * 1.6) * out * Number(style?.opacity ?? 1), transform: `${tr} ${style?.transform ?? ''}`, filter: golpe ? undefined : `blur(${(1 - p) * 10}px)`}}>{children}</div>;
};

const Capa: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
);

const Reloj: React.FC<{x: number; y: number; hora: string}> = ({x, y, hora}) => (
  <div style={{position: 'absolute', left: x - 80, top: y, width: 160, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 40, color: '#7dffb0', background: '#0e1512', borderRadius: 14, border: '5px solid white', padding: '2px 0', boxShadow: '0 6px 0 rgba(31,27,75,0.2)'}}>{hora}</div>
);

const Etiqueta: React.FC<{y: number; color: string; desde: number; children: React.ReactNode}> = ({y, color, desde, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < desde * fps) return null;
  const p = spring({frame: frame - Math.round(desde * fps), fps, config: {damping: 10}});
  return <div style={{position: 'absolute', left: 40, top: y, transform: `scale(${p}) rotate(-2deg)`, transformOrigin: 'left center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 34, letterSpacing: 2, color: 'white', background: color, padding: '4px 20px', borderRadius: 100, border: '5px solid white', boxShadow: '0 6px 0 rgba(31,27,75,0.2)'}}>{children}</div>;
};

const Oscuro: React.FC<{top: number; alto: number; k: number}> = ({top, alto, k}) => {
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, height: alto, background: '#0d0b24', opacity: k * 0.97, overflow: 'hidden'}}>
      {Array.from({length: 12}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 60 + (i % 4) * 270 + (Math.floor(i / 4) % 2) * 130, top: 90 + Math.floor(i / 4) * (alto / 3.2), fontFamily: DISPLAY, fontWeight: 900, fontSize: 130, color: 'white', opacity: 0.07}}>?</div>
      ))}
    </div>
  );
};

export const Contrato: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pop = (at: number, damping = 10) => spring({frame: frame - Math.round(at * fps), fps, config: {damping, stiffness: 180}});

  // qué mitad está "olvidada"
  const abajoOculto = 1 - paso(t, T.adentro, 0.8);
  const arribaOculto = paso(t, T.salida, 0.7) * (1 - paso(t, T.renuncia - 0.3, 0.6));

  // viaje del de afuera
  const vA = viaje((t - T.ascensor) / T.ascensorDur);
  // viajes del de adentro (cada vez más rápidos)
  let vB = viaje(0);
  let dia = 1;
  {
    let t0 = T.ciclo;
    for (const d of CICLOS) {
      if (t >= t0 && t < t0 + d) vB = viaje((t - t0) / d);
      if (t >= t0 + d * 0.5) dia++;
      t0 += d;
    }
    if (t > FIN_CICLOS) dia = Math.round(4 + 843 * Easing.out(Easing.quad)(paso(t, FIN_CICLOS, Math.max(1, T.jornada + 1.2 - FIN_CICLOS))) + Math.max(0, t - T.jornada - 1.2) * 3);
  }
  const corriendo = t > FIN_CICLOS && t < T.renuncia;

  // posición de la cabina: 0 = arriba, 1 = abajo
  let cab = t < T.alguien ? 0 : suave(paso(t, T.alguien, T.adentro - T.alguien));
  if (vA.dentro) cab = vA.lejos;
  if (vB.dentro) cab = 1 - vB.lejos;
  if (t >= P1) cab = 1 - suave(paso(t, P1, TRAMO));
  if (t >= R1) cab = suave(paso(t, R1, VUELTA));
  const cabY = 760 + cab * 400;
  const parpadeo = Math.max(vA.parpadeo, t < T.ciclo + CICLOS[0] ? vB.parpadeo : vB.parpadeo * 0.5);

  // relojes
  const horaA = t >= T.ascensor + T.ascensorDur * 0.5 && t < T.firmas ? '17:00' : '09:00';
  let horaB = '17:00';
  {
    let t0 = T.ciclo;
    for (const d of CICLOS) {
      if (t >= t0 + d * 0.5 && t < t0 + d) horaB = '09:00';
      t0 += d;
    }
    if (corriendo) horaB = Math.floor(t * 7) % 2 ? '09:00' : '17:00';
  }

  // papel de renuncia
  const hayPapel = t >= T.renuncia && t < T.leccion + 4;
  let papel = {x: CASA_X + 70, y: PISO - 150};
  if (t >= T.renuncia) papel = {x: interpolate(suave(paso(t, T.renuncia, TRAMO)), [0, 1], [CASA_X + 70, ASC_X]), y: PISO - 150};
  if (t >= P1) papel = {x: ASC_X, y: cabY + 90};
  if (t >= P2) papel = {x: interpolate(suave(paso(t, P2, TRAMO)), [0, 1], [ASC_X, CASA_X + 90]), y: MID - 150};
  if (t >= R0) papel = {x: interpolate(suave(paso(t, R0, VUELTA)), [0, 1], [CASA_X + 90, ASC_X]), y: MID - 150};
  if (t >= R1) papel = {x: ASC_X, y: cabY + 90};
  if (t >= R2) papel = {x: interpolate(suave(paso(t, R2, VUELTA)), [0, 1], [ASC_X, CASA_X + 70]), y: PISO - 150 + 60 * suave(paso(t, R2, VUELTA))};
  const sellado = t >= T.no;

  // ánimo
  const animoA = t >= T.ascensor + T.ascensorDur * 0.75 && t < T.alguien ? 1 : t >= T.leccion ? -0.2 : 0.4;
  const animoB = t >= T.no + 0.3 ? -1 : t >= T.casa ? -0.7 : -0.2;

  const luzOficina = corriendo ? 0.88 + 0.12 * Math.sin(t * 40) : 1;
  const textoClaro = clamp01((arribaOculto - 0.3) / 0.3);
  const tinta = mezcla(textoClaro, TINTA, '#ffffff');
  const kTitulo = paso(t, T.titulo - 0.2, 0.5);
  const firma = paso(t, T.firmas + 0.6, 1.0);
  const contrato1 = t >= T.oferta && t < T.chip - 0.1;
  const contrato2 = t >= T.firmas && t < T.alguien - 0.1;
  const dinero = Math.round(10000000 * Easing.out(Easing.cubic)(paso(t, T.oferta + 0.3, 1.4)));

  return (
    <AbsoluteFill style={{background: '#fff4e3', fontFamily: DISPLAY, color: tinta}}>
      {/* ============ AFUERA ============ */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: MID, overflow: 'hidden', background: 'linear-gradient(180deg, #ffe9d6 0%, #ffd7e4 55%, #ffe6a8 100%)'}}>
        {[{c: '#ffc2d9', x: 180, y: 300, r: 480}, {c: '#bfd4ff', x: 900, y: 520, r: 520}, {c: '#ffe39a', x: 420, y: 900, r: 460}].map((m, k) => (
          <div key={k} style={{position: 'absolute', width: m.r * 2, height: m.r * 2, borderRadius: '50%', left: m.x - m.r + Math.sin(t * 0.2 + k) * 80, top: m.y - m.r + Math.cos(t * 0.24 + k * 2) * 80, background: `radial-gradient(circle, ${m.c} 0%, ${m.c}00 68%)`}} />
        ))}
        {/* sol */}
        <div style={{position: 'absolute', left: 560, top: 590, width: 120, height: 120, borderRadius: 120, background: ORO, border: '7px solid white', boxShadow: `0 0 70px 18px ${ORO}88`, transform: `scale(${1 + 0.04 * Math.sin(t * 2)})`}} />
        {/* casa */}
        <svg width={260} height={280} style={{position: 'absolute', left: 30, top: MID - 262}}>
          <rect x={30} y={120} width={190} height={150} rx={10} fill="white" stroke={TINTA} strokeWidth={7} />
          <path d="M10 130 L125 28 L240 130 Z" fill={ROSA} stroke={TINTA} strokeWidth={7} strokeLinejoin="round" />
          <rect x={100} y={180} width={50} height={90} rx={8} fill={TINTA} />
          <rect x={164} y={160} width={36} height={36} rx={6} fill="#ffe39a" stroke={TINTA} strokeWidth={5} />
        </svg>
      </div>
      {/* pasto */}
      <div style={{position: 'absolute', left: 0, right: 0, top: MID - 14, height: 28, background: VERDE, borderRadius: 14}} />

      {/* ============ ADENTRO ============ */}
      <div style={{position: 'absolute', left: 0, right: 0, top: MID + 14, bottom: 0, overflow: 'hidden', background: '#d5ebe8', filter: `brightness(${luzOficina})`}}>
        {/* tubos de luz */}
        {[150, 480].map((x) => (
          <div key={x} style={{position: 'absolute', left: x, top: 22, width: 230, height: 16, borderRadius: 16, background: 'white', boxShadow: '0 0 40px 12px rgba(255,255,255,0.9)'}} />
        ))}
        {/* pared con paneles */}
        {[0, 1, 2, 3].map((k) => (
          <div key={k} style={{position: 'absolute', left: k * 190 - 10, top: 70, width: 180, height: 300, border: '5px solid #bcd7d3', borderRadius: 10}} />
        ))}
        {/* piso */}
        <div style={{position: 'absolute', left: 0, right: 0, top: PISO - MID - 14, bottom: 0, background: '#8fb1ad'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: PISO - MID - 14, height: 10, background: '#6f948f'}} />
        {/* escritorio */}
        <svg width={300} height={240} style={{position: 'absolute', left: 30, top: PISO - MID - 14 - 226}}>
          <rect x={70} y={40} width={150} height={104} rx={12} fill={TINTA} />
          <rect x={82} y={52} width={126} height={80} rx={6} fill="#7dffb0" opacity={0.85 + 0.15 * Math.sin(t * 9)} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={94} y={66 + k * 20} width={60 + ((Math.floor(t * 4) + k * 37) % 40)} height={8} rx={4} fill="#0e1512" opacity={0.6} />
          ))}
          <rect x={134} y={144} width={22} height={20} fill={TINTA} />
          <rect x={10} y={162} width={270} height={22} rx={8} fill={TINTA} />
          <rect x={30} y={184} width={18} height={56} fill={TINTA} />
          <rect x={242} y={184} width={18} height={56} fill={TINTA} />
        </svg>
      </div>

      {/* ============ ASCENSOR ============ */}
      <div style={{position: 'absolute', left: ASC_X - 92, top: 748, width: 184, height: PISO - 748, background: '#2b2766', borderRadius: 22, border: '6px solid white'}} />
      <div style={{position: 'absolute', left: ASC_X - 78, top: cabY + 6, width: 156, height: 232, background: '#f3f0ff', borderRadius: 14, boxShadow: 'inset 0 0 0 6px #b9b3e6'}} />
      {/* destello al cruzar la línea: ahí se divide la memoria */}
      {Math.abs(cab - 0.5) < 0.12 && (vA.dentro || vB.dentro) && <div style={{position: 'absolute', left: ASC_X - 130, top: MID - 40, width: 260, height: 80, borderRadius: 80, background: 'white', opacity: 1 - Math.abs(cab - 0.5) / 0.12, filter: 'blur(14px)'}} />}

      {/* relojes */}
      <Reloj x={ASC_X} y={672} hora={horaA} />
      <Reloj x={610} y={1100} hora={horaB} />

      {/* personajes */}
      {vA.dentro ? <Persona x={ASC_X} y={cabY + 236} color={cab < 0.5 ? ROSA : CELESTE} mira={0} animo={0.2} escala={0.95} /> : <Persona x={vA.x} y={MID} color={ROSA} mira={t >= T.aprobar && t < T.leccion ? 1 : vA.x > CASA_X + 5 ? 1 : 0.3} animo={animoA} />}
      {vB.dentro ? <Persona x={ASC_X} y={cabY + 236} color={cab < 0.5 ? ROSA : CELESTE} mira={0} animo={-0.3} escala={0.95} /> : <Persona x={vB.x} y={PISO} color={CELESTE} mira={t >= T.renuncia ? 1 : vB.x > CASA_X + 5 ? 1 : -0.6} animo={animoB} tiembla={corriendo} />}

      {/* chip */}
      {t >= T.chip && t < T.perfecto && (
        <div style={{position: 'absolute', left: CASA_X - 44, top: MID - 380 + (1 - pop(T.chip, 8)) * -200, fontSize: 80, transform: `rotate(${Math.sin(t * 6) * 6}deg)`}}>
          <div style={{width: 88, height: 88, borderRadius: 18, background: TINTA, border: '6px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${30 + 20 * Math.sin(t * 10)}px 6px ${CELESTE}`}}>
            <div style={{width: 40, height: 40, borderRadius: 8, background: CELESTE}} />
          </div>
        </div>
      )}
      <Etiqueta y={590} color={ROSA} desde={T.entrar}>AFUERA</Etiqueta>
      <Etiqueta y={MID + 40} color={CELESTE} desde={T.adentro}>ADENTRO</Etiqueta>

      {/* +$ cuando vuelve */}
      {t >= T.ascensor + T.ascensorDur * 0.95 && t < T.firmas && (
        <div style={{position: 'absolute', left: CASA_X + 90, top: MID - 330 - paso(t, T.ascensor + T.ascensorDur * 0.95, 1.5) * 40, fontSize: 76, fontWeight: 900, color: VERDE, textShadow: '0 6px 0 rgba(31,27,75,0.15)', transform: `scale(${pop(T.ascensor + T.ascensorDur * 0.95, 7)})`}}>+ $$$</div>
      )}

      {/* contador de días */}
      {t >= T.ciclo && t < T.leccion && (
        <div style={{position: 'absolute', left: 262, top: MID + 34, transform: `scale(${pop(T.ciclo)}) rotate(2deg)`, fontFamily: MONO, fontWeight: 800, fontSize: 38, color: 'white', background: TINTA, padding: '4px 18px', borderRadius: 16, border: '5px solid white', boxShadow: '0 6px 0 rgba(31,27,75,0.2)'}}>Día {dia}</div>
      )}

      {/* mitades olvidadas */}
      <Oscuro top={MID + 14} alto={1920 - MID - 14} k={abajoOculto} />
      <Oscuro top={0} alto={MID - 14} k={arribaOculto} />
      {abajoOculto > 0.5 && t >= T.entrar && <div style={{position: 'absolute', left: 0, right: 0, top: MID + 150, textAlign: 'center', fontSize: 44, fontWeight: 800, color: 'white', opacity: 0.55 * abajoOculto}}>lo que no vas a recordar</div>}
      {arribaOculto > 0.5 && <div style={{position: 'absolute', left: 0, width: 760, top: MID - 190, textAlign: 'center', fontSize: 44, fontWeight: 800, color: 'white', opacity: 0.55 * arribaOculto}}>lo que él nunca vio</div>}

      {/* línea: la misma persona */}
      {t >= T.vos && (
        <div style={{position: 'absolute', left: 506, top: MID - 30, transform: `scale(${pop(T.vos, 8)}) rotate(-2deg)`, fontSize: 30, fontWeight: 900, color: TINTA, background: ORO, padding: '6px 18px', borderRadius: 100, border: '5px solid white', boxShadow: '0 6px 0 rgba(31,27,75,0.2)'}}>la misma persona</div>
      )}

      {/* papel de renuncia */}
      {hayPapel && (
        <div style={{position: 'absolute', left: papel.x - 62, top: papel.y - 80, width: 124, height: 160, background: 'white', border: `5px solid ${TINTA}`, borderRadius: 10, boxShadow: '0 6px 0 rgba(31,27,75,0.2)', transform: `scale(${pop(T.renuncia)}) rotate(${t >= R2 ? 14 * paso(t, R2, VUELTA) : -5}deg)`, textAlign: 'center', overflow: 'hidden'}}>
          <div style={{fontSize: 19, fontWeight: 900, color: TINTA, marginTop: 12, letterSpacing: 0.5}}>RENUNCIA</div>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{height: 7, borderRadius: 4, background: '#cfcbe6', margin: `${k ? 9 : 12}px 16px 0`}} />
          ))}
          {sellado && <div style={{position: 'absolute', left: 4, right: 4, top: 82, fontSize: 60, fontWeight: 900, color: ROJO, border: `6px solid ${ROJO}`, borderRadius: 12, lineHeight: 1, transform: `rotate(-14deg) scale(${interpolate(pop(T.no, 8), [0, 1], [3, 1])})`}}>NO</div>}
        </div>
      )}

      {/* contrato */}
      {(contrato1 || contrato2) && (
        <div style={{position: 'absolute', left: 130, top: 590, width: 820, transform: `scale(${pop(contrato1 ? T.oferta : T.firmas, 11)}) rotate(-2deg)`, background: 'white', border: `7px solid ${TINTA}`, borderRadius: 34, boxShadow: '0 14px 0 rgba(31,27,75,0.22)', padding: '26px 40px 34px', textAlign: 'center', color: TINTA}}>
          <div style={{fontSize: 36, fontWeight: 900, letterSpacing: 8, opacity: 0.6}}>CONTRATO</div>
          <div style={{fontFamily: MONO, fontSize: 92, fontWeight: 800, color: VERDE, letterSpacing: -3, lineHeight: 1.15}}>${(contrato1 ? dinero : 10000000).toLocaleString('es-AR')}</div>
          {contrato2 && (
            <div style={{position: 'relative', height: 110, marginTop: 6}}>
              <svg width={420} height={100} style={{position: 'absolute', left: 150, top: 0}}>
                <path d="M10 70 C40 10 60 90 90 50 S140 20 160 60 S220 90 250 40 S330 30 400 62" fill="none" stroke={TINTA} strokeWidth={7} strokeLinecap="round" strokeDasharray={560} strokeDashoffset={560 * (1 - firma)} />
              </svg>
              <div style={{position: 'absolute', left: 130, right: 130, bottom: 0, height: 5, background: TINTA, opacity: 0.4}} />
              {t >= T.todosSi && <div style={{position: 'absolute', right: -10, top: -30, fontSize: 96, fontWeight: 900, color: VERDE, border: `8px solid ${VERDE}`, borderRadius: 18, padding: '0 22px', lineHeight: 1.1, background: 'white', transform: `rotate(12deg) scale(${interpolate(pop(T.todosSi, 8), [0, 1], [3, 1])})`}}>SÍ</div>}
            </div>
          )}
        </div>
      )}

      {/* ============ TEXTOS (zona segura de TikTok) ============ */}
      <div style={{position: 'absolute', top: 222, left: 56, right: 56, height: 340, textAlign: 'center'}}>
        <Capa>
          <Cap desde={T.oferta} hasta={T.chip - 0.15} style={{fontSize: 62, fontWeight: 800, lineHeight: 1.1}}>Te ofrecen</Cap>
          <Cap desde={T.oferta + 0.3} hasta={T.chip - 0.15} golpe style={{fontSize: 104, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05, color: VERDE, textShadow: '0 7px 0 rgba(31,27,75,0.14)'}}>10 millones de dólares.</Cap>
          <Cap desde={T.condicion} hasta={T.chip - 0.15} style={{fontSize: 46, fontWeight: 700, marginTop: 14, background: TINTA, color: 'white', padding: '6px 26px', borderRadius: 100, transform: 'rotate(-1.5deg)'}}>con una sola condición</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.chip} hasta={T.entrar - 0.1} style={{fontSize: 72, fontWeight: 900, lineHeight: 1.1}}>Te ponen un chip en la cabeza.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.entrar} hasta={T.perfecto - 0.15} style={{fontSize: 54, fontWeight: 800, lineHeight: 1.15}}>
            Al entrar al trabajo, <span style={{color: ROSA, fontWeight: 900}}>olvidás todo lo de afuera.</span>
          </Cap>
          <Cap desde={T.salir} hasta={T.perfecto - 0.15} style={{fontSize: 54, fontWeight: 800, lineHeight: 1.15, marginTop: 16}}>
            Al salir, <span style={{color: '#1c93b8', fontWeight: 900}}>olvidás todo lo de adentro.</span>
          </Cap>
        </Capa>
        <Capa>
          <Cap desde={T.perfecto} hasta={T.lunes - 0.1} golpe style={{fontSize: 96, fontWeight: 900, letterSpacing: -3}}>Suena perfecto.</Cap>
          <Cap desde={T.ascensor} hasta={T.lunes - 0.1} style={{fontSize: 50, fontWeight: 700, lineHeight: 1.2, marginTop: 8}}>Entrás a las 9, parpadeás… y ya son las 5.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.lunes} hasta={T.firmas - 0.15} style={{fontSize: 64, fontWeight: 900}}>Nunca más un lunes. 📅</Cap>
          <Cap desde={T.jefe} hasta={T.firmas - 0.15} style={{fontSize: 64, fontWeight: 900, marginTop: 4}}>Nunca más un jefe. 🙅</Cap>
          <Cap desde={T.cobras} hasta={T.firmas - 0.15} style={{fontSize: 44, fontWeight: 700, lineHeight: 1.2, marginTop: 12, opacity: 0.8}}>Cobrás por un trabajo que ni recordás.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.firmas} hasta={T.alguien - 0.15} golpe style={{fontSize: 140, fontWeight: 900, letterSpacing: -4}}>¿Firmás?</Cap>
          <Cap desde={T.todosSi} hasta={T.alguien - 0.15} style={{fontSize: 52, fontWeight: 700, opacity: 0.8}}>Casi todos dicen que sí.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.alguien} hasta={T.salida - 0.15} style={{fontSize: 60, fontWeight: 800, lineHeight: 1.15}}>Pero hay alguien a quien no le preguntaron.</Cap>
          <Cap desde={T.adentro} hasta={T.salida - 0.15} golpe style={{fontSize: 76, fontWeight: 900, marginTop: 14, background: CELESTE, color: 'white', padding: '4px 30px', borderRadius: 26, transform: 'rotate(-2deg)', border: '6px solid white', boxShadow: '0 8px 0 rgba(31,27,75,0.18)'}}>El que se queda adentro.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.salida} hasta={T.casa - 0.15} style={{fontSize: 70, fontWeight: 900, lineHeight: 1.1}}>Para él no existe la salida.</Cap>
          <Cap desde={T.ciclo} hasta={T.casa - 0.15} style={{fontSize: 46, fontWeight: 700, lineHeight: 1.2, marginTop: 12, opacity: 0.85}}>Sube a las 5, parpadea… y vuelven a ser las 9.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.casa} hasta={T.jornada - 0.1} style={{fontSize: 62, fontWeight: 900}}>No tiene casa. 🏠</Cap>
          <Cap desde={T.findes} hasta={T.jornada - 0.1} style={{fontSize: 62, fontWeight: 900, marginTop: 4}}>No tiene fines de semana.</Cap>
          <Cap desde={T.sol} hasta={T.jornada - 0.1} style={{fontSize: 62, fontWeight: 900, marginTop: 4}}>No conoce el sol. ☀️</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.jornada} hasta={T.renuncia - 0.15} style={{fontSize: 54, fontWeight: 700, opacity: 0.85}}>Su vida entera es</Cap>
          <Cap desde={T.jornada + 0.4} hasta={T.renuncia - 0.15} golpe style={{fontSize: 80, fontWeight: 900, letterSpacing: -2, lineHeight: 1.08}}>una jornada que nunca termina.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.renuncia} hasta={T.leccion - 0.15} style={{fontSize: 62, fontWeight: 900}}>Puede pedir la renuncia.</Cap>
          <Cap desde={T.aprobar} hasta={T.leccion - 0.15} style={{fontSize: 48, fontWeight: 700, lineHeight: 1.2, marginTop: 10, opacity: 0.85}}>Pero la tiene que aprobar el de afuera.</Cap>
          <Cap desde={T.no} hasta={T.leccion - 0.15} golpe style={{fontSize: 70, fontWeight: 900, marginTop: 10, color: ROJO}}>Y el de afuera dice que no.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.leccion} hasta={T.titulo - 0.2} style={{fontSize: 40, fontWeight: 900, letterSpacing: 6, color: 'white', background: TINTA, padding: '4px 24px', borderRadius: 100}}>LA LECCIÓN</Cap>
          <Cap desde={T.sacrificio} hasta={T.titulo - 0.2} style={{fontSize: 58, fontWeight: 800, lineHeight: 1.15, marginTop: 14}}>Es muy fácil aceptar un sacrificio…</Cap>
          <Cap desde={T.otro} hasta={T.titulo - 0.2} style={{fontSize: 62, fontWeight: 900, lineHeight: 1.15}}>
            cuando el que lo paga <span style={{color: '#1c93b8'}}>es otro.</span>
          </Cap>
          <Cap desde={T.vos} hasta={T.titulo - 0.2} golpe style={{fontSize: 70, fontWeight: 900, marginTop: 8, color: ROSA}}>Aunque ese otro seas vos.</Cap>
        </Capa>
      </div>

      {/* ============ CIERRE: el nombre de la serie ============ */}
      <AbsoluteFill style={{background: '#0d0b24', opacity: kTitulo * 0.9}} />
      {t >= T.titulo && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', color: 'white'}}>
          <Cap desde={T.titulo} hasta={T.dur + 1} style={{fontSize: 54, fontWeight: 700, opacity: 0.8}}>Esta es la idea detrás de</Cap>
          <Cap desde={T.titulo + 0.5} hasta={T.dur + 1} golpe style={{fontSize: 150, fontWeight: 900, letterSpacing: 4, lineHeight: 1.15}}>
            <span style={{color: ROSA}}>SEVE</span>
            <span style={{color: CELESTE}}>RANCE</span>
          </Cap>
          <Cap desde={T.titulo + 1.0} hasta={T.dur + 1} style={{fontSize: 40, fontWeight: 700, opacity: 0.6, letterSpacing: 6}}>LA SERIE</Cap>
          <div style={{marginTop: 150}}>
            <Cap desde={T.pregunta} hasta={T.dur + 1} golpe style={{fontSize: 110, fontWeight: 900, letterSpacing: -3}}>¿Firmarías?</Cap>
          </div>
          <div style={{display: 'flex', justifyContent: 'center', gap: 40, marginTop: 30}}>
            {[{x: 'SÍ', c: VERDE, d: 0.5}, {x: 'NO', c: ROJO, d: 0.75}].map((b) => (
              <Cap key={b.x} desde={T.pregunta + b.d} hasta={T.dur + 1} golpe style={{fontSize: 100, fontWeight: 900, color: 'white', background: b.c, width: 300, borderRadius: 36, border: '7px solid white', lineHeight: 1.5, transform: `rotate(${b.x === 'SÍ' ? -3 : 3}deg) scale(${1 + 0.04 * Math.sin(t * 5 + b.d * 9)})`}}>{b.x}</Cap>
            ))}
          </div>
          <div style={{marginTop: 46}}>
            <Cap desde={T.pregunta + 1.2} hasta={T.dur + 1} style={{fontSize: 46, fontWeight: 800}}>Comentá SÍ o NO 👇</Cap>
          </div>
        </div>
      )}

      {/* parpadeo */}
      {parpadeo > 0 && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 960 * parpadeo, background: '#07061a'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 960 * parpadeo, background: '#07061a'}} />
        </>
      )}

      <Audio src={staticFile('contrato-mezcla.wav')} />
    </AbsoluteFill>
  );
};
