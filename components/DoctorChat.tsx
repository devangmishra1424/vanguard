'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  User,
  Bot,
  Volume2,
  X,
  MessageSquare,
  Sparkles,
  Loader2,
  Globe,
  Pause,
  Play,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  isTranslating?: boolean;
};

export const DoctorChat = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }): React.ReactElement | null => {
  const { summary, labValues, language, jargonMap, addXP } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayLang, setDisplayLang] = useState<'EN' | 'HI'>('EN');
  const [speechState, setSpeechState] = useState<{ id: number | null, paused: boolean }>({ id: null, paused: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const parseMessage = (content: string) => {
    const enMatch = content.match(/EN:([\s\S]*?)(?=HI:|$)/);
    const hiMatch = content.match(/HI:([\s\S]*?)$/);
    return {
      en: enMatch ? enMatch[1].trim() : content,
      hi: hiMatch ? hiMatch[1].trim() : ''
    };
  };

  const lowValues = labValues.filter((v: any) => v.status === 'LOW').map((v: any) => v.name);
  const suggestions = [
    `Tell me more about my ${lowValues[0] || 'report'}`,
    "What foods should I eat?",
    "Is this serious?",
  ];

  useEffect(() => {
    if (messages.length > 0 && messages.length % 5 === 0) {
      addXP(5);
    }
  }, [messages.length, addXP]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Pre-warm speech voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }, []);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: { summary, labValues, language, jargonMap }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let assistantMessage = '';
      setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        assistantMessage += chunk;
        setMessages((prev: Message[]) => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantMessage;
          return updated;
        });
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev: Message[]) => [...prev, {
        role: 'assistant',
        content: `I'm sorry, I'm having trouble connecting: ${error.message || 'Unknown error'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (index: number) => {
    const msg = messages[index];
    if (msg.role !== 'assistant' || msg.translation) return;

    setMessages((prev: Message[]) => {
      const next = [...prev];
      next[index] = { ...next[index], isTranslating: true };
      return next;
    });

    try {
      const targetLang = language === 'EN' ? 'Hindi' : 'English';
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Translate the following text to ${targetLang}. Provide ONLY the translation:\n\n${msg.content}` }],
          context: { summary, labValues, language, jargonMap }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let translatedText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        translatedText += new TextDecoder().decode(value);
        setMessages((prev: Message[]) => {
          const next = [...prev];
          next[index] = { ...next[index], translation: translatedText };
          return next;
        });
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      setMessages((prev: Message[]) => {
        const next = [...prev];
        next[index] = { ...next[index], translation: `Error: ${error.message || 'Translation failed'}` };
        return next;
      });
    } finally {
      setMessages((prev: Message[]) => {
        const next = [...prev];
        next[index] = { ...next[index], isTranslating: false };
        return next;
      });
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setSpeechState({ id: null, paused: false });
  };

  const pauseSpeech = () => {
    window.speechSynthesis.pause();
    setSpeechState(prev => ({ ...prev, paused: true }));
  };

  const resumeSpeech = () => {
    window.speechSynthesis.resume();
    setSpeechState(prev => ({ ...prev, paused: false }));
  };

  const speak = (text: string, id: number) => {
    window.speechSynthesis.cancel();
    
    // Voices might not be loaded initially, try catching them
    const getBestVoice = (isHindi: boolean) => {
      const v = window.speechSynthesis.getVoices();
      if (isHindi) {
        return v.find(voice => voice.lang.startsWith('hi')) ||
          v.find(voice => voice.name.toLowerCase().includes('hindi'));
      }
      return v.find(voice => voice.lang.startsWith('en'));
    };

    const isHindi = displayLang === 'HI';
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = getBestVoice(isHindi);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = isHindi ? 'hi-IN' : 'en-US';
    }

    if (isHindi) {
      utterance.rate = 0.9;
    }

    utterance.onstart = () => {
      setSpeechState({ id, paused: false });
    };
    utterance.onend = () => {
      setSpeechState({ id: null, paused: false });
    };
    utterance.onerror = () => {
      setSpeechState({ id: null, paused: false });
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="doctor-chat-overlay" className="fixed inset-0 z-50">
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            key="chat-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <span className="text-xl">👨‍⚕️</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">Dr. Raahat</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Always Listening</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                  <button 
                    onClick={() => setDisplayLang('EN')}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${displayLang === 'EN' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => setDisplayLang('HI')}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${displayLang === 'HI' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    HI
                  </button>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="space-y-6 text-center pt-10">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 inline-block">
                    <Sparkles className="w-8 h-8 text-[#f59e0b] mx-auto mb-2" />
                    <p className="text-slate-300 font-medium">Namaste! How can I help you understand your report today?</p>
                  </div>
                  <div className="grid gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="text-sm p-3 rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-[#f59e0b]" />}
                    </div>
                    <div className="space-y-1">
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'}`}>
                        {m.role === 'assistant' ? (
                          displayLang === 'EN' ? parseMessage(m.content).en : (parseMessage(m.content).hi || parseMessage(m.content).en)
                        ) : m.content}
                      </div>
                      {m.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-1">
                          {speechState.id === i ? (
                            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                              {speechState.paused ? (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-400" onClick={resumeSpeech}>
                                  <Play className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-yellow-500 hover:text-yellow-400" onClick={pauseSpeech}>
                                  <Pause className="w-3 h-3" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400" onClick={stopSpeech}>
                                <Square className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => speak(displayLang === 'EN' ? parseMessage(m.content).en : (parseMessage(m.content).hi || parseMessage(m.content).en), i)}
                              className="h-8 px-2 text-slate-500 hover:text-[#f59e0b] gap-1"
                            >
                              <Volume2 className="w-3 h-3" /> Listen
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-[#f59e0b]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-slate-800 bg-slate-950">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend(input)}
                  placeholder="Ask Dr. Raahat..."
                  className="bg-slate-900 border-slate-800 text-white"
                />
                <Button
                  onClick={() => handleSend(input)}
                  disabled={loading || !input.trim()}
                  className="bg-[#f59e0b] hover:bg-orange-600 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-600 mt-3 text-center uppercase tracking-widest font-bold">
                AI Assistant • Not a substitute for medical advice
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};