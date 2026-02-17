import React, { useState, useEffect } from 'react';
import { ViewState, Book } from './types';
import { getBooks } from './services/storage';
import { Library } from './components/Library';
import { Reader } from './components/Reader';
import { Chatbot } from './components/Chatbot';

const STREAK_KEY = 'lumina_streak';
const LAST_READ_DATE_KEY = 'lumina_last_read_date';
const DARK_MODE_KEY = 'lumina_dark_mode';

const SplashScreen = () => (
  <div className="fixed inset-0 z-[100] bg-pop-yellow flex flex-col items-center justify-center border-8 border-black">
     <div className="flex flex-col items-center transform -rotate-2">
        <h1 className="text-8xl md:text-9xl font-display font-black text-white" style={{ textShadow: '8px 8px 0px #000' }}>
           READIUM
        </h1>
        <div className="bg-black text-white px-6 py-2 mt-4 font-mono font-bold text-xl animate-pulse">
           INITIALIZING LIBRARY...
        </div>
     </div>
  </div>
);

function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('LIBRARY');
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [streak, setStreak] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    refreshLibrary();
    calculateStreak();
    
    // Check dark mode pref
    const savedDark = localStorage.getItem(DARK_MODE_KEY);
    if (savedDark) {
      setIsDarkMode(savedDark === 'true');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Apply Dark Mode class to HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(DARK_MODE_KEY, 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(DARK_MODE_KEY, 'false');
    }
  }, [isDarkMode]);

  const refreshLibrary = async () => {
    const loadedBooks = await getBooks();
    setBooks(loadedBooks);
  };

  const calculateStreak = () => {
    const storedStreak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
    const lastRead = localStorage.getItem(LAST_READ_DATE_KEY);
    
    if (lastRead) {
      const lastDate = new Date(parseInt(lastRead));
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 2) { 
         const isToday = new Date().toDateString() === lastDate.toDateString();
         const isYesterday = new Date(Date.now() - 86400000).toDateString() === lastDate.toDateString();
         if (!isToday && !isYesterday) {
           setStreak(0);
           localStorage.setItem(STREAK_KEY, '0');
           return;
         }
      }
    }
    setStreak(storedStreak);
  };

  const updateStreak = () => {
    const lastRead = localStorage.getItem(LAST_READ_DATE_KEY);
    const now = Date.now();
    const todayStr = new Date(now).toDateString();
    let newStreak = streak;
    if (!lastRead) {
      newStreak = 1;
    } else {
      const lastDate = new Date(parseInt(lastRead));
      if (lastDate.toDateString() !== todayStr) {
        const isYesterday = new Date(now - 86400000).toDateString() === lastDate.toDateString();
        if (isYesterday) {
          newStreak += 1;
        } else {
          newStreak = 1; 
        }
      }
    }
    setStreak(newStreak);
    localStorage.setItem(STREAK_KEY, newStreak.toString());
    localStorage.setItem(LAST_READ_DATE_KEY, now.toString());
  };

  const handleOpenBook = (book: Book) => {
    setActiveBook(book);
    setView('READER');
    updateStreak();
  };

  const handleUpdateBook = (id: string, page: number, isRead: boolean, totalPages?: number, bookmarks?: number[]) => {
    setBooks(prev => prev.map(b => {
      if (b.id === id) {
        return { 
          ...b, 
          currentPage: page, 
          isRead, 
          lastReadAt: Date.now(), 
          ...(totalPages ? { totalPages } : {}),
          ...(bookmarks ? { bookmarks } : {}) 
        };
      }
      return b;
    }));
    updateStreak();
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen font-sans text-black dark:text-white bg-pop-bg dark:bg-dark transition-colors duration-200">
      <main>
        {view === 'LIBRARY' && (
          <Library 
            books={books} 
            onOpenBook={handleOpenBook} 
            onRefresh={refreshLibrary} 
            streak={streak}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
        )}

        {view === 'READER' && activeBook && (
          <Reader 
            book={activeBook} 
            onBack={() => {
              refreshLibrary(); 
              setView('LIBRARY');
            }} 
            onUpdateBook={handleUpdateBook}
          />
        )}
      </main>

      {/* Global Chatbot - Only show in Library */}
      {view === 'LIBRARY' && <Chatbot library={books} />}
    </div>
  );
}

export default App;