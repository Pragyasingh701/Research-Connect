import React, { useState } from 'react';
import { UserPlus, MessageSquare, Briefcase, Award, Check } from 'lucide-react';
import api from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';

export default function ResearcherCard({ researcher }) {
  const { socket } = useSocket();
  const [connected, setConnected] = useState(false);
  const [following, setFollowing] = useState(researcher.isFollowing || false);

  const profile = researcher || {};
  const userObj = researcher.user || {};

  const handleFollowToggle = async () => {
    const targetId = userObj._id || researcher._id;
    if (!targetId) return;

    const originalFollowing = following;
    setFollowing(!following);

    try {
      if (following) {
        await api.post(`/unfollow/${targetId}`);
        if (socket) socket.emit('unfollow-user', { targetUserId: targetId });
      } else {
        await api.post(`/follow/${targetId}`);
        if (socket) socket.emit('follow-user', { targetUserId: targetId });
      }
    } catch (err) {
      console.error('Follow toggle failed in card:', err);
      setFollowing(originalFollowing);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all duration-200 shadow-lg text-white">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-md shadow-teal-500/10">
              {userObj.fullName ? userObj.fullName.charAt(0) : 'R'}
            </div>
            <div>
              <h3 className="font-bold text-base hover:text-teal-400 cursor-pointer flex items-center gap-1.5">
                {userObj.fullName || 'Anonymous Researcher'}
                {profile.publications > 5 && (
                  <span className="w-4 h-4 bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[9px] rounded-full flex items-center justify-center font-bold" title="Verified Author">
                    ✓
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-medium">{profile.designation || 'Academic Researcher'}</p>
              <p className="text-xs text-slate-500">{profile.department || 'Department'}</p>
            </div>
          </div>
        </div>

        {/* Institution & Country */}
        <div className="flex flex-col gap-1.5 mb-4 text-xs text-slate-300 bg-slate-950/40 p-3 border border-slate-850 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Institution:</span>
            <span>{profile.institution || 'Unknown Institution'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Location:</span>
            <span>{profile.city ? `${profile.city}, ` : ''}{profile.country || 'Unknown'}</span>
          </div>
        </div>

        {/* Academic Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 text-center mb-4 bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/50">
          <div>
            <div className="text-sm font-extrabold text-teal-400">{profile.publications || 0}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Papers</div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-blue-400">{profile.citations || 0}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Citations</div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-purple-400">{profile.hIndex || 0}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">h-index</div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-pink-400">{profile.i10Index || 0}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">i10-index</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t border-slate-850 pt-4 mt-auto">
        <button
          onClick={() => setConnected(!connected)}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 ${
            connected 
              ? 'bg-slate-800 text-teal-400 border border-teal-500/20' 
              : 'bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-lg shadow-teal-500/10'
          }`}
        >
          {connected ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          {connected ? 'Connected' : 'Connect'}
        </button>
        <button
          onClick={handleFollowToggle}
          className={`px-3 py-2 text-xs font-bold border rounded-xl transition-all duration-200 cursor-pointer group ${
            following 
              ? 'border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-900/30 hover:bg-rose-950/15' 
              : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
          }`}
        >
          {following ? (
            <>
              <span className="group-hover:hidden">Following</span>
              <span className="hidden group-hover:inline">Unfollow</span>
            </>
          ) : (
            '+ Follow'
          )}
        </button>
        <button className="p-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors">
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
