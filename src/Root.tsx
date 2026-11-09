import {Composition} from 'remotion';
import {Prueba} from './Prueba';

// Formato TikTok / Reels: vertical 9:16, 1080x1920, 30 fps
export const Root: React.FC = () => (
  <Composition id="Prueba" component={Prueba} durationInFrames={120} fps={30} width={1080} height={1920} />
);
