'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { mockAnemia, mockLiver } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Reading report...');
  
  const { language, toggleLanguage, setReportData } = useStore();
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
  });

  const loadingSequence = ['Reading report...', 'Translating...', 'Mapping body...', 'Almost there...'];

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    let sequenceIndex = 0;
    const interval = setInterval(() => {
      sequenceIndex = (sequenceIndex + 1) % loadingSequence.length;
      setLoadingText(loadingSequence[sequenceIndex]);
    }, 2000);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/analyze-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Image: base64,
            mimeType: file.type,
            language: language,
            isPDF: file.type === 'application/pdf',
          }),
        });

        const data = await res.json();
        const { saveReportToHistory } = useStore.getState();
        setReportData(data);
        saveReportToHistory();
        clearInterval(interval);
        router.push('/dashboard');
      };
    } catch (error) {
      console.error('Upload error:', error);
      setLoading(false);
      clearInterval(interval);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0F172A] relative overflow-hidden">
      {/* Background Aurora Effect Mock */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-2xl text-center space-y-8"
      >
        <header className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight">
            Report<span className="text-[#f59e0b]">Raahat</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Empowering patients with clear, compassionate health insights.
          </p>
        </header>

        <div className="flex justify-center gap-4">
          <Button 
            variant={language === 'EN' ? 'default' : 'outline'}
            className={language === 'EN' ? 'bg-[#f59e0b] hover:bg-orange-600' : ''}
            onClick={() => language !== 'EN' && toggleLanguage()}
          >
            English
          </Button>
          <Button 
            variant={language === 'HI' ? 'default' : 'outline'}
            className={language === 'HI' ? 'bg-[#f59e0b] hover:bg-orange-600' : ''}
            onClick={() => language !== 'HI' && toggleLanguage()}
          >
            हिन्दी
          </Button>
        </div>

        <Card className="p-8 bg-slate-900 border-slate-800 relative group overflow-hidden">
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4
              ${isDragActive ? 'border-[#f59e0b] bg-slate-800' : 'border-slate-700 hover:border-slate-500'}
              ${file ? 'animate-pulse-orange border-[#f59e0b]' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {preview ? (
              <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <>
                <div className="p-4 bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-[#f59e0b]" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">Drop your lab report here</p>
                  <p className="text-sm text-slate-500">or click to browse (JPG, PNG)</p>
                </div>
              </>
            )}
          </div>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-6"
              >
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-14 text-lg bg-[#f59e0b] hover:bg-orange-600 text-white gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {loadingText}
                    </>
                  ) : (
                    <>
                      Analyze Report <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <div className="h-px w-8 bg-slate-800" />
              <span>Or try a sample</span>
              <div className="h-px w-8 bg-slate-800" />
            </div>
            <Button 
              variant="ghost" 
              onClick={() => {
                const { saveReportToHistory } = useStore.getState();
                setReportData(mockAnemia);
                saveReportToHistory();
                router.push('/dashboard');
              }}
              className="text-slate-400 hover:text-[#f59e0b] hover:bg-orange-500/10 gap-2"
            >
              <FileText className="w-4 h-4" /> Load Demo Report (Anemia)
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                const { saveReportToHistory } = useStore.getState();
                setReportData(mockLiver);
                saveReportToHistory();
                router.push('/dashboard');
              }}
              className="text-slate-400 hover:text-green-500 hover:bg-green-500/10 gap-2"
            >
              <FileText className="w-4 h-4" /> Load Demo Report (Liver)
            </Button>
          </div>
        </Card>

        {/* Placeholder for Lottie Avatar */}
        <div className="fixed bottom-8 right-8">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-24 h-24 bg-slate-800 rounded-full border-2 border-[#f59e0b] flex items-center justify-center shadow-xl"
          >
            <span className="text-4xl">👨‍⚕️</span>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
