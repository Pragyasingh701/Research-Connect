import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Plus, 
  Bookmark,
  ExternalLink,
  ChevronRight,
  UserPlus,
  Calendar,
  Users
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TaxonomyBrowser from './components/TaxonomyBrowser';

const DashboardHome = () => {
  const { user } = useAuth();
  
  const [feedItems, setFeedItems] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [trendingPubs, setTrendingPubs] = useState([]);
  const [coAuthors, setCoAuthors] = useState([]);
  
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingCoAuthors, setLoadingCoAuthors] = useState(true);
  
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);

  // Fetch Personalized Feed
  const fetchFeed = async (pageNumber = 1) => {
    try {
      setLoadingFeed(true);
      const response = await api.get(`/feed/home?page=${pageNumber}&limit=5`);
      const { feed } = response.data;
      
      if (feed.length < 5) {
        setHasMoreFeed(false);
      }
      
      if (pageNumber === 1) {
        setFeedItems(feed);
      } else {
        setFeedItems((prev) => [...prev, ...feed]);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Fetch Suggested Researchers
  const fetchSuggestedResearchers = async () => {
    try {
      setLoadingRecs(true);
      const response = await api.get('/feed/recommendations/researchers?limit=4');
      setResearchers(response.data.recommendations);
    } catch (err) {
      console.error('Failed to load researcher suggestions:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Fetch Trending Publications
  const fetchTrendingPublications = async () => {
    try {
      const response = await api.get('/feed/trending?limit=4');
      setTrendingPubs(response.data.publications);
    } catch (err) {
      console.error('Failed to load trending publications:', err);
    }
  };

  // Fetch Co-Authors
  const fetchCoAuthors = async () => {
    try {
      setLoadingCoAuthors(true);
      const response = await api.get('/profile/co-authors');
      setCoAuthors(response.data.coAuthors || []);
    } catch (err) {
      console.error('Failed to load co-authors:', err);
    } finally {
      setLoadingCoAuthors(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeed(1);
      fetchSuggestedResearchers();
      fetchTrendingPublications();
      fetchCoAuthors();
    }
  }, [user]);

  const handleLoadMore = () => {
    const nextPage = feedPage + 1;
    setFeedPage(nextPage);
    fetchFeed(nextPage);
  };

  const handleSavePublication = async (pubId) => {
    try {
      alert('Publication saved to your library!');
    } catch (err) {
      console.error('Failed to save publication:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 max-w-7xl mx-auto px-1 py-2">
      {/* Left 3 Columns: Feed and Onboarding */}
      <div className="xl:col-span-3 space-y-8">
        


        {/* Suggested Researchers Horizontal Panel */}
        <section className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-brand-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-blue animate-pulse" /> Recommended Colleagues
            </h2>
            <span className="text-xs font-semibold text-brand-text-secondary/75">Based on shared research fields</span>
          </div>

          {loadingRecs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-44 bg-brand-card border border-brand-border rounded-2xl p-5 animate-pulse flex flex-col justify-between shadow-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                    <div className="w-20 h-3 bg-slate-100 rounded-full"></div>
                    <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {researchers.map((rec) => (
                <div 
                  key={rec.user._id} 
                  className="bg-brand-card border border-brand-border hover:border-brand-blue/30 hover:shadow-md rounded-2xl p-5 flex flex-col items-center justify-between transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <img 
                      src={rec.profile?.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                      alt={rec.user.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-brand-border shadow-sm"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-brand-text-primary line-clamp-1 group-hover:text-brand-blue transition-colors">{rec.user.fullName}</h4>
                      <p className="text-[10px] text-brand-text-secondary font-medium line-clamp-1 mt-0.5">
                        {rec.profile?.institution || 'Stanford University'}
                      </p>
                    </div>
                    {rec.finalMatch > 0 && (
                      <span className="px-2 py-0.5 bg-brand-light-blue/50 text-brand-blue border border-brand-blue/10 rounded-full text-[9px] font-bold">
                        {rec.finalMatch}% Match
                      </span>
                    )}
                  </div>
                  <button className="w-full mt-4 flex items-center justify-center gap-1.5 py-1.5 border border-brand-blue/20 hover:bg-brand-blue hover:text-white rounded-xl text-[10px] font-bold text-brand-blue hover:border-transparent transition-all duration-250 cursor-pointer shadow-sm shadow-brand-blue/5">
                    <UserPlus className="w-3.5 h-3.5" /> Follow
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Center Feed: Suggested Research */}
        <section className="space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <h2 className="text-lg font-bold font-display text-brand-text-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-blue" /> Personalized Research Feed
            </h2>
          </div>

          {loadingFeed && feedPage === 1 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-brand-card border border-brand-border rounded-2xl p-6 animate-pulse space-y-4 shadow-sm">
                  <div className="h-4 w-1/3 bg-slate-100 rounded-full"></div>
                  <div className="h-3 w-3/4 bg-slate-100 rounded-full"></div>
                  <div className="h-16 w-full bg-slate-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {feedItems.map((item) => {
                const pub = item.data;
                const type = (pub.publicationType || 'journal').toLowerCase();
                let accentBarColor = 'bg-brand-blue';
                let typeBadgeBg = 'bg-brand-light-blue/40 text-brand-blue border-brand-blue/10';
                
                if (type === 'conference') {
                  accentBarColor = 'bg-brand-indigo';
                  typeBadgeBg = 'bg-brand-light-purple/50 text-brand-indigo border-brand-indigo/10';
                } else if (type === 'preprint' || type === 'book' || type === 'other') {
                  accentBarColor = 'bg-brand-orange';
                  typeBadgeBg = 'bg-brand-light-orange/40 text-brand-orange border-brand-orange/10';
                }

                let matchBadgeBg = 'bg-brand-light-blue text-brand-blue border-brand-blue/10';
                if (item.score >= 80) {
                  matchBadgeBg = 'bg-brand-light-green text-brand-success border-brand-success/15';
                }

                return (
                  <div 
                    key={pub._id}
                    className="bg-brand-card border border-brand-border/80 hover:border-brand-blue/20 hover:shadow-md rounded-2xl overflow-hidden flex flex-col md:flex-row md:items-stretch transition-all duration-300 text-left shadow-sm"
                  >
                    {/* Accent color bar */}
                    <div className={`w-full md:w-1.5 h-1.5 md:h-auto ${accentBarColor} shrink-0`} />

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Score Badge and Title */}
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-bold text-sm sm:text-base text-brand-text-primary leading-snug hover:text-brand-blue transition-colors font-display">
                            {pub.title}
                          </h3>
                          {item.score > 0 && (
                            <span className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold border ${matchBadgeBg}`}>
                              {item.score}% Match
                            </span>
                          )}
                        </div>

                        {/* Abstract Snippet */}
                        <p className="text-xs text-brand-text-secondary line-clamp-3 leading-relaxed">
                          {pub.abstract}
                        </p>

                        {/* Keywords Chips */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeBadgeBg}`}>
                            {pub.publicationType}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-brand-text-secondary/75 border border-brand-border/40 rounded text-[10px] font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Published in {pub.publicationYear}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Metadata & Action bar */}
                      <div className="flex items-center justify-between border-t border-brand-border/60 mt-5 pt-4 text-xs font-semibold text-brand-text-secondary">
                        <div className="flex items-center gap-3">
                          <span className="text-brand-text-secondary/80 truncate max-w-[200px]">{pub.journal || 'Academic Journal'}</span>
                          {pub.citationCount > 0 && (
                            <span className="px-2 py-0.5 bg-brand-light-green text-brand-success border border-brand-success/10 rounded text-[10px] font-extrabold">
                              {pub.citationCount} Citations
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleSavePublication(pub._id)}
                            className="p-2 text-brand-text-secondary/60 hover:text-brand-blue hover:bg-brand-light-blue/20 rounded-xl transition-all cursor-pointer"
                            title="Save to Library"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          {pub.pdfUrl && (
                            <a 
                              href={pub.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-brand-text-secondary/60 hover:text-brand-blue hover:bg-brand-light-blue/20 rounded-xl transition-all cursor-pointer"
                              title="View PDF"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {feedItems.length === 0 && (
                <div className="p-16 text-center bg-brand-card border border-brand-border/80 rounded-2xl space-y-4 shadow-sm">
                  <BookOpen className="w-12 h-12 text-brand-text-secondary/30 mx-auto" />
                  <div>
                    <h4 className="font-bold text-brand-text-primary text-base">No suggestions yet</h4>
                    <p className="text-xs text-brand-text-secondary max-w-xs mx-auto mt-1">
                      Try adding keywords or connecting your Google Scholar ID to get personalized paper updates.
                    </p>
                  </div>
                </div>
              )}

              {hasMoreFeed && (
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingFeed}
                  className="w-full py-3 bg-brand-card border border-brand-blue/20 hover:border-brand-blue hover:bg-brand-light-blue/10 text-brand-blue rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {loadingFeed ? 'Generating Feed...' : 'Load More Recommendations'}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Academic Taxonomy Browser */}
        <section className="pt-4 border-t border-brand-border/60">
          <TaxonomyBrowser />
        </section>
      </div>

      {/* Right Column: Profile Completion, Metrics, Trending Keywords */}
      <div className="space-y-8 text-left">
        
        {/* Research Metrics Widget */}
        <div className="bg-brand-card border border-brand-border/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5 font-display">
            <Award className="w-4.5 h-4.5 text-brand-blue" /> Academic Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3.5 bg-brand-light-blue/30 rounded-xl border border-brand-blue/10 text-center hover:shadow-sm transition-all">
              <span className="text-[10px] text-brand-blue font-bold uppercase tracking-wider">Publications</span>
              <h4 className="text-2xl font-extrabold text-brand-text-primary mt-1">{user?.publications || 0}</h4>
            </div>
            <div className="p-3.5 bg-brand-light-green/45 rounded-xl border border-brand-success/10 text-center hover:shadow-sm transition-all">
              <span className="text-[10px] text-brand-success font-bold uppercase tracking-wider">Citations</span>
              <h4 className="text-2xl font-extrabold text-brand-success mt-1">{user?.citations || 0}</h4>
            </div>
            <div className="p-3.5 bg-brand-light-purple/45 rounded-xl border border-brand-indigo/10 text-center hover:shadow-sm transition-all">
              <span className="text-[10px] text-brand-indigo font-bold uppercase tracking-wider">h-index</span>
              <h4 className="text-2xl font-extrabold text-brand-indigo mt-1">{user?.hIndex || 0}</h4>
            </div>
            <div className="p-3.5 bg-brand-light-orange/45 rounded-xl border border-brand-orange/10 text-center hover:shadow-sm transition-all">
              <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">i10-index</span>
              <h4 className="text-2xl font-extrabold text-brand-orange mt-1">{user?.i10Index || 0}</h4>
            </div>
          </div>
        </div>

        {/* Global Trending Publications */}
        <div className="bg-brand-card border border-brand-border/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5 font-display">
            <TrendingUp className="w-4.5 h-4.5 text-brand-indigo" /> Trending Publications
          </h3>
          <div className="space-y-4">
            {trendingPubs.map((pub) => (
              <div key={pub._id} className="group text-left space-y-1 pb-3 border-b border-brand-border/40 last:border-b-0 last:pb-0">
                <h4 className="font-bold text-xs text-brand-text-primary group-hover:text-brand-blue transition-colors line-clamp-2 leading-snug">
                  {pub.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-brand-text-secondary mt-1">
                  <span className="font-medium truncate max-w-[120px]">{pub.journal || 'Journal'}</span>
                  <span className="px-1.5 py-0.5 bg-brand-light-green text-brand-success border border-brand-success/10 font-bold rounded">
                    {pub.citationCount} Citations
                  </span>
                </div>
              </div>
            ))}
            
            {trendingPubs.length === 0 && (
              <p className="text-xs text-brand-text-secondary/70 italic">No trending papers indexed.</p>
            )}
          </div>
        </div>

        {/* Co-Authors Widget */}
        <div className="bg-brand-card border border-brand-border/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5 font-display">
            <Users className="w-4.5 h-4.5 text-brand-blue" /> Co-Authors
          </h3>
          <div className="space-y-3.5">
            {loadingCoAuthors ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-100 rounded-full w-24"></div>
                      <div className="h-2 bg-slate-100 rounded-full w-36"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : coAuthors.length > 0 ? (
              coAuthors.map((co) => (
                <div key={co._id} className="flex items-center justify-between group pb-3 border-b border-brand-border/40 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-light-blue/40 text-brand-blue font-bold text-xs flex items-center justify-center shrink-0 border border-brand-blue/10">
                      {co.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-xs text-brand-text-primary line-clamp-1 group-hover:text-brand-blue transition-colors">
                        {co.name}
                      </h4>
                      <p className="text-[10px] text-brand-text-secondary font-medium line-clamp-1 mt-0.5 max-w-[140px]">
                        {co.affiliation || 'Academic Researcher'}
                      </p>
                    </div>
                  </div>
                  {co.scholarUrl ? (
                    <a 
                      href={co.scholarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-brand-blue hover:text-brand-blue-hover flex items-center gap-0.5 shrink-0"
                    >
                      Google Scholar <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">Profile</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-brand-text-secondary/70 italic">No co-authors synced yet.</p>
                <Link to="/profile" className="text-[10px] font-bold text-brand-blue hover:underline mt-1.5 block">
                  Sync Google Scholar Profile &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions widget */}
        <div className="bg-brand-card border border-brand-border/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider font-display">Quick Actions</h3>
          <div className="flex flex-col gap-2.5">
            <Link to="/profile">
              <button className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-brand-light-blue/20 hover:text-brand-blue hover:border-brand-blue/20 text-xs font-bold text-brand-text-primary border border-brand-border rounded-xl transition-all cursor-pointer">
                <span>Update Research Fields</span>
                <ChevronRight className="w-4 h-4 text-brand-text-secondary/60" />
              </button>
            </Link>
            <button 
              onClick={() => alert('New workspace coordination will be supported in Phase 2.')}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-brand-light-blue/20 hover:text-brand-blue hover:border-brand-blue/20 text-xs font-bold text-brand-text-primary border border-brand-border rounded-xl transition-all cursor-pointer"
            >
              <span>Coordinate Study Workspace</span>
              <ChevronRight className="w-4 h-4 text-brand-text-secondary/60" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardHome;
