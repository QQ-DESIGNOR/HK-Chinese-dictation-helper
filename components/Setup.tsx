
import React, { useState, useRef } from 'react';
import { analyzeMaterial } from '../services/geminiService';
import { DictationItem, DictationMode } from '../types';
import { BookOpen, Sparkles, Upload, Image as ImageIcon, X, Languages, AlignLeft, List, ScrollText, Printer } from 'lucide-react';

interface SetupProps {
  onStart: (items: DictationItem[], mode: DictationMode, language: 'mandarin' | 'cantonese', view: 'practice' | 'worksheet') => void;
}

const Setup: React.FC<SetupProps> = ({ onStart }) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<DictationMode>('vocab');
  const [language, setLanguage] = useState<'mandarin' | 'cantonese'>('cantonese');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ mimeType: string; data: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcess = async (targetView: 'practice' | 'worksheet') => {
    if (!text.trim() && files.length === 0) return;
    setLoading(true);
    
    const items = await analyzeMaterial(text, files, mode);
    
    setLoading(false);
    onStart(items, mode, language, targetView);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      Array.from(newFiles).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1];
          setFiles(prev => [...prev, {
            mimeType: file.type,
            data: base64Data,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const loadSample = () => {
    setMode('paragraph');
    setText("今天是星期天，天氣晴朗。爸爸帶我去動物園看獅子和老虎。我們還看見了長頸鹿吃樹葉，真有趣！");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-blue-600 mb-2 flex items-center justify-center gap-3">
          <BookOpen className="w-10 h-10" />
          默書小助手
        </h1>
        <p className="text-slate-500">
          上傳圖片或PDF，選擇模式，開始練習或生成試卷！
        </p>
      </div>

      <div className="w-full bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100">
        
        {/* Mode Selection */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            onClick={() => setMode('vocab')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mode === 'vocab' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200 text-slate-500'}`}
          >
            <List className="w-6 h-6 mb-1" />
            <span className="font-bold text-sm">詞語 (Words)</span>
          </button>
          <button 
            onClick={() => setMode('idiom')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mode === 'idiom' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200 text-slate-500'}`}
          >
            <ScrollText className="w-6 h-6 mb-1" />
            <span className="font-bold text-sm">成語 (Idioms)</span>
          </button>
          <button 
            onClick={() => setMode('paragraph')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mode === 'paragraph' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-200 text-slate-500'}`}
          >
            <AlignLeft className="w-6 h-6 mb-1" />
            <span className="font-bold text-sm">段落 (Paragraphs)</span>
          </button>
        </div>

        {/* Text Area */}
        <div className="relative mb-4">
          <textarea
            className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-lg resize-none"
            placeholder="在此輸入課文內容，或使用下方按鈕上傳圖片..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {!text && files.length === 0 && (
            <button onClick={loadSample} className="absolute top-4 right-4 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100">
                試用範例
            </button>
          )}
        </div>

        {/* File Upload List */}
        <div className="space-y-2 mb-4">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <ImageIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="truncate text-green-800 font-medium">{file.name}</span>
              </div>
              <button onClick={() => removeFile(idx)} className="text-green-600 hover:text-green-800 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Controls: Upload & Language */}
        <div className="flex flex-col md:flex-row gap-4">
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             className="hidden" 
             multiple
             accept="image/*,application/pdf"
           />
           
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex-1 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 p-3 text-slate-500 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-all"
           >
             <Upload className="w-5 h-5" />
             <span>添加圖片/PDF</span>
           </button>

           <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
              <Languages className="w-5 h-5 text-slate-400 ml-2" />
              <div className="flex">
                <button 
                  onClick={() => setLanguage('cantonese')}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${language === 'cantonese' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  粵語
                </button>
                <button 
                  onClick={() => setLanguage('mandarin')}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${language === 'mandarin' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  普通話
                </button>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => handleProcess('worksheet')}
            disabled={loading || (!text.trim() && files.length === 0)}
            className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all border-2 ${
              loading || (!text.trim() && files.length === 0) 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
            }`}
          >
             <Printer className="w-5 h-5" />
             生成練習卷 (Worksheet)
          </button>

          <button
            onClick={() => handleProcess('practice')}
            disabled={loading || (!text.trim() && files.length === 0)}
            className={`flex-1 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
              loading || (!text.trim() && files.length === 0) 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <Sparkles className="animate-spin w-5 h-5" />
                正在分析...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                開始互動默書 (Start)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;
