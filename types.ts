export interface Book {
  id: string;
  title: string;
  author?: string;
  totalPages: number;
  currentPage: number;
  isRead: boolean;
  lastReadAt: number; // timestamp
  addedAt: number; // timestamp
  coverColor: string; // Random pastel color for UI
}

export interface PDFFile {
  id: string; // Matches Book ID
  data: ArrayBuffer;
}

export interface SearchResult {
  pageNumber: number;
  matchText: string;
}

export type ViewState = 'LIBRARY' | 'READER';
