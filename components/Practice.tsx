
import React, { useState, useEffect, useRef } from 'react';
import { DictationItem, ChatMessage, RobotEmotion, DictationMode } from '../types';
import Mascot from './Mascot';
import { chatWithAssistant, generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData, playAudioBuffer, getAudioContext } from '../services/audioUtils';
import { Send, Volume2, ChevronRight, Eye, RefreshCw, EyeOff, Play, Mic, MicOff, Globe } from 'lucide-react';

// Define SpeechRecognition types for TypeScript
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

interface PracticeProps {
  items: DictationItem[];
  mode: DictationMode;
  audioLanguage: 'mandarin' | 'cantonese';
  onBack: () => void;
}

const Practice: React.FC<PracticeProps> = ({ items, mode, audioLanguage, onBack }) => {
  // Game State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<'reading' | 'revealed'>('reading');
  const [robotEmotion, setRobotEmotion] = useState<RobotEmotion>('idle');
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: '你好！我是你的默書小助手。準備好了嗎？點擊播放按鈕開始吧！' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Voice Input State - Independent of Dictation Audio
  // Defaults to zh-HK but user can toggle.
  const [inputLang, setInputLang] = useState<string>('zh-HK');
  
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentItem = items[currentIndex];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Reset stage when index changes
    setStage('reading');
  }, [currentIndex]);

  // --- Audio Logic ---
  
  const speakText = async (text: string, isSlow: boolean = false) => {
    setRobotEmotion('speaking');

    // Strategy: Use Browser SpeechSynthesis for Cantonese (most reliable for dialect)
    // Use Gemini or Browser for Mandarin depending on complexity. 
    // To ensure consistency with the user's request for "Cantonese", we prioritize Browser TTS for it.

    if (audioLanguage === 'cantonese' || 'speechSynthesis' in window) {
      // Browser TTS
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to find a Cantonese voice
      const voices = window.speechSynthesis.getVoices();
      const cantoneseVoice = voices.find(v => v.lang.includes('HK') || v.lang.includes('yue'));
      const mandarinVoice = voices.find(v => v.lang.includes('CN') || v.lang.includes('zh'));
      
      if (audioLanguage === 'cantonese' && cantoneseVoice) {
        utterance.voice = cantoneseVoice;
        utterance.lang = 'zh-HK';
      } else {
        // Fallback or Mandarin
        if (mandarinVoice) utterance.voice = mandarinVoice;
        utterance.lang = 'zh-CN';
      }

      // Speed control based on mode/request
      utterance.rate = isSlow ? 0.7 : 0.9;
      
      utterance.onend = () => setRobotEmotion('idle');
      utterance.onerror = () => setRobotEmotion('idle');
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback logic if needed, but modern browsers support TTS.
      setRobotEmotion('idle');
      alert("你的瀏覽器不支持語音功能 (Browser TTS not supported)");
    }
  };

  const handlePlayAudio = async () => {
    if (mode === 'paragraph') {
      // Slow reading for paragraphs
      await speakText(currentItem.content, true);
    } else if (mode === 'idiom') {
      // Read Idiom, pause, then read meaning
      await speakText(currentItem.content, false);
      // We can't easily chain promises with window.speechSynthesis in a clean way without event listeners, 
      // but for simplicity, we just queue them.
      setTimeout(() => {
         speakText(`意思是：${currentItem.meaning}`, false);
      }, 2000);
    } else {
      // Vocab
      await speakText(currentItem.content, false);
    }
  };

  // --- Flow Logic ---

  const handleNext = () => {
    if (stage === 'reading') {
      setStage('revealed');
      // If needed, play the audio again or provide positive reinforcement
    } else {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setStage('reading');
        setRobotEmotion('idle');
      } else {
        // End of list
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: '恭喜你！完成了所有默書內容！🎉' }]);
        setRobotEmotion('happy');
      }
    }
  };

  // --- Voice Input Logic (STT) ---
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("你的瀏覽器不支持語音識別功能 (Browser does not support Speech Recognition)");
      return;
    }

    const recognition = new SpeechRecognition();
    // Use the independently selected inputLang
    recognition.lang = inputLang; 
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      // Stop robot speaking if user starts speaking
      window.speechSynthesis.cancel(); 
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setChatInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const cycleInputLang = () => {
    setInputLang(prev => {
      if (prev === 'zh-HK') return 'zh-CN';
      if (prev === 'zh-CN') return 'en-US';
      return 'zh-HK';
    });
  };

  const getInputLangLabel = () => {
    switch (inputLang) {
      case 'zh-HK': return '粵語 (Cantonese)';
      case 'zh-CN': return '普通話 (Mandarin)';
      case 'en-US': return '英文 (English)';
      default: return inputLang;
    }
  };


  // --- Chat Logic ---
  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setRobotEmotion('thinking');

    const historyForAi = messages.slice(-5).map(m => ({ role: m.role, text: m.text || '' }));
    
    const context = `Mode: ${mode}. Current Item: ${currentItem.content}. Meaning: ${currentItem.meaning}. Full List: ${items.map(i => i.content).join(', ')}`;

    const reply = await chatWithAssistant(historyForAi, chatInput, context);
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: reply }]);
    setRobotEmotion('idle');
    
    // Play assistant voice using Gemini TTS (optional, keeps the robot distinct from dictation voice)
    const audioBase64 = await generateSpeech(reply);
    if (audioBase64) {
       try {
        const audioBytes = decode(audioBase64);
        const audioContext = getAudioContext();
        const audioBuffer = await decodeAudioData(audioBytes, audioContext);
        playAudioBuffer(audioBuffer);
       } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-w-7xl mx-auto overflow-hidden bg-[#F0F9FF]">
      
      {/* Left Panel: Robot & Chat */}
      <div className="md:w-1/3 p-4 flex flex-col bg-white border-r border-blue-100 shadow-sm z-10">
        <div className="flex flex-col items-center p-4 border-b border-gray-100 bg-blue-50/50 rounded-2xl mb-4">
          <Mascot emotion={robotEmotion} onClick={() => setRobotEmotion('happy')} />
          <h2 className="mt-4 text-xl font-bold text-slate-700">默書小助手</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-gray-100 text-slate-700 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleChatSubmit} className="mt-4 relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full focus-within:ring-2 focus-within:ring-blue-400 transition-all">
             {/* Language Toggle */}
             <button 
                type="button"
                onClick={cycleInputLang}
                className="pl-3 pr-2 py-3 text-slate-400 hover:text-blue-500 border-r border-gray-200 flex items-center gap-1 text-xs font-bold transition-colors"
                title="切換語音識別語言 (Switch Language)"
             >
                <Globe className="w-4 h-4" />
                {inputLang === 'zh-HK' ? '粵' : inputLang === 'zh-CN' ? '普' : 'En'}
             </button>

             <input
                type="text"
                className="flex-1 px-3 py-3 bg-transparent outline-none min-w-0"
                placeholder={isListening ? "正在聆聽..." : "問我問題..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
            />
            {/* Mic Button */}
            <button 
                type="button"
                onClick={toggleListening}
                className={`mr-2 p-1.5 rounded-full transition-all ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'
                }`}
            >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          
          <button type="submit" className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md">
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
           語音輸入: <span className="font-bold text-blue-500">{getInputLangLabel()}</span>
        </p>
      </div>

      {/* Right Panel: Workspace */}
      <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-start overflow-y-auto">
        
        {/* Progress */}
        <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ← 退出 (Exit)
            </button>
            <div className="flex flex-col items-end">
                <span className="text-slate-500 font-bold text-sm">進度: {currentIndex + 1} / {items.length}</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                    <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>

        {/* Card Area */}
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center relative border-4 border-white ring-4 ring-blue-50 flex flex-col items-center justify-center min-h-[400px]">
            
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-bold mb-8">
               {mode === 'paragraph' ? '段落默寫' : mode === 'idiom' ? '成語默寫' : '詞語默寫'}
            </span>

            {/* Content Display */}
            <div className="flex-1 flex flex-col items-center justify-center w-full mb-8">
               {stage === 'revealed' ? (
                 <div className="animate-in fade-in zoom-in duration-300 w-full">
                    <h1 className={`${mode === 'paragraph' ? 'text-2xl leading-loose text-left' : 'text-6xl text-center'} font-black text-slate-800 tracking-wider mb-4`}>
                        {currentItem.content}
                    </h1>
                    {/* Sub Content (Pinyin) */}
                    {currentItem.subContent && (
                        <p className="text-xl text-blue-500 font-medium mb-2">{currentItem.subContent}</p>
                    )}
                    {/* Meaning */}
                    {currentItem.meaning && (
                        <p className="text-lg text-slate-400">{currentItem.meaning}</p>
                    )}
                 </div>
               ) : (
                 <div className="w-full">
                    {/* Hidden State */}
                    <div className="mb-8">
                        {mode === 'paragraph' ? (
                            <div className="space-y-3">
                                <div className="h-6 bg-slate-100 rounded w-full animate-pulse"></div>
                                <div className="h-6 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                            </div>
                        ) : (
                            <h1 className="text-6xl font-black text-slate-100 tracking-wider select-none">???</h1>
                        )}
                    </div>
                    
                    <button 
                        onClick={handlePlayAudio}
                        className="group relative inline-flex items-center gap-3 px-10 py-5 bg-orange-400 hover:bg-orange-500 text-white rounded-full font-bold text-2xl shadow-lg shadow-orange-100 transform active:scale-95 transition-all"
                    >
                        <Volume2 className="w-8 h-8 group-hover:animate-pulse" />
                        <span className="relative z-10">播放 (Play)</span>
                        {/* Ping effect */}
                        <span className="absolute -inset-1 rounded-full bg-orange-400 opacity-30 group-hover:animate-ping"></span>
                    </button>
                    
                    <p className="mt-6 text-slate-400 text-sm">
                        {audioLanguage === 'cantonese' ? '正在使用粵語朗讀' : '正在使用普通話朗讀'}
                    </p>
                 </div>
               )}
            </div>

            {/* Action Bar */}
            <div className="w-full border-t border-slate-100 pt-8 mt-auto">
               {stage === 'reading' ? (
                  <button 
                    onClick={handleNext}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl shadow-lg flex items-center justify-center gap-3"
                  >
                    <Eye className="w-6 h-6" />
                    查看答案 (Check Answer)
                  </button>
               ) : (
                  <div className="flex gap-4">
                     <button 
                        onClick={handlePlayAudio}
                        className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-lg"
                     >
                        <RefreshCw className="w-6 h-6" />
                     </button>
                     <button 
                        onClick={handleNext}
                        className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xl shadow-lg flex items-center justify-center gap-3"
                     >
                        {currentIndex < items.length - 1 ? '下一個 (Next)' : '完成 (Finish)'}
                        <ChevronRight className="w-6 h-6" />
                     </button>
                  </div>
               )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default Practice;
