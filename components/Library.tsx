import React, { useState, useRef } from 'react';
import { Book } from '../types';
import { Button } from './ui/Button';
import { Plus, Trash2, Search, BookOpen, Clock, ChevronRight, Zap, Star, Moon, Sun, FileText } from 'lucide-react';
import { saveBook, deleteBook } from '../services/storage';
import { pdfjs } from 'react-pdf';

// Set worker for page counting on upload
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

interface LibraryProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onRefresh: () => void;
  streak: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Library: React.FC<LibraryProps> = ({ books, onOpenBook, onRefresh, streak, isDarkMode, toggleDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('PDFs ONLY!');
      return;
    }
    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Calculate pages immediately
      let totalPages = 0;
      try {
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) }); // Clone buffer for PDFJS
        const pdf = await loadingTask.promise;
        totalPages = pdf.numPages;
      } catch (e) {
        console.warn("Could not calculate pages on upload", e);
      }

      const newBook: Book = {
        id: crypto.randomUUID(),
        title: file.name.replace('.pdf', ''),
        totalPages: totalPages, 
        currentPage: 1,
        isRead: false,
        lastReadAt: Date.now(),
        addedAt: Date.now(),
        // Bright Pop Colors
        coverColor: ['#FFDE59', '#5CE1E6', '#FF66C4', '#8E44AD', '#FF5757'][Math.floor(Math.random() * 5)] 
      };
      await saveBook(newBook, arrayBuffer);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to load PDF');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('NUKE THIS BOOK?')) {
      await deleteBook(id);
      onRefresh();
    }
  };

  const lastReadBook = books.length > 0 ? books[0] : null;

  // Helper to calculate progress percentage safely
  const getProgress = (book: Book) => {
    if (!book.totalPages || book.totalPages === 0) return 0;
    return Math.round((book.currentPage / book.totalPages) * 100);
  };

  return (
    <div className="min-h-screen pb-20 bg-pop-bg dark:bg-dark transition-colors duration-200">
      
      {/* Brutalist Header */}
      <div className="border-b-3 border-black dark:border-white bg-white dark:bg-dark sticky top-0 z-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-black dark:bg-white text-white dark:text-black p-1 border-2 border-black dark:border-white rotate-3">
                <BookOpen className="w-6 h-6" />
             </div>
             <span className="font-display font-black text-2xl tracking-tighter italic text-black dark:text-white">READIUM</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Dark Mode Toggle */}
             <button 
               onClick={toggleDarkMode}
               className="p-2 border-3 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white bg-white dark:bg-neutral-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
             >
                {isDarkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}
             </button>

             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-pop-pink border-3 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white -rotate-2">
                <Zap className="w-5 h-5 fill-white text-black" />
                <span className="font-bold font-mono text-black">STREAK: {streak}</span>
             </div>
             
             <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                 {isUploading ? "LOADING..." : "UPLOAD PDF"}
             </Button>
             <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileUpload} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        
        {/* Search Bar */}
        <div className="mb-16 relative">
           <div className="absolute top-0 left-0 w-full h-full bg-black dark:bg-white translate-x-2 translate-y-2"></div>
           <div className="relative bg-white dark:bg-neutral-900 border-3 border-black dark:border-white p-4 flex items-center gap-4">
              <Search className="w-8 h-8 text-black dark:text-white" />
              <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="FIND SOMETHING..."
                 className="w-full text-xl md:text-2xl font-display font-bold uppercase outline-none placeholder-gray-300 dark:placeholder-gray-600 bg-transparent text-black dark:text-white"
              />
           </div>
        </div>

        {/* Hero: Last Read */}
        {lastReadBook && !searchTerm && (
           <div className="mb-20">
              <div className="flex items-center gap-2 mb-4">
                 <Star className="w-6 h-6 fill-black dark:fill-white text-black dark:text-white" />
                 <h2 className="font-display font-black text-xl uppercase text-black dark:text-white">Jump Back In</h2>
              </div>
              
              <div 
                 onClick={() => onOpenBook(lastReadBook)}
                 className="relative group cursor-pointer"
              >
                 <div className="absolute inset-0 bg-black dark:bg-white translate-x-3 translate-y-3 md:translate-x-4 md:translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
                 
                 <div className="relative bg-white dark:bg-neutral-900 border-3 border-black dark:border-white p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 hover:-translate-y-1 hover:-translate-x-1 transition-transform">
                    {/* Cover */}
                    <div 
                      className="w-full md:w-64 h-64 md:h-80 border-3 border-black dark:border-white flex items-center justify-center shrink-0 relative overflow-hidden"
                      style={{ backgroundColor: lastReadBook.coverColor }}
                    >
                       <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                       <span className="font-display font-black text-8xl text-black opacity-20 rotate-12">{lastReadBook.title.charAt(0)}</span>
                       <div className="absolute bottom-4 right-4 bg-white dark:bg-neutral-900 border-3 border-black dark:border-white px-2 py-1 font-mono text-xs font-bold text-black dark:text-white">
                          PDF
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                       <div>
                          <div className="inline-block bg-black dark:bg-white text-white dark:text-black px-3 py-1 font-mono text-xs mb-4">
                             LAST READ: {new Date(lastReadBook.lastReadAt).toLocaleDateString()}
                          </div>
                          <h3 className="font-display font-black text-4xl md:text-6xl leading-none mb-6 uppercase text-black dark:text-white">
                             {lastReadBook.title}
                          </h3>
                       </div>

                       <div>
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="bg-gray-100 dark:bg-neutral-800 p-3 border-2 border-black dark:border-white">
                                <span className="block font-mono text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">CURRENT PAGE</span>
                                <div className="font-display font-black text-2xl text-black dark:text-white">
                                  {lastReadBook.currentPage} <span className="text-sm text-gray-400">/ {lastReadBook.totalPages || '?'}</span>
                                </div>
                             </div>
                             
                             <div className="bg-gray-100 dark:bg-neutral-800 p-3 border-2 border-black dark:border-white">
                                <span className="block font-mono text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">COMPLETION</span>
                                <div className="font-display font-black text-2xl text-black dark:text-white">
                                  {getProgress(lastReadBook)}%
                                </div>
                             </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-6 border-3 border-black dark:border-white p-0.5 mb-8 bg-white dark:bg-neutral-800">
                             <div 
                               className="h-full bg-pop-blue transition-all duration-500 ease-out" 
                               style={{ width: `${getProgress(lastReadBook)}%` }}
                             ></div>
                          </div>
                          
                          <Button variant="secondary" className="w-full md:w-auto text-lg">
                             CONTINUE READING <ChevronRight className="w-6 h-6 ml-2" />
                          </Button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Grid */}
        <div className="border-b-3 border-black dark:border-white mb-8 flex justify-between items-end pb-2">
           <h2 className="font-display font-black text-3xl uppercase text-black dark:text-white">The Stash</h2>
           <span className="font-mono font-bold bg-pop-yellow text-black border-3 border-black dark:border-white px-2">{filteredBooks.length} ITEMS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {filteredBooks.map((book) => (
              <div 
                 key={book.id}
                 onClick={() => onOpenBook(book)} 
                 className="group cursor-pointer relative"
              >
                 <div className="absolute inset-0 bg-black dark:bg-white translate-x-2 translate-y-2 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform"></div>
                 
                 <div className="relative bg-white dark:bg-neutral-900 border-3 border-black dark:border-white flex flex-col h-full hover:-translate-y-1 hover:-translate-x-1 transition-transform">
                    <div 
                      className="h-48 border-b-3 border-black dark:border-white flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: book.coverColor }}
                    >
                       <span className="font-display font-black text-6xl text-white opacity-50">{book.title.charAt(0)}</span>
                       {book.isRead && (
                          <div className="absolute top-2 right-2 bg-green-400 border-3 border-black p-1">
                             <Star className="w-4 h-4 fill-current" />
                          </div>
                       )}
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col justify-between">
                        <h4 className="font-bold text-lg leading-tight uppercase mb-4 line-clamp-3 text-black dark:text-white">
                           {book.title}
                        </h4>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t-3 border-black dark:border-white">
                           <div className="flex items-center gap-1 font-mono text-xs font-bold bg-gray-200 dark:bg-neutral-700 text-black dark:text-white px-2 py-1">
                              <FileText className="w-3 h-3" />
                              <span>{book.currentPage} / {book.totalPages || '?'}</span>
                           </div>
                           <button 
                              onClick={(e) => handleDelete(e, book.id)}
                              className="text-black dark:text-white hover:text-pop-red hover:scale-110 transition-transform"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>

        {filteredBooks.length === 0 && (
           <div className="py-20 text-center border-3 border-black dark:border-white border-dashed bg-gray-50 dark:bg-neutral-900">
              <h3 className="font-display font-black text-4xl text-gray-300 dark:text-gray-600 uppercase">Nothing Here</h3>
              <p className="font-mono font-bold mt-2 text-black dark:text-gray-400">UPLOAD SOMETHING COOL</p>
           </div>
        )}

      </div>
    </div>
  );
};