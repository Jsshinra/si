import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import T from './hoyo-tiempos.json';
import {Figura} from './tinta/Figura';
import {FiltrosTinta, Hervir, MANO, MARCADOR, Nota, Papel, Proyector, Rodear, TarjetaTitulo, TINTA} from './tinta/Estilo';

/*
 * "El hoyo" — explicación de la premisa de la película (Galder Gaztelu-Urrutia, 2019), en estilo "Tinta".
 * TikTok / Reels (1080x1920, 30 fps). Tiempos en src/hoyo-tiempos.json (compartidos con scripts/hoyo_musica.py).
 * Solo la premisa: sin finales ni spoilers.
 *
 * Mundo: un corte de la torre. Cada nivel mide NIVEL_H; el nivel n empieza en Y(n).
 */

export const HOYO_FPS = 30;
export const HOYO_DURACION = Math.round(T.dur * HOYO_FPS);

const NIVEL_H = 900;
const PISO = 820; // altura del piso dentro de cada nivel
const HUECO = [370, 710];
const Y = (n: number) => (n - 1) * NIVEL_H;
const ROJO = '#a3271d';
const OXIDO = '#7a3824';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const suave = Easing.inOut(Easing.cubic);

type Cam = {cx: number; cy: number; z: number};
const C = (n: number, cx: number, oy: number, z: number): Cam => ({cx, cy: Y(n) + oy, z});

const CAMARA: [number, Cam][] = [
  [0, C(48, 300, 560, 1.5)],
  [T.celda - 0.2, C(48, 300, 560, 1.5)],
  [T.celda + 0.8, C(48, 540, 470, 1.0)],
  [T.arriba, C(48, 540, 470, 1.0)],
  [T.arriba + 1.0, C(47, 540, 640, 0.8)],
  [T.abajo, C(47, 540, 640, 0.8)],
  [T.abajo + 1.2, C(49, 540, 300, 0.5)],
  [T.reglas - 0.4, C(50, 540, 200, 0.36)],
  [T.reglas + 0.8, C(48, 540, 470, 1.0)],
  [T.r2, C(48, 540, 470, 1.0)],
  [T.r2 + 0.7, C(48, 300, 560, 1.45)],
  [T.r3, C(48, 300, 560, 1.45)],
  [T.r3 + 0.6, C(48, 330, 460, 1.15)],
  [T.piso6 - 0.001, C(48, 330, 460, 1.15)],
  [T.piso6, C(6, 540, 470, 1.0)],
  [T.piso132 - 0.001, C(6, 540, 470, 1.0)],
  [T.piso132, C(132, 540, 470, 1.0)],
  [T.banquete - 0.001, C(132, 540, 470, 1.0)],
  [T.banquete, C(1, 540, 600, 1.3)],
  [T.necesita, C(1, 540, 600, 1.3)],
  [T.necesita + 0.9, C(5, 540, 300, 0.24)],
  [T.peroNo - 0.001, C(5, 540, 300, 0.24)],
  [T.peroNo, C(2, 540, 600, 1.3)],
  [T.bajas - 0.001, C(2, 540, 600, 1.3)],
  [T.vacios, C(150, 540, 600, 1.25)],
  [T.loco, C(150, 540, 600, 1.25)],
  [T.loco + 0.6, C(150, 790, 560, 1.45)],
  [T.haceLoMismo - 0.001, C(150, 790, 560, 1.45)],
  [T.haceLoMismo, C(2, 720, 600, 1.3)],
  [T.leccion, C(2, 720, 600, 1.3)],
  [T.leccion + 1.6, C(7, 540, 0, 0.13)],
  [T.dur, C(7, 540, 0, 0.12)],
];

