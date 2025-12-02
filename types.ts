export interface CharacterData {
  char: string;
  pinyin: string;
  definition?: string;
}

export interface HanziWriterInstance {
  animateCharacter: (options?: { onComplete?: () => void }) => void;
  loopCharacterAnimation: () => void;
  showCharacter: () => void;
  hideCharacter: () => void;
  quiz: (options?: any) => void;
}

// Declare global variable for the script-loaded library
declare global {
  interface Window {
    HanziWriter: any;
  }
}

export enum AppMode {
  PRACTICE = 'PRACTICE',
  GENERATING = 'GENERATING',
  FEEDBACK = 'FEEDBACK'
}
