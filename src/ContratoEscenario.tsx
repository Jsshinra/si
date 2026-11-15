import React from 'react';

/* Escenarios de "El contrato": el mundo de AFUERA, la oficina de ADENTRO y el ascensor que los une. */

export const MID = 1000; // suelo de afuera
export const PISO = 1400; // suelo de adentro
export const ASC_X = 850; // centro del ascensor
export const CASA_X = 390; // donde se para cada uno en su mundo

const TINTA = '#1f1b4b';
const ROSA = '#ff4f8b';
const VERDE = '#12b886';
const ORO = '#ffc400';

const Nube: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.95}>
    <rect x={0} y={34} width={190} height={46} rx={23} fill="white" />
    <circle cx={56} cy={38} r={36} fill="white" />
    <circle cx={112} cy={30} r={44} fill="white" />
    <circle cx={152} cy={48} r={26} fill="white" />
  </g>
);

export const Afuera: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: MID, overflow: 'hidden', background: 'linear-gradient(180deg, #cfeaff 0%, #ffe3ee 52%, #ffe9b8 100%)'}}>
    <svg width={1080} height={MID} viewBox={`0 0 1080 ${MID}`} style={{position: 'absolute', inset: 0}}>
      {/* sol con rayos */}
      <g transform={`translate(455 655)`}>
        <g transform={`rotate(${t * 12})`}>
          {Array.from({length: 12}).map((_, k) => (
            <rect key={k} x={-5} y={-104} width={10} height={26} rx={5} fill={ORO} transform={`rotate(${k * 30})`} />
          ))}
        </g>
        <circle r={62 + 2 * Math.sin(t * 2)} fill={ORO} stroke="white" strokeWidth={7} />
      </g>
      {/* nubes */}
      <Nube x={((t * 16 + 60) % 1400) - 220} y={592} s={0.9} />
      <Nube x={((t * 10 + 760) % 1400) - 220} y={690} s={0.65} />
      <Nube x={((t * 22 + 1100) % 1400) - 220} y={560} s={0.5} />
      {/* pájaros */}
      {[0, 1, 2].map((k) => {
        const bx = ((t * 46 + k * 110) % 1300) - 100;
        const by = 610 + k * 26 + Math.sin(t * 2 + k) * 10;
        const ala = 9 + Math.sin(t * 13 + k * 2) * 7;
        return <path key={k} d={`M${bx - 16} ${by - ala} Q${bx - 8} ${by - ala - 6} ${bx} ${by} Q${bx + 8} ${by - ala - 6} ${bx + 16} ${by - ala}`} fill="none" stroke={TINTA} strokeWidth={4.5} strokeLinecap="round" />;
      })}
      {/* colinas */}
      <ellipse cx={250} cy={MID + 40} rx={420} ry={150} fill="#bfe8c6" />
      <ellipse cx={820} cy={MID + 60} rx={460} ry={170} fill="#a9dfb6" />
      {/* cerca */}
      {Array.from({length: 9}).map((_, k) => (
        <g key={k}>
          <rect x={258 + k * 38} y={MID - 78} width={18} height={70} rx={6} fill="white" stroke={TINTA} strokeWidth={4} />
        </g>
      ))}
      <rect x={252} y={MID - 56} width={340} height={10} rx={5} fill="white" stroke={TINTA} strokeWidth={4} />
      {/* árbol */}
      <g transform={`translate(668 ${MID - 12}) rotate(${Math.sin(t * 1.3) * 1.5})`}>
        <rect x={-13} y={-150} width={26} height={150} rx={8} fill="#8a5a3c" stroke={TINTA} strokeWidth={5} />
        <circle cx={-44} cy={-170} r={52} fill="#35c98f" stroke={TINTA} strokeWidth={5} />
        <circle cx={44} cy={-176} r={56} fill="#2fbf87" stroke={TINTA} strokeWidth={5} />
        <circle cx={0} cy={-222} r={62} fill="#4ad6a0" stroke={TINTA} strokeWidth={5} />
        <circle cx={-22} cy={-216} r={7} fill="#ff6b6b" />
        <circle cx={30} cy={-190} r={7} fill="#ff6b6b" />
        <circle cx={-48} cy={-168} r={7} fill="#ff6b6b" />
      </g>
      {/* casa */}
      <g transform={`translate(24 ${MID - 280})`}>
        {/* humo */}
        {[0, 1, 2].map((k) => {
          const u = (t * 0.35 + k / 3) % 1;
          return <circle key={k} cx={196 + Math.sin(u * 5 + k) * 10} cy={30 - u * 110} r={10 + u * 16} fill="white" opacity={0.75 * (1 - u)} />;
        })}
        <rect x={178} y={36} width={34} height={70} fill="#c44569" stroke={TINTA} strokeWidth={6} />
        <rect x={30} y={130} width={200} height={150} rx={8} fill="#fffaf2" stroke={TINTA} strokeWidth={7} />
        <path d="M6 138 L130 30 L254 138 Z" fill={ROSA} stroke={TINTA} strokeWidth={7} strokeLinejoin="round" />
        <path d="M52 110 H208 M80 84 H180" stroke="#e0356f" strokeWidth={5} strokeLinecap="round" />
        <rect x={102} y={186} width={56} height={94} rx={8} fill="#7c4dff" stroke={TINTA} strokeWidth={6} />
        <circle cx={146} cy={236} r={5} fill={ORO} />
        <rect x={170} y={166} width={44} height={44} rx={6} fill="#bfe4ff" stroke={TINTA} strokeWidth={5} />
        <path d="M192 166 V210 M170 188 H214" stroke={TINTA} strokeWidth={4} />
        <rect x={46} y={166} width={40} height={44} rx={6} fill="#bfe4ff" stroke={TINTA} strokeWidth={5} />
        <path d="M66 166 V210 M46 188 H86" stroke={TINTA} strokeWidth={4} />
        <rect x={164} y={212} width={56} height={10} rx={3} fill={VERDE} stroke={TINTA} strokeWidth={3} />
        {[172, 190, 208].map((fx, k) => (
          <circle key={k} cx={fx} cy={208} r={6} fill={['#ff6b6b', ORO, '#ff8fd0'][k]} stroke={TINTA} strokeWidth={2.5} />
        ))}
      </g>
      {/* flores y arbusto */}
      {[300, 352, 470, 540, 600, 730].map((fx, k) => (
        <g key={k} transform={`translate(${fx} ${MID - 16}) rotate(${Math.sin(t * 2 + k) * 6})`}>
          <rect x={-2} y={-22} width={4} height={24} fill="#1f9d6b" />
          <circle cy={-26} r={9} fill={['#ff6b6b', ORO, '#ff8fd0', '#7c4dff', '#ffffff', '#ff6b6b'][k]} stroke={TINTA} strokeWidth={3} />
        </g>
      ))}
    </svg>
  </div>
);

