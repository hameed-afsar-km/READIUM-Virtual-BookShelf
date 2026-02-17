import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Terminal } from 'lucide-react';
import { getBookSuggestions } from '../services/gemini';
import { Book } from '../types';

interface ChatbotProps {
  library: Book[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ library }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I'M READIUM. WHAT DO YOU WANT TO READ?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    const response = await getBookSuggestions(userMsg, library);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-pop-pink border-3 border-black dark:border-white shadow-hard dark:shadow-hard-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all z-50 flex items-center justify-center"
        >
          <MessageSquare className="w-8 h-8 text-black" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-neutral-900 border-3 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white flex flex-col z-50 animate-shake transition-colors duration-200">
          
          {/* Header */}
          <div className="bg-pop-yellow border-b-3 border-black dark:border-white p-3 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                   <Terminal className="w-5 h-5 text-pop-yellow" />
                </div>
                <h3 className="font-display font-black text-lg text-black">READIUM BOT</h3>
             </div>
             <button onClick={() => setIsOpen(false)} className="bg-pop-red border-2 border-black p-1 hover:bg-red-600 transition-colors">
                <X className="w-4 h-4 text-white" />
             </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-neutral-800">
             {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-3 font-bold text-sm border-2 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white ${
                      m.role === 'user' 
                      ? 'bg-pop-blue text-black' 
                      : 'bg-white dark:bg-neutral-900 text-black dark:text-white'
                   }`}>
                      {m.content}
                   </div>
                </div>
             ))}
             {loading && (
                <div className="flex justify-start">
                   <div className="bg-black dark:bg-white text-white dark:text-black p-2 font-mono text-xs border-2 border-black dark:border-white animate-pulse">
                      PROCESSING...
                   </div>
                </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white dark:bg-neutral-900 border-t-3 border-black dark:border-white">
             <div className="relative flex gap-2">
                <input
                   type="text"
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   placeholder="TYPE HERE..."
                   className="w-full bg-white dark:bg-neutral-800 border-2 border-black dark:border-white text-black dark:text-white p-3 font-mono font-bold focus:outline-none focus:bg-pop-yellow/20 dark:focus:bg-pop-yellow/10"
                   autoFocus
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim()} 
                  className="bg-black dark:bg-white text-white dark:text-black px-4 border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                   <Send className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};