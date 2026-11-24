import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import T from './tiempo-tiempos.json';
import {Figura} from './tinta/Figura';
import {FiltrosTinta, Hervir, MANO, Nota, Papel, Proyector, TarjetaTitulo, TINTA} from './tinta/Estilo';

/*
 * "El precio del mañana" (In Time, Andrew Niccol, 2011) — la premisa explicada en estilo "Tinta".
 * TikTok / Reels (1080x1920, 30 fps). Tiempos en src/tiempo-tiempos.json (compartidos con scripts/tiempo_musica.py).
 * Solo la premisa: sin finales ni spoilers. Personajes y escenarios propios.
 */

export const TIEMPO_FPS = 30;
export const TIEMPO_DURACION = Math.round(T.dur * TIEMPO_FPS);

const VERDE = '#2f9e5c';
const VERDE_LUZ = '#5fe39a';
const ROJO = '#a3271d';
const PIEL = '#d8ad86';
const MONO = '"JetBrains Mono", monospace';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const suave = Easing.inOut(Easing.cubic);
const entre = (t: number, a: number, b: number) => t >= a && t < b;

/** formatea segundos como "364d 23:59:42" */
const reloj = (seg: number) => {
  const s = Math.max(0, Math.floor(seg));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d}d ${p(h)}:${p(m)}:${p(x)}`;
};

// ---------- el brazo ----------
const Brazo: React.FC<{digitos: string; luz: number; rojo?: boolean; fantasma?: number; y?: number}> = ({digitos, luz, rojo = false, fantasma = 0, y = 0}) => {
  const frame = useCurrentFrame();
  const pulso = 0.85 + 0.15 * Math.sin(frame / 4);
  const color = rojo ? '#e0412f' : VERDE_LUZ;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 1080, height: 1920}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {/* manga */}
        <g filter="url(#acuarela)">
          <path d="M-60 840 L210 860 L230 1290 L-60 1300 Z" fill="#6f7a86" />
        </g>
        <path d="M-60 840 L210 860 L230 1290 L-60 1300" fill="url(#rayado)" />
        <path d="M-60 840 L210 860 L230 1290 L-60 1300" fill="none" stroke={TINTA} strokeWidth={5} strokeLinejoin="round" />
        <path d="M120 870 Q150 1070 140 1285" stroke={TINTA} strokeWidth={3} fill="none" opacity={0.7} />
        {/* antebrazo */}
        <g filter="url(#acuarela)">
          <path d="M200 900 C430 880 640 900 840 940 L1140 930 L1140 1150 L840 1130 C640 1190 430 1250 210 1255 Z" fill={PIEL} />
        </g>
        <path d="M200 900 C430 880 640 900 840 940 L1140 930" fill="none" stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
        <path d="M210 1255 C430 1250 640 1190 840 1130 L1140 1150" fill="none" stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
        {/* sombra de abajo */}
        <path d="M260 1215 C450 1210 640 1160 830 1110 L830 1128 C640 1180 450 1235 260 1240 Z" fill="url(#rayadoFino)" />
        {/* muñeca y venas */}
        <path d="M850 950 q-14 90 4 180 M880 948 q-10 90 6 182" stroke={TINTA} strokeWidth={3} fill="none" opacity={0.55} />
        <path d="M300 1150 C420 1120 560 1110 700 1060" stroke="#6a8bb0" strokeWidth={4} fill="none" opacity={0.45} />
        <path d="M430 1180 C520 1150 600 1140 680 1110" stroke="#6a8bb0" strokeWidth={3} fill="none" opacity={0.35} />
        {/* palma que se va de cuadro */}
        <path d="M960 935 q60 -30 140 -10 M960 1140 q70 30 140 20" stroke={TINTA} strokeWidth={4} fill="none" />
      </svg>
      {/* los dígitos */}
      {luz > 0 && (
        <div
          style={{
            position: 'absolute', left: 250, top: 1000, width: 580, textAlign: 'center', transform: 'rotate(2.5deg)',
            fontFamily: MONO, fontWeight: 800, fontSize: 66, letterSpacing: 1, whiteSpace: 'nowrap', color, opacity: luz * pulso,
            textShadow: `0 0 18px ${color}, 0 0 40px ${color}`, mixBlendMode: 'multiply',
          }}
        >
          {digitos}
        </div>
      )}
      {luz > 0 && (
        <div style={{position: 'absolute', left: 250, top: 1000, width: 580, textAlign: 'center', transform: 'rotate(2.5deg)', fontFamily: MONO, fontWeight: 800, fontSize: 66, letterSpacing: 1, whiteSpace: 'nowrap', color, opacity: luz * 0.55, filter: 'blur(1px)'}}>
          {digitos}
        </div>
      )}
      {/* el reloj que no se ve (la lección) */}
      {fantasma > 0 && (
        <div style={{position: 'absolute', left: 250, top: 996, width: 580, textAlign: 'center', transform: 'rotate(2.5deg)', fontFamily: MONO, fontWeight: 800, fontSize: 66, letterSpacing: 1, whiteSpace: 'nowrap', color: 'transparent', WebkitTextStroke: `2.5px ${TINTA}`, opacity: fantasma * 0.55}}>
          ??d ??:??:??
        </div>
      )}
    </div>
  );
};

// ---------- apretón: el tiempo pasa de un brazo a otro ----------
const Apreton: React.FC<{k: number; t: number}> = ({k, t}) => {
  const izq = Math.round(2 * 3600 + 10 * 60 - k * 2 * 3600);
  const der = Math.round(12 * 60 + k * 2 * 3600);
  const f = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g filter="url(#acuarela)">
          <path d="M-60 900 C200 890 380 920 520 950 L560 1090 C400 1120 200 1140 -60 1150 Z" fill={PIEL} />
          <path d="M1140 980 C880 990 700 1000 560 1010 L520 1150 C700 1170 880 1190 1140 1210 Z" fill="#c99d78" />
        </g>
        <path d="M-60 900 C200 890 380 920 520 950 M560 1090 C400 1120 200 1140 -60 1150" fill="none" stroke={TINTA} strokeWidth={5} />
        <path d="M1140 980 C880 990 700 1000 560 1010 M520 1150 C700 1170 880 1190 1140 1210" fill="none" stroke={TINTA} strokeWidth={5} />
        {/* manos que agarran la muñeca del otro */}
        <ellipse cx={600} cy={1000} rx={90} ry={70} fill={PIEL} stroke={TINTA} strokeWidth={5} />
        <ellipse cx={480} cy={1110} rx={90} ry={70} fill="#c99d78" stroke={TINTA} strokeWidth={5} />
        <path d="M560 960 q30 40 0 80 M590 950 q30 45 0 95 M520 1070 q-30 40 0 80 M490 1060 q-30 45 0 95" stroke={TINTA} strokeWidth={3} fill="none" />
        {/* luz que viaja */}
        {k > 0 && k < 1 &&
          [0, 1, 2, 3, 4].map((j) => {
            const u = (t * 1.6 + j / 5) % 1;
            return <circle key={j} cx={180 + u * 720} cy={1020 + Math.sin(u * Math.PI) * -40} r={14} fill={VERDE_LUZ} opacity={0.85} style={{filter: `drop-shadow(0 0 12px ${VERDE_LUZ})`}} />;
          })}
      </svg>
      {[
        {x: 160, y: 985, v: izq, r: 1},
        {x: 630, y: 1100, v: der, r: 2},
      ].map((b, i) => (
        <div key={i} style={{position: 'absolute', left: b.x, top: b.y, width: 320, textAlign: 'center', transform: `rotate(${b.r}deg)`, fontFamily: MONO, fontWeight: 800, fontSize: 52, whiteSpace: 'nowrap', mixBlendMode: 'multiply', color: VERDE, textShadow: `0 0 16px ${VERDE_LUZ}`}}>
          {f(b.v)}
        </div>
      ))}
    </div>
  );
};

// ---------- etiquetas de precio ----------
const Etiqueta: React.FC<{x: number; y: number; que: string; precio: string; giro: number; desde: number; tachado?: string[]; dibujo: 'cafe' | 'colectivo'}> = ({x, y, que, precio, giro, desde, tachado = [], dibujo}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < desde) return null;
  const f2 = frame - (frame % 2);
  const p = spring({frame: f2 - Math.round(desde * fps), fps, config: {damping: 9, stiffness: 140}});
  const balanceo = Math.sin(f2 / 9 + x) * 3;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translateY(${(1 - p) * -500}px) rotate(${giro + balanceo}deg)`, transformOrigin: '50% -120px'}}>
      <svg width={300} height={240} style={{position: 'absolute', left: 40, top: -250, overflow: 'visible'}}>
        {dibujo === 'cafe' ? (
          <g transform="translate(40 40)">
            <path d="M20 40 h130 l-14 120 h-102 z" fill="#efe6d0" stroke={TINTA} strokeWidth={5} strokeLinejoin="round" />
            <path d="M150 60 q40 0 34 40 q-6 34 -44 30" fill="none" stroke={TINTA} strokeWidth={5} />
            <ellipse cx={85} cy={42} rx={65} ry={12} fill="#6b4528" stroke={TINTA} strokeWidth={4} />
            {[0, 1, 2].map((k) => {
              const u = ((f2 / 30) * 0.7 + k / 3) % 1;
              return <path key={k} d={`M${55 + k * 30} ${20 - u * 50} q12 -14 0 -28`} stroke={TINTA} strokeWidth={4} fill="none" opacity={1 - u} strokeLinecap="round" />;
            })}
          </g>
        ) : (
          <g transform="translate(-10 70)">
            <rect x={0} y={0} width={300} height={120} rx={20} fill="#c9a65a" stroke={TINTA} strokeWidth={5} />
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={22 + k * 64} y={18} width={50} height={44} rx={6} fill="#efe6d0" stroke={TINTA} strokeWidth={4} />
            ))}
            <circle cx={70} cy={124} r={24} fill="#3a3530" stroke={TINTA} strokeWidth={5} />
            <circle cx={230} cy={124} r={24} fill="#3a3530" stroke={TINTA} strokeWidth={5} />
          </g>
        )}
      </svg>
      <div style={{position: 'absolute', left: 170, top: -126, width: 3, height: 126, background: TINTA}} />
      <div style={{position: 'relative', width: 340, padding: '26px 30px 30px 60px', background: '#f1e6c8', clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)', boxShadow: '4px 8px 0 rgba(43,38,34,0.2)', fontFamily: MANO, fontWeight: 700, color: TINTA}}>
        <div style={{position: 'absolute', left: 26, top: '50%', width: 18, height: 18, marginTop: -9, borderRadius: 18, border: `4px solid ${TINTA}`}} />
        <div style={{fontSize: 52, lineHeight: 1}}>{que}</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap'}}>
          {tachado.map((x) => (
            <span key={x} style={{fontSize: 48, opacity: 0.55, textDecoration: `line-through ${ROJO} 5px`}}>{x}</span>
          ))}
          <span style={{fontSize: 76, color: tachado.length ? ROJO : VERDE, lineHeight: 1.05}}>{precio}</span>
        </div>
      </div>
    </div>
  );
};

