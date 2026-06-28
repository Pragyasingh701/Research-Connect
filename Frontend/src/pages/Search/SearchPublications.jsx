import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, BookOpen, Eye, ArrowDownToLine, Calendar, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const SearchPublications = () => {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('');
  const [journal, setJournal] = useState('');
  const [sort, setSort] = useState('citationCount');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [page, setPage] = useState(1);

  const handleSearch = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (year) params.append('year', year);
      if (type) params.append('type', type);
      if (journal.trim()) params.append('journal', journal.trim());
      params.append('sort', sort);
      params.append('page', pageNumber.toString());
      params.append('limit', '10');

      const response = await api.get(`/publications/search?${params.toString()}`);
      setResults(response.data.data.publications || []);
      setPagination(response.data.pagination || { total: 0, page: pageNumber, limit: 10, totalPages: 1 });
      setPage(pageNumber);
    } catch (err) {
      console.error('Search query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on mount and when filters/sorting change
  useEffect(() => {
    handleSearch(1);
  }, [sort, type, year]);

  const onSubmit = (e) => {
    e.preventDefault();
    handleSearch(1);
  };

  return (
    <div className="space-y-6 text-left pb-16">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Search Hub</h2>
        <p className="text-xs text-slate-500 mt-0.5">Explore full-text publications, DOIs, journals, and citation stats across the global database.</p>
      </div>

      {/* Main Search Input Box */}
      <form onSubmit={onSubmit} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
          <input 
            type="text" 
            placeholder="Search by publication title, abstract keyword, journal, or co-author name..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm bg-white shadow-sm"
          />
        </div>
        <button 
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/10"
        >
          Search
        </button>
      </form>

      {/* Advanced Filters Panel & Search Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Filters */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filters
            </h3>

            {/* Publication Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Publication Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
              >
                <option value="">All Formats</option>
                <option value="journal">Journal Articles</option>
                <option value="conference">Conference Papers</option>
                <option value="preprint">Preprints</option>
                <option value="book">Books</option>
                <option value="thesis">Thesis</option>
              </select>
            </div>

            {/* Publication Year */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Publication Year</label>
              <input 
                type="number" 
                placeholder="e.g. 2026" 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
              />
            </div>

            {/* Journal Venue */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Journal / Publisher</label>
              <input 
                type="text" 
                placeholder="e.g. IEEE, Springer" 
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
              />
            </div>

            {/* Sort Options */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Sort By</label>
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
              >
                <option value="citationCount">Highly Cited First</option>
                <option value="publicationYear">Newest First</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Right 3 Columns: Search Results */}
        <div className="lg:col-span-3 space-y-4">
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border border-slate-200/80 rounded-3xl p-6 animate-pulse space-y-4">
                  <div className="h-4 w-1/3 bg-slate-100 rounded-full"></div>
                  <div className="h-3 w-3/4 bg-slate-100 rounded-full"></div>
                  <div className="h-16 w-full bg-slate-100 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="p-16 text-center bg-white border border-slate-200/80 rounded-3xl space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700">No results found</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Try checking spelling or adjusting your publication year/format filters.
                  </p>
                </div>
              ) : (
                results.map((pub) => (
                  <div 
                    key={pub._id} 
                    className="bg-white border border-slate-200/80 hover:border-blue-200 rounded-3xl p-6 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">
                          {pub.publicationType || 'journal'}
                        </span>
                        {pub.doi && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100/50 rounded text-[9px] font-medium font-mono">
                            {pub.doi}
                          </span>
                        )}
                      </div>

                      <Link to={`/publications/${pub._id}`}>
                        <h4 className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors leading-snug">
                          {pub.title}
                        </h4>
                      </Link>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {pub.abstract}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 truncate max-w-[150px]">{pub.journal || 'Academic Venue'}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {pub.publicationYear}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 font-bold rounded text-[10px]">
                          {pub.citationCount || 0} Citations
                        </span>
                        <Link to={`/publications/${pub._id}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                          View details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                  </div>
                ))
              )}

              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button 
                    onClick={() => handleSearch(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-500 font-semibold">Page {page} of {pagination.totalPages}</span>
                  <button 
                    onClick={() => handleSearch(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default SearchPublications;