export const Adentro: React.FC<{t: number; luz: number}> = ({t, luz}) => {
  const H = 1920 - MID - 14;
  const piso = PISO - MID - 14;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: MID + 14, height: H, overflow: 'hidden', background: '#dbeeea', filter: `brightness(${luz})`}}>
      <svg width={1080} height={H} viewBox={`0 0 1080 ${H}`} style={{position: 'absolute', inset: 0}}>
        {/* techo */}
        <rect x={0} y={0} width={1080} height={54} fill="#c3ddd8" />
        {Array.from({length: 10}).map((_, k) => (
          <line key={k} x1={k * 120} y1={0} x2={k * 120} y2={54} stroke="#a9c9c3" strokeWidth={4} />
        ))}
        {[140, 470].map((x) => (
          <g key={x}>
            <rect x={x} y={16} width={240} height={20} rx={10} fill="white" />
            <rect x={x - 20} y={6} width={280} height={40} rx={20} fill="white" opacity={0.35} />
          </g>
        ))}
        {/* pared: zócalo y paneles */}
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={k * 190 - 10} y={74} width={180} height={piso - 96} rx={8} fill="none" stroke="#bcd9d4" strokeWidth={5} />
        ))}
        <rect x={0} y={piso - 22} width={1080} height={22} fill="#b3d0cb" />
        {/* cuadro motivacional */}
        <g transform="translate(336 150) scale(0.86)">
          <rect width={170} height={120} rx={8} fill="white" stroke={TINTA} strokeWidth={6} />
          <path d="M22 92 L58 62 L88 78 L146 30" fill="none" stroke={VERDE} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M146 30 l-22 2 M146 30 l-2 22" stroke={VERDE} strokeWidth={8} strokeLinecap="round" />
        </g>
        {/* piso con baldosas */}
        <rect x={0} y={piso} width={1080} height={H - piso} fill="#93b6b1" />
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={k} x1={0} y1={piso + 40 + k * k * 22 + k * 50} x2={1080} y2={piso + 40 + k * k * 22 + k * 50} stroke="#7fa49f" strokeWidth={4} />
        ))}
        {Array.from({length: 13}).map((_, k) => (
          <line key={k} x1={540 + (k - 6) * 120} y1={piso} x2={540 + (k - 6) * 330} y2={H} stroke="#7fa49f" strokeWidth={4} />
        ))}
        <rect x={0} y={piso} width={1080} height={10} fill="#6f948f" />
        {/* cubículo */}
        <rect x={-10} y={piso - 250} width={330} height={250} rx={10} fill="#a7c4d6" stroke={TINTA} strokeWidth={6} />
        <rect x={-10} y={piso - 250} width={330} height={20} fill="#7fa3b8" stroke={TINTA} strokeWidth={6} />
        {[0, 1].map((k) => (
          <rect key={k} x={20 + k * 44} y={piso - 214} width={34} height={34} fill={['#ffe066', '#ff9ecb'][k]} stroke={TINTA} strokeWidth={3} transform={`rotate(${k ? 5 : -4} ${37 + k * 44} ${piso - 197})`} />
        ))}
        {/* escritorio */}
        <g transform={`translate(30 ${piso - 226})`}>
          <rect x={86} y={30} width={160} height={110} rx={12} fill={TINTA} />
          <rect x={98} y={42} width={136} height={86} rx={6} fill="#7dffb0" opacity={0.85 + 0.15 * Math.sin(t * 9)} />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={110} y={54 + k * 17} width={50 + ((Math.floor(t * 4) + k * 37) % 56)} height={7} rx={3.5} fill="#0e1512" opacity={0.6} />
          ))}
          <rect x={156} y={140} width={22} height={22} fill={TINTA} />
          <rect x={126} y={156} width={82} height={8} rx={4} fill={TINTA} />
          {/* teclado */}
          <rect x={196} y={150} width={70} height={12} rx={4} fill="#e9e6f7" stroke={TINTA} strokeWidth={3} />
          {/* taza con vapor */}
          <rect x={30} y={132} width={30} height={30} rx={6} fill="white" stroke={TINTA} strokeWidth={4} />
          <path d="M60 140 q14 2 0 16" fill="none" stroke={TINTA} strokeWidth={4} />
          {[0, 1].map((k) => {
            const u = (t * 0.6 + k / 2) % 1;
            return <path key={k} d={`M${40 + k * 10} ${126 - u * 30} q6 -8 0 -16`} fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" opacity={1 - u} />;
          })}
          {/* pila de papeles */}
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={-4 + (k % 2) * 4} y={150 - k * 7} width={0} height={0} />
          ))}
          <rect x={10} y={162} width={280} height={22} rx={8} fill="#5a4a8a" stroke={TINTA} strokeWidth={5} />
          <rect x={28} y={184} width={18} height={44} fill={TINTA} />
          <rect x={254} y={184} width={18} height={44} fill={TINTA} />
          <rect x={52} y={188} width={90} height={38} rx={4} fill="#6f5fa3" stroke={TINTA} strokeWidth={4} />
          <circle cx={97} cy={207} r={4} fill={ORO} />
        </g>
        {/* dispenser de agua */}
        <g transform={`translate(520 ${piso - 190})`}>
          <rect x={6} y={0} width={48} height={64} rx={16} fill="#bfe8ff" stroke={TINTA} strokeWidth={5} />
          <circle cx={30 + Math.sin(t * 3) * 6} cy={40 - ((t * 20) % 30)} r={4} fill="white" opacity={0.8} />
          <rect x={0} y={62} width={60} height={128} rx={8} fill="white" stroke={TINTA} strokeWidth={5} />
          <rect x={12} y={84} width={14} height={10} rx={3} fill="#3fb6d9" />
          <rect x={34} y={84} width={14} height={10} rx={3} fill="#ff6b6b" />
        </g>
        {/* planta */}
        <g transform={`translate(690 ${piso})`}>
          {[-34, -12, 12, 34].map((a, k) => (
            <path key={k} d="M0 -50 Q-16 -110 0 -160 Q16 -110 0 -50 Z" fill={k % 2 ? '#2fbf87' : '#4ad6a0'} stroke={TINTA} strokeWidth={4} transform={`rotate(${a + Math.sin(t * 1.5 + k) * 2} 0 -50)`} />
          ))}
          <path d="M-30 -56 h60 l-8 56 h-44 z" fill="#ff922b" stroke={TINTA} strokeWidth={5} strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
};

