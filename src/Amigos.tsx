import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import T from './amigos-tiempos.json';

/*
 * "Las 200 horas que cuesta un amigo" — TikTok / Reels (1080x1920, 30 fps).
 * Dato: Jeffrey A. Hall (Univ. de Kansas, 2018): ~50 h para amigo casual, ~90 h para amigo, +200 h para amigo cercano.
 * Los tiempos salen de src/amigos-tiempos.json (los comparte con scripts/amigos_musica.py).
 *
 * Metáfora: dos personajes separados por un vacío. Cada hora juntos es un bloque del puente (200 bloques).
 */

export const AMIGOS_FPS = 30;
export const AMIGOS_DURACION = Math.round(T.dur * AMIGOS_FPS);

const DISPLAY = '"Inter Display", Inter, sans-serif';
const TINTA = '#1f1b4b';
const AZUL = '#5b6cff';
const VERDE = '#12b886';
const NARANJA = '#ff922b';
const ROSA = '#ff4f8b';
const ORO = '#ffc400';
const CONFETI = [AZUL, ROSA, VERDE, ORO, '#ffffff', '#7c4dff'];

// puente: 25 columnas x 8 filas = 200 bloques (1 bloque = 1 hora)
const COLS = 25;
const FILAS = 8;
const CELDA = 24;
const BX = 240;
const SUELO = 1180;
const xHora = (h: number) => BX + (h / FILAS) * CELDA;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const paso = (t: number, desde: number, dur: number) => clamp01((t - desde) / dur);

