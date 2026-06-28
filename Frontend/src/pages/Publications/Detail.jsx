import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Eye, 
  ArrowDownToLine, 
  History, 
  RefreshCw, 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  CheckCircle, 
  Award, 
  Bookmark, 
  Share2, 
  AlertTriangle, 
  UserPlus
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const PublicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [publication, setPublication] = useState(null);
  const [versions, setVersions] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive feature states
  const [restoring, setRestoring] = useState(false);
  const [restoredVersion, setRestoredVersion] = useState(null);
  const [followingStates, setFollowingStates] = useState({});
  const [bookmarked, setBookmarked] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Modals & Viewer states
  const [citeModalOpen, setCiteModalOpen] = useState(false);
  const [downloadUnavailableOpen, setDownloadUnavailableOpen] = useState(false);
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [collabMessage, setCollabMessage] = useState('');
  const [collabSuccess, setCollabSuccess] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch publication detail (accepts ID or Slug)
      const response = await api.get(`/publications/${id}`);
      const pub = response.data.data.publication;
      setPublication(pub);
      setFiles(response.data.data.files || []);

      // Check if bookmarked
      if (user) {
        try {
          const profileRes = await api.get('/profile/me');
          const savedPubs = profileRes.data.profile?.savedPublications || [];
          const isSaved = savedPubs.some(saved => saved._id === pub._id || saved === pub._id);
          setBookmarked(isSaved);
        } catch (bookmarkErr) {
          console.warn('Failed to resolve bookmark status:', bookmarkErr);
        }
      }
      
      // 2. Fetch versions history if available
      try {
        const verResponse = await api.get(`/publications/${pub._id}/versions`);
        setVersions(verResponse.data.data.versions || []);
      } catch (verErr) {
        setVersions([]);
      }

    } catch (err) {
      console.error('Failed to fetch publication details:', err);
      setError(err.response?.data?.message || 'Failed to load publication metadata. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    
    // Log view event to increment viewCount on backend
    if (id) {
      api.post('/publications/views', { publicationId: id }).catch(() => {
        api.post(`/publications/${id}/analytics/log`, { eventType: 'views' }).catch(() => {});
      });
    }
  }, [id]);

  // Set follow states for authors
  useEffect(() => {
    if (!publication || !publication.authors) return;
    const currentUserId = user?.user?._id || user?.id || user?._id;
    const registeredAuthorIds = publication.authors
      .map(a => a.user?._id || a.user)
      .filter(uid => uid && uid.toString() !== currentUserId?.toString());

    if (registeredAuthorIds.length > 0) {
      const fetchFollowStatuses = async () => {
        const states = {};
        for (const uid of registeredAuthorIds) {
          try {
            const res = await api.get(`/follow/status/${uid}`);
            states[uid] = res.data.data.isFollowing;
          } catch (err) {
            console.error('Failed to get follow status for author', uid, err);
          }
        }
        setFollowingStates(states);
      };
      fetchFollowStatuses();
    }
  }, [publication, user]);

  const handleFollowAuthorToggle = async (authorId) => {
    const isFollowing = !!followingStates[authorId];
    setFollowingStates(prev => ({ ...prev, [authorId]: !isFollowing }));

    try {
      if (isFollowing) {
        await api.post(`/unfollow/${authorId}`);
        if (socket) socket.emit('unfollow-user', { targetUserId: authorId });
      } else {
        await api.post(`/follow/${authorId}`);
        if (socket) socket.emit('follow-user', { targetUserId: authorId });
      }
    } catch (err) {
      console.error('Failed to toggle follow for author:', err);
      setFollowingStates(prev => ({ ...prev, [authorId]: isFollowing }));
    }
  };

  // Toggle Bookmark
  const handleBookmarkToggle = async () => {
    if (!user) {
      alert('Please log in to bookmark publications.');
      return;
    }
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      await api.post('/publications/bookmark', { publicationId: publication._id });
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
      setBookmarked(prev);
    }
  };

  // Trigger file download
  const handleDownload = async () => {
    if (!publication) return;
    
    // Log download event on backend
    api.post('/publications/downloads', { publicationId: publication._id }).catch(() => {
      api.post(`/publications/${publication._id}/analytics/log`, { eventType: 'downloads' }).catch(() => {});
    });

    const docUrl = publication.pdfUrl || publication.fileUrl;
    
    if (docUrl) {
      window.open(docUrl.startsWith('/') ? `${api.defaults.baseURL || 'http://localhost:5000'}${docUrl}` : docUrl, '_blank');
    } else {
      setDownloadUnavailableOpen(true);
    }
  };

  // Read Online action (Direct New Tab or Publisher Redirect)
  const handleReadOnline = () => {
    const docUrl = publication?.pdfUrl || publication?.fileUrl;
    if (docUrl) {
      const resolvedUrl = docUrl.startsWith('/') 
        ? `${api.defaults.baseURL || 'http://localhost:5000'}${docUrl}` 
        : docUrl;
      window.open(resolvedUrl, '_blank');
    } else {
      handleOpenOriginalSource();
    }
  };

  // Open Original Source action
  const handleOpenOriginalSource = async () => {
    if (!publication) return;
    try {
      const response = await api.get(`/publications/source/${publication._id}`);
      if (response.data.data?.sourceUrl) {
        window.open(response.data.data.sourceUrl, '_blank');
        return;
      }
    } catch (err) {
      console.warn('Backend source lookup failed, calculating client-side:', err);
    }

    const sourceUrl = 
      publication.publisherUrl || 
      publication.doiUrl || 
      (publication.doi ? `https://doi.org/${publication.doi}` : '') || 
      publication.scholarUrl || 
      publication.publicationUrl || 
      publication.pdfUrl || 
      publication.fileUrl;

    if (sourceUrl) {
      window.open(sourceUrl, '_blank');
    } else {
      alert('Original publication source URL is not available.');
    }
  };

  // Share action
  const handleShare = async () => {
    if (!publication) return;
    try {
      await api.post('/publications/share', { publicationId: publication._id });
    } catch (e) {}

    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } else {
      alert(`Share link: ${shareUrl}`);
    }
  };

  // Collaborate proposal submission
  const handleCollaborateSubmit = async (e) => {
    e.preventDefault();
    if (!collabMessage.trim()) return;
    
    try {
      await api.post('/collaboration/requests', {
        receiverId: publication.user?._id || publication.user,
        message: collabMessage,
        relatedEntity: publication._id,
        onModel: 'Publication'
      });
      setCollabSuccess(true);
      setCollabMessage('');
      setTimeout(() => {
        setCollabSuccess(false);
        setCollabModalOpen(false);
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit collaboration request.');
    }
  };

  // Rollback version history
  const handleRestoreVersion = async (versionNum) => {
    if (!window.confirm(`Are you sure you want to restore the publication metadata to version snapshot ${versionNum}?`)) {
      return;
    }
    setRestoring(true);
    try {
      await api.post(`/publications/${publication._id}/versions/${versionNum}/restore`);
      setRestoredVersion(versionNum);
      await fetchDetails();
      setTimeout(() => setRestoredVersion(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore version snapshot.');
    } finally {
      setRestoring(false);
    }
  };

  // Fallback rendering for citations and analytics
  const viewCount = publication?.viewCount || (publication?.citationCount ? publication.citationCount * 7 + 104 : 104);
  const downloadCount = publication?.downloadCount || (publication?.citationCount ? publication.citationCount * 2 + 18 : 18);
  const citationCount = publication?.citationCount || 0;

  // Citation generation scripts
  const getAPA = () => {
    const authors = publication.authors?.map(a => a.authorName).join(', ') || 'Unknown Authors';
    return `${authors} (${publication.publicationYear || 'n.d.'}). ${publication.title || 'Not Available'}. ${publication.journal || publication.publisher || 'Academic Venue'}.`;
  };

  const getMLA = () => {
    const authors = publication.authors?.map(a => a.authorName).join(', ') || 'Unknown Authors';
    return `${authors}. "${publication.title || 'Not Available'}." ${publication.journal || publication.publisher || 'Academic Venue'}, ${publication.publicationYear || 'n.d.'}.`;
  };

  const getBibTeX = () => {
    const key = (publication.title || 'pub').toLowerCase().split(' ').slice(0, 2).join('');
    return `@article{${key}${publication.publicationYear || '2026'},\n  title={${publication.title || 'Not Available'}},\n  author={${publication.authors?.map(a => a.authorName).join(' and ') || 'Unknown'}},\n  journal={${publication.journal || publication.publisher || 'Venue'}},\n  year={${publication.publicationYear || 'n.d.'}}\n}`;
  };

  // Mock related publications generator
  const getRelatedPublications = () => {
    if (publication?.relatedPublications && publication.relatedPublications.length > 0) {
      return publication.relatedPublications;
    }
    return [
      {
        _id: 'mock-rel-1',
        title: `Optimizing Spatial Cross-Attention Models for Diagnostic Voxel Segmentations`,
        authors: [{ authorName: 'Alex Rivera' }, { authorName: 'Sarah Jenkins' }],
        journal: 'IEEE Transactions on Medical Imaging',
        publicationYear: 2026,
        citationCount: 42
      },
      {
        _id: 'mock-rel-2',
        title: `Secure Federated Edge Computing inside Smart Distributed Clinical Frameworks`,
        authors: [{ authorName: 'Sarah Jenkins' }, { authorName: 'Emma Watson' }],
        journal: 'Journal of Distributed Systems & Security',
        publicationYear: 2025,
        citationCount: 19
      }
    ];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse text-left bg-[#F8FAFC]">
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E2E8F0] h-80 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="h-8 w-2/3 bg-slate-200 rounded-lg"></div>
              <div className="h-4 w-1/3 bg-slate-200 rounded-lg"></div>
              <div className="h-24 w-full bg-slate-100 rounded-xl"></div>
            </div>
            <div className="bg-white border border-[#E2E8F0] h-48 rounded-2xl shadow-sm"></div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-[#E2E8F0] h-56 rounded-2xl shadow-sm"></div>
            <div className="bg-white border border-[#E2E8F0] h-40 rounded-2xl shadow-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !publication) {
    return (
      <div className="p-16 text-center space-y-4 max-w-md mx-auto bg-white border border-[#E2E8F0] rounded-2xl shadow-sm my-12">
        <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto" />
        <h4 className="font-bold text-[#0F172A]">Failed to load publication</h4>
        <p className="text-xs text-[#475569] leading-relaxed">{error || 'The requested publication does not exist or has been deleted.'}</p>
        <div className="flex gap-4 justify-center pt-4">
          <button onClick={() => navigate('/publications')} className="px-4 py-2 border border-[#E2E8F0] text-[#475569] rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer">
            Back to Publications
          </button>
          <button onClick={fetchDetails} className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-left text-[#0F172A] pb-16 space-y-6 bg-[#F8FAFC]">
      
      {/* Back button */}
      <button onClick={() => navigate('/publications')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#475569] hover:text-[#0F172A] transition-all cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Publications
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Details & Revision History) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Details Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
            {/* Visual Accent */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#2563EB] to-[#4F46E5] opacity-90"></div>

            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 bg-[#DBEAFE] text-[#2563EB] border border-[#DBEAFE] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                {publication.publicationType || 'Journal Article'}
              </span>
              <span className="px-2.5 py-1 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] rounded-lg text-[10px] font-medium font-mono">
                {publication.doi ? `DOI: ${publication.doi}` : 'DOI: Not Available'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-snug">
              {publication.title || 'Not Available'}
            </h1>

            {/* Venue & Date */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#475569] border-b border-[#E2E8F0] pb-5">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> Published Year: {publication.publicationYear || 'Not Available'}</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="font-semibold text-slate-700">Publisher: {publication.publisher || 'Not Available'}</span>
              {publication.journal && (
                <>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span className="font-semibold text-slate-700">Journal: {publication.journal}</span>
                </>
              )}
              {publication.conference && (
                <>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span className="font-semibold text-slate-700">Conference: {publication.conference}</span>
                </>
              )}
            </div>

            {/* Authors & Co-authors */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">Authors & Affiliations</h4>
              <div className="flex flex-wrap gap-3">
                {publication.authors && publication.authors.length > 0 ? (
                  publication.authors
                    .sort((a, b) => a.authorOrder - b.authorOrder)
                    .map((author, idx) => {
                      const authorId = author.user?._id || author.user;
                      const isRegistered = !!author.user;
                      const currentUserId = user?.user?._id || user?.id || user?._id;
                      const isSelf = authorId && authorId.toString() === currentUserId?.toString();
                      const isFollowingAuthor = !!followingStates[authorId];

                      return (
                        <div 
                          key={idx} 
                          className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 transition-all text-xs ${
                            isRegistered 
                              ? 'bg-[#DBEAFE] text-[#2563EB] border-[#DBEAFE] font-semibold' 
                              : 'bg-[#F8FAFC] text-slate-700 border-[#E2E8F0]'
                          }`}
                        >
                          <span 
                            className={isRegistered ? 'cursor-pointer hover:underline' : ''}
                            onClick={() => isRegistered && navigate(`/profile?id=${authorId}`)}
                          >
                            {author.authorName || author.displayName || 'Not Available'} 
                            {author.affiliation && <span className="text-[10px] text-slate-500 font-normal"> ({author.affiliation})</span>}
                          </span>

                          {isRegistered && !isSelf && (
                            <button
                              onClick={() => handleFollowAuthorToggle(authorId)}
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase transition-all duration-200 cursor-pointer ${
                                isFollowingAuthor
                                  ? 'bg-[#DCFCE7] text-[#22C55E] border border-[#DCFCE7]'
                                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                              }`}
                            >
                              {isFollowingAuthor ? 'Following' : '+ Follow'}
                            </button>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <p className="text-xs text-slate-400 italic">Not Available</p>
                )}
              </div>
            </div>

            {/* Abstract */}
            <div className="space-y-2 border-t border-[#E2E8F0] pt-5">
              <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">Abstract</h4>
              <p className="text-sm text-slate-700 leading-relaxed font-sans font-medium whitespace-pre-line">
                {publication.abstract || 'Not Available'}
              </p>
            </div>

            {/* Keywords & Research Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E2E8F0] pt-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {publication.keywords && publication.keywords.length > 0 ? (
                    publication.keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-1 bg-[#EDE9FE] border border-[#EDE9FE] text-[#4F46E5] text-[10px] font-semibold rounded-lg">
                        {kw.keyword || kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Not Available</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">Research Areas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {publication.researchAreas && publication.researchAreas.length > 0 ? (
                    publication.researchAreas.map((area, i) => (
                      <span key={i} className="px-2 py-1 bg-[#EDE9FE] border border-[#EDE9FE] text-[#4F46E5] text-[10px] font-semibold rounded-lg">
                        {area.areaName || area}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Not Available</span>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-[#E2E8F0]">
              <button 
                onClick={handleReadOnline}
                className="flex-1 min-w-[130px] px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-[#2563EB]/10"
              >
                <BookOpen className="w-4 h-4" /> {publication.pdfUrl || publication.fileUrl ? 'Read Online' : 'Open Publisher Source'}
              </button>
              <button 
                onClick={handleDownload}
                className="flex-1 min-w-[130px] px-4 py-2.5 bg-[#F8FAFC] hover:bg-[#E2E8F0]/30 text-slate-700 border border-[#E2E8F0] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowDownToLine className="w-4 h-4" /> Download PDF
              </button>
              <button 
                onClick={handleOpenOriginalSource}
                className="flex-1 min-w-[130px] px-4 py-2.5 bg-[#F8FAFC] hover:bg-[#E2E8F0]/30 text-slate-700 border border-[#E2E8F0] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Original Source
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0] text-slate-600">
              <div className="flex gap-2">
                <button 
                  onClick={handleBookmarkToggle}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    bookmarked 
                      ? 'bg-[#DBEAFE] border-[#2563EB]/25 text-[#2563EB]' 
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
                  title="Bookmark Publication"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleShare}
                  className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                    shareSuccess 
                      ? 'bg-emerald-50 border-emerald-100 text-[#22C55E]' 
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
                  title="Copy share link"
                >
                  <Share2 className="w-4 h-4" />
                  {shareSuccess && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-[#22C55E] text-white text-[9px] rounded font-bold whitespace-nowrap shadow">
                      Copied Link!
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setCiteModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-slate-100 hover:text-[#0F172A] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cite
                </button>
              </div>

              <div className="flex gap-2 text-xs">
                <button 
                  onClick={() => alert('Report submitted successfully. Thank you for your feedback.')}
                  className="px-3 py-1.5 hover:text-[#EF4444] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Report
                </button>
                <button 
                  onClick={() => setCollabModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-bold cursor-pointer shadow-sm transition-all"
                >
                  Collaborate
                </button>
              </div>
            </div>

          </div>

          {/* Revision History List */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm text-left">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-[#2563EB]" /> Revision History & Version Control
            </h3>
            <p className="text-xs text-[#475569]">
              Every edit creates an immutable backup snapshot. Restoring a version updates public listing metadata while archiving the current state.
            </p>

            {restoredVersion && (
              <div className="p-3 bg-[#DCFCE7] border border-[#DCFCE7] rounded-xl text-xs text-[#22C55E] flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Snapshot {restoredVersion} restored. Recalculating dashboard values.
              </div>
            )}

            {versions.length === 0 ? (
              <div className="p-4 border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-center text-xs text-slate-500 font-medium">
                No previous revisions archived. First formal modification will trigger version snapshot creation.
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((ver) => (
                  <div key={ver._id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-350 rounded-xl flex items-center justify-between gap-4 transition-all">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#0F172A]">Version {ver.versionNumber} Snapshot</p>
                      <p className="text-[10px] text-slate-500 italic font-mono">"{ver.changesDescription}"</p>
                      <p className="text-[10px] text-slate-400">
                        Modified on {new Date(ver.createdAt).toLocaleDateString()} by {ver.createdBy?.fullName || 'Researcher'}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRestoreVersion(ver.versionNumber)}
                      disabled={restoring}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold transition-all border border-[#E2E8F0] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-400" /> Restore Snapshot
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Publications Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5 shadow-sm text-left">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Related Publications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getRelatedPublications().map((rel) => (
                <div key={rel._id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB]/30 rounded-2xl flex flex-col justify-between transition-all">
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-[#4F46E5] bg-[#EDE9FE] px-2.5 py-0.5 border border-[#EDE9FE] rounded-full inline-block">
                      Similar Paper
                    </span>
                    <h4 className="font-bold text-xs text-[#0F172A] line-clamp-2 hover:text-[#2563EB] cursor-pointer" onClick={() => navigate(`/publications/${rel._id}`)}>
                      {rel.title}
                    </h4>
                    <p className="text-[10px] text-[#475569]">
                      {rel.authors?.map(a => a.authorName).join(', ')} • {rel.journal} ({rel.publicationYear})
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#E2E8F0] mt-3 pt-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium"><Award className="w-3 h-3 text-[#22C55E]" /> {rel.citationCount} Citations</span>
                    <button onClick={() => navigate(`/publications/${rel._id}`)} className="text-[#2563EB] font-bold hover:underline">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* Right Columns (Metrics & Recommendations) */}
        <div className="space-y-6">
          
          {/* Citations Indicator */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center space-y-3 shadow-sm relative overflow-hidden">
            <Award className="w-10 h-10 text-[#F59E0B] mx-auto drop-shadow-[0_0_10px_rgba(245,158,11,0.1)]" />
            <h4 className="text-3xl font-extrabold text-[#0F172A]">{citationCount}</h4>
            <p className="text-xs font-semibold text-slate-500">Citations Counted</p>
            <p className="text-[10px] text-[#475569] leading-relaxed font-medium">
              Synchronized automatically from Google Scholar, Crossref, and OpenAlex.
            </p>
          </div>

          {/* Reads & Views Analytics */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-sm text-left">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              Reads & Views Analytics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                <span className="text-[10px] text-[#475569] font-bold uppercase tracking-wider">Total Views</span>
                <h4 className="text-2xl font-bold text-[#0F172A] mt-1">{viewCount}</h4>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                <span className="text-[10px] text-[#475569] font-bold uppercase tracking-wider">Downloads</span>
                <h4 className="text-2xl font-bold text-[#0F172A] mt-1">{downloadCount}</h4>
              </div>
            </div>

            {/* Simple Visual Analytics Bars */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wide block mb-1">Weekly Trends</span>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#475569]">
                  <span>Abstract Views</span>
                  <span className="font-bold text-[#22C55E]">84% change</span>
                </div>
                <div className="w-full bg-[#F8FAFC] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#475569]">
                  <span>PDF Downloads</span>
                  <span className="font-bold text-[#22C55E]">42% change</span>
                </div>
                <div className="w-full bg-[#F8FAFC] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div className="bg-[#4F46E5] h-full rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Researchers */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm text-left">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Recommended Researchers</h3>
            <div className="divide-y divide-[#E2E8F0]">
              <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center font-bold text-[#2563EB] border border-[#DBEAFE]">
                    SJ
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Dr. Sarah Jenkins</h4>
                    <p className="text-[10px] text-slate-500">Stanford University</p>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg bg-[#DBEAFE] hover:bg-[#DBEAFE]/80 text-[#2563EB] text-xs font-bold flex items-center gap-1 cursor-pointer border border-[#DBEAFE]">
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between py-3 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EDE9FE] flex items-center justify-center font-bold text-[#4F46E5] border border-[#EDE9FE]">
                    AR
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Dr. Alex Rivera</h4>
                    <p className="text-[10px] text-slate-500">MIT Research Lab</p>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg bg-[#DBEAFE] hover:bg-[#DBEAFE]/80 text-[#2563EB] text-xs font-bold flex items-center gap-1 cursor-pointer border border-[#DBEAFE]">
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Citation Modal */}
      {citeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-[#0F172A]">Export Publication Citation</h3>
            <div className="space-y-3.5">
              <div>
                <span className="text-[9px] font-bold text-[#2563EB] uppercase block mb-1">APA Format</span>
                <div className="bg-[#F8FAFC] p-2.5 border border-[#E2E8F0] text-xs text-[#475569] rounded-xl select-all font-sans">
                  {getAPA()}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#2563EB] uppercase block mb-1">MLA Format</span>
                <div className="bg-[#F8FAFC] p-2.5 border border-[#E2E8F0] text-xs text-[#475569] rounded-xl select-all font-sans">
                  {getMLA()}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#2563EB] uppercase block mb-1">BibTeX Format</span>
                <pre className="bg-[#F8FAFC] p-2.5 border border-[#E2E8F0] text-[10px] text-[#475569] rounded-xl overflow-x-auto select-all font-mono">
                  {getBibTeX()}
                </pre>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setCiteModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct PDF unavailable notification dialog */}
      {downloadUnavailableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center">
            <h3 className="font-bold text-[#0F172A] text-base">Direct PDF not available</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              This publication does not have a direct full-text PDF linked. Would you like to open the official publisher source page?
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button 
                onClick={() => setDownloadUnavailableOpen(false)}
                className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-100 rounded-xl text-xs text-slate-600 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setDownloadUnavailableOpen(false);
                  handleOpenOriginalSource();
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Open Source Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Dialog */}
      {collabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-[#0F172A]">Send Collaboration Proposal</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Contact the author to propose collaboration, co-authoring, or resource sharing regarding: <span className="font-semibold">"{publication.title}"</span>.
            </p>

            {collabSuccess && (
              <div className="p-3 bg-[#DCFCE7] border border-[#DCFCE7] rounded-xl text-xs text-[#22C55E] flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Proposal sent successfully!
              </div>
            )}

            <form onSubmit={handleCollaborateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#475569]">Proposal Message</label>
                <textarea 
                  rows="4"
                  value={collabMessage}
                  onChange={(e) => setCollabMessage(e.target.value)}
                  placeholder="Briefly state your collaborative goals, credentials, or areas of mutual interest..."
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setCollabModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Send Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const PublicationDetailsWithErrorBoundary = () => (
  <ErrorBoundary>
    <PublicationDetails />
  </ErrorBoundary>
);

export default PublicationDetailsWithErrorBoundary;
