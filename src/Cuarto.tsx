import React from 'react';
import {Easing, interpolate, random, spring} from 'remotion';

/*
 * El cuarto ilustrado, dibujado 100% en SVG.
 * Coordenadas de escena = 1080x1920 (igual que el video), así los globos y textos
 * que van "dentro" del cuarto se posicionan en el mismo sistema y se mueven con la cámara.
 */

export type EstadoChico = 'despierto' | 'leyendo' | 'asustado';

export type Cam = {x: number; y: number; s: number};

export const CAMS = {
  general: {x: 540, y: 960, s: 1},
  reloj: {x: 120, y: 1290, s: 2.4},
  mesita: {x: 330, y: 1250, s: 1.5},
  lectura: {x: 700, y: 1150, s: 1.6},
  puerta: {x: 770, y: 900, s: 1.4},
  cara: {x: 500, y: 1180, s: 2.0},
} satisfies Record<string, Cam>;

/** Interpola la cámara entre keyframes [segundo, cámara] con easing suave */
export const camara = (t: number, keys: [number, Cam][]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b] = keys[i + 1];
    if (t >= t0 && t <= t1) {
      const p = Easing.inOut(Easing.cubic)((t - t0) / Math.max(t1 - t0, 0.001));
      return {x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, s: a.s + (b.s - a.s) * p};
    }
  }
  return keys[keys.length - 1][1];
};

export const transformCamara = ({x, y, s}: Cam) => {
  const tx = Math.min(0, Math.max(1080 - 1080 * s, 540 - x * s));
  const ty = Math.min(0, Math.max(1920 - 1920 * s, 960 - y * s));
  return `translate(${tx}px, ${ty}px) scale(${s})`;
};

// ---------- paleta ----------
const PARED_A = '#1d2350';
const PARED_B = '#10142e';
const PISO = '#0b0d1c';
const PIEL = '#e9b98a';
const PELO = '#22160f';
const PIJAMA = '#3f74c4';
const MANTA = '#6b4fa6';
const MANTA_B = '#57408c';
const MADERA = '#4a3426';
const LUZ = '#ffd27a';

type Props = {
  frame: number;
  estado: EstadoChico;
  /** 0 = celular en la mesita, 1 = en las manos */
  celularEnMano: number;
  /** brillo de la pantalla 0..1 */
  brillo: number;
  /** vibración del celular (px) */
  vibra: number;
  /** temblor de la puerta (px) */
  puertaShake: number;
  /** destello de la puerta 0..1 */
  destello: number;
  /** escala de los rayos del destello */
  rayos: number;
  /** intensidad de la luz bajo la puerta 0..1 */
  luzPuerta: number;
  /** posición de la sombra bajo la puerta (px) */
  sombra: number;
  /** oscurecer el cuarto 0..1 (la puerta queda iluminada) */
  oscuro: number;
};

const Ojo: React.FC<{cx: number; cy: number; estado: EstadoChico; parpado: number}> = ({cx, cy, estado, parpado}) => {
  const grande = estado === 'asustado';
  const rx = grande ? 17 : 13;
  const ry = grande ? 21 : 15;
  const [px, py] = estado === 'leyendo' ? [5, 7] : estado === 'despierto' ? [3, -4] : [0, 0];
  const pr = grande ? 4.5 : 7;
  // párpado: 0 abierto, 1 cerrado. "despierto" lo deja medio caído (cansado)
  const caida = estado === 'despierto' ? 0.35 : estado === 'leyendo' ? 0.2 : 0;
  const cierre = Math.max(caida, parpado);
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#f5f3ff" />
      <circle cx={cx + px} cy={cy + py} r={pr} fill="#1a1020" />
      <rect x={cx - rx - 2} y={cy - ry - 2} width={rx * 2 + 4} height={(ry * 2 + 4) * cierre} fill={PIEL} />
    </g>
  );
};