const camara = (t: number): Cam => {
  // la caída: la cámara sigue a la plataforma
  if (t >= T.bajas && t < T.vacios) {
    const L = nivelPlataforma(t);
    return {cx: 540, cy: Y(L) + PISO - 260, z: interpolate(t, [T.bajas, T.bajas + 0.6, T.vacios - 0.6, T.vacios], [1.3, 0.9, 0.9, 1.25])};
  }
  for (let i = 0; i < CAMARA.length - 1; i++) {
    const [t0, a] = CAMARA[i];
    const [t1, b] = CAMARA[i + 1];
    if (t >= t0 && t < t1) {
      const k = suave(clamp01((t - t0) / (t1 - t0)));
      return {cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, z: a.z + (b.z - a.z) * k};
    }
  }
  return CAMARA[CAMARA.length - 1][1];
};

/** en qué nivel está la plataforma (fraccional) en cada momento; -10 = no se ve */
const nivelPlataforma = (t: number) => {
  if (t >= T.r1 && t < T.r2) {
    if (t < T.llega) return interpolate(suave((t - T.r1) / (T.llega - T.r1)), [0, 1], [45, 48]);
    if (t < T.sigue) return 48;
    return 48 + (t - T.sigue) * 2.4;
  }
  if (t >= T.banquete && t < T.necesita + 0.5) return 1;
  if (t >= T.necesita + 0.5 && t < T.peroNo) return interpolate(t, [T.necesita + 0.5, T.peroNo - 0.6], [1, 9], {extrapolateRight: 'clamp'});
  if (t >= T.peroNo && t < T.bajas) return 2;
  if (t >= T.bajas && t < T.vacios) return interpolate(suave((t - T.bajas) / (T.vacios - T.bajas)), [0, 1], [2, 150]);
  if (t >= T.vacios && t < T.loco + 0.2) return 150;
  if (t >= T.haceLoMismo && t < T.titulo) return 2;
  return -10;
};

/** cuánta comida queda (0..1) */
const restante = (t: number, L: number) => {
  if (t >= T.necesita + 0.5 && t < T.peroNo) return 1 - (L - 1) * 0.07;
  if (t >= T.banquete && t < T.necesita + 0.5) return 1;
  if (t >= T.haceLoMismo) return 0.75 - clamp01((t - T.haceLoMismo) / 3) * 0.3;
  if (t >= T.peroNo && t < T.bajas) return 0.95 - clamp01((t - T.peroNo) / 6) * 0.3;
  return clamp01(1 - (L - 1) / 60);
};

// ---------- dibujos ----------

