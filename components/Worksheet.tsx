
import React, { useState } from 'react';
import { DictationItem, DictationMode } from '../types';
import { Printer, Eye, EyeOff, ArrowLeft, ExternalLink } from 'lucide-react';

interface WorksheetProps {
  items: DictationItem[];
  mode: DictationMode;
  onBack: () => void;
}

const Worksheet: React.FC<WorksheetProps> = ({ items, mode, onBack }) => {
  const [showAnswers, setShowAnswers] = useState(false);

  const handlePrint = () => {
    // Check if running inside an iframe (like Project IDX preview)
    const isIframe = window.self !== window.top;
    
    if (isIframe) {
      alert("⚠️ 瀏覽器限制：\n\n在預覽窗口中無法直接打印。\n\n請點擊編輯器右上角的「Open in New Tab」圖標，在獨立網頁窗口中打開後即可正常打印/導出 PDF。");
      return;
    }
    
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('zh-HK');

  return (
    <div className="min-h-screen bg-slate-100 pb-20 print:bg-white print:p-0">
      
      {/* Navbar - Hidden when printing */}
      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm flex items-center justify-between print:hidden z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold">
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        <h2 className="font-bold text-lg text-slate-800">練習卷預覽 (Preview)</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnswers ? '隱藏答案' : '顯示答案'}
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            打印 / 另存為PDF
          </button>
        </div>
      </div>

      {/* Helper text for PDF */}
      <div className="max-w-[210mm] mx-auto mt-4 px-4 print:hidden space-y-2">
        <p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2 items-start">
            <span className="text-blue-600">ℹ️</span> 
            <span>
              <strong>如何導出 PDF：</strong> 點擊上方打印按鈕，在打印目的地選擇「另存為 PDF」。
              <br/>
              如果沒有反應，請確保您是在<strong>獨立的瀏覽器分頁</strong>中打開此網頁，而不是在編輯器的預覽框中。
            </span>
        </p>
      </div>

      {/* Worksheet Paper */}
      <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-lg mt-4 mb-8 p-[20mm] print:shadow-none print:m-0 print:w-full print:p-[15mm] print:border-none">
        
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-8">
          <h1 className="text-3xl font-black text-center mb-6 tracking-widest text-slate-900">
            默書練習卷
            <span className="text-sm font-normal block mt-1 tracking-normal text-slate-500 print:text-black">
               {mode === 'paragraph' ? '段落填充 (Paragraph Cloze)' : mode === 'idiom' ? '成語釋義 (Idioms)' : '詞語填空 (Sentence Completion)'}
            </span>
          </h1>
          <div className="flex justify-between text-lg font-serif text-slate-900">
            <div className="flex gap-2">
              <span>姓名:</span>
              <span className="border-b border-black w-32 inline-block"></span>
            </div>
            <div className="flex gap-2">
              <span>日期:</span>
              <span className="border-b border-black w-32 inline-block text-center">{currentDate}</span>
            </div>
            <div className="flex gap-2">
              <span>分數:</span>
              <span className="border-b border-black w-20 inline-block"></span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 font-serif text-slate-900">
          
          {mode === 'paragraph' ? (
            <div className="space-y-4">
               <div className="bg-gray-100 p-4 border rounded-lg text-sm text-gray-700 print:bg-gray-100 print:text-black print:border-gray-300 mb-4">
                  <span className="font-bold">說明：</span> 請閱讀下文，並在橫線上填寫正確的字詞（注意上下文）。
               </div>
               
               {/* Continuous Paragraph Block with Proper Indentation */}
               <div className="text-xl leading-9 text-justify tracking-wide">
                 {items.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {/* Paragraph Break Logic */}
                      {item.isNewParagraph && (
                        <div className={`w-full ${idx === 0 ? '' : 'h-6'}`}></div>
                      )}
                      
                      {/* Content with Indentation for new paragraphs */}
                      <span className={`inline ${item.isNewParagraph ? 'indent-8 inline-block' : ''}`}>
                        {showAnswers ? (
                          <span className="text-green-700 font-bold mx-0.5">{item.content}</span>
                        ) : (
                          <span className="mx-0.5">{item.clozeContent || item.content}</span>
                        )}
                      </span>
                    </React.Fragment>
                 ))}
               </div>

               {showAnswers && (
                 <div className="mt-8 pt-8 border-t border-dashed border-gray-300 print:block">
                    <h3 className="font-bold text-lg mb-4">參考答案全文：</h3>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {items.map((item, idx) => (
                        <React.Fragment key={idx}>
                          {item.isNewParagraph && idx > 0 && <br className="mb-2 block"/>}
                          <span>{item.content}</span>
                        </React.Fragment>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          ) : mode === 'vocab' ? (
             <div className="space-y-8">
                <div className="bg-gray-100 p-4 border rounded-lg text-sm text-gray-700 print:bg-gray-100 print:text-black print:border-gray-300 mb-4">
                  <span className="font-bold">說明：</span> 請根據句意，在橫線上填入正確的詞語。
                </div>

                {items.map((item, idx) => (
                   <div key={item.id} className="border-b border-dashed border-gray-200 pb-6 break-inside-avoid">
                      <div className="flex gap-2 text-xl mb-3">
                         <span className="font-bold w-6">{idx + 1}.</span>
                         <div className="flex-1 leading-relaxed">
                            {/* Sentence Line */}
                            {showAnswers && item.example ? (
                               <span className="text-green-700 font-bold">{item.example}</span>
                            ) : (
                               <span>{item.clozeContent || item.example || "__________________"}</span>
                            )}
                         </div>
                      </div>
                      
                      {/* Hint Line - Only show when answers are revealed */}
                      {showAnswers && (
                        <div className="pl-8 text-sm text-green-600 italic">
                           提示 (Meaning): {item.meaning}
                        </div>
                      )}
                   </div>
                ))}

                {showAnswers && (
                  <div className="mt-8 pt-8 border-t border-dashed border-gray-300 print:block">
                     <h3 className="font-bold text-lg mb-4">參考答案：</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {items.map((item, idx) => (
                         <div key={idx} className="text-sm text-gray-600">
                           {idx + 1}. {item.content}
                         </div>
                       ))}
                     </div>
                  </div>
                )}
             </div>
          ) : (
            // Idiom Grid Layout (Keep as is for Idioms)
            <div className="w-full">
               <div className="grid grid-cols-12 gap-4 border-b-2 border-black pb-2 mb-4 font-bold text-lg">
                 <div className="col-span-1">#</div>
                 <div className="col-span-7">成語釋義 (Meaning)</div>
                 <div className="col-span-4">默寫 (Write Here)</div>
               </div>

               {items.map((item, idx) => (
                 <div key={item.id} className="grid grid-cols-12 gap-4 items-center border-b border-gray-200 py-4 break-inside-avoid">
                   <div className="col-span-1 font-bold text-gray-500">{idx + 1}</div>
                   
                   <div className="col-span-7 text-lg">
                      {item.meaning || "請默寫..."}
                      {item.subContent && showAnswers && (
                        <span className="block text-sm text-gray-400 mt-1">{item.subContent}</span>
                      )}
                   </div>
                   
                   <div className="col-span-4 relative h-12">
                      {showAnswers ? (
                         <div className="absolute inset-0 flex items-center text-2xl font-kaiti text-green-700 font-bold">
                            {item.content}
                         </div>
                      ) : (
                         <div className="w-full h-full border-b border-black"></div>
                      )}
                   </div>
                 </div>
               ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-slate-400 print:text-black">
           <p>默書小助手生成的練習卷</p>
        </div>

      </div>
    </div>
  );
};

export default Worksheet;
