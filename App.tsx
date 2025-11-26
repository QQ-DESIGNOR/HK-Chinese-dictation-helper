
import React, { useState } from 'react';
import Setup from './components/Setup';
import Practice from './components/Practice';
import Worksheet from './components/Worksheet';
import { DictationItem, AppState, DictationMode } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    view: 'setup',
    mode: 'vocab',
    audioLanguage: 'cantonese',
    dictationList: [],
    currentIndex: 0,
  });

  const handleStart = (items: DictationItem[], mode: DictationMode, language: 'mandarin' | 'cantonese', targetView: 'practice' | 'worksheet' = 'practice') => {
    if (items.length === 0) {
      alert("未能提取到內容，請檢查文件是否清晰。(Could not extract content, please check your files)");
      return;
    }
    setAppState(prev => ({
      ...prev,
      view: targetView,
      dictationList: items,
      mode: mode,
      audioLanguage: language,
      currentIndex: 0
    }));
  };

  const handleBack = () => {
    setAppState(prev => ({
      ...prev,
      view: 'setup',
      dictationList: [],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-slate-800 font-sans selection:bg-blue-200">
      {appState.view === 'setup' && (
        <Setup onStart={handleStart} />
      )}
      
      {appState.view === 'practice' && (
        <Practice 
          items={appState.dictationList}
          mode={appState.mode}
          audioLanguage={appState.audioLanguage}
          onBack={handleBack}
        />
      )}

      {appState.view === 'worksheet' && (
        <Worksheet 
          items={appState.dictationList}
          mode={appState.mode}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default App;