const Comida: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => {
  const N = 9;
  const hay = Math.round(r * N);
  const items = [
    {dx: 30, w: 70, tipo: 'torta'},
    {dx: 112, w: 84, tipo: 'pollo'},
    {dx: 208, w: 60, tipo: 'vino'},
    {dx: 254, w: 56, tipo: 'uvas'},
    {dx: 64, w: 60, tipo: 'fruta'},
    {dx: 150, w: 66, tipo: 'flan'},
    {dx: 226, w: 70, tipo: 'pan'},
    {dx: 12, w: 50, tipo: 'queso'},
    {dx: 270, w: 40, tipo: 'copa'},
  ];
  return (
    <g>
      {items.map((it, i) => {
        const ix = x + it.dx;
        const fila = i >= 4 ? 0 : -1;
        const iy = y + fila * 18;
        const plato = <ellipse cx={ix + it.w / 2} cy={iy - 4} rx={it.w / 2 + 6} ry={9} fill="#efe7d4" stroke={TINTA} strokeWidth={3} />;
        if (i >= hay) {
          return (
            <g key={i} opacity={fila ? 0.9 : 1}>
              {plato}
              {(it.tipo === 'pollo' || it.tipo === 'pan') && r < 0.35 && <path d={`M${ix + 12} ${iy - 10} l${it.w - 24} -6 m-4 -4 l8 8 m-${it.w - 16} 0 l-6 -6`} stroke={TINTA} strokeWidth={4} strokeLinecap="round" fill="none" />}
              {r < 0.15 && <circle cx={ix + it.w / 2 + 8} cy={iy - 8} r={2.5} fill={TINTA} opacity={0.6} />}
            </g>
          );
        }
        let dibujo: React.ReactNode = null;
        const cx = ix + it.w / 2;
        if (it.tipo === 'torta') dibujo = (<g><rect x={ix + 6} y={iy - 70} width={it.w - 12} height={62} rx={6} fill="#e7c3c9" stroke={TINTA} strokeWidth={3} /><path d={`M${ix + 6} ${iy - 48} q${(it.w - 12) / 4} 10 ${(it.w - 12) / 2} 0 t${(it.w - 12) / 2} 0`} stroke={TINTA} strokeWidth={3} fill="none" /><circle cx={cx} cy={iy - 78} r={7} fill={ROJO} stroke={TINTA} strokeWidth={2.5} /></g>);
        if (it.tipo === 'pollo') dibujo = (<g><ellipse cx={cx} cy={iy - 26} rx={it.w / 2 - 4} ry={24} fill="#c98a4b" stroke={TINTA} strokeWidth={3} /><path d={`M${ix + 8} ${iy - 34} l-14 -12 M${ix + it.w - 8} ${iy - 34} l14 -12`} stroke={TINTA} strokeWidth={5} strokeLinecap="round" /></g>);
        if (it.tipo === 'vino') dibujo = (<g><rect x={cx - 10} y={iy - 92} width={20} height={88} rx={6} fill="#5a1f2a" stroke={TINTA} strokeWidth={3} /><rect x={cx - 5} y={iy - 112} width={10} height={24} fill="#5a1f2a" stroke={TINTA} strokeWidth={3} /></g>);
        if (it.tipo === 'uvas') dibujo = (<g>{[0, 1, 2, 3, 4, 5].map((k) => <circle key={k} cx={cx - 12 + (k % 3) * 12 + (k > 2 ? 6 : 0)} cy={iy - 34 + (k > 2 ? 14 : 0)} r={8} fill="#6d4a7a" stroke={TINTA} strokeWidth={2.4} />)}</g>);
        if (it.tipo === 'fruta') dibujo = (<g><circle cx={cx - 12} cy={iy - 22} r={15} fill={ROJO} stroke={TINTA} strokeWidth={3} /><circle cx={cx + 12} cy={iy - 22} r={15} fill="#c99a3b" stroke={TINTA} strokeWidth={3} /></g>);
        if (it.tipo === 'flan') dibujo = (<path d={`M${ix + 10} ${iy - 6} L${ix + 18} ${iy - 46} L${ix + it.w - 18} ${iy - 46} L${ix + it.w - 10} ${iy - 6} Z`} fill="#e3b45a" stroke={TINTA} strokeWidth={3} />);
        if (it.tipo === 'pan') dibujo = (<g><ellipse cx={cx} cy={iy - 18} rx={it.w / 2 - 4} ry={16} fill="#c9a06a" stroke={TINTA} strokeWidth={3} /><path d={`M${cx - 14} ${iy - 26} l8 10 M${cx} ${iy - 28} l8 10 M${cx + 14} ${iy - 26} l6 8`} stroke={TINTA} strokeWidth={2.5} /></g>);
        if (it.tipo === 'queso') dibujo = (<path d={`M${ix + 6} ${iy - 6} L${ix + it.w - 6} ${iy - 6} L${ix + it.w - 10} ${iy - 34} Z`} fill="#e8c55a" stroke={TINTA} strokeWidth={3} />);
        if (it.tipo === 'copa') dibujo = (<path d={`M${cx - 12} ${iy - 60} h24 q0 26 -12 28 v20 h10 h-20 h10 v-20 q-12 -2 -12 -28 z`} fill="#8e2b3a" stroke={TINTA} strokeWidth={3} />);
        return (
          <g key={i}>
            {plato}
            {dibujo}
          </g>
        );
      })}
    </g>
  );
};

