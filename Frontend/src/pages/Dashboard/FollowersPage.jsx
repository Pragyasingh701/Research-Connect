import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, Search, SlidersHorizontal, ArrowLeft, MessageSquare, 
  Briefcase, Sparkles, MapPin, Loader2, ArrowUpDown, ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const FollowersPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Target User ID (default to logged-in user)
  const targetUserId = searchParams.get('id') || user?.id || user?._id;
  const isOwnProfile = targetUserId === (user?.id || user?._id);

  // States
  const [followers, setFollowers] = useState([]);
  const [targetUserName, setTargetUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalFollowers, setTotalFollowers] = useState(0);

  // List of followed IDs by the logged-in user (to toggle Follow Back / Following state)
  const [myFollowingIds, setMyFollowingIds] = useState(new Set());

  // Fetch initial following list of logged-in user to check who they follow
  const fetchMyFollowing = async () => {
    if (!user) return;
    try {
      const myId = user.id || user._id;
      const res = await api.get(`/following/${myId}?limit=1000`);
      const ids = new Set(res.data.data.map(item => item.user._id.toString()));
      setMyFollowingIds(ids);
    } catch (err) {
      console.error('Failed to fetch own following list', err);
    }
  };

  // Fetch target user's details for header
  const fetchTargetUser = async () => {
    if (isOwnProfile) {
      setTargetUserName('Your');
      return;
    }
    try {
      const res = await api.get(`/profile/details/${targetUserId}`);
      setTargetUserName(`${res.data.data?.displayName || res.data.data?.user?.fullName}'s`);
    } catch (err) {
      console.error('Failed to fetch target user details', err);
      setTargetUserName('Researcher');
    }
  };

  // Fetch Followers
  const fetchFollowers = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        search: searchQuery,
        sortBy,
        country: filterCountry,
        institution: filterInstitution
      });

      const res = await api.get(`/followers/${targetUserId}?${params.toString()}`);
      const { data, hasMore: more, total } = res.data;

      if (append) {
        setFollowers(prev => [...prev, ...data]);
      } else {
        setFollowers(data);
      }
      setHasMore(more);
      setTotalFollowers(total);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load followers');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger loading of followers on filter/search change
  useEffect(() => {
    if (targetUserId) {
      fetchMyFollowing();
      fetchTargetUser();
      fetchFollowers(1, false);
    }
  }, [targetUserId, sortBy, filterCountry, filterInstitution]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (targetUserId) {
        fetchFollowers(1, false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Listen to live follower count and status updates via socket
  useEffect(() => {
    if (!socket) return;

    // Join room for this profile
    socket.emit('request-follow-count', { targetUserId });

    const handleFollowCountUpdated = (data) => {
      if (data.userId === targetUserId) {
        setTotalFollowers(data.followersCount);
      }
    };

    const handleResearcherFollowed = (data) => {
      // If we are looking at our own followers page, refresh to show new followers instantly
      if (isOwnProfile) {
        fetchFollowers(1, false);
      }
    };

    socket.on('followers-count-updated', handleFollowCountUpdated);
    socket.on('researcher-followed', handleResearcherFollowed);

    return () => {
      socket.off('followers-count-updated', handleFollowCountUpdated);
      socket.off('researcher-followed', handleResearcherFollowed);
    };
  }, [socket, targetUserId, isOwnProfile]);

  // Follow/Unfollow handler
  const handleFollowToggle = async (targetId, name) => {
    const isFollowing = myFollowingIds.has(targetId);
    
    // Optimistic UI updates
    setMyFollowingIds(prev => {
      const next = new Set(prev);
      if (isFollowing) next.delete(targetId);
      else next.add(targetId);
      return next;
    });

    try {
      if (isFollowing) {
        await api.post(`/unfollow/${targetId}`);
        // Emit socket event to notify other open sessions
        if (socket) socket.emit('unfollow-user', { targetUserId: targetId });
      } else {
        await api.post(`/follow/${targetId}`);
        // Emit socket event to notify other open sessions
        if (socket) socket.emit('follow-user', { targetUserId: targetId });
      }
    } catch (err) {
      console.error('Follow action failed:', err);
      // Revert optimistic UI on error
      setMyFollowingIds(prev => {
        const next = new Set(prev);
        if (isFollowing) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
    }
  };

  const loadMore = () => {
    fetchFollowers(page + 1, true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left text-slate-800">
      
      {/* Header section with back navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2 font-display">
              <Users className="w-7 h-7 text-indigo-600" />
              {targetUserName} Followers
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 font-sans font-medium">
              Showing {followers.length} of {totalFollowers} followers
            </p>
          </div>
        </div>

        {/* Search, Sort and Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm cursor-pointer transition-all"
            >
              <option value="newest">Newest Followers</option>
              <option value="oldest">Oldest Followers</option>
              <option value="publications">Most Publications</option>
              <option value="citations">Most Citations</option>
              <option value="hindex">Highest h-index</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              showFilters 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in shadow-inner">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Institution</label>
            <input
              type="text"
              placeholder="e.g. Stanford University"
              value={filterInstitution}
              onChange={(e) => setFilterInstitution(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Country</label>
            <input
              type="text"
              placeholder="e.g. USA"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      )}

      {/* Followers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm animate-pulse flex flex-col justify-between h-[210px]">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-xl mt-4"></div>
            </div>
          ))}
        </div>
      ) : followers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">No followers found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1 font-medium font-sans">
            Try adjusting your search queries or filters to discover other researchers.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {followers.map(({ user: fUser, profile: fProfile, aiMatchScore, mutualConnections, followedAt }) => {
              const isFollowing = myFollowingIds.has(fUser._id);
              const initials = fUser.fullName.split(' ').map(n => n[0]).join('');

              return (
                <div 
                  key={fUser._id} 
                  className="bg-white border border-slate-200/80 hover:border-slate-300/90 hover:shadow-md rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm relative overflow-hidden"
                >
                  {/* Top segment with similarity match badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 flex items-center justify-center font-extrabold text-lg border border-slate-200/60 shadow-inner shrink-0 overflow-hidden">
                        {fProfile?.profilePhoto ? (
                          <img src={fProfile.profilePhoto} alt={fUser.fullName} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>

                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 
                            onClick={() => navigate(`/profile?id=${fUser._id}`)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer hover:underline text-sm sm:text-base leading-snug"
                          >
                            {fUser.fullName}
                          </h3>
                          {fUser.role === 'researcher' && (
                            <span className="bg-blue-50 text-blue-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-200/20">
                              Researcher
                            </span>
                          )}
                        </div>

                        {fProfile?.designation && (
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {fProfile.designation}
                          </p>
                        )}

                        {fProfile?.institution && (
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {fProfile.institution}, {fProfile.country}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* AI Similarity score */}
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 border border-indigo-200/30 text-indigo-600 px-2.5 py-1 rounded-full shadow-inner shadow-indigo-500/5">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        {aiMatchScore}% Match
                      </span>
                    </div>
                  </div>

                  {/* Research Interests Chips */}
                  {fProfile?.researchAreas && fProfile.researchAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {fProfile.researchAreas.slice(0, 3).map((area, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 rounded text-[9px] font-bold tracking-tight transition-colors"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-4"></div>

                  {/* Bottom Stats & Action buttons */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 text-xs font-semibold text-slate-450">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-extrabold">Publications</span>
                        <span className="text-slate-900 font-bold mt-0.5 block">{fProfile?.publications || 0}</span>
                      </div>
                      <div className="border-r border-slate-200 h-6"></div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-extrabold">Citations</span>
                        <span className="text-slate-900 font-bold mt-0.5 block">{fProfile?.citations || 0}</span>
                      </div>
                      {mutualConnections > 0 && (
                        <>
                          <div className="border-r border-slate-200 h-6"></div>
                          <div className="text-left">
                            <span className="text-indigo-600 text-[10px] block uppercase tracking-wider font-extrabold">Mutual</span>
                            <span className="text-indigo-600 font-bold mt-0.5 block">{mutualConnections} connections</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Message/Collab buttons (Placeholder action for Phase 2 integration) */}
                      <button 
                        onClick={() => navigate(`/profile?id=${fUser._id}`)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                        title="View Profile Details"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Follow Back Button with Hover states */}
                      <button
                        onClick={() => handleFollowToggle(fUser._id, fUser.fullName)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                          isFollowing 
                            ? 'bg-slate-50 border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/20 group' 
                            : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <span className="group-hover:hidden">✓ Following</span>
                            <span className="hidden group-hover:inline">Unfollow</span>
                          </>
                        ) : (
                          'Follow Back'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll / Load more */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  Loading...
                </>
              ) : (
                'Load More Followers'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowersPage;
