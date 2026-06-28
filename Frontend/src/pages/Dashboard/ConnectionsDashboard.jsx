import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  Users, UserPlus, UserCheck, Search, ShieldAlert, MessageSquare, Briefcase, 
  MapPin, Award, Trash2, Shield, Eye, UserMinus, Plus, TrendingUp, CheckCircle, AlertCircle
} from 'lucide-react';

const ConnectionsDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('connections');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Connection data states
  const [connections, setConnections] = useState({ active: [], pendingReceived: [], pendingSent: [], suggested: [] });
  const [followData, setFollowData] = useState({ followers: [], following: [], popular: [], trending: [], suggested: [] });

  // Fetch connection and follow lists
  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [connRes, followRes] = await Promise.all([
        api.get('/connections/list'),
        api.get('/follows/dashboard'),
      ]);

      setConnections(connRes.data.data);
      setFollowData(followRes.data.data);
    } catch (err) {
      setError('Failed to fetch network connections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, []);

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket) return;

    const handleNewConnectionRequest = () => fetchNetworkData();
    const handleConnectionAccepted = () => fetchNetworkData();
    const handleNewFollower = () => fetchNetworkData();

    socket.on('NEW_CONNECTION_REQUEST', handleNewConnectionRequest);
    socket.on('CONNECTION_REQUEST_ACCEPTED', handleConnectionAccepted);
    socket.on('NEW_FOLLOWER', handleNewFollower);

    return () => {
      socket.off('NEW_CONNECTION_REQUEST', handleNewConnectionRequest);
      socket.off('CONNECTION_REQUEST_ACCEPTED', handleConnectionAccepted);
      socket.off('NEW_FOLLOWER', handleNewFollower);
    };
  }, [socket]);

  // Toast Trigger
  const triggerToast = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4500);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4500);
    }
  };

  // Connection Actions
  const handleConnect = async (id, name) => {
    try {
      await api.post(`/connections/connect/${id}`);
      triggerToast(`Connection request sent to ${name}!`);
      fetchNetworkData();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to send connection request', 'error');
    }
  };

  const handleAcceptConnection = async (connectionId, name) => {
    try {
      await api.patch(`/connections/accept/${connectionId}`);
      triggerToast(`Connected with ${name}!`);
      fetchNetworkData();
    } catch (err) {
      triggerToast('Failed to accept connection request', 'error');
    }
  };

  const handleRejectConnection = async (connectionId) => {
    try {
      await api.patch(`/connections/reject/${connectionId}`);
      triggerToast('Connection request declined.');
      fetchNetworkData();
    } catch (err) {
      triggerToast('Failed to decline connection request', 'error');
    }
  };

  const handleRemoveConnection = async (partnerId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your connections?`)) return;
    try {
      await api.delete(`/connections/remove/${partnerId}`);
      triggerToast(`Removed connection with ${name}.`);
      fetchNetworkData();
    } catch (err) {
      triggerToast('Failed to remove connection', 'error');
    }
  };

  // Follow Actions
  const handleFollow = async (id, name) => {
    try {
      await api.post(`/follow/${id}`);
      triggerToast(`You are now following ${name}!`);
      fetchNetworkData();
      if (socket) socket.emit('follow-user', { targetUserId: id });
    } catch (err) {
      triggerToast('Failed to follow user', 'error');
    }
  };

  const handleUnfollow = async (id, name) => {
    try {
      await api.post(`/unfollow/${id}`);
      triggerToast(`Unfollowed ${name}.`);
      fetchNetworkData();
      if (socket) socket.emit('unfollow-user', { targetUserId: id });
    } catch (err) {
      triggerToast('Failed to unfollow user', 'error');
    }
  };

  // Block/Report Actions
  const handleBlockUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to block ${name}? Doing so will remove any connection.`)) return;
    try {
      await api.post(`/connections/block/${id}`);
      triggerToast(`Blocked ${name}.`);
      fetchNetworkData();
    } catch (err) {
      triggerToast('Failed to block user', 'error');
    }
  };

  const handleReportUser = async (id, name) => {
    const reason = window.prompt(`Please enter the reason for reporting ${name}:`);
    if (!reason) return;
    try {
      await api.post(`/connections/report/${id}`, { reason });
      triggerToast(`Report filed against ${name}. Thank you.`);
    } catch (err) {
      triggerToast('Failed to file report', 'error');
    }
  };

  // Filter connections by search term
  const filteredConnections = connections.active.filter(conn => 
    conn.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.profile?.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.profile?.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading your network...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-800">
      {/* Toast notifications */}
      {successMsg && (
        <div className="fixed top-24 right-6 z-50 flex items-center bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg border border-emerald-400/20 animate-bounce">
          <CheckCircle className="mr-2 h-5 w-5" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-24 right-6 z-50 flex items-center bg-rose-500 text-white px-5 py-3 rounded-xl shadow-lg border border-rose-400/20">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
            My Network
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4">
            Build Your Professional Academic Network
          </h1>
          <p className="text-slate-300 mt-2 text-base md:text-lg">
            Connect with co-authors, follow trending researchers, and expand your scientific reach.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-col space-y-2">
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'connections'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5" />
              <span>My Connections</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${activeTab === 'connections' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {connections.active?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <UserPlus className="h-5 w-5" />
              <span>Pending Requests</span>
            </div>
            {connections.pendingReceived?.length > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                {connections.pendingReceived.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('suggested')}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'suggested'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <Award className="h-5 w-5" />
            <span>Suggested Connections</span>
          </button>

          <button
            onClick={() => setActiveTab('followers')}
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'followers'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <UserCheck className="h-5 w-5" />
              <span>Followers & Following</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${activeTab === 'followers' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {followData.followers?.length || 0}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          
          {/* TAB: MY CONNECTIONS */}
          {activeTab === 'connections' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    My Connections
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage your active research connections.</p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search connections..."
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-64 text-slate-700"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {filteredConnections.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-semibold">No connections found</p>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">
                    {searchTerm ? "Try searching for a different name or institution." : "Start building your network by connecting with suggested researchers."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredConnections.map((conn) => (
                    <div key={conn.connectionId} className="border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 bg-slate-50/20 flex flex-col justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-extrabold shadow-inner shrink-0">
                          {conn.profile?.profilePhoto ? (
                            <img src={conn.profile.profilePhoto} alt={conn.user.fullName} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            conn.user.fullName[0]
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                              <a href={`/profile?id=${conn.user._id}`}>{conn.fullName || conn.user.fullName}</a>
                            </h3>
                            {conn.similarityScore >= 50 && (
                              <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-200/30">
                                {conn.similarityScore}% Match
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mb-1">
                            {conn.profile?.designation || 'Researcher'}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {conn.profile?.institution || 'Global Institute'}
                          </p>
                          {conn.profile?.country && (
                            <p className="text-[10px] text-slate-400 flex items-center mt-0.5">
                              <MapPin className="h-3 w-3 mr-1" />
                              {conn.profile.country}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center gap-2">
                        <div className="flex gap-1">
                          <a
                            href={`/profile?id=${conn.user._id}`}
                            title="View Profile"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href="/collaboration"
                            title="Collaborate"
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          >
                            <Award className="h-4 w-4" />
                          </a>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleBlockUser(conn.user._id, conn.user.fullName)}
                            title="Block User"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveConnection(conn.user._id, conn.user.fullName)}
                            title="Remove Connection"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PENDING REQUESTS */}
          {activeTab === 'pending' && (
            <div className="space-y-8">
              {/* Received Requests */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center text-slate-950">
                  <UserPlus className="h-5 w-5 mr-2 text-emerald-600" />
                  Received Connection Requests
                </h2>
                
                {connections.pendingReceived?.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                    <UserPlus className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-semibold">No pending received requests</p>
                    <p className="text-slate-400 text-sm">When other researchers invite you to connect, they will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.pendingReceived.map((req) => (
                      <div key={req.connectionId} className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/20 flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {req.profile?.profilePhoto ? (
                              <img src={req.profile.profilePhoto} alt={req.user.fullName} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              req.user.fullName[0]
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{req.user.fullName}</h3>
                            <p className="text-xs text-slate-500">{req.profile?.designation || 'Researcher'}</p>
                            <p className="text-[10px] text-slate-400">{req.profile?.institution || 'Global Institute'}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptConnection(req.connectionId, req.user.fullName)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectConnection(req.connectionId)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center text-slate-950">
                  <Send className="h-4 w-4 mr-2 text-blue-600" />
                  Sent Connection Requests
                </h2>

                {connections.pendingSent?.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-semibold">No pending sent requests</p>
                    <p className="text-slate-400 text-sm">Any connection invitations you dispatch will be listed here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.pendingSent.map((req) => (
                      <div key={req.connectionId} className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/20 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
                            {req.profile?.profilePhoto ? (
                              <img src={req.profile.profilePhoto} alt={req.user.fullName} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              req.user.fullName[0]
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{req.user.fullName}</h3>
                            <p className="text-xs text-slate-500 truncate max-w-[150px]">{req.profile?.institution || 'Global Institute'}</p>
                          </div>
                        </div>

                        <span className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SUGGESTED CONNECTIONS */}
          {activeTab === 'suggested' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-indigo-600" />
                  AI Suggested Connections
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Expand your network with highly relevant scientific minds.</p>
              </div>

              {connections.suggested?.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Award className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-semibold">No suggestions available</p>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Ensure your profile is complete to get tailored matching suggestions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connections.suggested.map((sug) => (
                    <div key={sug.user._id} className="border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 bg-slate-50/20 flex flex-col justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-base font-extrabold shadow-inner shrink-0">
                          {sug.profile?.profilePhoto ? (
                            <img src={sug.profile.profilePhoto} alt={sug.user.fullName} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            sug.user.fullName[0]
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-900">{sug.user.fullName}</h3>
                            <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-200/30">
                              {sug.similarityScore}% Match
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mb-1">
                            {sug.profile?.designation || 'Researcher'}
                          </p>
                          <p className="text-xs text-slate-450 truncate max-w-[200px]">
                            {sug.profile?.institution || 'Global Institute'}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 mt-4 flex gap-2">
                        <button
                          onClick={() => handleConnect(sug.user._id, sug.user.fullName)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors flex-1"
                        >
                          Connect
                        </button>
                        <a
                          href={`/profile?id=${sug.user._id}`}
                          className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl text-center transition-all flex-1"
                        >
                          View Profile
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: FOLLOWERS & FOLLOWING */}
          {activeTab === 'followers' && (
            <div className="space-y-8">
              {/* Followers & Following Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Following list */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-950 flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                      People I Follow
                    </h3>
                    <a href="/following" className="text-xs font-bold text-blue-600 hover:underline">
                      View All
                    </a>
                  </div>

                  {followData.following?.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-6 text-center border border-dashed border-slate-100 rounded-xl">
                      You are not following anyone yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {followData.following.map((f) => (
                        <li key={f.user._id} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl bg-slate-50/40">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                              {f.profile?.profilePhoto ? (
                                <img src={f.profile.profilePhoto} alt={f.user.fullName} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                f.user.fullName[0]
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-850">{f.user.fullName}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{f.profile?.institution || 'Global Institute'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnfollow(f.user._id, f.user.fullName)}
                            className="text-[10px] font-bold text-rose-600 hover:underline"
                          >
                            Unfollow
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Followers list */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-950 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-emerald-600" />
                      My Followers
                    </h3>
                    <a href="/followers" className="text-xs font-bold text-blue-600 hover:underline">
                      View All
                    </a>
                  </div>

                  {followData.followers?.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-6 text-center border border-dashed border-slate-100 rounded-xl">
                      No followers yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {followData.followers.map((f) => (
                        <li key={f.user._id} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl bg-slate-50/40">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                              {f.profile?.profilePhoto ? (
                                <img src={f.profile.profilePhoto} alt={f.user.fullName} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                f.user.fullName[0]
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-850">{f.user.fullName}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{f.profile?.institution || 'Global Institute'}</p>
                            </div>
                          </div>
                          
                          {/* Check if not following back, show follow back */}
                          {!followData.following.some(fl => fl.user._id === f.user._id) ? (
                            <button
                              onClick={() => handleFollow(f.user._id, f.user.fullName)}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Follow Back
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              Mutual
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* Popular & Trending Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Popular Researchers */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                    Popular Researchers
                  </h3>
                  <ul className="space-y-3.5">
                    {followData.popular?.map((item) => {
                      const isFollowing = followData.following.some(f => f.user._id === item.user._id);
                      return (
                        <li key={item.user._id} className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                              {item.profile?.profilePhoto ? (
                                <img src={item.profile.profilePhoto} alt={item.user.fullName} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                item.user.fullName[0]
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-855">{item.user.fullName}</p>
                              <p className="text-[10px] text-slate-400">{item.profile?.institution}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => isFollowing ? handleUnfollow(item.user._id, item.user.fullName) : handleFollow(item.user._id, item.user.fullName)}
                            className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                              isFollowing ? 'border border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Trending Researchers */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                    Trending Researchers (Last 30 Days)
                  </h3>
                  <ul className="space-y-3.5">
                    {followData.trending?.map((item) => {
                      const isFollowing = followData.following.some(f => f.user._id === item.user._id);
                      return (
                        <li key={item.user._id} className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                              {item.profile?.profilePhoto ? (
                                <img src={item.profile.profilePhoto} alt={item.user.fullName} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                item.user.fullName[0]
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-855">{item.user.fullName}</p>
                              <p className="text-[10px] text-slate-400">{item.profile?.institution}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => isFollowing ? handleUnfollow(item.user._id, item.user.fullName) : handleFollow(item.user._id, item.user.fullName)}
                            className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                              isFollowing ? 'border border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ConnectionsDashboard;
