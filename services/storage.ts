import { Book, PDFFile } from '../types';

const DB_NAME = 'LuminaLibraryDB';
const DB_VERSION = 1;
const STORE_BOOKS = 'books';
const STORE_FILES = 'files';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveBook = async (book: Book, file: ArrayBuffer): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_BOOKS, STORE_FILES], 'readwrite');
  
  const bookStore = tx.objectStore(STORE_BOOKS);
  const fileStore = tx.objectStore(STORE_FILES);

  bookStore.put(book);
  fileStore.put({ id: book.id, data: file });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getBooks = async (): Promise<Book[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, 'readonly');
    const store = tx.objectStore(STORE_BOOKS);
    const request = store.getAll();
    request.onsuccess = () => {
       // Sort by last read descending
       const books = request.result as Book[];
       books.sort((a, b) => b.lastReadAt - a.lastReadAt);
       resolve(books);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getBookFile = async (id: string): Promise<ArrayBuffer | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, 'readonly');
    const store = tx.objectStore(STORE_FILES);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.data);
    request.onerror = () => reject(request.error);
  });
};

export const updateBookProgress = async (id: string, currentPage: number, isRead: boolean, totalPages?: number): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_BOOKS, 'readwrite');
  const store = tx.objectStore(STORE_BOOKS);
  
  const getReq = store.get(id);
  
  return new Promise((resolve, reject) => {
    getReq.onsuccess = () => {
      const book = getReq.result as Book;
      if (book) {
        book.currentPage = currentPage;
        book.isRead = isRead;
        book.lastReadAt = Date.now();
        if (totalPages !== undefined) {
          book.totalPages = totalPages;
        }
        store.put(book);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const toggleBookmark = async (id: string, page: number): Promise<number[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_BOOKS, 'readwrite');
  const store = tx.objectStore(STORE_BOOKS);

  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const book = getReq.result as Book;
      if (book) {
        const bookmarks = book.bookmarks || [];
        const index = bookmarks.indexOf(page);
        if (index === -1) {
          bookmarks.push(page);
          bookmarks.sort((a, b) => a - b);
        } else {
          bookmarks.splice(index, 1);
        }
        book.bookmarks = bookmarks;
        store.put(book);
        resolve(bookmarks);
      } else {
        reject(new Error("Book not found"));
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const deleteBook = async (id: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_BOOKS, STORE_FILES], 'readwrite');
  tx.objectStore(STORE_BOOKS).delete(id);
  tx.objectStore(STORE_FILES).delete(id);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};