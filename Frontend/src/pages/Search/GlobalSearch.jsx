import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, BookOpen, Users, Building2, Bookmark, History, Trash2, HelpCircle } from 'lucide-react';
import ResearcherCard from './components/ResearcherCard';
import PublicationCard from './components/PublicationCard';
import InstitutionCard from './components/InstitutionCard';

export default function GlobalSearch() {
  const [activeTab, setActiveTab] = useState('researchers'); // researchers, publications, institutions
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortOption, setSortOption] = useState('relevance');

  // Advanced Filters
  const [filters, setFilters] = useState({
    country: '',
    institution: '',
    department: '',
    designation: '',
    minExperience: '',
    minPublications: '',
    minCitations: '',
    minHIndex: '',
    orcidVerified: false,
    googleScholarVerified: false,
    publicationType: '',
    year: '',
    openAccess: false,
    type: '' // Institution type
  });

  // History & Saved Searches
  const [history, setHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    fetchHistoryAndSaved();
  }, []);

  // Fetch results when tab, sort, page, or filters change
  useEffect(() => {
    executeSearch();
  }, [activeTab, sortOption, page]);

  const fetchHistoryAndSaved = async () => {
    try {
      const [histRes, savedRes] = await Promise.all([
        fetch('/api/search/history'),
        fetch('/api/search/saved')
      ]);
      const histData = await histRes.json();
      const savedData = await savedRes.json();

      if (histData.status === 'success') setHistory(histData.history || []);
      if (savedData.status === 'success') setSavedSearches(savedData.saved || []);
    } catch (err) {
      console.error('Error fetching history/saved:', err);
    }
  };

  // Autocomplete Suggestions
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.status === 'success') {
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const executeSearch = async () => {
    setLoading(true);
    try {
      let url = `/api/search/${activeTab}?page=${page}&sort=${sortOption}&limit=9`;
      if (query) url += `&query=${encodeURIComponent(query)}`;

      // Append active filters
      Object.keys(filters).forEach(key => {
        const val = filters[key];
        if (val !== '' && val !== false) {
          url += `&${key}=${encodeURIComponent(val)}`;
        }
      });

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'success') {
        setResults(data.results || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setSuggestions([]);
    executeSearch();
    fetchHistoryAndSaved(); // Refresh history
  };

  const handleSuggestionClick = (text, type) => {
    setQuery(text);
    setSuggestions([]);
    if (type === 'researcher') setActiveTab('researchers');
    else if (type === 'publication') setActiveTab('publications');
    else if (type === 'institution') setActiveTab('institutions');
    
    setPage(1);
    executeSearch();
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/api/search/history', { method: 'DELETE' });
      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) return;
    try {
      const res = await fetch('/api/search/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          query,
          filters,
          searchType: activeTab
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSaveName('');
        setShowSaveModal(false);
        fetchHistoryAndSaved();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSavedSearch = async (id) => {
    try {
      await fetch(`/api/search/saved/${id}`, { method: 'DELETE' });
      fetchHistoryAndSaved();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplySavedSearch = (saved) => {
    setQuery(saved.query || '');
    setActiveTab(saved.searchType || 'researchers');
    setFilters(saved.filters || {});
    setPage(1);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      country: '',
      institution: '',
      department: '',
      designation: '',
      minExperience: '',
      minPublications: '',
      minCitations: '',
      minHIndex: '',
      orcidVerified: false,
      googleScholarVerified: false,
      publicationType: '',
      year: '',
      openAccess: false,
      type: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white min-h-screen">
      
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2">
          Discover Academic Knowledge
        </h1>
        <p className="text-slate-400 text-sm">
          Search across millions of researchers, publications, and institutions.
        </p>
      </div>

      {/* Main Search Bar and Auto-suggestions */}
      <div className="max-w-3xl mx-auto mb-8 relative">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, title, keywords, or topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-2xl text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-teal-500/20 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl z-30 overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s.text, s.type)}
                className="w-full text-left px-4 py-3.5 hover:bg-slate-900 transition-colors duration-150 border-b border-slate-900/50 last:border-0 flex items-center justify-between text-sm"
              >
                <span>{s.text}</span>
                <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded capitalize">{s.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Layout Grid: Left Sidebar Filters, Right Search Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Filter Sidebar & Saved Searches */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Tabs / Search Scope */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-1.5">
            <button
              onClick={() => { setActiveTab('researchers'); setPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
                activeTab === 'researchers' ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:bg-slate-850'
              }`}
            >
              <Users className="w-4 h-4" />
              Researchers
            </button>
            <button
              onClick={() => { setActiveTab('publications'); setPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
                activeTab === 'publications' ? 'bg-blue-500 text-slate-950' : 'text-slate-300 hover:bg-slate-850'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Publications
            </button>
            <button
              onClick={() => { setActiveTab('institutions'); setPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
                activeTab === 'institutions' ? 'bg-indigo-500 text-slate-950' : 'text-slate-300 hover:bg-slate-850'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Institutions
            </button>
          </div>

          {/* Advanced Filters Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <span className="font-bold text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Advanced Filters
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Reset
              </button>
            </div>

            <div className="space-y-4">
              {/* Common Filters */}
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Country</label>
                <input
                  type="text"
                  placeholder="e.g. United States"
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-teal-500"
                />
              </div>

              {/* Researcher Specific Filters */}
              {activeTab === 'researchers' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Institution</label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={filters.institution}
                      onChange={(e) => handleFilterChange('institution', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Min Publications</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={filters.minPublications}
                      onChange={(e) => handleFilterChange('minPublications', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Min Citations</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={filters.minCitations}
                      onChange={(e) => handleFilterChange('minCitations', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Min h-index</label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={filters.minHIndex}
                      onChange={(e) => handleFilterChange('minHIndex', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                    />
                  </div>
                </>
              )}

              {/* Publication Specific Filters */}
              {activeTab === 'publications' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Publication Type</label>
                    <select
                      value={filters.publicationType}
                      onChange={(e) => handleFilterChange('publicationType', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-blue-500"
                    >
                      <option value="">Any Type</option>
                      <option value="Journal">Journal Article</option>
                      <option value="Conference">Conference Paper</option>
                      <option value="Book">Book</option>
                      <option value="Thesis">Thesis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Publication Year</label>
                    <input
                      type="number"
                      placeholder="e.g. 2025"
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={filters.openAccess}
                      onChange={(e) => handleFilterChange('openAccess', e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-0"
                    />
                    <span className="text-xs text-slate-300">Open Access only</span>
                  </label>
                </>
              )}

              {/* Institution Specific Filters */}
              {activeTab === 'institutions' && (
                <div>
                  <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Institution Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500"
                  >
                    <option value="">Any Type</option>
                    <option value="Academic">Academic</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleSearchSubmit}
                className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 font-bold text-xs rounded-xl mt-4 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-teal-400" />
                Saved Searches
              </h3>
              <div className="space-y-2">
                {savedSearches.map((s) => (
                  <div key={s._id} className="flex items-center justify-between group">
                    <button
                      onClick={() => handleApplySavedSearch(s)}
                      className="text-xs text-slate-300 hover:text-teal-400 text-left truncate flex-1 font-medium"
                    >
                      {s.name}
                    </button>
                    <button
                      onClick={() => handleDeleteSavedSearch(s._id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 3 Columns: Search Results list */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Results Info & Sorting */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                Found <span className="font-bold text-white">{total}</span> {activeTab}
              </span>
              <button
                onClick={() => setShowSaveModal(true)}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold bg-teal-500/5 border border-teal-500/20 hover:border-teal-500/40 px-2 py-1 rounded-lg transition-all flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3" />
                Save Search
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none"
              >
                <option value="relevance">Relevance</option>
                {activeTab === 'publications' && (
                  <>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </>
                )}
                <option value="citations">Most Cited</option>
                {activeTab === 'researchers' && (
                  <>
                    <option value="hIndex">h-index</option>
                    <option value="publications">Most Publications</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-900 border border-slate-850 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl py-16 text-center text-slate-500">
              <p className="text-sm">No results match your search query or filter options.</p>
              <button 
                onClick={() => { setQuery(''); handleResetFilters(); }} 
                className="text-xs text-teal-400 hover:underline mt-2 font-medium"
              >
                Clear all search filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'researchers' && results.map((item) => (
                <ResearcherCard key={item._id} researcher={item} />
              ))}
              {activeTab === 'publications' && results.map((item) => (
                <PublicationCard key={item._id} publication={item} />
              ))}
              {activeTab === 'institutions' && results.map((item) => (
                <InstitutionCard key={item._id} institution={item} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > results.length && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 rounded-xl text-sm font-semibold transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={results.length < 9}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 rounded-xl text-sm font-semibold transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Save Search</h3>
            <p className="text-slate-400 text-sm mb-4">
              Enter a name for this search configuration to access it quickly later.
            </p>
            <input
              type="text"
              placeholder="e.g. AI Researchers in United States"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-white outline-none mb-4 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                }}
                className="px-4 py-2 text-sm font-semibold border border-slate-850 hover:bg-slate-850 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                className="px-4 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-xl transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
