'use client';

import { useState, useCallback } from 'react';

interface Annotation {
  id: string;
  text: string;
  color: string;
  pageNumber: number;
  position: { x: number; y: number };
  timestamp: string;
}

interface Note {
  id: string;
  text: string;
  pageNumber: number;
  timestamp: string;
}

interface Comment {
  id: string;
  text: string;
  timestamp: string;
  userName: string;
}

interface Review {
  id: string;
  text: string;
  rating: number;
  timestamp: string;
  userName: string;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publicationDate: string;
  journal: string;
  userRating: number | null;
  citations: number;
  doi: string;
  readingStatus: 'want' | 'current' | 'read' | null;
  pdfUrl: string | null;
  arxivId: string | null;
  currentPage: number;
  totalPages: number;
  annotations: Annotation[];
  notes: Note[];
  sections: { title: string; page: number }[];
  comments: Comment[];
  reviews: Review[];
}

interface SearchFilters {
  query: string;
  sortBy: 'date' | 'rating' | 'title';
  shelf: 'all' | 'want' | 'current' | 'read';
}

interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  pdfLink: string;
  journalRef?: string;
}

export default function Home(): JSX.Element {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isReaderMode, setIsReaderMode] = useState<boolean>(false);
  const [textSize, setTextSize] = useState<number>(16);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'date',
    shelf: 'all'
  });
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<ArxivPaper[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const query = event.target.value;
    setFilters(prev => ({ ...prev, query }));
  }, []);

  const handleSort = useCallback((sortBy: SearchFilters['sortBy']): void => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleShelfChange = useCallback((shelf: SearchFilters['shelf']): void => {
    setFilters(prev => ({ ...prev, shelf }));
  }, []);

  const handleRate = useCallback((paperId: string, rating: number): void => {
    setPapers(prev =>
      prev.map(paper =>
        paper.id === paperId ? { ...paper, userRating: rating } : paper
      )
    );
  }, []);

  const handleReadingStatus = useCallback((paperId: string, status: Paper['readingStatus']): void => {
    setPapers(prev =>
      prev.map(paper =>
        paper.id === paperId ? { ...paper, readingStatus: status } : paper
      )
    );
  }, []);

  const handlePageChange = useCallback((newPage: number): void => {
    if (selectedPaper) {
      const updatedPaper = { ...selectedPaper, currentPage: newPage };
      setSelectedPaper(updatedPaper);
      setPapers(prev =>
        prev.map(paper =>
          paper.id === selectedPaper.id ? updatedPaper : paper
        )
      );
    }
  }, [selectedPaper]);

  const handleAddNote = useCallback((note: Omit<Note, 'id' | 'timestamp'>): void => {
    if (selectedPaper) {
      const newNote: Note = {
        ...note,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };

      const updatedPaper = {
        ...selectedPaper,
        notes: [...selectedPaper.notes, newNote]
      };

      setSelectedPaper(updatedPaper);
      setPapers(prev =>
        prev.map(paper =>
          paper.id === selectedPaper.id ? updatedPaper : paper
        )
      );
    }
  }, [selectedPaper]);

  const handleAddAnnotation = useCallback((annotation: Omit<Annotation, 'id' | 'timestamp'>): void => {
    if (selectedPaper) {
      const newAnnotation: Annotation = {
        ...annotation,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };

      const updatedPaper = {
        ...selectedPaper,
        annotations: [...selectedPaper.annotations, newAnnotation]
      };

      setSelectedPaper(updatedPaper);
      setPapers(prev =>
        prev.map(paper =>
          paper.id === selectedPaper.id ? updatedPaper : paper
        )
      );
    }
  }, [selectedPaper]);

  const handleAddComment = useCallback((paperId: string, text: string): void => {
    if (!text.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString(),
      userName: 'Anonymous User'
    };

    setPapers(prev =>
      prev.map(paper =>
        paper.id === paperId
          ? { ...paper, comments: [...paper.comments, newComment] }
          : paper
      )
    );

    if (selectedPaper?.id === paperId) {
      setSelectedPaper(prev =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : null
      );
    }

    setCommentText('');
  }, [selectedPaper]);

  const handleAddReview = useCallback((paperId: string, text: string, rating: number): void => {
    if (!text.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      text,
      rating,
      timestamp: new Date().toISOString(),
      userName: 'Anonymous User'
    };

    setPapers(prev =>
      prev.map(paper =>
        paper.id === paperId
          ? { ...paper, reviews: [...paper.reviews, newReview] }
          : paper
      )
    );

    if (selectedPaper?.id === paperId) {
      setSelectedPaper(prev =>
        prev ? { ...prev, reviews: [...prev.reviews, newReview] } : null
      );
    }

    setReviewText('');
    setReviewRating(5);
    setShowReviewForm(false);
  }, [selectedPaper]);

  const searchArxiv = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: 'http',
          origin: 'export.arxiv.org',
          path: '/api/query',
          method: 'GET',
          params: {
            search_query: `all:${query}`,
            start: 0,
            max_results: 10,
            sortBy: 'relevance',
            sortOrder: 'descending'
          }
        })
      });

      if (!response.ok) throw new Error('Failed to fetch from arXiv');

      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');
      
      const entries = Array.from(xmlDoc.getElementsByTagName('entry'));
      const papers: ArxivPaper[] = entries.map(entry => {
        const id = entry.getElementsByTagName('id')[0].textContent?.split('/').pop() || '';
        return {
          id,
          title: entry.getElementsByTagName('title')[0].textContent?.trim() || '',
          authors: Array.from(entry.getElementsByTagName('author')).map(
            author => author.getElementsByTagName('name')[0].textContent || ''
          ),
          summary: entry.getElementsByTagName('summary')[0].textContent?.trim() || '',
          published: entry.getElementsByTagName('published')[0].textContent || '',
          pdfLink: `https://arxiv.org/pdf/${id}.pdf`,
          journalRef: entry.getElementsByTagName('journal_ref')[0]?.textContent || undefined
        };
      });

      setSearchResults(papers);
    } catch (error) {
      console.error('Error searching arXiv:', error);
      alert('Failed to search arXiv. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addPaperToLibrary = useCallback((arxivPaper: ArxivPaper): void => {
    const newPaper: Paper = {
      id: Date.now().toString(),
      title: arxivPaper.title,
      authors: arxivPaper.authors,
      abstract: arxivPaper.summary,
      publicationDate: arxivPaper.published,
      journal: arxivPaper.journalRef || 'arXiv preprint',
      userRating: null,
      citations: 0,
      doi: '',
      readingStatus: null,
      pdfUrl: arxivPaper.pdfLink,
      arxivId: arxivPaper.id,
      currentPage: 1,
      totalPages: 0,
      annotations: [],
      notes: [],
      sections: [],
      comments: [],
      reviews: []
    };

    setPapers(prev => [...prev, newPaper]);
  }, []);

  const filteredPapers = papers
    .filter(paper => {
      const matchesQuery = paper.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        paper.authors.some(author =>
          author.toLowerCase().includes(filters.query.toLowerCase())
        );
      const matchesShelf = filters.shelf === 'all' || paper.readingStatus === filters.shelf;
      return matchesQuery && matchesShelf;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
        case 'rating':
          return (b.userRating || 0) - (a.userRating || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (isReaderMode && selectedPaper) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          {selectedPaper.sections.length > 0 ? (
            <ul className="space-y-2">
              {selectedPaper.sections.map((section) => (
                <li key={section.page}>
                  <button
                    onClick={() => handlePageChange(section.page)}
                    className={`w-full text-left px-2 py-1 rounded ${
                      selectedPaper.currentPage === section.page
                        ? 'bg-[#1B3A33] text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No sections available</p>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsReaderMode(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                {'←'} Back to Library
              </button>
              <span className="text-gray-600">
                {selectedPaper.pdfUrl 
                  ? `Page ${selectedPaper.currentPage} of ${selectedPaper.totalPages}`
                  : 'Loading PDF...'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTextSize(prev => Math.max(12, prev - 2))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                {'A-'}
              </button>
              <button
                onClick={() => setTextSize(prev => Math.min(24, prev + 2))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                {'A+'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {selectedPaper.pdfUrl ? (
              <iframe
                src={selectedPaper.pdfUrl}
                className="w-full h-full border-0 rounded-lg shadow-lg"
                title="PDF Viewer"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A33]"></div>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="space-y-4">
              {selectedPaper.notes.map((note) => (
                <div key={note.id} className="bg-yellow-50 p-3 rounded">
                  <p className="text-sm">{note.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Page {note.pageNumber} • {new Date(note.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleAddNote({
                text: '',
                pageNumber: selectedPaper.currentPage
              })}
              className="mt-4 w-full px-4 py-2 bg-[#1B3A33] text-white rounded hover:bg-[#152E28]"
            >
              Add Note
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Reviews</h2>
            <div className="space-y-4">
              {selectedPaper.reviews.map((review) => (
                <div key={review.id} className="bg-blue-50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= review.rating
                              ? 'text-[#FF9900]'
                              : 'text-gray-300'
                          }`}
                        >
                          {'★'}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      by {review.userName}
                    </span>
                  </div>
                  <p className="text-sm">{review.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(review.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="mt-4 w-full px-4 py-2 bg-[#1B3A33] text-white rounded hover:bg-[#152E28]"
              >
                Write a Review
              </button>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl ${
                        star <= reviewRating
                          ? 'text-[#FF9900]'
                          : 'text-gray-300'
                      }`}
                    >
                      {'★'}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your review..."
                  className="w-full p-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-[#1B3A33] focus:border-[#1B3A33]"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleAddReview(selectedPaper.id, reviewText, reviewRating);
                    }}
                    className="flex-1 px-4 py-2 bg-[#1B3A33] text-white rounded hover:bg-[#152E28]"
                  >
                    Post Review
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewText('');
                      setReviewRating(5);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Comments</h2>
            <div className="space-y-4">
              {selectedPaper.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comment.userName} • {new Date(comment.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-[#1B3A33] focus:border-[#1B3A33]"
                rows={3}
              />
              <button
                onClick={() => handleAddComment(selectedPaper.id, commentText)}
                className="w-full px-4 py-2 bg-[#1B3A33] text-white rounded hover:bg-[#152E28]"
              >
                Post Comment
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Highlights</h2>
            <div className="space-y-4">
              {selectedPaper.annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="p-3 rounded"
                  style={{ backgroundColor: `${annotation.color}20` }}
                >
                  <p className="text-sm">{annotation.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Page {annotation.pageNumber} • {new Date(annotation.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F8F4]">
      <div className="bg-[#F4F1EA] border-b border-[#D6D0C4] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-[#1B3A33] mb-4">Academic Paper Library</h1>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 relative">
              <input
                type="search"
                placeholder="Search papers on arXiv..."
                value={filters.query}
                onChange={(e) => {
                  handleSearch(e);
                  searchArxiv(e.target.value);
                }}
                className="w-full p-2 border border-[#D6D0C4] rounded bg-white focus:ring-2 focus:ring-[#1B3A33] focus:border-[#1B3A33]"
                aria-label="Search papers on arXiv"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1B3A33]"></div>
                </div>
              )}
              {searchResults.length > 0 && filters.query && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#D6D0C4] rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {searchResults.map((paper) => (
                    <div
                      key={paper.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-[#D6D0C4] last:border-b-0"
                      onClick={() => {
                        addPaperToLibrary(paper);
                        setSearchResults([]);
                        setFilters(prev => ({ ...prev, query: '' }));
                      }}
                    >
                      <h3 className="font-medium text-[#1B3A33]">{paper.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{paper.authors.join(', ')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(paper.published).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => handleSort(e.target.value as SearchFilters['sortBy'])}
              className="p-2 border border-[#D6D0C4] rounded bg-white focus:ring-2 focus:ring-[#1B3A33]"
              aria-label="Sort papers by"
            >
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6 mb-8">
          <button
            onClick={() => handleShelfChange('all')}
            className={`px-4 py-2 rounded ${
              filters.shelf === 'all'
                ? 'bg-[#1B3A33] text-white'
                : 'text-[#1B3A33] hover:bg-[#1B3A33] hover:text-white'
            }`}
          >
            All Papers
          </button>
          <button
            onClick={() => handleShelfChange('want')}
            className={`px-4 py-2 rounded ${
              filters.shelf === 'want'
                ? 'bg-[#1B3A33] text-white'
                : 'text-[#1B3A33] hover:bg-[#1B3A33] hover:text-white'
            }`}
          >
            Want to Read
          </button>
          <button
            onClick={() => handleShelfChange('current')}
            className={`px-4 py-2 rounded ${
              filters.shelf === 'current'
                ? 'bg-[#1B3A33] text-white'
                : 'text-[#1B3A33] hover:bg-[#1B3A33] hover:text-white'
            }`}
          >
            Currently Reading
          </button>
          <button
            onClick={() => handleShelfChange('read')}
            className={`px-4 py-2 rounded ${
              filters.shelf === 'read'
                ? 'bg-[#1B3A33] text-white'
                : 'text-[#1B3A33] hover:bg-[#1B3A33] hover:text-white'
            }`}
          >
            Read
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Search for papers on arXiv to add them to your library
            </div>
          ) : (
            papers.map(paper => (
              <article
                key={paper.id}
                className="bg-white border border-[#D6D0C4] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => {
                        setSelectedPaper(paper);
                        setIsReaderMode(true);
                      }}
                      className="w-20 h-28 flex-shrink-0 bg-[#1B3A33] rounded flex items-center justify-center cursor-pointer"
                    >
                      <span className="text-white text-3xl">{'📄'}</span>
                    </button>
                    <div>
                      <h2 
                        className="text-lg font-semibold text-[#1B3A33] hover:underline cursor-pointer"
                        onClick={() => {
                          setSelectedPaper(paper);
                          setIsReaderMode(true);
                        }}
                      >
                        {paper.title}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {paper.authors.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {paper.journal} • {new Date(paper.publicationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(paper.id, star)}
                          className={`text-xl ${
                            (paper.userRating || 0) >= star
                              ? 'text-[#FF9900]'
                              : 'text-gray-300'
                          }`}
                          aria-label={`Rate ${star} stars`}
                        >
                          {'★'}
                        </button>
                      ))}
                      <span className="text-sm text-gray-600 ml-2">
                        {paper.userRating ? `${paper.userRating} stars` : 'Rate this paper'}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <select
                        value={paper.readingStatus || ''}
                        onChange={(e) => handleReadingStatus(paper.id, e.target.value as Paper['readingStatus'])}
                        className="w-full p-2 text-sm border border-[#D6D0C4] rounded bg-white focus:ring-2 focus:ring-[#1B3A33]"
                      >
                        <option value="">Add to Shelf</option>
                        <option value="want">Want to Read</option>
                        <option value="current">Currently Reading</option>
                        <option value="read">Read</option>
                      </select>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      <span className="mr-4">Citations: {paper.citations}</span>
                      {paper.arxivId && (
                        <a
                          href={`https://arxiv.org/abs/${paper.arxivId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1B3A33] hover:underline"
                        >
                          arXiv
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