const Chico: React.FC<{frame: number; estado: EstadoChico; manos: number}> = ({frame, estado, manos}) => {
  const parpado = frame % 80 < 4 ? 1 : 0;
  const temblor = estado === 'asustado' ? (random(`c${frame}`) - 0.5) * 4 : 0;
  const respira = Math.sin(frame / 18) * 3;
  // manos: de descansando sobre la manta a sosteniendo el celular
  const hx = interpolate(manos, [0, 1], [590, 640]);
  const hy = interpolate(manos, [0, 1], [1470, 1340]);
  return (
    <g transform={`translate(${temblor}, ${respira * 0.3})`}>
      {/* torso */}
      <rect x={400} y={1255 + respira} width={165} height={260} rx={70} fill={PIJAMA} />
      <path d={`M430 ${1300 + respira} Q482 ${1330 + respira} 535 ${1300 + respira}`} stroke="#2f5a9e" strokeWidth={10} fill="none" />
      {/* brazos */}
      <path d={`M545 ${1320 + respira} Q ${hx - 10} ${hy - 90} ${hx} ${hy}`} stroke={PIJAMA} strokeWidth={38} strokeLinecap="round" fill="none" />
      <path d={`M430 ${1330 + respira} Q ${hx - 120} ${hy + 40} ${hx - 30} ${hy + 18}`} stroke="#3567b0" strokeWidth={36} strokeLinecap="round" fill="none" />
      {/* cabeza */}
      <g transform={`translate(0, ${respira})`}>
        <circle cx={398} cy={1195} r={24} fill={PIEL} />
        <circle cx={470} cy={1175} r={92} fill={PIEL} />
        {/* pelo */}
        <path d="M380 1170 Q370 1060 470 1072 Q560 1068 568 1150 Q540 1112 512 1128 Q500 1100 470 1118 Q445 1092 420 1125 Q400 1140 380 1170 Z" fill={PELO} />
        <path d="M383 1150 Q372 1110 398 1092" stroke={PELO} strokeWidth={22} strokeLinecap="round" fill="none" />
        {/* cejas */}
        {estado === 'asustado' ? (
          <>
            <path d="M478 1128 Q492 1116 508 1124" stroke={PELO} strokeWidth={6} fill="none" strokeLinecap="round" />
            <path d="M523 1124 Q538 1114 552 1124" stroke={PELO} strokeWidth={6} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M478 1138 L508 1136" stroke={PELO} strokeWidth={6} strokeLinecap="round" />
            <path d="M522 1136 L550 1138" stroke={PELO} strokeWidth={6} strokeLinecap="round" />
          </>
        )}
        <Ojo cx={494} cy={1162} estado={estado} parpado={parpado} />
        <Ojo cx={537} cy={1162} estado={estado} parpado={parpado} />
        {/* nariz y boca */}
        <path d="M553 1180 Q566 1192 552 1198" stroke="#c9946a" strokeWidth={5} fill="none" strokeLinecap="round" />
        {estado === 'asustado' ? (
          <ellipse cx={528} cy={1226} rx={11} ry={15} fill="#5a1f2a" />
        ) : (
          <path d="M512 1226 L540 1224" stroke="#8a4b3a" strokeWidth={5} strokeLinecap="round" />
        )}
        {estado === 'asustado' && <path d="M430 1110 Q422 1128 430 1136 Q440 1128 430 1110 Z" fill="#9fd8ff" opacity={0.9} />}
      </g>
      {/* manos */}
      <circle cx={hx} cy={hy} r={21} fill={PIEL} />
      <circle cx={hx - 30} cy={hy + 18} r={20} fill={PIEL} />
    </g>
  );
};