const Plataforma: React.FC<{L: number; r: number}> = ({L, r}) => {
  const y = Y(L) + PISO;
  return (
    <g>
      <g filter="url(#acuarela)">
        <rect x={HUECO[0] + 10} y={y} width={HUECO[1] - HUECO[0] - 20} height={54} fill="#a9a194" />
      </g>
      <rect x={HUECO[0] + 10} y={y} width={HUECO[1] - HUECO[0] - 20} height={54} fill="url(#rayado)" opacity={0.6} />
      <rect x={HUECO[0] + 10} y={y} width={HUECO[1] - HUECO[0] - 20} height={54} fill="none" stroke={TINTA} strokeWidth={4} />
      <Comida x={HUECO[0] + 14} y={y} r={r} />
    </g>
  );
};

/** Una celda de la torre */
const Nivel: React.FC<{n: number; children?: React.ReactNode; calor?: number; calendario?: number}> = ({n, children, calor = 0, calendario}) => {
  const fr = useCurrentFrame();
  const y = Y(n);
  const oscuridad = Math.min(0.62, 0.05 + n / 260);
  return (
    <g>
      {/* pared de fondo */}
      <g filter="url(#acuarela)">
        <rect x={0} y={y} width={1080} height={NIVEL_H} fill="#bdb4a3" />
        <rect x={0} y={y} width={1080} height={160} fill="#a99f8d" opacity={0.6} />
      </g>
      <rect x={0} y={y} width={70} height={NIVEL_H} fill="url(#rayado)" />
      <rect x={1010} y={y} width={70} height={NIVEL_H} fill="url(#rayado)" />
      <path d={`M70 ${y} V${y + PISO} M1010 ${y} V${y + PISO}`} stroke={TINTA} strokeWidth={3.5} />
      {/* grietas y manchas */}
      <path d={`M${180 + (n % 5) * 60} ${y + 120} l20 40 l-12 30 l18 36`} stroke={TINTA} strokeWidth={2} fill="none" opacity={0.45} />
      <path d={`M${820 - (n % 3) * 40} ${y + 420} l-14 26 l10 22`} stroke={TINTA} strokeWidth={2} fill="none" opacity={0.4} />
      {/* número pintado */}
      <text x={540} y={y + 330} textAnchor="middle" fontFamily="Permanent Marker" fontSize={230} fill={OXIDO} opacity={0.62}>{n}</text>
      {/* calendario */}
      {calendario !== undefined && (
        <g>
          <rect x={98} y={y + 300} width={130} height={150} fill="#efe6d0" stroke={TINTA} strokeWidth={3.5} />
          <rect x={98} y={y + 300} width={130} height={34} fill={ROJO} opacity={0.75} />
          <circle cx={130} cy={y + 300} r={6} fill="none" stroke={TINTA} strokeWidth={3} />
          <circle cx={196} cy={y + 300} r={6} fill="none" stroke={TINTA} strokeWidth={3} />
          <text x={163} y={y + 424} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={84} fill={TINTA}>1</text>
          {calendario < 1 && (
            <g transform={`translate(${calendario * 260} ${calendario * -180}) rotate(${calendario * 120} 163 ${y + 380})`} opacity={1 - calendario}>
              <rect x={98} y={y + 300} width={130} height={150} fill="#f3ead6" stroke={TINTA} strokeWidth={3.5} />
              <rect x={98} y={y + 300} width={130} height={34} fill={ROJO} opacity={0.75} />
              <text x={163} y={y + 424} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={84} fill={TINTA}>30</text>
            </g>
          )}
        </g>
      )}
      {/* camas */}
      {[60, 750].map((bx) => (
        <g key={bx}>
          <g filter="url(#acuarela)">
            <rect x={bx} y={y + 712} width={270} height={108} fill="#8f8677" />
            <rect x={bx + 6} y={y + 700} width={258} height={26} fill="#d9d0bd" />
          </g>
          <rect x={bx} y={y + 712} width={270} height={108} fill="url(#rayadoFino)" />
          <rect x={bx} y={y + 712} width={270} height={108} fill="none" stroke={TINTA} strokeWidth={3.5} />
          <rect x={bx + 6} y={y + 700} width={258} height={26} rx={10} fill="none" stroke={TINTA} strokeWidth={3} />
        </g>
      ))}
      {/* calor */}
      {calor > 0 && (
        <g>
          <rect x={70} y={y} width={940} height={PISO} fill={ROJO} opacity={calor * 0.4} style={{mixBlendMode: 'multiply'}} />
          {[0, 1, 2, 3, 4].map((k) => {
            const u = ((fr - (fr % 2)) / 40 + k * 0.2) % 1;
            return <path key={k} d={`M${180 + k * 170} ${y + 680 - u * 40} q20 -40 0 -80 t0 -80 t0 -80`} stroke={ROJO} strokeWidth={5} fill="none" opacity={calor * 0.8} strokeLinecap="round" />;
          })}
          <g>
            <rect x={930} y={y + 260} width={34} height={240} rx={17} fill="#efe6d0" stroke={TINTA} strokeWidth={3.5} />
            <rect x={940} y={y + 260 + 230 * (1 - (0.2 + calor * 0.78))} width={14} height={230 * (0.2 + calor * 0.78)} rx={7} fill={ROJO} />
            <circle cx={947} cy={y + 512} r={26} fill={ROJO} stroke={TINTA} strokeWidth={3.5} />
          </g>
        </g>
      )}
      {children}
      {/* sombra general según la profundidad */}
      <rect x={0} y={y} width={1080} height={NIVEL_H} fill="#1d150e" opacity={oscuridad} style={{mixBlendMode: 'multiply'}} />
      {/* losa con el hueco */}
      <g filter="url(#acuarela)">
        <rect x={0} y={y + PISO} width={HUECO[0]} height={NIVEL_H - PISO} fill="#8c8474" />
        <rect x={HUECO[1]} y={y + PISO} width={1080 - HUECO[1]} height={NIVEL_H - PISO} fill="#8c8474" />
      </g>
      <rect x={0} y={y + PISO} width={HUECO[0]} height={NIVEL_H - PISO} fill="url(#rayado)" />
      <rect x={HUECO[1]} y={y + PISO} width={1080 - HUECO[1]} height={NIVEL_H - PISO} fill="url(#rayado)" />
      <path d={`M0 ${y + PISO} H${HUECO[0]} V${y + NIVEL_H} M${HUECO[1]} ${y + NIVEL_H} V${y + PISO} H1080`} stroke={TINTA} strokeWidth={4} fill="none" />
    </g>
  );
};

