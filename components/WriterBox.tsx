import React, { useEffect, useRef, useState } from 'react';
import { TianZiGe } from './TianZiGe';
import { Volume2, RefreshCw, Eraser, Star, CheckCircle } from 'lucide-react';
import { gradeHandwriting, generateSpeech } from '../services/geminiService';

interface WriterBoxProps {
  char: string;
  pinyin: string;
  definition?: string;
  size?: number;
}

export const WriterBox: React.FC<WriterBoxProps> = ({ char, pinyin, definition, size = 160 }) => {
  const writerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const writerInstance = useRef<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  // Store raw base64 PCM data
  const [audioData, setAudioData] = useState<string | null>(null);

  // Initialize HanziWriter
  useEffect(() => {
    if (writerRef.current && window.HanziWriter) {
      try {
        writerInstance.current = window.HanziWriter.create(writerRef.current, char, {
          width: size,
          height: size,
          padding: 10,
          showOutline: true,
          strokeAnimationSpeed: 1, // 1x speed
          delayBetweenStrokes: 200,
          strokeColor: '#333333',
          outlineColor: '#ECD1D1',
          drawingWidth: 20, // Thick lines for kids
        });
      } catch (e) {
        console.error("Failed to load HanziWriter", e);
      }
    }

    return () => {
      // Cleanup if necessary (HanziWriter doesn't have a strict destroy method exposed easily via instance usually)
      if (writerRef.current) writerRef.current.innerHTML = '';
    };
  }, [char, size]);

  const animate = () => {
    if (writerInstance.current) {
      setIsAnimating(true);
      writerInstance.current.animateCharacter({
        onComplete: () => setIsAnimating(false)
      });
    }
  };

  const playSound = async () => {
    let pcm = audioData;
    if (!pcm) {
      pcm = await generateSpeech(char);
      if (pcm) {
        setAudioData(pcm);
      }
    }

    if (pcm) {
      playPCM(pcm);
    }
  };

  const playPCM = async (base64: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i=0; i<pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }

      const buffer = audioContext.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }

  // Canvas Drawing Logic
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#2563eb'; // Blue ink
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setFeedback(null);
    }
  };

  const handleGrade = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsGrading(true);
    // Create a temporary canvas to combine white background + user drawing
    // Otherwise transparent background turns black in some viewers/AI models
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, size, size);
        tCtx.drawImage(canvas, 0, 0);
        const dataUrl = tempCanvas.toDataURL('image/png');
        const result = await gradeHandwriting(char, dataUrl);
        setFeedback(result);
    }
    setIsGrading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-white rounded-xl shadow-sm border border-stone-100">
      <div className="flex justify-between w-full px-2 items-center">
        <div className="text-center">
          <span className="text-xl font-bold text-stone-600 font-sans">{pinyin}</span>
        </div>
        <button 
          onClick={playSound}
          className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 transition-colors"
          title="朗读"
        >
          <Volume2 size={16} />
        </button>
      </div>

      {/* Main Grid Container */}
      <div className="flex gap-4">
        {/* Left: Guide (HanziWriter) */}
        <div className="flex flex-col gap-1 items-center">
           <TianZiGe size={size}>
             <div ref={writerRef} className="cursor-pointer" onClick={animate} />
           </TianZiGe>
           <button 
            onClick={animate} 
            disabled={isAnimating}
            className="mt-1 text-xs flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium"
           >
             <RefreshCw size={12} className={isAnimating ? "animate-spin" : ""} />
             演示笔画
           </button>
        </div>

        {/* Right: Practice (Canvas) */}
        <div className="flex flex-col gap-1 items-center">
          <TianZiGe size={size} className="cursor-crosshair bg-white">
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 touch-none"
            />
          </TianZiGe>
          <div className="flex gap-2 mt-1">
             <button 
              onClick={clearCanvas}
              className="text-xs flex items-center gap-1 text-stone-400 hover:text-red-500"
              title="清除"
            >
              <Eraser size={14} />
            </button>
            <button 
              onClick={handleGrade}
              disabled={isGrading}
              className="text-xs flex items-center gap-1 text-emerald-500 hover:text-emerald-600 font-bold"
              title="AI 评分"
            >
              {isGrading ? (
                <span className="animate-pulse">评分中...</span>
              ) : (
                <>
                  <CheckCircle size={14} />
                  AI 评分
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Definition or Feedback */}
      <div className="mt-2 w-full max-w-[340px] text-center min-h-[40px]">
        {feedback ? (
          <div className="bg-yellow-50 text-yellow-800 p-2 rounded-lg text-sm border border-yellow-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-center gap-1 mb-1 font-bold">
               <Star size={14} className="fill-yellow-500 text-yellow-500"/> AI 点评
            </div>
            {feedback}
          </div>
        ) : (
          definition && <p className="text-stone-400 text-xs italic">{definition}</p>
        )}
      </div>
    </div>
  );
};