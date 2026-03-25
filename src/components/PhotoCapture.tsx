import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PhotoCaptureProps {
  onCapture: (imageUrl: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  className?: string;
}

export default function PhotoCapture({ onCapture, onCancel, isProcessing, className }: PhotoCaptureProps) {
  const [mode, setMode] = useState<'select' | 'camera'>('select');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMode('select');
      alert("Kon geen toegang krijgen tot de camera. Controleer je machtigingen.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Resize to reasonable dimensions for AI analysis (max 1280px)
      const MAX_DIM = 1280;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > height) {
        if (width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPreview(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const MAX_DIM = 1280;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_DIM) {
                height *= MAX_DIM / width;
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width *= MAX_DIM / height;
                height = MAX_DIM;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              setPreview(canvas.toDataURL('image/jpeg', 0.7));
            }
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onCapture(preview);
    }
  };

  return (
    <div className={cn("glass-card rounded-3xl overflow-hidden flex flex-col", className)}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-bold text-white">Foto toevoegen</h3>
        <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 relative bg-black/40 min-h-[300px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center p-4"
            >
              <img src={preview} alt="Preview" className="max-h-[250px] rounded-2xl shadow-2xl border border-white/20 object-contain" />
              <div className="mt-6 flex gap-4">
                <button 
                  onClick={() => { setPreview(null); if (mode === 'camera') startCamera(); }}
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all"
                >
                  <RefreshCw size={24} />
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={isCapturing || isProcessing}
                  className="bg-primary text-white p-3 rounded-full shadow-xl shadow-primary/20 hover:scale-110 transition-all disabled:opacity-50 relative"
                >
                  {isCapturing || isProcessing ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <Check size={24} />
                  )}
                </button>
              </div>
              
              {(isCapturing || isProcessing) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
                    <Sparkles size={16} />
                    <span>AI Sommelier analyseert...</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Dit kan even duren (Google Search actief)</p>
                </motion.div>
              )}
            </motion.div>
          ) : mode === 'camera' ? (
            <motion.div 
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button 
                  onClick={takePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center hover:scale-110 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full border-2 border-zinc-900" />
                </button>
              </div>
              <button 
                onClick={() => setMode('select')}
                className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
              >
                <X size={20} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 w-full space-y-4"
            >
              <button 
                onClick={() => setMode('camera')}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all group"
              >
                <div className="bg-primary/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <Camera className="text-primary" size={32} />
                </div>
                <span className="font-bold text-white">Camera gebruiken</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all group"
              >
                <div className="bg-zinc-800 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <Upload className="text-zinc-400" size={32} />
                </div>
                <span className="font-bold text-white">Foto uploaden</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
