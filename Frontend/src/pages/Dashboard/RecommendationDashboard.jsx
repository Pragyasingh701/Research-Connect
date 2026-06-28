import React, { useState, useEffect } from 'react';
import { Sparkles, Users, FileText, TrendingUp, Compass, Bookmark, Check } from 'lucide-react';
import PublicationCard from '../Search/components/PublicationCard';

export default function RecommendationDashboard() {
  const [researchers, setResearchers] = useState([]);
  const [publications, setPublications] = useState([]);
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const [resRec, pubRec, trendKW] = await Promise.all([
        fetch('/api/recommendations/researchers?limit=6'),
        fetch('/api/recommendations/publications?limit=6'),
        fetch('/api/keywords/trending')
      ]);

      const resData = await resRec.json();
      const pubData = await pubRec.json();
      const trendData = await trendKW.json();

      if (resData.status === 'success') setResearchers(resData.recommendations || []);
      if (pubData.status === 'success') {
        // Simple mapping from feed array
        const list = pubData.feed || [];
        setPublications(list.map(f => f.data ? { ...f.data, score: f.score } : f));
      }
      if (trendData.status === 'success') setTrendingKeywords(trendData.keywords || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = (id) => {
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBookmark = (id) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getMatchLevelColor = (score) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    if (score >= 30) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  const getMatchLabel = (score) => {
    if (score >= 85) return 'Very High Match';
    if (score >= 60) return 'High Match';
    if (score >= 30) return 'Medium Match';
    return 'Low Match';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-white">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-8 h-8 text-teal-400 animate-pulse" />
          <h1 className="text-3xl font-bold">AI Recommendation Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-900 border border-slate-850 rounded-2xl animate-pulse"></div>
            <div className="h-64 bg-slate-900 border border-slate-850 rounded-2xl animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-900 border border-slate-850 rounded-2xl animate-pulse"></div>
            <div className="h-48 bg-slate-900 border border-slate-850 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-teal-400 animate-bounce" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              AI Recommendation Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Personalized researchers, publications, and topics curated based on your research profile.
            </p>
          </div>
        </div>
        <button 
          onClick={fetchRecommendations}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-650 text-sm font-semibold rounded-xl transition-all duration-200"
        >
          Refresh Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recommended Researchers */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-bold">Suggested Collaborators</h2>
            </div>
            
            {researchers.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No recommended researchers found. Try adding more keywords to your profile.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {researchers.map((rec) => {
                  const isFollowed = followedIds.has(rec.user._id);
                  const profile = rec.profile || {};
                  return (
                    <div 
                      key={rec.user._id}
                      className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-slate-950 text-base shadow-lg">
                              {rec.user.fullName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm hover:text-teal-400 cursor-pointer">{rec.user.fullName}</h3>
                              <p className="text-xs text-slate-400">{profile.designation || 'Researcher'}</p>
                              <p className="text-[10px] text-slate-500">{profile.institution || 'No Institution'}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 border rounded-full font-medium uppercase tracking-wider ${getMatchLevelColor(rec.finalMatch)}`}>
                            {rec.finalMatch}% Match
                          </span>
                        </div>

                        {profile.bio && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {profile.bio}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-900">
                        <span className="text-[10px] text-slate-500">
                          {rec.sharedFieldsCount || 0} shared interests
                        </span>
                        <button
                          onClick={() => handleFollow(rec.user._id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-1 ${
                            isFollowed 
                              ? 'bg-slate-800 text-teal-400 border border-teal-500/20' 
                              : 'bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-md shadow-teal-500/10'
                          }`}
                        >
                          {isFollowed ? <Check className="w-3 h-3" /> : null}
                          {isFollowed ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recommended Publications */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold">Recommended Publications</h2>
            </div>

            {publications.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No recommended publications available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {publications.map((pub) => (
                  <PublicationCard key={pub._id} publication={pub} />
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Trending Topics */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold">Trending Topics</h2>
            </div>
            
            {trendingKeywords.length === 0 ? (
              <p className="text-slate-500 text-sm">No trending topics currently.</p>
            ) : (
              <div className="space-y-3">
                {trendingKeywords.slice(0, 5).map((kw, index) => (
                  <div 
                    key={kw._id}
                    className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-slate-750 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 w-4">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-200">
                        {kw.keyword}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase bg-slate-900 px-2 py-0.5 rounded">
                      {kw.category || 'ML'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recommended Conferences */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Suggested Venues</h2>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <h4 className="text-xs font-bold text-white">NeurIPS 2026</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Conference on Neural Information Processing Systems</p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                  <span>Deadline: May 15, 2026</span>
                  <span className="text-amber-400">95% Relevance</span>
                </div>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <h4 className="text-xs font-bold text-white">CVPR 2026</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Conference on Computer Vision and Pattern Recognition</p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                  <span>Deadline: Nov 15, 2025</span>
                  <span className="text-amber-400">88% Relevance</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
