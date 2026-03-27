'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const TypewriterText = ({ text, speed = 30 }: { text: string, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index));
      index++;
      if (index > text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-slate-300 leading-relaxed"
    >
      {displayedText}
    </motion.p>
  );
};

export default TypewriterText;