/** horas acumuladas en cada momento */
const horas = (t: number) =>
  interpolate(
    t,
    [T.h50a, T.h50b, T.h90a, T.h90b, T.mates, T.mates + 0.8, T.viajes, T.viajes + 0.8, T.charlas, T.charlas + 0.8, T.h200a, T.h200b],
    [0, 50, 50, 90, 90, 110, 110, 130, 130, 150, 150, 200],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
/** en el giro el puente "se vacía": con alguien nuevo, te faltan horas */
const vacio = (t: number) => paso(t, T.giro + 0.3, 0.7) * (1 - paso(t, T.amigo, 0.6));
const HORAS_NUEVO = 24;

const Persona: React.FC<{x: number; color: string; mira: number; feliz: number; gris?: number; salta?: number; etiqueta?: string; corbata?: boolean; escala?: number}> = ({x, color, mira, feliz, gris = 0, salta = 0, etiqueta, corbata, escala = 1.3}) => {
  const frame = useCurrentFrame();
  const parpado = (frame + Math.round(x)) % 90 < 4;
  const respira = Math.sin(frame / 14 + x) * 3;
  return (
    <div style={{position: 'absolute', left: x - 90, top: SUELO - 230 - salta, width: 180, height: 300, filter: `grayscale(${gris})`, transform: `scale(${escala})`, transformOrigin: '90px 230px'}}>
      <svg width={180} height={300} viewBox="0 0 180 300" style={{overflow: 'visible'}}>
        <rect x={58} y={196} width={22} height={36} rx={10} fill={TINTA} />
        <rect x={100} y={196} width={22} height={36} rx={10} fill={TINTA} />
        <rect x={28} y={60 - respira} width={124} height={150 + respira} rx={58} fill={color} stroke="white" strokeWidth={7} />
        {/* brazos */}
        <path d={`M30 ${130 - respira} q-26 ${10 - feliz * 50} -30 ${34 - feliz * 80}`} stroke={color} strokeWidth={18} strokeLinecap="round" fill="none" />
        <path d={`M150 ${130 - respira} q26 ${10 - feliz * 50} 30 ${34 - feliz * 80}`} stroke={color} strokeWidth={18} strokeLinecap="round" fill="none" />
        {/* cara */}
        {[70, 110].map((ex) => (
          <g key={ex}>
            <ellipse cx={ex} cy={112 - respira} rx={15} ry={parpado ? 2 : 17} fill="white" />
            {!parpado && <circle cx={ex + mira * 6} cy={114 - respira} r={7.5} fill={TINTA} />}
          </g>
        ))}
        <path d={`M72 ${150 - respira} Q90 ${150 - respira + 4 + feliz * 22} 108 ${150 - respira}`} stroke={TINTA} strokeWidth={6} strokeLinecap="round" fill={feliz > 0.6 ? TINTA : 'none'} />
        {corbata && <path d={`M90 ${170 - respira} l-9 12 l9 30 l9 -30 z`} fill="#c0392b" />}
      </svg>
      {etiqueta && (
        <div style={{position: 'absolute', top: 244, left: -60, right: -60, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, color: 'white'}}>
          {etiqueta}
        </div>
      )}
    </div>
  );
};

const Bandera: React.FC<{h: number; at: number; texto: string; color: string; oculta: number}> = ({h, at, texto, color, oculta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at * fps) return null;
  const p = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 9, stiffness: 200}});
  return (
    <div style={{position: 'absolute', left: xHora(h) - 3, top: SUELO - 96, opacity: 1 - oculta, transform: `scaleY(${p})`, transformOrigin: '3px 96px'}}>
      <div style={{width: 6, height: 96, background: TINTA, borderRadius: 3}} />
      <div style={{position: 'absolute', top: -6, left: h >= 200 ? undefined : 4, right: h >= 200 ? 0 : undefined, whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: 900, fontSize: 30, color: 'white', background: color, padding: '4px 14px', borderRadius: 10, border: '4px solid white', boxShadow: '0 5px 0 rgba(31,27,75,0.2)'}}>
        {texto}
      </div>
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

const Manchas: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    {[
      {c: '#ffc2d9', x: 160, y: 300, r: 520, v: 0.23},
      {c: '#bfd4ff', x: 940, y: 700, r: 600, v: 0.17},
      {c: '#ffe39a', x: 540, y: 1650, r: 700, v: 0.2},
      {c: '#c9f2dd', x: 980, y: 1300, r: 420, v: 0.26},
    ].map((m, k) => (
      <div key={k} style={{position: 'absolute', width: m.r * 2, height: m.r * 2, borderRadius: '50%', left: m.x - m.r + Math.sin(t * m.v + k) * 90, top: m.y - m.r + Math.cos(t * m.v * 1.3 + k * 2) * 110, background: `radial-gradient(circle, ${m.c} 0%, ${m.c}00 68%)`}} />
    ))}
  </AbsoluteFill>
);

const Confeti: React.FC<{t: number; desde: number; dur: number}> = ({t, desde, dur}) => {
  if (t < desde) return null;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {Array.from({length: 60}).map((_, k) => {
        const d = t - desde - random(`ci${k}${desde}`) * dur * 0.5;
        if (d < 0 || d > dur) return null;
        const y = -60 + d * (380 + random(`cv${k}`) * 420);
        const x = random(`cx${k}${desde}`) * 1080 + Math.sin(d * 2.4 + k) * 46;
        const w = 14 + random(`cw${k}`) * 16;
        return <div key={k} style={{position: 'absolute', left: x, top: y, width: w, height: k % 3 === 0 ? w : w * 0.45, borderRadius: k % 3 === 0 ? w : 4, background: CONFETI[k % CONFETI.length], transform: `rotate(${d * (160 + random(`cr${k}`) * 300)}deg)`}} />;
      })}
    </AbsoluteFill>
  );
};

