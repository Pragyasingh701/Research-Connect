import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Award, 
  BarChart3, 
  Plus, 
  ArrowUpRight, 
  ArrowDownToLine, 
  Eye, 
  Bookmark, 
  Calendar, 
  Search, 
  SlidersHorizontal, 
  RefreshCw 
} from 'lucide-react';
import api from '../../services/api';
import PublicationCard from '../Search/components/PublicationCard';

const PublicationsDashboard = () => {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [syncing, setSyncing] = useState(false);
  
  const [stats, setStats] = useState({
    totalCitations: 0,
    hIndex: 0,
    i10Index: 0,
    totalViews: 412,  // Simulated default
    totalDownloads: 184 // Simulated default
  });

  const fetchMyPublications = async () => {
    try {
      const response = await api.get('/profile/me');
      setPublications(response.data.publications || []);
      const profile = response.data.profile;
      if (profile) {
        setStats({
          totalCitations: profile.citations || 0,
          hIndex: profile.hIndex || 0,
          i10Index: profile.i10Index || 0,
          totalViews: 412,
          totalDownloads: 184
        });
      }
    } catch (err) {
      console.error('Failed to load portfolio publications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncScholar = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      // Optional: Re-fetch or trigger a success state
      fetchMyPublications();
    }, 1500);
  };

  useEffect(() => {
    fetchMyPublications();
  }, []);

  // Filter and Sort Logic
  const filteredPublications = publications
    .filter((pub) => {
      const matchesSearch = 
        pub.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.authors?.some(a => (a.authorName || a.displayName)?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedType === 'all' || pub.publicationType?.toLowerCase() === selectedType.toLowerCase();
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.publicationYear || 0) - (a.publicationYear || 0);
      }
      if (sortBy === 'oldest') {
        return (a.publicationYear || 0) - (b.publicationYear || 0);
      }
      if (sortBy === 'citations') {
        return (b.citationCount || 0) - (a.citationCount || 0);
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin"></div>
        <p className="text-sm text-brand-text-secondary font-semibold tracking-wide">Loading portfolio dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto px-1 py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-brand-border/60">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient font-display">
            Research Portfolio
          </h2>
          <p className="text-xs text-brand-text-secondary mt-1">
            Manage your bibliography publications, track downloads metrics, and coordinate revisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncScholar}
            disabled={syncing}
            className="px-4 py-2.5 border border-brand-blue/20 hover:border-brand-blue/40 text-brand-blue bg-brand-light-blue/30 hover:bg-brand-light-blue/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Google Scholar'}
          </button>
          <Link to="/publications/upload" className="shrink-0">
            <button className="px-5 py-2.5 bg-primary-gradient hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-blue/10 flex items-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]">
              <Plus className="w-4 h-4" /> Upload Publication
            </button>
          </Link>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Publications */}
        <div className="bg-brand-light-blue/30 border border-brand-blue/10 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between text-brand-blue">
            <span className="text-[10px] font-bold uppercase tracking-wider">Publications</span>
            <BookOpen className="w-5 h-5" />
          </div>
          <h4 className="text-3xl font-extrabold text-brand-text-primary mt-4">{publications.length}</h4>
        </div>

        {/* Citations */}
        <div className="bg-brand-light-green/40 border border-brand-success/10 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between text-brand-success">
            <span className="text-[10px] font-bold uppercase tracking-wider">Citations</span>
            <Award className="w-5 h-5" />
          </div>
          <h4 className="text-3xl font-extrabold text-brand-success mt-4">{stats.totalCitations}</h4>
        </div>

        {/* h-index */}
        <div className="bg-brand-light-purple/40 border border-brand-indigo/10 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between text-brand-indigo">
            <span className="text-[10px] font-bold uppercase tracking-wider">h-index</span>
            <BarChart3 className="w-5 h-5" />
          </div>
          <h4 className="text-3xl font-extrabold text-brand-indigo mt-4">{stats.hIndex}</h4>
        </div>

        {/* i10-index */}
        <div className="bg-brand-light-orange/40 border border-brand-orange/10 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between text-brand-orange">
            <span className="text-[10px] font-bold uppercase tracking-wider">i10-index</span>
            <Bookmark className="w-5 h-5" />
          </div>
          <h4 className="text-3xl font-extrabold text-brand-orange mt-4">{stats.i10Index}</h4>
        </div>

        {/* Reads / Views */}
        <div className="bg-slate-50 border border-brand-border/60 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between text-brand-text-secondary">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reads / Views</span>
            <Eye className="w-5 h-5 text-brand-indigo" />
          </div>
          <h4 className="text-3xl font-extrabold text-brand-text-primary mt-4">{stats.totalViews}</h4>
        </div>

        {/* PDF Downloads */}
        <div className="bg-red-50/70 border border-brand-red/10 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between text-brand-red">
            <span className="text-[10px] font-bold uppercase tracking-wider">PDF Downloads</span>
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <h4 className="text-3xl font-extrabold text-brand-red mt-4">{stats.totalDownloads}</h4>
        </div>
      </div>

      {/* Filter and Search Control Bar */}
      <div className="bg-brand-card border border-brand-border/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-brand-bg p-1 border border-brand-border rounded-xl">
            {['all', 'journal', 'conference', 'preprint'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                {type === 'all' ? 'All Works' : `${type}s`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-text-secondary flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-brand-bg border border-brand-border rounded-xl px-3 py-1.5 text-xs font-bold text-brand-text-primary focus:outline-none focus:border-brand-blue cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="citations">Most Cited</option>
            </select>
          </div>
        </div>
      </div>

      {/* Publications List */}
      {filteredPublications.length === 0 ? (
        <div className="bg-brand-card border border-brand-border/80 rounded-2xl p-16 text-center space-y-4 shadow-sm">
          <BookOpen className="w-12 h-12 text-brand-text-secondary/40 mx-auto" />
          <div>
            <h4 className="font-bold text-brand-text-primary text-base">No matching works found</h4>
            <p className="text-xs text-brand-text-secondary max-w-sm mx-auto mt-1">
              Try adjusting your search query or filters, or upload a new publication to expand your portfolio.
            </p>
          </div>
          {(searchQuery || selectedType !== 'all') && (
            <button 
              onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
              className="px-4 py-2 border border-brand-border hover:bg-brand-bg text-brand-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPublications.map((pub) => (
            <PublicationCard key={pub._id} publication={pub} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicationsDashboard;
