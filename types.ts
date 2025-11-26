
export type DictationMode = 'paragraph' | 'vocab' | 'idiom';

export interface DictationItem {
  id: string;
  content: string; // The main text (Sentence, Word, or Idiom)
  subContent?: string; // Pinyin or Meaning
  meaning?: string; // Translation or detailed meaning
  example?: string; // Full example sentence (for Vocab mode)
  clozeContent?: string; // Content with blanks for worksheets
  isNewParagraph?: boolean; // Indicates if this item starts a new paragraph
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text?: string;
  audioData?: string; // Base64 audio
  isAudio?: boolean;
}

export type RobotEmotion = 'idle' | 'happy' | 'thinking' | 'speaking' | 'sad';

export interface AppState {
  view: 'setup' | 'practice' | 'worksheet' | 'report';
  mode: DictationMode;
  audioLanguage: 'mandarin' | 'cantonese';
  dictationList: DictationItem[];
  currentIndex: number;
}