export const Amigos: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const h = horas(t);
  const kVacio = vacio(t);
  const hVisible = interpolate(kVacio, [0, 1], [h, HORAS_NUEVO]);
  const completo = t >= T.h200b;

  // personajes
  const entra = (d: number) => spring({frame: frame - Math.round((T.gancho + d) * fps), fps, config: {damping: 10}});
  const cruce = paso(t, T.amigo + 0.6, 2.4);
  const cruceE = Easing.inOut(Easing.cubic)(cruce);
  const xVos = interpolate(cruceE, [0, 1], [128, 462]);
  const xAmigo = interpolate(cruceE, [0, 1], [952, 618]);
  const pasoSalto = cruce > 0 && cruce < 1 ? Math.abs(Math.sin(t * 11)) * 16 : 0;
  const festejo = completo && kVacio === 0 ? Math.abs(Math.sin((t - T.h200b) * 7)) * 26 * Math.exp(-(t - T.h200b) / 1.2) : 0;
  const abrazo = paso(t, T.enVos - 0.3, 0.5);
  const cercania = clamp01(h / 200) * (1 - kVacio) + kVacio * 0.1;
  const felizVos = Math.max(cercania * 0.8, abrazo);
  const estado = kVacio > 0.5 ? 'alguien nuevo' : h >= 200 ? 'amigos de verdad' : h >= 90 ? 'amigos' : h >= 50 ? 'amigos casuales' : 'conocidos';
  const colorEstado = kVacio > 0.5 ? '#8a879c' : h >= 200 ? ROSA : h >= 90 ? NARANJA : h >= 50 ? VERDE : AZUL;

  const pulsoContador = 1 + 0.12 * Math.max(Math.exp(-(t - T.h50b) / 0.15) * (t >= T.h50b ? 1 : 0), Math.exp(-(t - T.h90b) / 0.15) * (t >= T.h90b ? 1 : 0), Math.exp(-(t - T.h200b) / 0.25) * (t >= T.h200b ? 2 : 0));
  const zoom = 1 + 0.02 * Math.sin(t / 3);

  return (
    <AbsoluteFill style={{background: '#fff4e3', fontFamily: DISPLAY, color: TINTA}}>
      <Manchas t={t} />
      {/* brillo cálido cuando el puente está completo */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 60%, #ffd98a 0%, #ffd98a00 65%)', opacity: (completo ? 0.8 : 0) * (1 - kVacio)}} />
      <Confeti t={t} desde={T.h200b} dur={2.6} />
      <Confeti t={t} desde={T.enVos} dur={5} />

      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '540px 1100px'}}>
        {/* contador de horas */}
        <div style={{position: 'absolute', top: 610, left: 0, right: 0, textAlign: 'center', opacity: entra(0.5)}}>
          <div style={{fontSize: 200, fontWeight: 900, letterSpacing: -8, lineHeight: 1, transform: `scale(${pulsoContador})`, color: colorEstado, textShadow: '0 9px 0 rgba(31,27,75,0.15)'}}>
            {t >= T.mas ? 201 : Math.round(hVisible)}
            <span style={{fontSize: 110, letterSpacing: -2, marginLeft: 10}}>h</span>
          </div>
          <div style={{display: 'inline-block', marginTop: 16, fontSize: 44, fontWeight: 900, color: 'white', background: colorEstado, padding: '6px 30px', borderRadius: 100, border: '5px solid white', boxShadow: '0 6px 0 rgba(31,27,75,0.2)'}}>{estado}</div>
        </div>

        {/* barrancos */}
        {[{x: -40, w: 280}, {x: 840, w: 280}].map((b, k) => (
          <div key={k} style={{position: 'absolute', left: b.x, top: SUELO, width: b.w, height: 800, background: TINTA, borderRadius: 36, transform: `translateY(${(1 - entra(0)) * 900}px)`}}>
            <div style={{height: 26, background: VERDE, borderRadius: '36px 36px 0 0'}} />
          </div>
        ))}

        {/* puente: 200 bloques */}
        {Array.from({length: COLS * FILAS}).map((_, i) => {
          const col = Math.floor(i / FILAS);
          const fila = i % FILAS;
          if (i >= Math.ceil(h)) return null;
          const fantasma = i >= HORAS_NUEVO ? kVacio : 0;
          const kOro = paso(t, T.gasto + col * 0.04, 0.25);
          const base = i < 50 ? AZUL : i < 90 ? VERDE : NARANJA;
          const nace = clamp01((h - i) / 3);
          const ondaOro = kOro > 0 && kOro < 1 ? 0.5 : 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: BX + col * CELDA + 1, top: SUELO + (FILAS - 1 - fila) * CELDA + 1 - FILAS * CELDA + FILAS * CELDA, width: CELDA - 2, height: CELDA - 2, borderRadius: 6,
                background: kOro >= 1 ? ORO : kOro > 0 ? '#fff3b0' : base, opacity: 1 - fantasma * 0.82,
                transform: `scale(${nace + (1 - nace) * 1.8 + ondaOro})`,
                boxShadow: kOro >= 1 ? `0 0 14px 1px ${ORO}` : undefined,
              }}
            />
          );
        })}
        <Bandera h={50} at={T.h50b} texto="50 h" color={VERDE} oculta={kVacio} />
        <Bandera h={90} at={T.h90b} texto="90 h" color={NARANJA} oculta={kVacio} />
        <Bandera h={200} at={T.h200b} texto="+200 h" color={ROSA} oculta={Math.max(kVacio, paso(t, T.amigo, 0.4))} />

        {/* maletines: las horas de trabajo rebotan */}
        {Array.from({length: 18}).map((_, k) => {
          const t0 = T.trabajo + k * 0.45;
          const d = t - t0;
          if (d < 0 || d > 1.5 || t0 > T.otras - 0.8) return null;
          const x0 = 300 + random(`mx${k}`) * 260;
          const cae = 0.5;
          const dir = random(`md${k}`) > 0.5 ? 1 : -1;
          const y = d < cae ? interpolate(d, [0, cae], [560, SUELO - 70], {easing: Easing.in(Easing.quad)}) : SUELO - 70 - 520 * (d - cae) + 900 * (d - cae) ** 2;
          const x = d < cae ? x0 : x0 + dir * 260 * (d - cae);
          return (
            <div key={k} style={{position: 'absolute', left: x - 35, top: y, fontSize: 70, opacity: d < cae ? 1 : 1 - paso(d, cae + 0.5, 0.5), transform: `rotate(${d > cae ? dir * (d - cae) * 300 : 0}deg)`}}>
              💼
              {d >= cae && d < cae + 0.6 && <div style={{position: 'absolute', top: -50, left: 4, fontSize: 44, fontWeight: 900, color: '#e03131', transform: 'rotate(0deg)'}}>+0</div>}
            </div>
          );
        })}
        {/* las otras horas: caen y suman */}
        {[{at: T.mates, e: '🧉'}, {at: T.viajes, e: '🚗'}, {at: T.charlas, e: '💬'}].map((o, k) => {
          const d = t - o.at;
          if (d < -0.35 || d > 0.9) return null;
          const y = d < 0 ? interpolate(d, [-0.35, 0], [540, SUELO - 120], {easing: Easing.in(Easing.quad)}) : SUELO - 120 - 160 * d;
          return (
            <div key={k} style={{position: 'absolute', left: xHora(100 + k * 20) - 60, top: y, fontSize: 110, opacity: 1 - paso(d, 0.4, 0.5), transform: `scale(${d >= 0 ? 1 + 0.4 * Math.exp(-d / 0.1) : 1})`}}>
              {o.e}
              {d >= 0 && <div style={{position: 'absolute', top: -46, left: 20, fontSize: 50, fontWeight: 900, color: VERDE}}>+20</div>}
            </div>
          );
        })}

        {/* personajes */}
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - entra(0.15)) * -40}px)`, opacity: entra(0.15)}}>
          <Persona x={xVos} color={ROSA} mira={1} feliz={felizVos} salta={pasoSalto + festejo} etiqueta={cruce > 0 ? undefined : 'vos'} />
          <Persona x={xAmigo} color={AZUL} mira={-1} feliz={Math.max(cercania, abrazo)} gris={1 - cercania} salta={pasoSalto + festejo * 0.9} />
        </div>
        {/* corazones */}
        {t >= T.enVos &&
          Array.from({length: 9}).map((_, k) => {
            const d = (t - T.enVos - k * 0.22 + 20) % 2.2;
            if (t - T.enVos < k * 0.22) return null;
            return <div key={k} style={{position: 'absolute', left: 510 + (k % 2 ? 1 : -1) * (170 + (k % 3) * 36) + Math.sin(d * 3 + k) * 14, top: SUELO - 190 - d * 80, fontSize: 50 + (k % 3) * 12, opacity: 1 - d / 2.2}}>🧡</div>;
          })}
        {/* +1 */}
        {t >= T.mas && (
          <div style={{position: 'absolute', left: 800, top: 590, width: 200, textAlign: 'center', fontSize: 120, fontWeight: 900, color: VERDE, textShadow: '0 8px 0 rgba(31,27,75,0.15)', transform: `scale(${spring({frame: frame - Math.round(T.mas * fps), fps, config: {damping: 7, stiffness: 200}})}) rotate(-6deg)`}}>+1</div>
        )}
      </div>

      {/* textos (zona segura de TikTok) */}
      <div style={{position: 'absolute', top: 225, left: 60, right: 60, height: 340, textAlign: 'center'}}>
        <Capa>
          <Cap desde={T.gancho} hasta={T.h50a - 0.15} golpe style={{fontSize: 88, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05}}>
            Hacerse amigo tiene <span style={{color: ROSA}}>un precio.</span>
          </Cap>
          <Cap desde={T.gancho2} hasta={T.h50a - 0.15} style={{fontSize: 46, fontWeight: 700, marginTop: 18, background: TINTA, color: 'white', padding: '6px 26px', borderRadius: 100, transform: 'rotate(-1.5deg)'}}>y un científico lo midió… en horas</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.h50a} hasta={T.h90a - 0.15} style={{fontSize: 64, fontWeight: 800, lineHeight: 1.15}}>
            <span style={{color: VERDE, fontWeight: 900}}>50 horas</span> juntos: recién ahí dejás de ser un conocido.
          </Cap>
        </Capa>
        <Capa>
          <Cap desde={T.h90a} hasta={T.trabajo - 0.15} style={{fontSize: 80, fontWeight: 900, lineHeight: 1.1}}>
            <span style={{color: NARANJA}}>90 horas:</span> ya son amigos.
          </Cap>
        </Capa>
        <Capa>
          <Cap desde={T.trabajo} hasta={T.otras - 0.15} style={{fontSize: 62, fontWeight: 900, lineHeight: 1.15}}>
            Pero ojo: las horas de trabajo casi no cuentan. 💼
          </Cap>
        </Capa>
        <Capa>
          <Cap desde={T.otras} hasta={T.h200q - 0.15} style={{fontSize: 84, fontWeight: 900}}>Cuentan las otras.</Cap>
          {[{at: T.mates, x: 'Los mates. 🧉'}, {at: T.viajes, x: 'Los viajes. 🚗'}, {at: T.charlas, x: 'Las charlas que no llevan a ningún lado. 💬'}].map((l, k) => (
            <div key={k} style={{position: 'absolute', left: 0, right: 0, bottom: 20}}>
              <Cap desde={l.at} hasta={k < 2 ? [T.viajes, T.charlas][k] - 0.05 : T.h200q - 0.15} style={{fontSize: 46, fontWeight: 700, opacity: 0.8}}>{l.x}</Cap>
            </div>
          ))}
        </Capa>
        <Capa>
          <Cap desde={T.h200q} hasta={T.giro - 0.15} style={{fontSize: 60, fontWeight: 800}}>¿Y un amigo de verdad?</Cap>
          <Cap desde={T.h200a} hasta={T.giro - 0.15} golpe style={{fontSize: 112, fontWeight: 900, letterSpacing: -3, color: ROSA, marginTop: 6, textShadow: '0 8px 0 rgba(31,27,75,0.14)'}}>Más de 200.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.giro} hasta={T.amigo - 0.15} style={{fontSize: 54, fontWeight: 700, lineHeight: 1.2, opacity: 0.8}}>Si de grande te cuesta hacer amigos…</Cap>
          <Cap desde={T.noSosVos} hasta={T.amigo - 0.15} golpe style={{fontSize: 104, fontWeight: 900, letterSpacing: -3, marginTop: 8}}>no sos vos.</Cap>
          <Cap desde={T.faltan} hasta={T.amigo - 0.15} golpe style={{fontSize: 70, fontWeight: 900, marginTop: 12, background: 'white', color: AZUL, padding: '4px 30px', borderRadius: 26, transform: 'rotate(-2deg)', boxShadow: '0 8px 0 rgba(31,27,75,0.18)'}}>Te faltan horas.</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.amigo} hasta={T.cierre - 0.15} style={{fontSize: 50, fontWeight: 800, lineHeight: 1.2}}>Y ese amigo que ya tenés…</Cap>
          <Cap desde={T.gasto} hasta={T.cierre - 0.15} style={{fontSize: 56, fontWeight: 900, lineHeight: 1.15, marginTop: 6}}>
            gastó <span style={{color: '#e09600'}}>200 horas de su vida</span>
          </Cap>
          <Cap desde={T.enVos} hasta={T.cierre - 0.15} golpe style={{fontSize: 104, fontWeight: 900, letterSpacing: -3, lineHeight: 1.1, color: ROSA, textShadow: '0 8px 0 rgba(31,27,75,0.14)'}}>en vos. 🧡</Cap>
        </Capa>
        <Capa>
          <Cap desde={T.cierre} hasta={T.dur + 1} golpe style={{fontSize: 124, fontWeight: 900, letterSpacing: -4}}>Mandáselo.</Cap>
          <Cap desde={T.mas} hasta={T.dur + 1} style={{fontSize: 64, fontWeight: 800, marginTop: 6}}>
            Y sumen <span style={{color: VERDE, fontWeight: 900}}>una más.</span>
          </Cap>
        </Capa>
      </div>

      {/* tarjeta de Gustavo */}
      <div style={{position: 'absolute', top: 1400, left: 40, right: 40, display: 'flex', justifyContent: 'center'}}>
        <Cap desde={T.gustavo} hasta={T.otras - 0.15} golpe style={{display: 'flex', alignItems: 'center', gap: 20, background: 'white', border: `5px solid ${TINTA}`, borderRadius: 30, padding: '10px 30px 10px 14px', boxShadow: '0 8px 0 rgba(31,27,75,0.22)'}}>
          <div style={{width: 96, height: 96, borderRadius: 96, background: '#e9e4f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58}}>👔</div>
          <div style={{textAlign: 'left', lineHeight: 1.15}}>
            <div style={{fontSize: 38, fontWeight: 900}}>Gustavo, de Contabilidad</div>
            <div style={{fontSize: 32, fontWeight: 700, opacity: t >= T.perro ? 1 : 0.55}}>{t >= T.perro ? '¿Tiene perro? Ni idea. 🤷' : '1 año sentado al lado tuyo'}</div>
          </div>
        </Cap>
      </div>

      {/* llamado a la acción */}
      <div style={{position: 'absolute', top: 1436, left: 30, right: 30, display: 'flex', justifyContent: 'center'}}>
        <Cap desde={T.cta} hasta={T.dur + 1} golpe style={{fontSize: 38, fontWeight: 800, whiteSpace: 'nowrap', color: 'white', background: TINTA, padding: '14px 30px', borderRadius: 100, border: '5px solid white', boxShadow: '0 8px 0 rgba(31,27,75,0.25)'}}>
          Mandáselo a tu amigo de +200 horas 🧡
        </Cap>
      </div>

      <Audio src={staticFile('amigos-mezcla.wav')} />
    </AbsoluteFill>
  );
};
