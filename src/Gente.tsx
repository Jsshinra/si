import React from 'react';
import {random, useCurrentFrame} from 'remotion';

/*
 * Persona ilustrada en SVG (estilo plano), reutilizable en los videos de dilemas.
 * La misma cara y el mismo pelo con dos vestuarios: 'afuera' (buzo y jeans) y 'adentro' (camisa, corbata y credencial).
 * x, y = posición de los pies en la escena.
 */

const TINTA = '#1f1b4b';
const PIEL = '#f2c29b';
const PIEL_SOMBRA = '#e0a67c';
const PELO = '#3a2416';

export type Ropa = 'afuera' | 'adentro';
export type Pose = 'normal' | 'festeja' | 'teclea' | 'sostiene';

const ROPAS = {
  afuera: {torso: '#ff4f8b', torsoOscuro: '#e0356f', pantalon: '#4a5aa8', zapato: '#ffffff'},
  adentro: {torso: '#e6f5fb', torsoOscuro: '#bfe0ec', pantalon: '#2a2660', zapato: '#15132e'},
};

const rad = (g: number) => (g * Math.PI) / 180;

export const Persona: React.FC<{
  x: number;
  y: number;
  ropa: Ropa;
  /** hacia dónde mira: 1 derecha, -1 izquierda */
  sentido?: number;
  /** -1 triste … 1 feliz */
  animo?: number;
  camina?: boolean;
  pose?: Pose;
  escala?: number;
  tiembla?: boolean;
}> = ({x, y, ropa, sentido = 1, animo = 0, camina = false, pose = 'normal', escala = 1, tiembla = false}) => {
  const frame = useCurrentFrame();
  const r = ROPAS[ropa];
  const fase = frame * 0.42;
  const sw = camina ? Math.sin(fase) : 0;
  const bob = camina ? Math.abs(Math.sin(fase)) * 6 : Math.sin(frame / 14 + x) * 1.5;
  const parpado = (frame + Math.round(x)) % 96 < 4;
  const tx = tiembla ? (random(`tp${frame}`) - 0.5) * 5 : 0;
  const s = sentido >= 0 ? 1 : -1;

  // piernas
  const cadera = 208 - bob;
  const pierna = (hx: number, ang: number) => {
    const fx = hx + Math.sin(rad(ang)) * 96 * s;
    const fy = cadera + Math.cos(rad(ang)) * 96;
    return {hx, fx, fy};
  };
  const p1 = pierna(88, sw * 24);
  const p2 = pierna(112, -sw * 24);

  // brazos: ángulo desde la vertical hacia abajo
  const hombroY = 130 - bob;
  const brazo = (hx: number, ang: number, dir: number) => ({hx, mx: hx + Math.sin(rad(ang)) * 80 * dir, my: hombroY + Math.cos(rad(ang)) * 80});
  let b1 = brazo(70, 8 - sw * 28, -1);
  let b2 = brazo(130, 8 + sw * 28, 1);
  if (pose === 'festeja') {
    b1 = brazo(70, 150 + Math.sin(frame / 3) * 10, -1);
    b2 = brazo(130, 150 - Math.sin(frame / 3) * 10, 1);
  } else if (pose === 'teclea') {
    b1 = brazo(s > 0 ? 126 : 74, 68 + (frame % 6 < 3 ? 5 : 0), s);
    b2 = brazo(s > 0 ? 130 : 70, 78 + (frame % 6 < 3 ? 0 : 5), s);
  } else if (pose === 'sostiene') {
    if (s > 0) b2 = brazo(130, 72, 1);
    else b1 = brazo(70, 72, -1);
  }
  const Brazo: React.FC<{b: {hx: number; mx: number; my: number}}> = ({b}) => (
    <g>
      <line x1={b.hx} y1={hombroY} x2={b.mx} y2={b.my} stroke={TINTA} strokeWidth={26} strokeLinecap="round" />
      <line x1={b.hx} y1={hombroY} x2={b.mx} y2={b.my} stroke={r.torso} strokeWidth={19} strokeLinecap="round" />
      <circle cx={b.mx} cy={b.my} r={12} fill={PIEL} stroke={TINTA} strokeWidth={3.5} />
    </g>
  );
  const Pierna: React.FC<{p: {hx: number; fx: number; fy: number}}> = ({p}) => (
    <g>
      <line x1={p.hx} y1={cadera} x2={p.fx} y2={p.fy} stroke={TINTA} strokeWidth={30} strokeLinecap="round" />
      <line x1={p.hx} y1={cadera} x2={p.fx} y2={p.fy} stroke={r.pantalon} strokeWidth={23} strokeLinecap="round" />
      <ellipse cx={p.fx + 9 * s} cy={p.fy + 8} rx={21} ry={11} fill={r.zapato} stroke={TINTA} strokeWidth={4} />
    </g>
  );

  const cy = 70 - bob; // centro de la cabeza
  const cara = s * 7;
  const feliz = Math.max(0, animo);
  const triste = Math.max(0, -animo);

  return (
    <div style={{position: 'absolute', left: x - 100 + tx, top: y - 310, width: 200, height: 330, transform: `scale(${escala})`, transformOrigin: '100px 310px'}}>
      <svg width={200} height={330} viewBox="0 0 200 330" style={{overflow: 'visible'}}>
        <ellipse cx={100} cy={313} rx={62} ry={10} fill="rgba(31,27,75,0.18)" />
        {/* brazo de atrás */}
        <Brazo b={s > 0 ? b1 : b2} />
        <Pierna p={p1} />
        <Pierna p={p2} />
        {/* torso */}
        {ropa === 'afuera' && <ellipse cx={100} cy={118 - bob} rx={38} ry={16} fill={r.torsoOscuro} stroke={TINTA} strokeWidth={4} />}
        <rect x={64} y={110 - bob} width={72} height={108} rx={26} fill={r.torso} stroke={TINTA} strokeWidth={5} />
        {ropa === 'afuera' ? (
          <g>
            <path d={`M78 ${182 - bob} h44 v20 q0 8 -8 8 h-28 q-8 0 -8 -8 z`} fill={r.torsoOscuro} />
            <line x1={92} y1={122 - bob} x2={90} y2={152 - bob} stroke="white" strokeWidth={4} strokeLinecap="round" />
            <line x1={108} y1={122 - bob} x2={110} y2={152 - bob} stroke="white" strokeWidth={4} strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d={`M100 ${118 - bob} l-9 12 l9 52 l9 -52 z`} fill="#1c93b8" stroke={TINTA} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M82 ${112 - bob} l18 10 l-12 12 z`} fill="white" stroke={TINTA} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M118 ${112 - bob} l-18 10 l12 12 z`} fill="white" stroke={TINTA} strokeWidth={3} strokeLinejoin="round" />
            <line x1={120} y1={124 - bob} x2={122} y2={160 - bob} stroke="#3fb6d9" strokeWidth={3} />
            <rect x={111} y={160 - bob} width={22} height={28} rx={4} fill="white" stroke={TINTA} strokeWidth={3} />
            <circle cx={122} cy={170 - bob} r={5} fill={PIEL_SOMBRA} />
            <rect x={115} y={179 - bob} width={14} height={4} rx={2} fill="#bcb7e0" />
            <rect x={66} y={200 - bob} width={68} height={10} fill={TINTA} />
          </g>
        )}
        {/* cuello y cabeza */}
        <rect x={90} y={100 - bob} width={20} height={18} fill={PIEL_SOMBRA} />
        <g transform={`translate(100 ${cy})`}>
          <circle cx={-40 * s} cy={6} r={9} fill={PIEL} stroke={TINTA} strokeWidth={3.5} />
          <circle r={41} fill={PIEL} stroke={TINTA} strokeWidth={5} />
          {/* pelo */}
          <path d="M-43 4 C-50 -46 -14 -54 4 -50 C36 -54 50 -22 43 6 C36 -12 22 -22 4 -19 C-14 -22 -32 -14 -43 4 Z" fill={PELO} stroke={TINTA} strokeWidth={4} strokeLinejoin="round" transform={`scale(${s} 1)`} />
          <path d="M-6 -50 q10 -16 24 -6" fill="none" stroke={PELO} strokeWidth={8} strokeLinecap="round" transform={`scale(${s} 1)`} />
          {/* cara */}
          <g transform={`translate(${cara} 0)`}>
            {[-15, 15].map((ex) => (
              <g key={ex}>
                {parpado ? <line x1={ex - 6} y1={4} x2={ex + 6} y2={4} stroke={TINTA} strokeWidth={4} strokeLinecap="round" /> : <ellipse cx={ex} cy={4 + triste * 2} rx={5} ry={6.5 + (tiembla ? 2 : 0)} fill={TINTA} />}
                {!parpado && <circle cx={ex + 1.5} cy={1.5 + triste * 2} r={1.8} fill="white" />}
                <line x1={ex - 8} y1={-11 + (ex < 0 ? 1 : -1) * triste * 4 * -1 - feliz * 2} x2={ex + 8} y2={-11 + (ex < 0 ? -1 : 1) * triste * 4 * -1 - feliz * 2} stroke={PELO} strokeWidth={4.5} strokeLinecap="round" />
                <circle cx={ex * 1.7} cy={16} r={7} fill="#ff8fa8" opacity={0.35} />
              </g>
            ))}
            <path d={`M-11 22 Q0 ${22 + animo * 13} 11 22`} stroke={TINTA} strokeWidth={4.5} strokeLinecap="round" fill={animo > 0.6 ? '#7a2136' : 'none'} />
          </g>
          {tiembla && <path d={`M${-30 * s} -20 q-6 12 0 18 q6 -6 0 -18 z`} fill="#8fd6f5" stroke={TINTA} strokeWidth={2.5} />}
        </g>
        {/* brazo de adelante */}
        <Brazo b={s > 0 ? b2 : b1} />
      </svg>
    </div>
  );
};
