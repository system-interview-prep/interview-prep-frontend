export type MascotMood =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'surprised'
  | 'coaching'
  | 'confused'
  | 'typing_password'
  | 'listening'
  | 'encouraging';

export interface EyePosition {
  angle: number;
  distance: number;
}

export interface MascotContainerProps {
  children?: React.ReactNode;
  mood?: MascotMood;
  speechText?: string | null;
  className?: string;
}
