import React, { useState, useRef } from 'react';
import { WriterBox } from './components/WriterBox';
import { TianZiGe } from './components/TianZiGe';
import { generatePracticeContent, getPinyinForText } from './services/geminiService';
import { CharacterData } from './types';
import { Sparkles, PenTool, BookOpen, Cat, Sun, Type, Download, FileText } from 'lucide-react';

const SUGGESTED_TOPICS = [
  { icon: <Sun size={18} />, label: 'Seasons (四季)', value: 'Words related to Spring, Summer, Autumn, Winter' },
  { icon: <Cat size={18} />, label: 'Animals (动物)', value: 'Common animals like Cat, Dog, Panda' },
  { icon: <BookOpen size={18} />, label: 'School (学校)', value: 'Things found in school' },
  { icon: <Sparkles size={18} />, label: 'Colors (颜色)', value: 'Basic colors' },
];

export default function App() {
  const [inputText, setInputText] = useState('');
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'ai'>('custom');
  
  // State for PDF generation
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText) return;
    setLoading(true);
    const data = await getPinyinForText(inputText);
    setCharacters(data);
    setLoading(false);
  };

  const handleAIGenerate = async (topic: string) => {
    setLoading(true);
    const data = await generatePracticeContent(topic);
    setCharacters(data);
    setLoading(false);
  };

  const handleExportPDF = () => {
    if (!printRef.current) return;
    if (!(window as any).html2pdf) {
      alert("PDF generator is loading. Please try again in a moment.");
      return;
    }

    setIsExporting(true);
    // CRITICAL: Scroll to top to ensure html2canvas starts capturing from (0,0)
    window.scrollTo(0, 0);

    // Increase delay to 1000ms to allow fonts to load and the overlay to fully paint
    setTimeout(async () => {
      try {
        const element = printRef.current;
        const opt = {
          margin:       10, // mm
          filename:     'practice-sheet.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true, 
            scrollY: 0, 
            windowWidth: 1200 // Force desktop width to ensure layout is correct
          },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF Export failed", err);
        alert("Could not generate PDF. Please try again.");
      } finally {
        setIsExporting(false);
      }
    }, 1000);
  };

  return (
    <>
      {/* --- PRINT / PDF EXPORT LAYOUT --- */}
      {/* 
         This div corresponds to #print-layer in index.html.
         It is hidden by default. When isExporting is true, it gets the class 'show-for-export'
         which makes it visible, absolute, and on top.
      */}
      <div 
        id="print-layer"
        ref={printRef} 
        className={isExporting ? 'show-for-export' : ''}
      >
        <div className="w-full bg-white text-black p-8 min-h-[297mm]">
          <div className="text-center mb-8 border-b-2 border-stone-800 pb-4">
             <h1 className="text-3xl font-kaiti font-bold mb-2 text-black">汉字书写练习 Chinese Writing Practice</h1>
             <p className="text-stone-500 text-sm">Created with Little Calligrapher AI</p>
          </div>
          
          <div className="flex flex-col gap-6">
            {characters.map((data, idx) => (
              <div key={idx} className="flex items-end justify-start gap-2 break-inside-avoid page-break-inside-avoid">
                 {/* First box: Exemplar */}
                 <div className="flex flex-col items-center mr-2 min-w-[70px]">
                     <span className="text-xl font-sans mb-1 text-stone-600">{data.pinyin}</span>
                     {/* Force variant="print" */}
                     <TianZiGe size={70} variant="print" className="!border-red-600">
                        <span className="font-kaiti text-5xl leading-[70px] text-center w-full h-full block text-black">{data.char}</span>
                     </TianZiGe>
                 </div>
                 
                 {/* Practice boxes */}
                 {Array.from({length: 8}).map((_, i) => (
                     <div key={i}>
                         <TianZiGe size={70} variant="print" />
                     </div>
                 ))}
              </div>
            ))}
            
            {characters.length === 0 && (
              <div className="text-center text-gray-400 mt-20 p-10 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-xl">Practice sheet is empty.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SCREEN LAYOUT --- */}
      <div id="app-root" className="min-h-screen bg-[#faf8f5] text-stone-800 pb-20">
        <header className="bg-white border-b border-stone-100 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm">
                文
              </div>
              <h1 className="text-xl font-bold text-stone-800 tracking-tight">Little Calligrapher AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                 Ready to Practice
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Intro / Welcome */}
          {!characters.length && !loading && (
            <div className="text-center mb-12 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl font-handwriting text-stone-700 mb-4">Let's write beautiful Chinese characters!</h2>
              <p className="text-stone-400 max-w-md mx-auto">
                Enter any text to get started, or ask the Magic AI to create a practice sheet for you.
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-200 mb-8 max-w-2xl mx-auto">
            <div className="flex gap-1 mb-4 p-1 bg-stone-100 rounded-xl w-fit mx-auto">
               <button 
                onClick={() => setActiveTab('custom')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'custom' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
               >
                 Custom Text
               </button>
               <button 
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'ai' ? 'bg-white shadow-sm text-blue-600' : 'text-stone-500 hover:text-stone-700'}`}
               >
                 <Sparkles size={14} />
                 Magic Generator
               </button>
            </div>

            {activeTab === 'custom' ? (
              <form onSubmit={handleCustomSubmit} className="flex flex-col md:flex-row gap-3 p-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter characters here (e.g. 你好世界)"
                  className="flex-1 text-lg p-4 rounded-xl border-2 border-transparent bg-stone-50 focus:bg-white focus:border-red-300 focus:outline-none transition-all placeholder:text-stone-300"
                />
                <button 
                  type="submit"
                  disabled={loading || !inputText}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-md shadow-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? 'Generating...' : 'Start'}
                </button>
              </form>
            ) : (
              <div className="p-2">
                <p className="text-center text-stone-400 text-sm mb-4">Pick a topic and I'll make a worksheet for you!</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SUGGESTED_TOPICS.map((topic) => (
                    <button
                      key={topic.label}
                      onClick={() => handleAIGenerate(topic.value)}
                      disabled={loading}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-stone-100 bg-stone-50 hover:bg-blue-50 hover:border-blue-100 hover:shadow-md transition-all group"
                    >
                      <div className="text-stone-400 group-hover:text-blue-500 transition-colors">
                        {topic.icon}
                      </div>
                      <span className="text-sm font-bold text-stone-600 group-hover:text-blue-700">{topic.label}</span>
                    </button>
                  ))}
                </div>
                {loading && <div className="text-center mt-4 text-blue-500 text-sm animate-pulse">Designing your worksheet...</div>}
              </div>
            )}
          </div>

          {/* Content Area */}
          {characters.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-stone-700 flex items-center gap-2">
                    <PenTool className="text-red-400"/>
                    Practice Sheet
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors shadow-sm text-sm font-medium active:scale-95 disabled:opacity-70"
                    >
                      {isExporting ? (
                         <>
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           Generating...
                         </>
                      ) : (
                         <>
                           <Download size={18} />
                           Export PDF
                         </>
                      )}
                    </button>
                    <button 
                      onClick={() => { setCharacters([]); setInputText(''); }}
                      className="text-stone-400 hover:text-red-500 text-sm underline underline-offset-4 px-2"
                    >
                      Clear All
                    </button>
                  </div>
               </div>
               
               <div className="flex flex-wrap justify-center gap-6">
                 {characters.map((data, index) => (
                   <WriterBox 
                      key={`${data.char}-${index}`} 
                      char={data.char} 
                      pinyin={data.pinyin} 
                      definition={data.definition}
                   />
                 ))}
               </div>
            </div>
          )}

          {/* Empty State / Footer illustration filler */}
          {!characters.length && !loading && (
            <div className="flex justify-center mt-12 opacity-30 pointer-events-none">
               <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-32 h-32 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center">
                      <Type className="text-stone-300" />
                    </div>
                  ))}
               </div>
            </div>
          )}
        </main>
        
        {/* Loading Overlay during export */}
        {isExporting && (
          <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center">
             <div className="bg-white p-6 rounded-2xl flex flex-col items-center animate-in fade-in zoom-in-95">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-bold text-stone-700">Generating Practice Sheet...</p>
                <p className="text-sm text-stone-500">Please wait while we create your PDF</p>
             </div>
          </div>
        )}
      </div>
    </>
  );
}