export const Cuarto: React.FC<Props> = (p) => {
  const {frame} = p;
  // posición del celular: arco desde la mesita hasta las manos
  const m = p.celularEnMano;
  const cx = interpolate(m, [0, 1], [178, 628]);
  const cy = interpolate(m, [0, 1], [1318, 1300]) - Math.sin(m * Math.PI) * 160;
  const ancho = interpolate(m, [0, 1], [62, 52]);
  const alto = interpolate(m, [0, 1], [16, 92]);
  const rot = interpolate(m, [0, 1], [0, -8]);
  const vib = p.vibra ? (random(`v${frame}`) - 0.5) * p.vibra : 0;

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="pared" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PARED_A} />
          <stop offset="1" stopColor={PARED_B} />
        </linearGradient>
        <linearGradient id="vidrio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3a78" />
          <stop offset="1" stopColor="#121a3f" />
        </linearGradient>
        <radialGradient id="pantalla">
          <stop offset="0" stopColor="#a8dcff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#a8dcff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="reloj">
          <stop offset="0" stopColor="#ff2d55" stopOpacity={0.45} />
          <stop offset="1" stopColor="#ff2d55" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="luna">
          <stop offset="0" stopColor="#fff8d6" stopOpacity={0.5} />
          <stop offset="1" stopColor="#fff8d6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="haz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LUZ} stopOpacity={0.55} />
          <stop offset="1" stopColor={LUZ} stopOpacity={0} />
        </linearGradient>
        <filter id="blur8"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="blur24"><feGaussianBlur stdDeviation="24" /></filter>
      </defs>

      {/* pared y piso */}
      <rect width={1080} height={1300} fill="url(#pared)" />
      <rect y={1300} width={1080} height={620} fill={PISO} />
      {[1360, 1440, 1560, 1720, 1900].map((y) => (
        <line key={y} x1={0} x2={1080} y1={y} y2={y} stroke="#14172b" strokeWidth={4} />
      ))}
      <rect y={1286} width={1080} height={16} fill="#161a36" />

      {/* ventana con luna */}
      <polygon points="80,900 380,900 640,1920 0,1920" fill="#cfd8ff" opacity={0.035} />
      <rect x={70} y={500} width={320} height={410} rx={10} fill="#2b3264" />
      <rect x={88} y={518} width={284} height={374} fill="url(#vidrio)" />
      <circle cx={290} cy={600} r={110} fill="url(#luna)" />
      <circle cx={290} cy={600} r={44} fill="#f4efcc" />
      <circle cx={274} cy={590} r={8} fill="#e2dcb4" />
      {[[130, 560], [180, 700], [340, 760], [120, 820], [230, 840]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3 + (i % 2)} fill="white" opacity={0.5 + 0.5 * Math.abs(Math.sin(frame / 20 + i))} />
      ))}
      <rect x={226} y={518} width={10} height={374} fill="#2b3264" />
      <rect x={88} y={700} width={284} height={10} fill="#2b3264" />
      <path d="M50 480 Q90 700 60 940 L110 940 Q130 700 120 480 Z" fill="#3b2a5f" />
      <path d="M410 480 Q370 700 400 940 L350 940 Q330 700 340 480 Z" fill="#3b2a5f" />
      <rect x={40} y={468} width={390} height={18} rx={9} fill="#2a2148" />

      {/* puerta */}
      <g transform={`translate(${p.puertaShake}, 0)`}>
        <rect x={588} y={560} width={364} height={740} fill="#262b52" />
        {/* luz que se escapa por los bordes cuando golpean */}
        <rect x={604} y={576} width={332} height={724} fill="none" stroke={LUZ} strokeWidth={14} opacity={p.destello} filter="url(#blur8)" />
        <rect x={610} y={582} width={320} height={718} fill={MADERA} />
        <rect x={640} y={612} width={260} height={280} rx={8} fill="none" stroke="#3a281d" strokeWidth={10} />
        <rect x={640} y={930} width={260} height={330} rx={8} fill="none" stroke="#3a281d" strokeWidth={10} />
        <circle cx={892} cy={960} r={17} fill="#c9a24a" />
        <circle cx={887} cy={955} r={6} fill="#f1d27c" />
      </g>
      {/* luz por debajo de la puerta + sombra de pies */}
      <g opacity={0.35 + 0.65 * p.luzPuerta}>
        <rect x={600} y={1288} width={340} height={22} fill={LUZ} filter="url(#blur24)" />
        <polygon points="612,1300 928,1300 1010,1420 540,1420" fill="url(#haz)" />
        <rect x={612} y={1294} width={316} height={8} fill="#ffe7b0" />
        <rect x={720 + p.sombra} y={1294} width={44} height={8} fill="#000" />
        <rect x={800 + p.sombra} y={1294} width={44} height={8} fill="#000" />
      </g>
      {/* rayos del destello (estilo cómic) */}
      <g opacity={p.destello} transform={`translate(770 930) scale(${p.rayos}) translate(-770 -930)`}>
        {Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 + 0.2;
          const r1 = 1.12;
          const r2 = 1.32;
          return (
            <line
              key={i}
              x1={770 + Math.cos(a) * 230 * r1}
              y1={930 + Math.sin(a) * 430 * r1}
              x2={770 + Math.cos(a) * 230 * r2}
              y2={930 + Math.sin(a) * 430 * r2}
              stroke="#ffe08a"
              strokeWidth={12}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* mesita de luz con reloj */}
      <rect x={20} y={1330} width={200} height={300} rx={10} fill="#3a2b52" />
      <rect x={20} y={1322} width={210} height={20} rx={6} fill="#4a3866" />
      <rect x={40} y={1440} width={160} height={8} rx={4} fill="#2c2040" />
      <circle cx={110} cy={1500} r={8} fill="#6a5590" />
      <circle cx={95} cy={1290} r={90} fill="url(#reloj)" />
      <rect x={40} y={1262} width={112} height={60} rx={10} fill="#141018" />
      <text x={96} y={1305} textAnchor="middle" fontFamily='"JetBrains Mono", monospace' fontWeight={800} fontSize={36} fill="#ff2d55">
        3{Math.floor(frame / 15) % 2 === 0 ? ':' : ' '}07
      </text>

      {/* cama */}
      <rect x={232} y={1150} width={80} height={520} rx={24} fill="#3b2f63" />
      <rect x={290} y={1600} width={780} height={90} rx={14} fill="#2b2250" />
      <rect x={280} y={1480} width={790} height={150} rx={30} fill="#7d84bb" />
      <ellipse cx={400} cy={1440} rx={120} ry={60} fill="#9aa1d4" />

      <Chico frame={frame} estado={p.estado} manos={m} />

      {/* manta con las rodillas levantadas */}
      <path d="M360 1500 Q520 1470 600 1440 Q700 1330 800 1430 Q900 1470 1070 1470 L1070 1640 L360 1640 Q330 1570 360 1500 Z" fill={MANTA} />
      <path d="M360 1500 Q520 1470 600 1440" stroke={MANTA_B} strokeWidth={14} fill="none" />
      <path d="M700 1400 Q760 1520 720 1640" stroke={MANTA_B} strokeWidth={10} fill="none" opacity={0.7} />

      {/* celular */}
      <g transform={`translate(${cx + vib}, ${cy}) rotate(${rot})`}>
        <circle r={240 * p.brillo} fill="url(#pantalla)" />
        <rect x={-ancho / 2} y={-alto / 2} width={ancho} height={alto} rx={8} fill="#0d0d12" stroke="#30303c" strokeWidth={3} />
        <rect x={-ancho / 2 + 4} y={-alto / 2 + 4} width={ancho - 8} height={alto - 8} rx={5} fill="#bfe6ff" opacity={p.brillo} />
      </g>
      {/* ondas de vibración */}
      {p.vibra > 0 &&
        [0, 1].map((i) => (
          <g key={i} opacity={0.8}>
            <path d={`M${cx - 50 - i * 16} ${cy - 18} q-10 18 0 36`} stroke="white" strokeWidth={5} fill="none" strokeLinecap="round" />
            <path d={`M${cx + 50 + i * 16} ${cy - 18} q10 18 0 36`} stroke="white" strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
        ))}
      {/* luz de la pantalla sobre la cara */}
      <circle cx={560} cy={1220} r={320} fill="url(#pantalla)" opacity={0.6 * p.brillo * m} />

      {/* oscurecer todo menos la puerta */}
      <rect width={1080} height={1920} fill="#04030a" opacity={p.oscuro * 0.82} />
      <g opacity={p.oscuro}>
        <rect x={600} y={1288} width={340} height={22} fill="#ff6a4a" filter="url(#blur24)" />
        <rect x={612} y={1294} width={316} height={8} fill="#ffb199" />
        <rect x={604} y={576} width={332} height={724} fill="none" stroke="#ff4a3a" strokeWidth={6} opacity={0.5} filter="url(#blur8)" />
      </g>
    </svg>
  );
};

