export type MascotMood =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'surprised'
  | 'coaching'
  | 'confused'
  | 'encouraging'
  | 'listening'
  | 'celebrating';

export interface EyePosition {
  angle: number;
  distance: number;
}

export interface MascotContainerProps {
  children?: React.ReactNode;
  mood?: MascotMood;
  speechText?: string | null;
  className?: string;
  hidden?: boolean;
}
