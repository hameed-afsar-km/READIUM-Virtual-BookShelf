import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Book } from '../types';
import { getBookFile, updateBookProgress } from '../services/storage';

// Use the .mjs worker for ES module environments to avoid "Failed to fetch dynamically imported module"
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

interface ReaderProps {
  book: Book;
  onBack: () => void;
  onUpdateBook: (id: string, page: number, isRead: boolean, totalPages?: number) => void;
}

export const Reader: React.FC<ReaderProps> = ({ book, onBack, onUpdateBook }) => {
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(book.totalPages || 0);
  const [pageNumber, setPageNumber] = useState<number>(book.currentPage || 1);
  const [scale, setScale] = useState<number>(1.0);
  
  const pdfDocumentRef = useRef<any>(null); 

  useEffect(() => {
    const loadFile = async () => {
      const data = await getBookFile(book.id);
      if (data) setFileData(data);
    };
    loadFile();
  }, [book.id]);

  const onDocumentLoadSuccess = async ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // If we didn't have total pages before, or if it changed, update it.
    if (book.totalPages !== numPages) {
       await updateBookProgress(book.id, pageNumber, false, numPages);
       onUpdateBook(book.id, pageNumber, false, numPages);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > numPages) return;
    setPageNumber(newPage);
    const isFinished = newPage >= numPages;
    await updateBookProgress(book.id, newPage, isFinished);
    onUpdateBook(book.id, newPage, isFinished);
  };

  if (!fileData) return (
    <div className="h-screen flex flex-col items-center justify-center bg-pop-yellow border-8 border-black">
      <div className="font-display font-black text-4xl animate-pulse">LOADING DATA...</div>
    </div>
  );

  return (
    <div className="h-screen bg-pop-blue dark:bg-indigo-950 flex flex-col overflow-hidden transition-colors duration-200">
      
      {/* Top Bar */}
      <div className="bg-white dark:bg-dark border-b-3 border-black dark:border-white h-16 px-4 flex items-center justify-between shrink-0 z-20">
         <div className="flex items-center gap-4 max-w-[50%]">
            <Button variant="danger" size="sm" onClick={onBack} className="shadow-none border-2">
               <X className="w-5 h-5 mr-1" /> EXIT
            </Button>
            <h1 className="font-display font-bold uppercase truncate border-l-3 border-black dark:border-white pl-4 text-black dark:text-white">{book.title}</h1>
         </div>

         <div className="flex items-center gap-4">
             <div className="flex bg-white dark:bg-neutral-800 border-3 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white text-black dark:text-white">
                 <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-r-3 border-black dark:border-white transition-colors">
                   <ZoomOut className="w-4 h-4"/>
                 </button>
                 <div className="w-16 flex items-center justify-center font-mono font-bold">
                    {Math.round(scale * 100)}%
                 </div>
                 <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-l-3 border-black dark:border-white transition-colors">
                   <ZoomIn className="w-4 h-4"/>
                 </button>
             </div>
         </div>
      </div>

      {/* Reader Content */}
      <div className="flex-1 overflow-auto flex justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
        
        {/* Use inline-flex to shrink wrap the document exactly */}
        <div className="relative inline-flex justify-center items-center">
           
           {/* Main PDF Container - Border hugs content because of inline-flex on parent and this being a child */}
           <div className="relative border-3 border-black dark:border-white bg-white z-10 shadow-lg">
              <Document
                file={fileData}
                onLoadSuccess={(pdf) => {
                  onDocumentLoadSuccess(pdf);
                  pdfDocumentRef.current = pdf;
                }}
                loading={<div className="p-20 font-display font-bold">RENDERING...</div>}
                className="flex justify-center"
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale} 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="bg-white" 
                />
              </Document>
           </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="bg-white dark:bg-dark border-t-3 border-black dark:border-white p-4 flex justify-center z-20 transition-colors duration-200">
         <div className="flex items-center gap-6">
            <Button variant="secondary" onClick={() => handlePageChange(pageNumber - 1)} disabled={pageNumber <= 1}>
               <ChevronLeft className="w-6 h-6" /> PREV
            </Button>
            
            <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 font-display font-black text-xl skew-x-[-10deg]">
               <span className="skew-x-[10deg] inline-block">
                  {pageNumber} / {numPages}
               </span>
            </div>

            <Button variant="primary" onClick={() => handlePageChange(pageNumber + 1)} disabled={pageNumber >= numPages}>
               NEXT <ChevronRight className="w-6 h-6" />
            </Button>

            {pageNumber >= numPages && (
               <div className="bg-green-400 border-3 border-black dark:border-white text-black px-4 py-2 font-black flex items-center gap-2 animate-bounce">
                  <Check className="w-6 h-6" /> FINISHED!
               </div>
            )}
         </div>
      </div>

    </div>
  );
};