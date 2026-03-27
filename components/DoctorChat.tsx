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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export const DoctorChat = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { summary, labValues, language, jargonMap, addXP } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lowValues = labValues.filter(v => v.status === 'LOW').map(v => v.name);
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

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // In a real app, this would call a Next.js API route that streams from Groq
      // For this implementation, I'll simulate the streaming for UI "wow"
      // because I've already shown how to call Groq in the API route.
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          context: { summary, labValues, language, jargonMap }
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let assistantMessage = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        assistantMessage += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantMessage;
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'HI' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
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
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
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
                        {m.content}
                      </div>
                      {m.role === 'assistant' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => speak(m.content)}
                          className="h-8 px-2 text-slate-500 hover:text-[#f59e0b]"
                        >
                          <Volume2 className="w-3 h-3 mr-1" /> Listen
                        </Button>
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
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
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
        </>
      )}
    </AnimatePresence>
  );
};
