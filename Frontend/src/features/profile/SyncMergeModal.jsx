import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button.jsx';

const SyncMergeModal = ({ isOpen, onClose, onSyncComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compareData, setCompareData] = useState(null);
  const [selectedPubs, setSelectedPubs] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [syncAction, setSyncAction] = useState('merge'); // 'merge', 'updateAll'
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!isOpen) return;
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/profile/google-scholar/compare');
        setCompareData(response.data.data);
        // Pre-check all new publications
        if (response.data.data?.newPublications) {
          setSelectedPubs(response.data.data.newPublications.map(p => p.title));
        }
        // Pre-check changed fields that are not manually locked
        if (response.data.data?.profileDiff) {
          const changedNonLocked = Object.entries(response.data.data.profileDiff)
            .filter(([key, diff]) => diff.current !== diff.latest && !diff.isManualOverride)
            .map(([key]) => key);
          setSelectedFields(changedNonLocked);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to compare Google Scholar data.');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePub = (title) => {
    setSelectedPubs((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleSyncSubmit = async () => {
    setSyncing(true);
    setError('');
    try {
      await api.post('/profile/google-scholar/sync', {
        action: syncAction,
        fields: selectedFields,
        publications: selectedPubs,
      });
      onSyncComplete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete Google Scholar sync.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin-slow" /> Google Scholar Sync Wizard
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Compare and resolve differences between your local profile and Google Scholar.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto text-left space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-medium">Checking for profile differences...</p>
            </div>
          ) : (
            compareData && (
              <div className="space-y-6">
                
                {/* Sync Mode Selection */}
                <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <span className="text-xs font-bold text-slate-800 block">Select Synchronization Strategy</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="syncAction" 
                        value="updateAll"
                        checked={syncAction === 'updateAll'}
                        onChange={() => setSyncAction('updateAll')}
                        className="w-4 h-4 text-blue-600 border-slate-350"
                      />
                      Update All (Safely syncs all unlocked fields)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="syncAction" 
                        value="merge"
                        checked={syncAction === 'merge'}
                        onChange={() => setSyncAction('merge')}
                        className="w-4 h-4 text-blue-600 border-slate-355"
                      />
                      Selective Merge (Pick specific fields and publications)
                    </label>
                  </div>
                </div>

                {/* Profile Differences Comparison */}
                {syncAction === 'merge' && compareData.profileDiff && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Information Comparison</h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {Object.entries(compareData.profileDiff).map(([key, diff]) => {
                        const hasChanged = diff.current !== diff.latest;
                        const isChecked = selectedFields.includes(key);
                        const fieldLabels = {
                          displayName: 'Full Name',
                          institution: 'Institution',
                          department: 'Department',
                          bio: 'Biography (Interests)',
                          website: 'Website'
                        };
                        return (
                          <div key={key} className={`p-4 flex items-start gap-4 text-left transition-all ${
                            hasChanged ? 'bg-amber-50/5' : ''
                          }`}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              disabled={diff.isManualOverride && !isChecked}
                              onChange={() => setSelectedFields(prev => 
                                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                              )}
                              className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">{fieldLabels[key] || key}</span>
                                {diff.isManualOverride && (
                                  <span className="px-1.5 py-0.5 bg-red-50 text-red-650 border border-red-100 rounded-md text-[8px] font-bold uppercase">
                                    Manually Edited (Locked)
                                  </span>
                                )}
                                {!hasChanged && (
                                  <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[8px] font-semibold">
                                    No change
                                  </span>
                                )}
                              </div>
                              {hasChanged && (
                                <div className="grid grid-cols-2 gap-4 mt-1.5 text-xs">
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Current Local:</span>
                                    <span className="text-slate-600 truncate block">{diff.current || '(empty)'}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-blue-400 block font-semibold">Google Scholar:</span>
                                    <span className="text-blue-600 font-medium truncate block">{diff.latest || '(empty)'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Metrics Diff Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Metrics Comparison</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(compareData.metricsDiff).map(([key, diff]) => {
                      const hasChanged = diff.latest !== diff.current;
                      return (
                        <div key={key} className={`p-4 rounded-2xl border transition-all ${
                          hasChanged ? 'bg-blue-50/20 border-blue-100' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{key}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-sm font-semibold text-slate-500">{diff.current}</span>
                            {hasChanged && (
                              <>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="text-base font-extrabold text-blue-600">{diff.latest}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* New Publications Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" /> New Publications ({compareData.newPublications.length})
                    </h4>
                  </div>

                  {compareData.newPublications.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto opacity-70" />
                      <p className="text-xs text-slate-400 mt-2 font-medium">All publications are completely synchronized!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {compareData.newPublications.map((pub) => {
                        const isChecked = selectedPubs.includes(pub.title);
                        return (
                          <div 
                            key={pub.title} 
                            onClick={() => handleTogglePub(pub.title)}
                            className={`flex items-start gap-3 p-3 border rounded-2xl cursor-pointer transition-all ${
                              isChecked ? 'bg-blue-50/20 border-blue-200' : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="text-left flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-slate-800 leading-snug line-clamp-1">{pub.title}</h5>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{pub.authors}</p>
                              <div className="flex items-center gap-2 mt-1 text-[9px] font-semibold text-slate-400">
                                <span>{pub.journal || 'Journal'}</span>
                                {pub.publicationYear && (
                                  <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px]">{pub.publicationYear}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <Button variant="outline" onClick={onClose} disabled={syncing}>
            Close
          </Button>
          <Button
            onClick={handleSyncSubmit}
            disabled={syncing || !compareData || (compareData.newPublications.length > 0 && selectedPubs.length === 0)}
            isLoading={syncing}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            Import & Sync Selected
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SyncMergeModal;