/** Globo de mensaje que sale del celular (posición en coordenadas de escena) */
export const GloboCelular: React.FC<{
  frame: number;
  fps: number;
  entra: number;
  sale: number;
  textoDesde: number;
  texto: React.ReactNode;
  resaltarDesde?: number;
}> = ({frame, fps, entra, sale, textoDesde, texto, resaltarDesde}) => {
  if (frame < entra || frame > sale + 12) return null;
  const pIn = spring({frame: frame - entra, fps, config: {damping: 11, stiffness: 170}});
  const pOut = frame > sale ? interpolate(frame - sale, [0, 10], [1, 0], {extrapolateRight: 'clamp'}) : 1;
  const p = pIn * pOut;
  const conTexto = frame >= textoDesde;
  const pTexto = spring({frame: frame - textoDesde, fps, config: {damping: 12}});
  const resalta = resaltarDesde !== undefined && frame >= resaltarDesde;
  const pulso = resalta ? 1 + 0.08 * Math.exp(-(frame - resaltarDesde!) / 6) : 1;
  return (
    <div
      style={{
        position: 'absolute', left: 612, top: 900, width: 400,
        transform: `scale(${p})`, transformOrigin: '30px 330px', opacity: Math.min(1, p * 1.5),
        fontFamily: '"Inter Display", Inter, sans-serif', color: 'white',
      }}
    >
      <div style={{background: 'rgba(28,28,40,0.96)', borderRadius: 34, padding: '22px 28px', border: '3px solid rgba(160,210,255,0.5)', boxShadow: '0 0 40px rgba(140,200,255,0.45)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 30, fontWeight: 800}}>
          <div style={{width: 44, height: 44, borderRadius: 44, background: '#ff2d55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24}}>Y</div>
          Yo
          <span style={{fontSize: 24, fontWeight: 700, color: resalta ? 'white' : '#ff2d55', background: resalta ? '#ff2d55' : 'transparent', padding: '2px 10px', borderRadius: 10, transform: `scale(${pulso})`, display: 'inline-block'}}>
            mi número
          </span>
        </div>
        <div style={{marginTop: 12, fontSize: 40, fontWeight: 600, lineHeight: 1.2, minHeight: 50}}>
          {conTexto ? (
            <span style={{display: 'inline-block', transform: `scale(${0.8 + 0.2 * pTexto})`, opacity: pTexto}}>{texto}</span>
          ) : (
            <span style={{display: 'flex', gap: 10, paddingTop: 12}}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{width: 16, height: 16, borderRadius: 16, background: '#9a9aa8', transform: `translateY(${Math.sin((frame - i * 4) / 3) * 6}px)`}} />
              ))}
            </span>
          )}
        </div>
      </div>
      {/* colita del globo apuntando al celular */}
      <svg width={80} height={70} style={{position: 'absolute', left: 4, bottom: -60}}>
        <path d="M18 0 L60 0 L8 62 Z" fill="rgba(28,28,40,0.96)" />
      </svg>
    </div>
  );
};

