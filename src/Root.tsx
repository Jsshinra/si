import {Composition} from 'remotion';
import {Historia, DURACION, FPS} from './Historia';
import {Amigos, AMIGOS_DURACION, AMIGOS_FPS} from './Amigos';
import {Prueba} from './Prueba';
import {Puntitos, PUNTITOS_DURACION, PUNTITOS_FPS} from './Puntitos';

// Formato TikTok / Reels: vertical 9:16, 1080x1920
export const Root: React.FC = () => (
  <>
    <Composition id="Amigos" component={Amigos} durationInFrames={AMIGOS_DURACION} fps={AMIGOS_FPS} width={1080} height={1920} />
    <Composition id="Puntitos" component={Puntitos} durationInFrames={PUNTITOS_DURACION} fps={PUNTITOS_FPS} width={1080} height={1920} />
    <Composition id="Mensaje3AM" component={Historia} durationInFrames={DURACION} fps={FPS} width={1080} height={1920} />
    <Composition id="Prueba" component={Prueba} durationInFrames={120} fps={30} width={1080} height={1920} />
  </>
);
