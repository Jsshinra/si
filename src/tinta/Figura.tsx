import React from 'react';
import {useCurrentFrame} from 'remotion';
import {TINTA} from './Estilo';

/*
 * Persona dibujada en tinta con manchas de acuarela.
 * Proporciones de adulto (cabeza ~1/7 de la altura). x, y = pies en la escena.
 */

export type PoseFigura = 'parado' | 'sentado' | 'come' | 'agarra' | 'abraza';
export type Cara = 'neutral' | 'miedo' | 'hambre' | 'come' | 'calor' | 'cerrados';

const PIEL = '#d8ad86';
const PELOS = ['#3b2c22', '#1f1a17', '#6b4a2e', '#8a8076'];
const ROPAS = ['#9c9384', '#8a8f86', '#a39a86', '#857c70'];

type Props = {
  x: number;
  y: number;
  pose?: PoseFigura;
  cara?: Cara;
  sentido?: number;
  escala?: number;
  variante?: number;
  bufanda?: boolean;
  gorro?: string;
  /** 0..1 cuán flaco/hambriento */
  hambre?: number;
  tiembla?: boolean;
};

export const Figura: React.FC<Props> = ({x, y, pose = 'parado', cara = 'neutral', sentido = 1, escala = 1, variante = 0, bufanda = false, gorro, hambre = 0, tiembla = false}) => {
  const frame = useCurrentFrame();
  const f2 = frame - (frame % 2);
  const s = sentido >= 0 ? 1 : -1;
  const pelo = PELOS[variante % PELOS.length];
  const ropa = ROPAS[variante % ROPAS.length];
  const respira = Math.sin(f2 / 16 + variante) * 2;
  const jx = tiembla ? (((f2 * 7919) % 7) - 3) * 1.2 : 0;
  const sentado = pose === 'sentado' || pose === 'come' || pose === 'abraza';
  const cadera = sentado ? 292 : 250;
  const hombro = (sentado ? 172 : 130) - respira;
  const cabezaY = hombro - 58;
  const ancho = 1 - hambre * 0.22;

  // piernas
  const piernas = sentado
    ? [
        `M${100} ${cadera} L${100 + 70 * s} ${cadera + 6} L${100 + 72 * s} ${400}`,
        `M${120} ${cadera} L${120 + 74 * s} ${cadera + 10} L${120 + 80 * s} ${400}`,
      ]
    : [`M${98} ${cadera} L${94} ${325} L${90} ${400}`, `M${122} ${cadera} L${126} ${325} L${130} ${400}`];

  // brazos: [hombro, codo, mano]
  const hx1 = 110 - 30 * ancho;
  const hx2 = 110 + 30 * ancho;
  let brazoA = `M${hx1} ${hombro + 6} L${hx1 - 10} ${hombro + 70} L${hx1 - 6} ${hombro + 130}`;
  let brazoB = `M${hx2} ${hombro + 6} L${hx2 + 10} ${hombro + 70} L${hx2 + 6} ${hombro + 130}`;
  let manoA = {x: hx1 - 6, y: hombro + 130};
  let manoB = {x: hx2 + 6, y: hombro + 130};
  if (pose === 'come') {
    const mov = Math.sin(f2 / 2.2) * 8;
    brazoB = `M${hx2} ${hombro + 6} L${hx2 + 24 * s} ${hombro + 62} L${110 + 16 * s} ${cabezaY + 34 + mov}`;
    manoB = {x: 110 + 16 * s, y: cabezaY + 34 + mov};
    brazoA = `M${hx1} ${hombro + 6} L${hx1 + 10 * s} ${hombro + 70} L${110 + 50 * s} ${hombro + 96}`;
    manoA = {x: 110 + 50 * s, y: hombro + 96};
  } else if (pose === 'agarra') {
    brazoB = `M${hx2} ${hombro + 6} L${hx2 + 60 * s} ${hombro + 40} L${hx2 + 118 * s} ${hombro + 60}`;
    manoB = {x: hx2 + 118 * s, y: hombro + 60};
  } else if (pose === 'abraza') {
    brazoA = `M${hx1} ${hombro + 6} L${hx1 + 20} ${hombro + 70} L${118} ${hombro + 96}`;
    brazoB = `M${hx2} ${hombro + 6} L${hx2 - 20} ${hombro + 70} L${102} ${hombro + 100}`;
    manoA = {x: 118, y: hombro + 96};
    manoB = {x: 102, y: hombro + 100};
  }

  const ojoY = cabezaY - 2;
  const ojos = [110 + 6 * s - 13, 110 + 6 * s + 13];
  const Ojo = ({ox}: {ox: number}) => {
    if (cara === 'cerrados' || (cara !== 'miedo' && (f2 + variante * 17) % 110 < 4)) return <path d={`M${ox - 6} ${ojoY} q6 4 12 0`} stroke={TINTA} strokeWidth={3.2} fill="none" strokeLinecap="round" />;
    if (cara === 'miedo') return (
      <g>
        <ellipse cx={ox} cy={ojoY} rx={7} ry={8.5} fill="#f6efdd" stroke={TINTA} strokeWidth={2.6} />
        <circle cx={ox} cy={ojoY} r={2.4} fill={TINTA} />
      </g>
    );
    return (
      <g>
        <circle cx={ox + 2 * s} cy={ojoY} r={3.6} fill={TINTA} />
        {(cara === 'hambre' || hambre > 0.4) && <path d={`M${ox - 8} ${ojoY + 7} q8 5 16 0`} stroke={TINTA} strokeWidth={2} fill="none" opacity={0.6} />}
      </g>
    );
  };
  const cejas = cara === 'miedo' || cara === 'calor' ? -6 : cara === 'hambre' ? 3 : 0;
  const boca =
    cara === 'come' || pose === 'come'
      ? <ellipse cx={110 + 9 * s} cy={cabezaY + 24} rx={7} ry={5 + Math.abs(Math.sin(f2 / 2.2)) * 5} fill={TINTA} />
      : cara === 'miedo'
        ? <ellipse cx={110 + 8 * s} cy={cabezaY + 25} rx={6} ry={8} fill={TINTA} />
        : cara === 'hambre' || cara === 'calor'
          ? <path d={`M${100 + 8 * s} ${cabezaY + 27} q10 -6 20 0`} stroke={TINTA} strokeWidth={3} fill="none" strokeLinecap="round" />
          : <path d={`M${101 + 8 * s} ${cabezaY + 24} q9 3 18 0`} stroke={TINTA} strokeWidth={3} fill="none" strokeLinecap="round" />;

  return (
    <div style={{position: 'absolute', left: x - 110 * escala + jx, top: y - 410 * escala, width: 220, height: 420, transform: `scale(${escala})`, transformOrigin: '0 0'}}>
      <svg width={220} height={420} viewBox="0 0 220 420" style={{overflow: 'visible'}}>
        <ellipse cx={110 + (sentado ? 40 * s : 0)} cy={404} rx={sentado ? 90 : 60} ry={9} fill="rgba(43,38,34,0.22)" />
        {/* piernas: mancha + tinta */}
        <g filter="url(#acuarela)">
          {piernas.map((d, k) => (
            <path key={k} d={d} stroke="#6f6658" strokeWidth={26} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>
        {piernas.map((d, k) => (
          <path key={k} d={d} stroke={TINTA} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} transform="translate(-9 0)" />
        ))}
        {piernas.map((d, k) => (
          <path key={`b${k}`} d={d} stroke={TINTA} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} transform="translate(9 0)" />
        ))}
        {/* torso */}
        <g filter="url(#acuarela)">
          <path d={`M${110 - 36 * ancho} ${hombro} Q110 ${hombro - 10} ${110 + 36 * ancho} ${hombro} L${110 + 30 * ancho} ${cadera} L${110 - 30 * ancho} ${cadera} Z`} fill={ropa} />
        </g>
        <path d={`M${110 - 36 * ancho} ${hombro} Q110 ${hombro - 10} ${110 + 36 * ancho} ${hombro} L${110 + 30 * ancho} ${cadera} L${110 - 30 * ancho} ${cadera} Z`} fill="none" stroke={TINTA} strokeWidth={3.6} strokeLinejoin="round" />
        <path d={`M${110 - 24 * ancho} ${cadera - 4} L${110 - 28 * ancho} ${hombro + 30}`} stroke="url(#rayadoFino)" strokeWidth={20} />
        <text x={110} y={hombro + 62} textAnchor="middle" fontFamily="Special Elite" fontSize={15} fill={TINTA} opacity={0.6}>{variante * 37 + 112}</text>
        {/* brazos */}
        <g filter="url(#acuarela)">
          <path d={brazoA} stroke={ropa} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={brazoB} stroke={ropa} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <path d={brazoA} stroke={TINTA} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={brazoB} stroke={TINTA} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {[manoA, manoB].map((m, k) => (
          <circle key={k} cx={m.x} cy={m.y} r={9} fill={PIEL} stroke={TINTA} strokeWidth={3} />
        ))}
        {/* cuello y cabeza */}
        <path d={`M103 ${hombro - 4} L103 ${cabezaY + 30} M117 ${hombro - 4} L117 ${cabezaY + 30}`} stroke={TINTA} strokeWidth={3} />
        <g filter="url(#acuarela)">
          <ellipse cx={110} cy={cabezaY} rx={27 * (1 - hambre * 0.08)} ry={34} fill={PIEL} />
        </g>
        <ellipse cx={110} cy={cabezaY} rx={27 * (1 - hambre * 0.08)} ry={34} fill="none" stroke={TINTA} strokeWidth={3.6} />
        {/* oreja */}
        <path d={`M${110 - 25 * s} ${cabezaY - 6} q${-9 * s} 8 0 18`} stroke={TINTA} strokeWidth={3} fill={PIEL} />
        {/* pelo */}
        {gorro ? (
          <g>
            <path d={`M82 ${cabezaY - 8} Q84 ${cabezaY - 46} 110 ${cabezaY - 46} Q136 ${cabezaY - 46} 138 ${cabezaY - 8} Z`} fill={gorro} stroke={TINTA} strokeWidth={3.4} />
            <path d={`M82 ${cabezaY - 10} H138`} stroke={TINTA} strokeWidth={3} />
          </g>
        ) : (
          <path
            d={`M83 ${cabezaY - 2} C78 ${cabezaY - 40} 106 ${cabezaY - 52} 126 ${cabezaY - 40} C140 ${cabezaY - 32} 140 ${cabezaY - 14} 137 ${cabezaY - 4} C130 ${cabezaY - 20} 118 ${cabezaY - 26} 104 ${cabezaY - 22} C96 ${cabezaY - 20} 88 ${cabezaY - 12} 83 ${cabezaY - 2} Z`}
            fill={pelo} stroke={TINTA} strokeWidth={3} transform={s < 0 ? `translate(220 0) scale(-1 1)` : undefined}
          />
        )}
        {/* cara */}
        {ojos.map((ox) => (
          <Ojo key={ox} ox={ox} />
        ))}
        <path d={`M${ojos[0] - 7} ${ojoY - 11 + cejas} l13 ${cara === 'hambre' ? 3 : -1}`} stroke={TINTA} strokeWidth={3.2} strokeLinecap="round" />
        <path d={`M${ojos[1] - 6} ${ojoY - 11 + cejas + (cara === 'hambre' ? 3 : -1)} l13 ${cara === 'hambre' ? -3 : 1}`} stroke={TINTA} strokeWidth={3.2} strokeLinecap="round" />
        <path d={`M${110 + 12 * s} ${cabezaY + 2} l${5 * s} 10 l${-6 * s} 2`} stroke={TINTA} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        {boca}
        {hambre > 0.3 && <path d={`M${92} ${cabezaY + 10} q4 8 0 14 M${128} ${cabezaY + 10} q-4 8 0 14`} stroke={TINTA} strokeWidth={1.8} fill="none" opacity={0.5} />}
        {cara === 'calor' && (
          <g>
            <path d={`M${84} ${cabezaY - 4} q-4 8 0 12 q5 -5 0 -12 z`} fill="#9cc7d6" stroke={TINTA} strokeWidth={2} />
            <path d={`M${136} ${cabezaY + 6} q-4 8 0 12 q5 -5 0 -12 z`} fill="#9cc7d6" stroke={TINTA} strokeWidth={2} />
          </g>
        )}
        {/* bufanda roja: así se reconoce al protagonista */}
        {bufanda && (
          <g>
            <g filter="url(#acuarela)">
              <path d={`M86 ${hombro - 8} Q110 ${hombro + 8} 134 ${hombro - 8} L134 ${hombro + 6} Q110 ${hombro + 22} 86 ${hombro + 6} Z`} fill="#a3271d" />
              <path d={`M${120} ${hombro + 8} l${8 * s} 60 l${12 * s} -2 l${-4 * s} -60 z`} fill="#a3271d" />
            </g>
            <path d={`M86 ${hombro - 8} Q110 ${hombro + 8} 134 ${hombro - 8} L134 ${hombro + 6} Q110 ${hombro + 22} 86 ${hombro + 6} Z`} fill="none" stroke={TINTA} strokeWidth={3} />
          </g>
        )}
      </svg>
    </div>
  );
};
