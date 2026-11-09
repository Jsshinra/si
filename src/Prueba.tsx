import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Prueba: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 12}});
  const sub = spring({frame: frame - 18, fps, config: {damping: 14}});
  const hue = interpolate(frame, [0, 120], [260, 330]);
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, hsl(${hue},80%,18%), #050508)`, justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif'}}>
      <div style={{fontSize: 170, fontWeight: 900, color: 'white', transform: `scale(${pop}) rotate(${(1 - pop) * -12}deg)`}}>
        ¡Que onda!
      </div>
      <div style={{fontSize: 60, color: '#ffd166', marginTop: 40, opacity: sub, transform: `translateY(${(1 - sub) * 80}px)`}}>
        Videos hechos con código
      </div>
    </AbsoluteFill>
  );
};