/** Escala de grises de los vecinos según la profundidad */
const vecinos = (n: number, plat: number, t: number) => {
  const hambre = clamp01((n - 40) / 110);
  const cerca = Math.abs(plat - n) < 0.35;
  const pose = cerca ? (n < 60 ? 'come' : 'agarra') : 'sentado';
  return [
    {x: 190, s: 1, v: n % 4, gorro: n % 7 === 3 ? '#5f7a3a' : undefined},
    {x: 890, s: -1, v: (n + 2) % 4, gorro: n % 5 === 1 ? '#6b5a8a' : undefined},
  ].map((f) => ({...f, pose: pose as 'sentado' | 'come' | 'agarra', hambre, cara: (cerca ? (n < 60 ? 'come' : 'hambre') : hambre > 0.5 ? 'hambre' : 'neutral') as 'come' | 'hambre' | 'neutral', t}));
};

export const Hoyo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f2 = frame - (frame % 2);
  const t = frame / fps;
  const t2 = f2 / fps;
  const cam = camara(t2);
  const L = nivelPlataforma(t2);
  const r = restante(t2, L);
  const cayendo = t >= T.bajas + 0.5 && t < T.vacios - 0.5;

  // niveles visibles
  const arriba = cam.cy - 960 / cam.z;
  const abajo = cam.cy + 960 / cam.z;
  const n0 = Math.max(1, Math.floor(arriba / NIVEL_H) + 1);
  const n1 = Math.max(1, Math.floor(abajo / NIVEL_H) + 1);
  const niveles: number[] = [];
  for (let n = n0; n <= n1; n++) niveles.push(n);

  // calor (regla 2)
  const calor = t >= T.calor && t < T.r3 ? interpolate(t, [T.calor, T.calor + 1.2, T.tira, T.tira + 0.8], [0, 1, 1, 0], {extrapolateRight: 'clamp'}) : 0;
  const calendario = t < T.arranca ? 0 : clamp01((t2 - T.arranca) / 0.6);
  // manzana
  const manzana = (() => {
    if (t < T.r2 || t > T.tira + 1.2) return null;
    if (t < T.guarda) return {x: 268, y: Y(48) + 560, o: 1};
    if (t < T.tira) return {x: 230, y: Y(48) + 640, o: 0.35};
    const k = clamp01((t2 - T.tira) / 1.1);
    return {x: 230 + k * 300, y: Y(48) + 640 - 120 * Math.sin(k * Math.PI) + k * k * 520, o: 1};
  })();

  // protagonista
  const nivelProta = t < T.piso6 ? 48 : t < T.piso132 ? 6 : t < T.banquete ? 132 : -1;
  const caraProta = t < T.gancho + 1.2 ? 'cerrados' : t < T.celda + 0.4 ? 'miedo' : calor > 0.3 ? 'calor' : t >= T.piso132 ? 'hambre' : t >= T.piso6 ? 'neutral' : L === 48 && t > T.llega ? 'come' : 'neutral';
  const poseProta = t >= T.llega && t < T.sigue ? 'agarra' : t >= T.piso6 && t < T.piso132 ? 'come' : 'sentado';
  // el del gorro verde (escena "lo más loco")
  const nivelGorro = t >= T.loco && t < T.haceLoMismo ? 150 : t >= T.haceLoMismo && t < T.leccion + 1.6 ? 2 : -1;

  const figurasNivel = (n: number) => {
    const lista = vecinos(n, L, t).map((f, k) => ({...f, bufanda: false, k}));
    if (n === nivelProta) {
      lista[0] = {...lista[0], pose: poseProta as 'sentado', cara: caraProta as 'neutral', hambre: n === 132 ? 0.85 : 0, bufanda: true, gorro: undefined, v: 0};
    }
    if (n === nivelGorro) {
      lista[1] = {...lista[1], gorro: '#5f7a3a', v: 1, hambre: n === 150 ? 0.9 : 0.1, pose: n === 2 ? 'come' : 'sentado', cara: n === 2 ? 'come' : 'hambre'};
    }
    return lista;
  };

  const mundo = `translate(${540 - cam.cx * cam.z}px, ${960 - cam.cy * cam.z}px) scale(${cam.z})`;
  const temblorCaida = cayendo ? (random(`c${f2}`) - 0.5) * 10 : 0;
  // nivel que marca el cartel durante la caída
  const cartelNivel = Math.round(L);

  return (
    <AbsoluteFill style={{background: '#d9ccb0'}}>
      <FiltrosTinta />
      <Papel />
      <Hervir>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translateX(${temblorCaida}px) ${mundo}`}}>
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {/* paredes exteriores de la torre */}
            <rect x={-60} y={Y(n0)} width={60} height={(n1 - n0 + 1) * NIVEL_H} fill="#5e564a" />
            <rect x={1080} y={Y(n0)} width={60} height={(n1 - n0 + 1) * NIVEL_H} fill="#5e564a" />
            {n0 === 1 && <rect x={-60} y={-90} width={1200} height={90} fill="#5e564a" stroke={TINTA} strokeWidth={5} />}
            <g filter={cayendo ? 'url(#caida)' : undefined}>
              {niveles.map((n) => (
                <Nivel key={n} n={n} calor={n === 48 ? calor : 0} calendario={n === 48 && t >= T.r3 - 0.5 && t < T.piso6 ? calendario : undefined} />
              ))}
            </g>
            {L > -5 && <Plataforma L={L} r={r} />}
            {/* tildes del diagrama "alcanzaría para todos" */}
            {t >= T.necesita + 0.5 && t < T.peroNo &&
              [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
                L >= n + 0.4 ? (
                  <path key={n} d={`M${HUECO[1] + 90} ${Y(n) + 520} l40 50 l90 -130`} stroke="#2f7a4a" strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ) : null,
              )}
            {/* manzana */}
            {manzana && (
              <g opacity={manzana.o}>
                <circle cx={manzana.x} cy={manzana.y} r={22} fill={ROJO} stroke={TINTA} strokeWidth={3.5} />
                <path d={`M${manzana.x} ${manzana.y - 22} l4 -14`} stroke={TINTA} strokeWidth={3.5} />
              </g>
            )}
          </svg>
          {/* personas */}
          {!cayendo &&
            niveles.map((n) =>
              figurasNivel(n).map((f) => (
                <Figura
                  key={`${n}-${f.k}`} x={f.x} y={Y(n) + PISO} pose={f.pose} cara={f.cara} sentido={f.s} variante={f.v}
                  gorro={f.gorro} hambre={f.hambre} bufanda={f.bufanda} tiembla={f.bufanda && calor > 0.4}
                />
              )),
            )}
          {/* círculo alrededor del hueco */}
          <div style={{position: 'absolute', left: 0, top: Y(48)}}>
            <Rodear desde={T.celda + 1.2} x={HUECO[0] - 40} y={PISO - 60} w={HUECO[1] - HUECO[0] + 80} h={150} />
          </div>
        </div>
      </Hervir>

      {/* cartel de nivel durante la caída */}
      {t >= T.bajas + 0.3 && t < T.vacios + 1.5 && (
        <div style={{position: 'absolute', right: 40, top: 1180, transform: 'rotate(4deg)', background: '#f3ead6', padding: '6px 26px 10px', boxShadow: '3px 6px 0 rgba(43,38,34,0.25)', fontFamily: MANO, fontWeight: 700, color: TINTA, textAlign: 'center'}}>
          <div style={{fontSize: 40, opacity: 0.7}}>nivel</div>
          <div style={{fontFamily: MARCADOR, fontSize: 96, lineHeight: 1, color: cartelNivel > 60 ? '#a3271d' : TINTA}}>{cartelNivel}</div>
        </div>
      )}

      {/* oscuridad para el cierre */}
      <AbsoluteFill style={{background: '#1d150e', opacity: interpolate(t, [T.titulo - 0.6, T.titulo + 0.4], [0, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />

      {/* ============ NOTAS (zona segura de TikTok) ============ */}
      <div style={{position: 'absolute', top: 230, left: 40, right: 40, height: 380, textAlign: 'center'}}>
        {[
          {d: T.gancho + 0.4, h: T.celda - 0.1, txt: 'Imaginate que te despertás acá.', g: -1.5},
          {d: T.celda, h: T.arriba - 0.1, txt: 'Una celda con un agujero en el piso.', g: 1.2},
          {d: T.arriba, h: T.abajo - 0.1, txt: 'Arriba, otra celda igual…', g: -1},
          {d: T.abajo, h: T.reglas - 0.1, txt: '…y abajo, otra. Y otra. Y otra.', g: 1.4},
          {d: T.reglas, h: T.r1 - 0.1, txt: 'Hay 3 reglas.', g: -2, tam: 96},
          {d: T.r1, h: T.r2 - 0.1, txt: '1. Una vez por día baja la comida. Frena un ratito… y sigue.', g: 1},
          {d: T.r2, h: T.r3 - 0.1, txt: '2. Comé lo que quieras. Pero no podés guardar nada.', g: -1.2},
          {d: T.r3, h: T.banquete - 0.1, txt: '3. Cada mes te despertás en otro piso. Al azar.', g: 1.3},
          {d: T.banquete, h: T.necesita - 0.1, txt: 'Arriba llega intacta. Un banquete.', g: -1},
          {d: T.necesita, h: T.peroNo - 0.1, txt: 'Si cada uno comiera solo lo que necesita… alcanzaría para todos.', g: 1.1},
          {d: T.peroNo, h: T.ultima - 0.05, txt: 'Pero no pasa.', g: -2, tam: 96},
          {d: T.ultima, h: T.bajas - 0.1, txt: 'Comen como si fuera la última vez. El mes que viene pueden estar abajo.', g: 1},
          {d: T.bajas, h: T.vacios - 0.1, txt: 'Cuanto más bajás… menos queda.', g: -1.3},
          {d: T.vacios, h: T.loco - 0.1, txt: 'Hasta que llegan platos vacíos.', g: 1.2},
          {d: T.loco, h: T.haceLoMismo - 0.1, txt: 'Lo más loco: el que pasó un mes muerto de hambre…', g: -1},
          {d: T.haceLoMismo, h: T.leccion - 0.1, txt: '…cuando le toca arriba, hace lo mismo.', g: 1.4},
          {d: T.leccion, h: T.frase1 - 0.05, txt: '¿La lección?', g: -2, tam: 96},
          {d: T.frase1, h: T.titulo - 0.3, txt: 'El problema no es que no alcance.', g: 1},
        ].map((n) => (
          <div key={n.d} style={{position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'center'}}>
            <Nota desde={n.d} hasta={n.h} giro={n.g} tamano={n.tam ?? 70} style={{maxWidth: 940}}>
              {n.txt}
            </Nota>
          </div>
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center'}}>
          <Nota desde={T.frase2} hasta={T.titulo - 0.3} giro={-1.4} tamano={64} tono="#f6e7c4" style={{maxWidth: 900}}>
            Es que nadie confía en que al otro le va a alcanzar.
          </Nota>
        </div>
      </div>

      {/* ============ CIERRE ============ */}
      <TarjetaTitulo desde={T.titulo} antetitulo="Esto es…" titulo="EL HOYO" anio="2019" detalle="Película española" sello="NIVEL 48" />
      {t >= T.pregunta && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 1110, textAlign: 'center'}}>
          <Nota desde={T.pregunta} hasta={T.dur + 1} giro={1.2} tamano={62} style={{maxWidth: 920}}>
            Si te tocara el piso 1… ¿comerías solo lo tuyo?
          </Nota>
          <div style={{display: 'flex', justifyContent: 'center', gap: 70, marginTop: 34}}>
            {['SÍ', 'NO'].map((x, k) => {
              const p = spring({frame: f2 - Math.round((T.pregunta + 1.2 + k * 0.25) * fps), fps, config: {damping: 10}});
              return (
                <div key={x} style={{display: 'flex', alignItems: 'center', gap: 18, transform: `scale(${p}) rotate(${k ? 3 : -3}deg)`, fontFamily: MANO, fontWeight: 700, fontSize: 88, color: '#f3ead6'}}>
                  <div style={{width: 70, height: 70, border: '6px solid #f3ead6', borderRadius: 8}} />
                  {x}
                </div>
              );
            })}
          </div>
          {t >= T.comenta && (
            <div style={{marginTop: 26, fontFamily: MANO, fontWeight: 700, fontSize: 56, color: '#f3ead6', opacity: clamp01((t - T.comenta) * 3)}}>Comentá abajo 👇</div>
          )}
        </div>
      )}

      <Proyector />
      <Audio src={staticFile('hoyo-mezcla.wav')} />
    </AbsoluteFill>
  );
};