export const Ascensor: React.FC<{cabY: number; t: number}> = ({cabY, t}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
    {/* techito de la entrada */}
    <path d={`M${ASC_X - 116} 760 L${ASC_X} 716 L${ASC_X + 116} 760 Z`} fill={TINTA} stroke="white" strokeWidth={6} strokeLinejoin="round" />
    {/* hueco */}
    <rect x={ASC_X - 92} y={752} width={184} height={PISO - 752} rx={16} fill="#2b2766" stroke="white" strokeWidth={6} />
    <line x1={ASC_X - 60} y1={760} x2={ASC_X - 60} y2={PISO - 6} stroke="#3d3888" strokeWidth={4} />
    <line x1={ASC_X + 60} y1={760} x2={ASC_X + 60} y2={PISO - 6} stroke="#3d3888" strokeWidth={4} />
    {/* cable */}
    <line x1={ASC_X} y1={760} x2={ASC_X} y2={cabY + 8} stroke="#8a86c7" strokeWidth={5} />
    {/* cabina */}
    <rect x={ASC_X - 80} y={cabY + 6} width={160} height={232} rx={14} fill="#f6f3ff" stroke="#b9b3e6" strokeWidth={7} />
    <rect x={ASC_X - 80} y={cabY + 6} width={160} height={26} rx={12} fill="#b9b3e6" />
    <circle cx={ASC_X} cy={cabY + 19} r={7} fill={ORO} opacity={0.7 + 0.3 * Math.sin(t * 8)} />
    <rect x={ASC_X - 70} y={cabY + 150} width={140} height={7} rx={3.5} fill="#cfc9ee" />
    {/* botoneras */}
    {[MID - 150, PISO - 150].map((by, k) => (
      <g key={k}>
        <rect x={ASC_X - 134} y={by} width={30} height={56} rx={8} fill="white" stroke={TINTA} strokeWidth={4} />
        <circle cx={ASC_X - 119} cy={by + 17} r={6} fill={k ? '#c9c6e4' : VERDE} />
        <circle cx={ASC_X - 119} cy={by + 39} r={6} fill={k ? ROSA : '#c9c6e4'} />
      </g>
    ))}
  </svg>
);
