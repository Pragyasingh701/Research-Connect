import React, { useState, useEffect } from 'react';

export default function KeywordManager() {
  const [myKeywords, setMyKeywords] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [popularKeywords, setPopularKeywords] = useState([]);
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch initial data
  useEffect(() => {
    fetchMyKeywords();
    fetchPopularAndTrending();
    fetchAiSuggestions();
  }, []);

  const fetchMyKeywords = async () => {
    try {
      const res = await fetch('/api/keywords/my');
      const data = await res.json();
      if (data.status === 'success') {
        setMyKeywords(data.keywords || []);
      }
    } catch (err) {
      console.error('Error fetching my keywords:', err);
    }
  };

  const fetchPopularAndTrending = async () => {
    try {
      const [popRes, trendRes] = await Promise.all([
        fetch('/api/keywords/popular'),
        fetch('/api/keywords/trending')
      ]);
      const popData = await popRes.json();
      const trendData = await trendRes.json();
      
      if (popData.status === 'success') setPopularKeywords(popData.keywords || []);
      if (trendData.status === 'success') setTrendingKeywords(trendData.keywords || []);
    } catch (err) {
      console.error('Error fetching keywords:', err);
    }
  };

  const fetchAiSuggestions = async () => {
    try {
      const res = await fetch('/api/keywords/suggested');
      const data = await res.json();
      if (data.status === 'success') {
        setAiSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
    }
  };

  // Handle autocomplete search
  useEffect(() => {
    if (inputVal.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/keywords?search=${encodeURIComponent(inputVal)}`);
        const data = await res.json();
        if (data.status === 'success') {
          setSuggestions(data.keywords || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [inputVal]);

  const handleAddKeyword = async (keywordStr) => {
    if (!keywordStr.trim()) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keywordStr })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: `Added "${keywordStr}" successfully!` });
        setInputVal('');
        setSuggestions([]);
        fetchMyKeywords();
        fetchAiSuggestions();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add keyword' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveKeyword = async (keywordId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/keywords/${keywordId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchMyKeywords();
        fetchAiSuggestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(myKeywords.map(k => k.keyword)));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "research_interests.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setLoading(true);
    try {
      const items = importText.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/keywords/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: items })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: data.message });
        setShowImportModal(false);
        setImportText('');
        fetchMyKeywords();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to import keywords' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            Research Interests & Keywords
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage your areas of expertise. These keywords drive your recommendations and search visibility.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-sm font-semibold border border-slate-700 hover:border-teal-500 hover:text-teal-400 rounded-xl transition-all duration-200"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-semibold border border-slate-700 hover:border-blue-500 hover:text-blue-400 rounded-xl transition-all duration-200"
          >
            Export
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between ${
          message.type === 'success' ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Current Keywords */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">My Keywords</h3>
        {myKeywords.length === 0 ? (
          <div className="text-slate-500 text-sm py-4 text-center border border-dashed border-slate-800 rounded-xl">
            No keywords added yet. Use the search bar below to add your research interests.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myKeywords.map((kw) => (
              <span 
                key={kw._id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-sm font-medium transition-all duration-150"
              >
                <span>{kw.keyword}</span>
                <button 
                  disabled={loading}
                  onClick={() => handleRemoveKeyword(kw._id)}
                  className="w-4 h-4 rounded-full bg-slate-900 text-slate-400 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-xs transition-colors duration-150"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search & Add */}
      <div className="mb-8 relative">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Add Keywords</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search or type a new research interest (e.g., Deep Learning)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-150"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddKeyword(inputVal);
              }
            }}
          />
          <button
            disabled={loading}
            onClick={() => handleAddKeyword(inputVal)}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all duration-150"
          >
            Add
          </button>
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-850 rounded-xl shadow-2xl z-20 overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s._id}
                onClick={() => handleAddKeyword(s.keyword)}
                className="w-full text-left px-4 py-3 hover:bg-slate-900 transition-colors duration-150 border-b border-slate-900/50 last:border-0 flex items-center justify-between"
              >
                <span>{s.keyword}</span>
                <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full capitalize">{s.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Suggested Keywords */}
      {aiSuggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            AI Suggested Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map((kw, idx) => (
              <button
                key={idx}
                onClick={() => handleAddKeyword(kw)}
                className="px-3 py-1.5 bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/20 hover:border-teal-500/40 text-teal-300 hover:text-teal-200 rounded-full text-xs font-medium transition-all duration-150"
              >
                + {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular and Trending Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Popular Keywords</h3>
          <div className="flex flex-wrap gap-1.5">
            {popularKeywords.slice(0, 10).map((kw) => (
              <button
                key={kw._id}
                onClick={() => handleAddKeyword(kw.keyword)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-all duration-150"
              >
                {kw.keyword}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3">Trending Topics</h3>
          <div className="flex flex-wrap gap-1.5">
            {trendingKeywords.slice(0, 10).map((kw) => (
              <button
                key={kw._id}
                onClick={() => handleAddKeyword(kw.keyword)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-all duration-150"
              >
                🔥 {kw.keyword}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2">Import Keywords</h3>
            <p className="text-slate-400 text-sm mb-4">
              Paste your research interests as a comma-separated list below.
            </p>
            <textarea
              placeholder="e.g. Deep Learning, Computer Vision, CNN, Medical Imaging"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={4}
              className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-white outline-none resize-none placeholder-slate-600 mb-4 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="px-4 py-2 text-sm font-semibold border border-slate-850 hover:bg-slate-850 rounded-xl transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleImport}
                className="px-4 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-xl transition-colors duration-150"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