/** Globo de voz "tenebroso" que sale de la puerta */
export const GloboPuerta: React.FC<{frame: number; fps: number; entra: number; children: React.ReactNode}> = ({frame, fps, entra, children}) => {
  if (frame < entra) return null;
  const p = spring({frame: frame - entra, fps, config: {damping: 9, stiffness: 140}});
  const tx = (random(`gp${frame}`) - 0.5) * 6;
  const ty = (random(`gq${frame}`) - 0.5) * 6;
  // borde ondulado
  const puntos = Array.from({length: 28}).map((_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = 1 + 0.06 * Math.sin(i * 2.3 + frame / 4);
    return `${250 + Math.cos(a) * 240 * r},${120 + Math.sin(a) * 110 * r}`;
  });
  return (
    <div style={{position: 'absolute', left: 520, top: 330, width: 500, height: 300, transform: `translate(${tx}px, ${ty}px) scale(${p})`, transformOrigin: '250px 290px'}}>
      <svg width={500} height={300} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <polygon points={puntos.join(' ')} fill="#1a0409" stroke="#ff2d55" strokeWidth={6} />
        <path d="M230 222 Q250 270 240 300 Q275 262 285 222 Z" fill="#1a0409" stroke="#ff2d55" strokeWidth={6} />
        <rect x={232} y={214} width={52} height={14} fill="#1a0409" />
      </svg>
      <div style={{position: 'absolute', inset: 0, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DejaVu Serif", serif', fontStyle: 'italic', fontSize: 56, color: 'white', textShadow: '0 0 18px #ff2d55'}}>
        {children}
      </div>
    </div>
  );
};

/** Onomatopeya de cómic ("TOC!") */
export const Onomatopeya: React.FC<{frame: number; fps: number; at: number; hasta: number; x: number; y: number; rot: number}> = ({frame, fps, at, hasta, x, y, rot}) => {
  if (frame < at || frame > hasta + 8) return null;
  const salida = interpolate(frame, [hasta, hasta + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const p = spring({frame: frame - at, fps, config: {damping: 8, stiffness: 260}}) * salida;
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${p})`,
        fontFamily: '"Inter Display", Inter, sans-serif', fontWeight: 900, fontSize: 118, color: '#ffe08a',
        WebkitTextStroke: '10px #1a0d05', paintOrder: 'stroke fill', letterSpacing: -2,
        filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.5))',
      }}
    >
      TOC!
    </div>
  );
};