// ---------- la ciudad dividida ----------
const Ciudad: React.FC<{t: number; t2: number}> = ({t, t2}) => {
  const luzRicos = interpolate(t, [T.ricos - 0.3, T.ricos + 0.5, T.pobres - 0.3, T.pobres + 0.3], [0.5, 1, 1, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const luzPobres = interpolate(t, [T.ricos, T.ricos + 0.5, T.pobres - 0.3, T.pobres + 0.4], [0.75, 0.5, 0.5, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kPocos = clamp01((t2 - T.pocos - 0.6) / 2);
  // pobres: cuánto tiempo les queda (segundos), algunos llegan a cero al final
  const pobres = [
    {x: 120, v: 0, base: 23 * 3600, cae: true},
    {x: 300, v: 2, base: 6 * 3600 + 40 * 60, cae: false},
    {x: 470, v: 1, base: 41 * 60, cae: true},
    {x: 640, v: 3, base: 15 * 3600, cae: false},
    {x: 810, v: 2, base: 2 * 3600 + 5 * 60, cae: true},
    {x: 975, v: 0, base: 9 * 3600, cae: false},
  ];
  const ricos = [
    {x: 250, v: 1, txt: '312 años'},
    {x: 560, v: 3, txt: '1.000.000 años'},
    {x: 860, v: 0, txt: '87 años'},
  ];
  const ff = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;
  };
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {/* ARRIBA: la zona rica */}
        <g opacity={luzRicos}>
          <g filter="url(#acuarela)">
            <rect x={0} y={470} width={1080} height={520} fill="#e6d3a2" opacity={0.75} />
            {[60, 230, 420, 640, 830].map((x, k) => (
              <rect key={x} x={x} y={560 - (k % 2) * 90 - (k === 2 ? 60 : 0)} width={150} height={430 + (k % 2) * 90 + (k === 2 ? 60 : 0)} fill={k % 2 ? '#c4a35a' : '#d2b56e'} />
            ))}
          </g>
          {[60, 230, 420, 640, 830].map((x, k) => {
            const top = 560 - (k % 2) * 90 - (k === 2 ? 60 : 0);
            return (
              <g key={x}>
                <rect x={x} y={top} width={150} height={990 - top} fill="none" stroke={TINTA} strokeWidth={4} />
                {Array.from({length: Math.floor((990 - top - 40) / 70)}).map((_, r) =>
                  [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={x + 18 + c * 42} y={top + 24 + r * 70} width={28} height={40} fill="#f6ecd0" stroke={TINTA} strokeWidth={2.5} />),
                )}
              </g>
            );
          })}
        </g>
        {/* el muro */}
        <g filter="url(#acuarela)">
          <rect x={0} y={990} width={1080} height={60} fill="#7d7468" />
        </g>
        <rect x={0} y={990} width={1080} height={60} fill="url(#rayado)" />
        <path d="M0 990 H1080 M0 1050 H1080" stroke={TINTA} strokeWidth={5} />
        {Array.from({length: 12}).map((_, k) => (
          <path key={k} d={`M${k * 95 + 20} 990 l20 -26 l20 26`} stroke={TINTA} strokeWidth={4} fill="none" />
        ))}
        {/* ABAJO: la zona pobre */}
        <g opacity={luzPobres}>
          <g filter="url(#acuarela)">
            <rect x={0} y={1050} width={1080} height={480} fill="#a9a196" opacity={0.7} />
            <path d="M40 1260 h220 v-90 l-110 -70 l-110 70 z" fill="#8f877b" />
            <path d="M300 1260 h260 v-130 h-260 z" fill="#7f776c" />
            <path d="M620 1260 h200 v-80 l-100 -60 l-100 60 z" fill="#8f877b" />
            <rect x={860} y={1100} width={180} height={160} fill="#6f685e" />
          </g>
          <path d="M40 1260 h220 v-90 l-110 -70 l-110 70 z M300 1260 h260 v-130 h-260 z M620 1260 h200 v-80 l-100 -60 l-100 60 z" fill="none" stroke={TINTA} strokeWidth={4} strokeLinejoin="round" />
          <rect x={860} y={1100} width={180} height={160} fill="url(#rayado)" stroke={TINTA} strokeWidth={4} />
          <rect x={990} y={1040} width={30} height={60} fill="#5e564a" stroke={TINTA} strokeWidth={4} />
          {[0, 1, 2].map((k) => {
            const u = (t2 * 0.25 + k / 3) % 1;
            return <circle key={k} cx={1005 + Math.sin(u * 6 + k) * 14} cy={1030 - u * 130} r={12 + u * 22} fill="#8a8478" opacity={0.55 * (1 - u)} />;
          })}
          <path d="M0 1500 H1080" stroke={TINTA} strokeWidth={4} />
        </g>
      </svg>
      {/* gente de arriba: tranquilos */}
      <div style={{opacity: luzRicos}}>
        {ricos.map((r, k) => (
          <React.Fragment key={k}>
            <Figura x={r.x} y={985} pose="parado" variante={r.v} sentido={k === 2 ? -1 : 1} escala={0.7} />
            <div style={{position: 'absolute', left: r.x - 150, top: 700, width: 300, textAlign: 'center'}}><span style={{display: 'inline-block', background: '#f3ead6', padding: '2px 14px', boxShadow: '2px 4px 0 rgba(43,38,34,0.2)', fontFamily: MONO, fontWeight: 800, fontSize: 30, color: VERDE}}>{r.txt}</span></div>
          </React.Fragment>
        ))}
      </div>
      {/* gente de abajo: al día */}
      <div style={{opacity: luzPobres}}>
        {pobres.map((p, k) => {
          const queda = p.base - Math.max(0, t2 - T.divide) * (p.base < 3600 ? 9 : 120);
          const enCero = p.cae && kPocos > 0;
          const s = enCero ? 0 : Math.max(0, queda);
          return (
            <React.Fragment key={k}>
              <div style={{opacity: enCero ? 1 - kPocos * 0.75 : 1, filter: enCero ? `grayscale(${kPocos})` : undefined}}>
                <Figura x={p.x} y={1495} pose="parado" variante={p.v} sentido={k % 2 ? -1 : 1} escala={0.6} hambre={0.4} cara={enCero ? 'cerrados' : 'neutral'} />
              </div>
              <div style={{position: 'absolute', left: p.x - 100, top: 1262, width: 200, textAlign: 'center'}}><span style={{display: 'inline-block', background: '#f3ead6', padding: '0 8px', fontFamily: MONO, fontWeight: 800, fontSize: 26, color: enCero ? '#c43a2a' : VERDE}}>{enCero ? '0m 00s' : ff(s)}</span></div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ---------- regla 1: dejás de envejecer ----------
const Edades: React.FC<{t: number; t2: number}> = ({t, t2}) => {
  const edades = [
    {e: 5, x: 150, s: 0.42},
    {e: 12, x: 360, s: 0.6},
    {e: 18, x: 590, s: 0.78},
    {e: 25, x: 860, s: 0.92},
  ];
  const anios = ['2040', '2070', '2110', '2160'];
  const kAnio = Math.floor(clamp01((t2 - T.para) / 2.2) * 3.99);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d="M60 1330 C300 1324 700 1336 1020 1328" stroke={TINTA} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M1020 1328 l-26 -16 m26 16 l-26 16" stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
      </svg>
      {edades.map((e, k) => {
        const desde = T.r1 + 0.6 + k * 0.7;
        if (t < desde) return null;
        return (
          <React.Fragment key={e.e}>
            <Figura x={e.x} y={1320} pose="parado" variante={0} escala={e.s} bufanda={k === 3} />
            <div style={{position: 'absolute', left: e.x - 80, top: 1350, width: 160, textAlign: 'center', fontFamily: MANO, fontWeight: 700, fontSize: 64, color: k === 3 ? ROJO : TINTA}}>{e.e}</div>
          </React.Fragment>
        );
      })}
      {t >= T.para && (
        <div style={{position: 'absolute', left: 660, top: 770, width: 400, textAlign: 'center', fontFamily: MANO, fontWeight: 700, color: TINTA, transform: 'rotate(-3deg)'}}>
          <div style={{display: 'inline-block', background: '#f3ead6', padding: '6px 26px', boxShadow: '3px 6px 0 rgba(43,38,34,0.2)', fontSize: 64}}>año {anios[kAnio]}</div>
          <div style={{fontSize: 52, marginTop: 10, color: ROJO}}>…sigue teniendo 25</div>
        </div>
      )}
    </div>
  );
};

export const Tiempo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f2 = frame - (frame % 2);
  const t = frame / fps;
  const t2 = f2 / fps;

  // qué escena se ve
  const escenaBrazo = t < T.r1 || entre(t, T.r2, T.r3) || entre(t, T.leccion, T.titulo + 1);
  const escenaEdades = entre(t, T.r1, T.r2);
  const escenaApreton = entre(t, T.r3, T.cafe);
  const escenaPrecios = entre(t, T.cafe, T.divide);
  const escenaCiudad = entre(t, T.divide, T.leccion);

  // dígitos del brazo
  let seg = 364 * 86400 + 23 * 3600 + 59 * 60 + 59 - t;
  let rojo = false;
  if (t >= T.unAnio) seg = 365 * 86400 - (t - T.unAnio);
  if (t >= T.cero - 1.4) {
    const k = suave(clamp01((t - (T.cero - 1.4)) / 1.4));
    seg = (365 * 86400) * (1 - k);
    rojo = k >= 1;
  }
  if (t >= T.leccion) seg = 0;
  const luz = t < T.leccion ? interpolate(t, [T.gancho + 0.6, T.gancho + 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const zoomBrazo = t < T.reglas ? interpolate(t, [0, T.reloj, T.reloj + 1.2], [1.0, 1.0, 1.35], {extrapolateRight: 'clamp', easing: suave}) : t < T.r1 ? 1.0 : t < T.r3 ? interpolate(t, [T.r2, T.r2 + 0.8, T.cero - 1.6, T.cero - 0.6], [1, 1.25, 1.25, 1.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : interpolate(t, [T.leccion, T.noVes], [1, 1.2], {extrapolateRight: 'clamp'});
  const oscuroCero = t >= T.cero ? interpolate(t, [T.cero, T.cero + 0.6, T.r3 - 0.5, T.r3], [0, 0.7, 0.7, 0], {extrapolateRight: 'clamp'}) : 0;
  const kApreton = clamp01((t2 - T.paga) / 2.2);

  return (
    <AbsoluteFill style={{background: '#d9ccb0'}}>
      <FiltrosTinta />
      <Papel />
      <Hervir>
        {escenaBrazo && (
          <div style={{position: 'absolute', inset: 0, transform: `scale(${zoomBrazo * 1.18})`, transformOrigin: '540px 1060px'}}>
            <Brazo digitos={reloj(seg)} luz={luz} rojo={rojo} fantasma={t >= T.noVes ? clamp01((t - T.noVes) / 0.8) : 0} />
          </div>
        )}
        {escenaEdades && <Edades t={t} t2={t2} />}
        {escenaApreton && (
          <div style={{position: 'absolute', inset: 0, transform: 'scale(1.3)', transformOrigin: '540px 1060px'}}>
            <Apreton k={kApreton} t={t2} />
          </div>
        )}
        {escenaPrecios && (
          <>
            <div style={{position: 'absolute', inset: 0, transform: 'scale(1.35)', transformOrigin: '540px 900px'}}>
              <Etiqueta x={70} y={880} que="un café" precio="4 min" giro={-4} desde={T.cafe} dibujo="cafe" />
              <Etiqueta x={560} y={1070} que="el colectivo" precio="2 horas" giro={5} desde={T.colectivo} dibujo="colectivo" />
            </div>
          </>
        )}
        {escenaCiudad && <Ciudad t={t} t2={t2} />}
        {/* los precios suben abajo */}
        {escenaCiudad && t >= T.suben && t < T.leccion && (
          <div style={{position: 'absolute', left: 330, top: 560, transform: 'scale(0.95)', transformOrigin: '0 0'}}>
            <Etiqueta x={0} y={130} que="un café" precio={t2 < T.suben + 1.6 ? '5 min' : t2 < T.suben + 3.0 ? '7 min' : '10 min'} tachado={t2 < T.suben + 1.6 ? ['4 min'] : t2 < T.suben + 3.0 ? ['4', '5 min'] : ['4', '5', '7 min']} giro={3} desde={T.suben} dibujo="cafe" />
          </div>
        )}
      </Hervir>
      <AbsoluteFill style={{background: '#120c08', opacity: oscuroCero}} />

      {/* zonas */}
      {escenaCiudad && (
        <>
          <div style={{position: 'absolute', left: 30, top: 990, fontFamily: MANO, fontWeight: 700, fontSize: 48, color: '#f3ead6', opacity: clamp01((t - T.divide - 0.4) * 3)}}>↑ los que tienen siglos</div>
          <div style={{position: 'absolute', right: 30, top: 990, fontFamily: MANO, fontWeight: 700, fontSize: 48, color: '#f3ead6', opacity: clamp01((t - T.divide - 0.8) * 3)}}>los que viven al día ↓</div>
        </>
      )}

      {/* ============ NOTAS ============ */}
      <div style={{position: 'absolute', top: 230, left: 40, right: 40, height: 380, textAlign: 'center'}}>
        {[
          {d: T.gancho + 0.3, h: T.reloj - 0.1, txt: 'Imaginate que un día, en tu brazo, aparece esto.', g: -1.4},
          {d: T.reloj, h: T.reglas - 0.1, txt: 'Un reloj. Y cuenta para atrás.', g: 1.2},
          {d: T.reglas, h: T.r1 - 0.1, txt: 'En este mundo hay 3 reglas.', g: -2, tam: 84},
          {d: T.r1, h: T.r2 - 0.1, txt: '1. A los 25 dejás de envejecer. Para siempre.', g: 1},
          {d: T.r2, h: T.cero - 0.1, txt: '2. Ese día arranca tu reloj: te dan un año.', g: -1.2},
          {d: T.cero, h: T.r3 - 0.1, txt: 'Cuando llega a cero… te morís.', g: 1.6},
          {d: T.r3, h: T.cafe - 0.1, txt: '3. El tiempo es la plata. Te pagan en horas.', g: -1},
          {d: T.cafe, h: T.divide - 0.1, txt: 'Y todo se paga con tu vida.', g: 1.2},
          {d: T.divide, h: T.ricos - 0.05, txt: 'Entonces el mundo se divide en dos.', g: -1.4},
          {d: T.ricos, h: T.pobres - 0.1, txt: 'Arriba tienen siglos. No necesitan apurarse.', g: 1},
          {d: T.pobres, h: T.suben - 0.1, txt: 'Abajo se despiertan con un día… y salen a ganarse el de mañana.', g: -1.2},
          {d: T.suben, h: T.pocos - 0.1, txt: 'Y cada tanto, abajo, los precios suben.', g: 1.3},
          {d: T.pocos, h: T.leccion - 0.1, txt: 'Para que unos pocos vivan para siempre… muchos tienen que quedarse en cero.', g: -1},
          {d: T.leccion, h: T.noVes - 0.1, txt: '¿La lección? Todo lo que comprás, lo pagás con horas de tu vida.', g: 1.2},
          {d: T.noVes, h: T.titulo - 0.2, txt: 'Tu reloj también existe. Solo que no lo ves.', g: -1.6},
        ].map((n) => (
          <div key={n.d} style={{position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'center'}}>
            <Nota desde={n.d} hasta={n.h} giro={n.g} tamano={n.tam ?? 68} style={{maxWidth: 950}}>
              {n.txt}
            </Nota>
          </div>
        ))}
      </div>

      {/* ============ CIERRE ============ */}
      <AbsoluteFill style={{background: '#1d150e', opacity: interpolate(t, [T.titulo - 0.4, T.titulo + 0.4], [0, 0.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />
      <TarjetaTitulo desde={T.titulo} antetitulo="Esto es…" titulo="EL PRECIO DEL MAÑANA" anio="2011" detalle="(In Time) · Película" sello="1 AÑO" />
      {t >= T.pregunta && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 1160, textAlign: 'center'}}>
          <Nota desde={T.pregunta} hasta={T.dur + 1} giro={1.2} tamano={62} style={{maxWidth: 920}}>
            ¿Cambiarías un año de tu vida… por un millón de dólares?
          </Nota>
          <div style={{display: 'flex', justifyContent: 'center', gap: 70, marginTop: 34}}>
            {['SÍ', 'NO'].map((x, k) => {
              const p = spring({frame: f2 - Math.round((T.pregunta + 1.4 + k * 0.25) * fps), fps, config: {damping: 10}});
              return (
                <div key={x} style={{display: 'flex', alignItems: 'center', gap: 18, transform: `scale(${p}) rotate(${k ? 3 : -3}deg)`, fontFamily: MANO, fontWeight: 700, fontSize: 88, color: '#f3ead6'}}>
                  <div style={{width: 70, height: 70, border: '6px solid #f3ead6', borderRadius: 8}} />
                  {x}
                </div>
              );
            })}
          </div>
          {t >= T.comenta && <div style={{marginTop: 26, fontFamily: MANO, fontWeight: 700, fontSize: 56, color: '#f3ead6', opacity: clamp01((t - T.comenta) * 3)}}>Comentá abajo 👇</div>}
        </div>
      )}

      <Proyector />
      <Audio src={staticFile('tiempo-mezcla.wav')} />
    </AbsoluteFill>
  );
};

