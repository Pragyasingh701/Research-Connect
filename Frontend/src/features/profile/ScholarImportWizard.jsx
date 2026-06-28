import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Award, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink, 
  RefreshCw,
  Trash2
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button.jsx';

const ScholarImportWizard = ({ onImportComplete, onCancel }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Preview State
  const [previewData, setPreviewData] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  
  // Selection States
  const [selectedPubs, setSelectedPubs] = useState([]);
  const [selectedFields, setSelectedFields] = useState(['displayName', 'institution', 'department', 'profilePhoto', 'bio', 'website']);
  const [importing, setImporting] = useState(false);

  const handlePreview = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError('');
    setPreviewData(null);
    setSearchResults([]);

    try {
      const response = await api.get(`/profile/google-scholar/preview?input=${encodeURIComponent(inputValue.trim())}`);
      const { data } = response.data;

      if (data.type === 'search_results') {
        setSearchResults(data.profiles);
      } else {
        setPreviewData(data);
        // Pre-check all publications by default
        setSelectedPubs(data.publications.map((p) => p.title));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch Scholar profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = async (authorId) => {
    setInputValue(authorId);
    setSearchResults([]);
    setLoading(true);
    try {
      const response = await api.get(`/profile/google-scholar/preview?input=${authorId}`);
      const { data } = response.data;
      setPreviewData(data);
      setSelectedPubs(data.publications.map((p) => p.title));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch selected profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePub = (title) => {
    setSelectedPubs((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleToggleAllPubs = () => {
    if (selectedPubs.length === previewData.publications.length) {
      setSelectedPubs([]);
    } else {
      setSelectedPubs(previewData.publications.map((p) => p.title));
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    setImporting(true);
    setError('');

    try {
      await api.post('/profile/google-scholar/import', {
        authorId: previewData.authorId,
        selectedPubTitles: selectedPubs,
        selectedFields,
      });
      onImportComplete();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete importing Scholar profile.');
      setImporting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-left space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" /> Link Google Scholar Account
          </h3>
          <p className="text-xs text-slate-400 mt-1">Import academic affiliations, citation metrics, and publications list.</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input query field */}
      {!previewData && searchResults.length === 0 && (
        <form onSubmit={handlePreview} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Paste Scholar Profile URL, Author ID, or search by Name"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            )}
            <Button type="submit" isLoading={loading} className="px-5">
              Preview Import
            </Button>
          </div>
        </form>
      )}

      {/* Search results selection fallback */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Multiple profiles match your search:</h4>
          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
            {searchResults.map((p) => (
              <div 
                key={p.authorId}
                onClick={() => handleSelectResult(p.authorId)}
                className="flex items-center gap-4 p-4 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 rounded-2xl cursor-pointer transition-all"
              >
                <img 
                  src={p.thumbnail || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                  alt={p.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-100"
                />
                <div className="text-left flex-1 min-w-0">
                  <h5 className="font-bold text-xs text-slate-800">{p.name}</h5>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{p.affiliations}</p>
                  {p.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.interests.slice(0, 3).map((int) => (
                        <span key={int} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-500">
                          {int}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setSearchResults([])}>Back to search</Button>
        </div>
      )}

      {/* Profile Import Preview screen */}
      {previewData && (
        <div className="space-y-6">
          {/* User profile Summary info */}
          <div className="flex items-center gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
            <img 
              src={previewData.profile.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
              alt={previewData.profile.fullName}
              className="w-14 h-14 rounded-full object-cover border border-slate-100"
            />
            <div className="text-left flex-grow min-w-0">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                {previewData.profile.fullName} 
                <a href={previewData.profile.website || '#'} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </h4>
              <p className="text-xs text-slate-500">{previewData.profile.affiliation}</p>
              {previewData.profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {previewData.profile.interests.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selective Profile Fields Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Select Profile Fields to Import
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {[
                { key: 'displayName', label: 'Full Name', val: previewData.profile.fullName },
                { key: 'institution', label: 'Institution', val: previewData.profile.institution },
                { key: 'department', label: 'Department', val: previewData.profile.department },
                { key: 'profilePhoto', label: 'Profile Photo', val: previewData.profile.profilePhoto ? 'Available' : 'None' },
                { key: 'bio', label: 'Biography (Interests)', val: previewData.profile.interests.join(', ') },
                { key: 'website', label: 'Personal Website', val: previewData.profile.homepage || 'None' }
              ].map((field) => {
                const isChecked = selectedFields.includes(field.key);
                return (
                  <label key={field.key} className={`flex items-start gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                    isChecked ? 'bg-blue-50/10 border-blue-200' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setSelectedFields(prev => 
                        prev.includes(field.key) ? prev.filter(k => k !== field.key) : [...prev, field.key]
                      )}
                      className="mt-0.5 w-4 h-4 text-blue-600 border-slate-350 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-700 block">{field.label}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{field.val || 'Not specified'}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Research citation statistics widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 border border-slate-200/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Publications</span>
              <h4 className="text-base font-extrabold text-slate-700 mt-1">{previewData.metrics.totalPublications}</h4>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Citations</span>
              <h4 className="text-base font-extrabold text-slate-700 mt-1">{previewData.metrics.totalCitations}</h4>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">h-index</span>
              <h4 className="text-base font-extrabold text-slate-700 mt-1">{previewData.metrics.hIndex}</h4>
            </div>
            <div className="p-3 border border-slate-200/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">i10-index</span>
              <h4 className="text-base font-extrabold text-slate-700 mt-1">{previewData.metrics.i10Index}</h4>
            </div>
          </div>

          {/* Publications selective list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" /> Publications List ({selectedPubs.length} Selected)
              </h4>
              <button 
                onClick={handleToggleAllPubs}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {selectedPubs.length === previewData.publications.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {previewData.publications.map((pub) => {
                const isChecked = selectedPubs.includes(pub.title);
                return (
                  <div 
                    key={pub.title} 
                    className="flex items-start gap-3 p-3 border border-slate-150 hover:bg-slate-50/50 rounded-xl transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePub(pub.title)}
                      className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-800 leading-snug line-clamp-1">{pub.title}</h5>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{pub.authors}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] font-semibold text-slate-400">
                        <span>{pub.journal || 'Journal'}</span>
                        {pub.publicationYear && (
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px]">{pub.publicationYear}</span>
                        )}
                        {pub.citationCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-amber-50 text-amber-600 rounded text-[9px]">
                            {pub.citationCount} Citations
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collaborators preview summary list */}
          {previewData.coAuthors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Users className="w-4 h-4 text-blue-600" /> Imported Co-Authors ({previewData.coAuthors.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {previewData.coAuthors.slice(0, 8).map((ca) => (
                  <span 
                    key={ca.scholarId} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-medium text-slate-600"
                  >
                    {ca.name}
                  </span>
                ))}
                {previewData.coAuthors.length > 8 && (
                  <span className="inline-flex items-center px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-400">
                    +{previewData.coAuthors.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Control Actions buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button 
              variant="outline" 
              onClick={() => {
                setPreviewData(null);
                setInputValue('');
              }}
              disabled={importing}
            >
              Reset Search
            </Button>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={importing}>Cancel</Button>
              )}
              <Button 
                onClick={handleImport} 
                isLoading={importing} 
                className="px-6 bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm Import <CheckCircle2 className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarImportWizard;
