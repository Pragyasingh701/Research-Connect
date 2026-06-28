import React, { useState, useEffect } from 'react';
import { 
  Award, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Plus, 
  CheckCircle2, 
  ExternalLink,
  BookOpen, 
  User,
  Users,
  GraduationCap,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  BookMarked,
  Share2,
  Bookmark,
  ChevronDown,
  Trash2,
  Link2,
  Camera,
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useScholarImport } from '../../hooks/auth.hooks';
import api from '../../services/api';
import ScholarImportWizard from '../../features/profile/ScholarImportWizard.jsx';
import EditProfileModal from '../../features/profile/EditProfileModal.jsx';
import SyncMergeModal from '../../features/profile/SyncMergeModal.jsx';
import KeywordManager from './components/KeywordManager';

const providerIcons = {
  'ORCID': (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#A6C307">
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.734 17.776H6.277V6.36h1.457v11.416zm-.728-12.433c-.524 0-.949-.425-.949-.949 0-.524.425-.949.949-.949.525 0 .949.425.949.949 0 .524-.424.949-.949.949zm9.584 7.039c0 2.876-1.785 4.394-4.394 4.394h-2.585V6.36h2.894c2.518 0 4.085 1.488 4.085 4.384v1.638zm-1.457-.036c0-2.075-.983-3.149-2.621-3.149h-1.457v6.627h1.365c1.72 0 2.713-.983 2.713-3.203v-.275z"/>
    </svg>
  ),
  'Google Scholar': (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#4285F4">
      <path d="M12 2L1 8l11 6 9-4.91V17h2V9L12 2zM4.14 11.23c.53 1.83 2.1 3.27 4.13 3.66v4.61a4 4 0 0 0 7.46 0v-4.61c2.03-.39 3.6-1.83 4.13-3.66L12 15.5l-7.86-4.27z" />
    </svg>
  ),
  'Scopus': (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#E9711C">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.48 2 12s4.477 10 10 10z" />
      <path d="M14.5 8.5c-.75-.75-1.75-1-2.5-1-1.75 0-3 1-3 2.5s1 2 2.5 2.5 2.5.5 2.5 1.5c0 .75-.75 1.5-2 1.5-1 0-2-.5-2.5-1.25l-1.25 1c.75 1 2 1.75 3.75 1.75 2.5 0 3.5-1.5 3.5-3s-1-2.25-2.75-2.75-2.25-.5-2.25-1.25c0-.75.75-1.25 1.75-1.25.75 0 1.5.25 2 .75l1-1z" fill="#FFF" />
    </svg>
  ),
  'LinkedIn': (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  'ResearchGate': (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#00CCBB">
      <path d="M19.37 11.56c-.02-.08-.06-.16-.1-.23L16.48 6.5h-2.92v11h2.17v-4.14h.77l2.25 4.14h2.46l-2.62-4.81c1.07-.44 1.83-1.5 1.83-2.73a2.91 2.91 0 0 0-.05-.4zm-3.64-1.25V8.26h.81c.73 0 1.18.33 1.18.98 0 .66-.45.99-1.18.99h-.81zM9.43 11.56c0-.85-.18-1.5-.53-1.93-.35-.44-.9-.65-1.62-.65H5.21v5.19h2.07c.72 0 1.27-.21 1.62-.65.35-.43.53-1.08.53-1.96zm-2.07 4.13H5.21v2.18H3.04v-11h4.24c1.35 0 2.41.38 3.19 1.14.77.76 1.16 1.85 1.16 3.26 0 1.4-.39 2.49-1.16 3.25-.78.77-1.84 1.17-3.19 1.17z"/>
    </svg>
  ),
  'GitHub': (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#181717">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  ),
  'Website': (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
};

const ProfilePage = () => {
  const { user, syncProfile } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { importProfile, loading: importLoading, error: importError } = useScholarImport();

  const [profileData, setProfileData] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scholarStatus, setScholarStatus] = useState(null);
  
  const [activeTab, setActiveTab] = useState('About');
  const handleDownloadPub = async (e, pub) => {
    e.stopPropagation();
    api.post('/publications/downloads', { publicationId: pub._id }).catch(() => {});
    const docUrl = pub.pdfUrl || pub.fileUrl;
    if (docUrl) {
      window.open(docUrl.startsWith('/') ? `${api.defaults.baseURL || 'http://localhost:5000'}${docUrl}` : docUrl, '_blank');
    } else {
      alert('PDF not available for this publication.');
    }
  };
  const [scholarIdInput, setScholarIdInput] = useState('');
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Collaboration & Network States
  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionState, setConnectionState] = useState('Not Connected');
  const [connectionId, setConnectionId] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [collaborationStatus, setCollaborationStatus] = useState('Open for Collaboration');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const queryId = new URLSearchParams(window.location.search).get('id') || (user?.user?._id || user?.id || user?._id);

  // Collaborate Modal States
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [collabForm, setCollabForm] = useState({
    projectTitle: '',
    researchArea: '',
    purpose: '',
    expectedContribution: '',
    requiredSkills: '',
    timeline: '',
    fundingAvailable: false,
    message: '',
    priority: 'Medium',
  });

  const statusOptions = [
    { value: 'Open for Collaboration', color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '🟢' },
    { value: 'Available for Selected Projects', color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '🟡' },
    { value: 'Looking for Co-authors', color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '🔵' },
    { value: 'Looking for Research Funding', color: 'bg-purple-500', text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '🟣' },
    { value: 'Looking for Supervisor', color: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🟠' },
    { value: 'Looking for PhD Students', color: 'bg-amber-700', text: 'text-amber-700', bg: 'bg-amber-700/10', border: 'border-amber-700/20', icon: '🟤' },
    { value: 'Looking for Master\'s Students', color: 'bg-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-600/10', border: 'border-emerald-600/20', icon: '🟢' },
    { value: 'Looking for Interns', color: 'bg-sky-600', text: 'text-sky-600', bg: 'bg-sky-600/10', border: 'border-sky-600/20', icon: '🔵' },
    { value: 'Looking for Industry Partners', color: 'bg-fuchsia-600', text: 'text-fuchsia-600', bg: 'bg-fuchsia-600/10', border: 'border-fuchsia-600/20', icon: '🟣' },
    { value: 'Currently Not Available', color: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: '🔴' }
  ];

  const getStatusOption = (val) => statusOptions.find(o => o.value === val) || statusOptions[0];


  const getPhotoUrl = (path, defaultUrl) => {
    if (!path) return defaultUrl;
    if (path.startsWith('http')) return path;
    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const baseURL = apiURL.split('/api/v1')[0];
    return `${baseURL}${path}`;
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    setLoading(true);
    try {
      const response = await api.post(`/profile/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.status === 'success') {
        alert(`${type === 'cover' ? 'Cover' : 'Profile'} photo updated successfully.`);
        await fetchProfileDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || `Failed to upload ${type} photo.`);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Profile Completeness calculation
  const getCompletenessDetails = () => {
    const hasBasicInfo = !!(profileData?.bio && profileData?.designation && profileData?.institution && profileData?.city && profileData?.country);
    const hasEducation = !!(profileData?.educationList && profileData.educationList.length > 0);
    const hasExperience = !!(profileData?.experienceList && profileData.experienceList.length > 0);
    const hasResearchInterests = !!(profileData?.researchAreas && profileData.researchAreas.length > 0);
    const hasPublications = !!(publications && publications.length > 0);
    const hasPhoto = !!profileData?.profilePhoto;
    const hasCover = !!profileData?.coverPhoto;
    const hasPhotoAndCover = hasPhoto && hasCover;

    let percentage = 0;
    if (hasBasicInfo) percentage += 25;
    if (hasEducation) percentage += 15;
    if (hasExperience) percentage += 15;
    if (hasResearchInterests) percentage += 15;
    if (hasPublications) percentage += 15;
    if (hasPhotoAndCover) percentage += 15;
    else if (hasPhoto || hasCover) percentage += 7;

    percentage = Math.min(percentage, 100);

    return {
      percentage,
      steps: [
        { label: 'Basic Information', completed: hasBasicInfo },
        { label: 'Education History', completed: hasEducation },
        { label: 'Professional Experience', completed: hasExperience },
        { label: 'Research Interests', completed: hasResearchInterests },
        { label: 'Publications Uploaded', completed: hasPublications },
        { label: 'Profile Photo & Cover', completed: hasPhotoAndCover }
      ]
    };
  };

  const completeness = getCompletenessDetails();

  const tabs = ['About', 'Activity', 'Education', 'Experience', 'Research Interests', 'Publications', 'Projects', 'Achievements'];


  const handleUnlink = async (provider) => {
    if (window.confirm(`Are you sure you want to unlink your ${provider}?`)) {
      setLoading(true);
      try {
        if (provider === 'Google Scholar') {
          await api.delete('/profile/google-scholar/unlink');
        } else {
          // Clear field by updating profile
          const updatedAcademic = { ...profileData?.academicProfile };
          if (provider === 'ORCID') updatedAcademic.orcid = '';
          if (provider === 'Scopus') updatedAcademic.scopusId = '';
          if (provider === 'LinkedIn') updatedAcademic.linkedIn = '';
          if (provider === 'ResearchGate') updatedAcademic.researchGate = '';
          
          await api.put('/profile', {
            ...profileData,
            academicProfile: updatedAcademic
          });
        }
        await fetchProfileDetails();
        alert(`${provider} unlinked successfully.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Unlink failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefreshSync = async (provider, syncEndpoint, payload) => {
    setLoading(true);
    try {
      if (provider === 'Google Scholar') {
        await api.put('/profile/google-scholar/sync');
      } else {
        await api.post(syncEndpoint, payload);
      }
      await fetchProfileDetails();
      alert(`${provider} synchronized successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Sync failed.');
    } finally {
      setLoading(false);
    }
  };

  const identityProviders = [
    {
      name: 'ORCID',
      connected: !!profileData?.academicProfile?.orcid,
      value: profileData?.academicProfile?.orcid,
      url: profileData?.academicProfile?.orcid ? `https://orcid.org/${profileData.academicProfile.orcid}` : null,
      syncEndpoint: '/profile/import/orcid',
      syncPayload: { orcidId: profileData?.academicProfile?.orcid },
    },
    {
      name: 'Google Scholar',
      connected: !!profileData?.academicProfile?.googleScholar,
      value: profileData?.academicProfile?.googleScholar,
      url: profileData?.academicProfile?.googleScholar ? `https://scholar.google.com/citations?user=${profileData.academicProfile.googleScholar}` : null,
      syncEndpoint: '/profile/google-scholar/sync',
      syncPayload: {},
    },
    {
      name: 'Scopus',
      connected: !!profileData?.academicProfile?.scopusId,
      value: profileData?.academicProfile?.scopusId,
      url: profileData?.academicProfile?.scopusId ? `https://www.scopus.com/authid/detail.uri?authorId=${profileData.academicProfile.scopusId}` : null,
      syncEndpoint: '/profile/scopus',
      syncPayload: { scopusId: profileData?.academicProfile?.scopusId },
    },
    {
      name: 'LinkedIn',
      connected: !!profileData?.academicProfile?.linkedIn,
      value: profileData?.academicProfile?.linkedIn,
      url: profileData?.academicProfile?.linkedIn ? (profileData.academicProfile.linkedIn.startsWith('http') ? profileData.academicProfile.linkedIn : `https://linkedin.com/in/${profileData.academicProfile.linkedIn}`) : null,
      syncEndpoint: '/profile/import/linkedin',
      syncPayload: { linkedinUrl: profileData?.academicProfile?.linkedIn },
    },
    {
      name: 'ResearchGate',
      connected: !!profileData?.academicProfile?.researchGate || !!profileData?.socialLinks?.researchgate,
      value: profileData?.academicProfile?.researchGate || profileData?.socialLinks?.researchgate,
      url: (profileData?.academicProfile?.researchGate || profileData?.socialLinks?.researchgate) ? `https://researchgate.net/profile/${profileData.academicProfile?.researchGate || profileData.socialLinks?.researchgate}` : null,
    },
    {
      name: 'GitHub',
      connected: !!profileData?.socialLinks?.github,
      value: profileData?.socialLinks?.github,
      url: profileData?.socialLinks?.github ? (profileData.socialLinks.github.startsWith('http') ? profileData.socialLinks.github : `https://github.com/${profileData.socialLinks.github}`) : null,
    },
    {
      name: 'Website',
      connected: !!profileData?.website,
      value: profileData?.website,
      url: profileData?.website,
    }
  ];

  // Fetch real profile details and publications on mount
  const fetchProfileDetails = async () => {
    try {
      const queryId = new URLSearchParams(window.location.search).get('id');
      if (queryId && queryId !== user?.user?._id) {
        setIsOwnProfile(false);
        const response = await api.get(`/profile/user/${queryId}`);
        setProfileData(response.data.profile);
        setPublications(response.data.publications || []);
        setIsFollowing(response.data.isFollowing);
        setConnectionState(response.data.connectionState);
        setConnectionId(response.data.connectionId);
        setIsBlocked(response.data.isBlocked);
        setCollaborationStatus(response.data.collaborationStatus);
        setFollowersCount(response.data.followersCount);
        setFollowingCount(response.data.followingCount);
        
        // Fetch mutual followers
        try {
          const mutualRes = await api.get(`/follow/mutual/${queryId}`);
          setMutualFollowers(mutualRes.data.data);
        } catch (err) {
          console.error('Failed to load mutual followers', err);
        }
      } else {
        setIsOwnProfile(true);
        const response = await api.get('/profile/me');
        setProfileData(response.data.profile);
        setPublications(response.data.publications || []);
        
        // Fetch own status
        try {
          const colStatusRes = await api.get('/collaboration/status');
          setCollaborationStatus(colStatusRes.data.data?.status || 'Open for Collaboration');
        } catch (err) {
          console.error('Failed to load collaboration status');
        }

        // Fetch own followers
        try {
          const followRes = await api.get('/follows/dashboard');
          setFollowersCount(followRes.data.data?.followers?.length || 0);
          setFollowingCount(followRes.data.data?.following?.length || 0);
        } catch (err) {
          console.error('Failed to load followers counts');
        }

        // Fetch Google Scholar connection status
        try {
          const statusRes = await api.get('/profile/google-scholar/status');
          setScholarStatus(statusRes.data);
        } catch (err) {
          console.error('Failed to load Google Scholar status:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load profile details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const queryId = new URLSearchParams(window.location.search).get('id');
      if (!queryId) return;

      const originalFollowing = isFollowing;
      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? Math.max(0, prev - 1) : prev + 1);

      if (isFollowing) {
        await api.post(`/unfollow/${queryId}`);
        if (socket) {
          socket.emit('unfollow-user', { targetUserId: queryId });
        }
      } else {
        await api.post(`/follow/${queryId}`);
        if (socket) {
          socket.emit('follow-user', { targetUserId: queryId });
        }
      }
    } catch (err) {
      console.error('Follow action failed:', err);
      // Revert optimistic UI on failure
      setIsFollowing(isFollowing);
      setFollowersCount(prev => isFollowing ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleConnectAction = async () => {
    try {
      const queryId = new URLSearchParams(window.location.search).get('id');
      if (!queryId) return;
      if (connectionState === 'Not Connected') {
        const res = await api.post(`/connections/connect/${queryId}`);
        setConnectionState('Pending Sent');
        setConnectionId(res.data.data._id);
      } else if (connectionState === 'Pending Received') {
        await api.patch(`/connections/accept/${connectionId}`);
        setConnectionState('Connected');
      }
    } catch (err) {
      console.error('Connection action failed:', err);
    }
  };

  const handleSendCollabRequest = async (e) => {
    e.preventDefault();
    try {
      const queryId = new URLSearchParams(window.location.search).get('id');
      const payload = {
        ...collabForm,
        receiverId: queryId,
        requiredSkills: collabForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/collaboration/requests', payload);
      alert('Collaboration request sent successfully!');
      setCollabModalOpen(false);
      setCollabForm({
        projectTitle: '', researchArea: '', purpose: '', expectedContribution: '',
        requiredSkills: '', timeline: '', fundingAvailable: false, message: '', priority: 'Medium'
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send collaboration request');
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [user]); // Re-fetch whenever context user changes

  useEffect(() => {
    if (!socket) return;

    const queryId = new URLSearchParams(window.location.search).get('id') || user?.user?._id || user?.id || user?._id;
    if (!queryId) return;

    // Join room & fetch latest counts
    socket.emit('request-follow-count', { targetUserId: queryId });
    socket.emit('request-following-count', { targetUserId: queryId });

    const handleFollowersUpdated = (data) => {
      if (data.userId.toString() === queryId.toString()) {
        setFollowersCount(data.followersCount);
      }
    };

    const handleFollowingUpdated = (data) => {
      if (data.userId.toString() === queryId.toString()) {
        setFollowingCount(data.followingCount);
      }
    };

    const handleProfileUpdatedEvent = () => {
      fetchProfileDetails();
    };

    socket.on('followers-count-updated', handleFollowersUpdated);
    socket.on('following-count-updated', handleFollowingUpdated);
    socket.on('profile-updated', handleProfileUpdatedEvent);

    return () => {
      socket.off('followers-count-updated', handleFollowersUpdated);
      socket.off('following-count-updated', handleFollowingUpdated);
      socket.off('profile-updated', handleProfileUpdatedEvent);
    };
  }, [socket, window.location.search, user]);

  const handleScholarImport = async (e) => {
    e.preventDefault();
    if (!scholarIdInput.trim()) return;
    
    let authorId = scholarIdInput.trim();
    if (authorId.includes('user=')) {
      authorId = authorId.split('user=')[1].split('&')[0];
    } else if (authorId.includes('author/')) {
      authorId = authorId.split('author/')[1].split('?')[0];
    }

    const result = await importProfile(authorId);
    if (result.success) {
      setImportSuccess(true);
      setScholarIdInput('');
      fetchProfileDetails(); // Force reload local state
      setTimeout(() => setImportSuccess(false), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Loading profile details...</p>
      </div>
    );
  }

  // Fallbacks mapping to Google Scholar mock data or real profiles
  const fullName = profileData?.user?.fullName || 'Sushil Kumar kushwaha';
  const designation = profileData?.designation || 'Associate Professor';
  const department = profileData?.department || 'Department of Computer Science & Engineering';
  const institution = profileData?.institution || 'Amity University';
  const locationText = profileData?.city && profileData?.country 
    ? `${profileData.city}, ${profileData.country}` 
    : (profileData?.country && profileData.country !== 'Not Specified' ? profileData.country : 'Noida, India');
  
  const bioText = profileData?.bio || 'I am an Associate Professor specializing in Machine Learning, Deep Learning, and Natural Language Processing. My research focuses on developing intelligent systems that solve real-world problems. I have published extensively in top-tier journals and conferences and actively collaborate on interdisciplinary research projects.';
  const emailText = profileData?.user?.email || '2304280100173@kashiit.ac.in';
  
  return (
    <div className="flex flex-col gap-8">
      {/* Google Scholar Sync Banner Card */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-200/30 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" /> Google Scholar Integration
            {scholarStatus?.connected && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                scholarStatus.syncStatus === 'synced'
                  ? 'bg-green-50 text-green-700 border-green-200/50'
                  : 'bg-amber-50 text-amber-700 border-amber-200/50'
              }`}>
                {scholarStatus.syncStatus}
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-500 max-w-xl">
            {scholarStatus?.connected 
              ? `Connected with Scholar ID: ${scholarStatus.providerUserId}. Last synced: ${
                  scholarStatus.lastSyncedAt 
                    ? new Date(scholarStatus.lastSyncedAt).toLocaleString() 
                    : 'Never'
                }`
              : 'Auto-populate your academic metrics, citations index, co-authors network, and papers directly from your Google Scholar profile.'}
          </p>
        </div>
        
        {scholarStatus?.connected ? (
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setShowSyncModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" /> Sync Latest
            </button>
            <button 
              onClick={async () => {
                if (window.confirm('Are you sure you want to unlink your Google Scholar profile?')) {
                  setLoading(true);
                  try {
                    await api.delete('/profile/google-scholar/unlink');
                    await fetchProfileDetails();
                    alert('Google Scholar profile unlinked.');
                  } catch (err) {
                    alert(err.response?.data?.message || 'Unlink failed.');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              className="px-4 py-2 border border-red-200 hover:bg-red-55 text-red-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Unlink Account
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowImportPanel(!showImportPanel)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-sm shadow-blue-500/10"
          >
            <RefreshCw className="w-4 h-4" /> Link Profile Now
          </button>
        )}
      </div>

      {/* Interactive Scholar Import Input Panel */}
      {showImportPanel && !profileData?.academicProfile?.googleScholar && (
        <ScholarImportWizard 
          onImportComplete={async () => {
            setShowImportPanel(false);
            setLoading(true);
            await fetchProfileDetails();
            alert('Import completed successfully!');
          }}
          onCancel={() => setShowImportPanel(false)}
        />
      )}

      {/* Main Profile Header Banner */}
      <div className="glass-card rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-sm relative transition-all duration-300 hover:shadow-md">
        {/* Cover Photo */}
        <div className="h-44 sm:h-52 bg-slate-100 relative overflow-hidden group">
          <img 
            src={getPhotoUrl(profileData?.coverPhoto, 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1200')}
            alt="Cover Banner"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
          
          {/* Edit Cover Photo Overlay Button */}
          <label className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 px-3 py-2 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105 flex items-center gap-2 text-xs font-bold backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-300 z-20">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Change Cover</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handlePhotoUpload(e, 'cover')} 
            />
          </label>
        </div>

        {/* Profile Details Container */}
        <div className="px-8 pb-8 pt-0 flex flex-col md:flex-row items-start gap-6 text-left relative -mt-20 z-10">
          {/* Profile Photo */}
          <div className="relative shrink-0 group/photo">
            <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white group-hover/photo:border-blue-600 transition-all duration-300">
              <img 
                src={getPhotoUrl(profileData?.profilePhoto, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80')}
                alt={fullName}
                className="w-full h-full object-cover"
              />
              <label className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300">
                <Camera className="w-5 h-5 text-blue-400" />
                <span className="text-[10px] font-bold mt-1">Change Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handlePhotoUpload(e, 'photo')} 
                />
              </label>
            </div>
            {profileData?.academicProfile?.googleScholar && (
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-md animate-pulse z-10">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            )}
          </div>

          {/* User Text Info */}
          <div className="flex-1 pt-20 md:pt-24 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex flex-wrap items-center gap-2 leading-none font-display">
                  {fullName}
                  <CheckCircle2 className="w-6 h-6 text-blue-600 fill-blue-50/50 hover:scale-110 transition-transform cursor-pointer" />
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/50 rounded-full text-[9px] font-extrabold tracking-wider uppercase font-sans">
                    Score {completeness.percentage}%
                  </span>
                  {(() => {
                    const opt = getStatusOption(collaborationStatus);
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${opt.bg} ${opt.text} ${opt.border} animate-pulse`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {opt.value}
                      </span>
                    );
                  })()}
                </h2>
                <p className="text-sm font-bold text-blue-600 mt-2 font-sans tracking-wide uppercase">{designation}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {isOwnProfile ? (
                  <>
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      Edit Profile
                    </button>
                    <a 
                      href="/collaboration"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 text-center shadow-md shadow-slate-900/10"
                    >
                      Manage Collaboration
                    </a>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleConnectAction}
                      disabled={connectionState === 'Pending Sent'}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 cursor-pointer shadow-md ${
                        connectionState === 'Connected' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10' :
                        connectionState === 'Pending Sent' ? 'bg-slate-150 text-slate-400 border border-slate-200 cursor-not-allowed' :
                        'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                      }`}
                    >
                      {connectionState === 'Connected' ? 'Connected' :
                       connectionState === 'Pending Sent' ? 'Invitation Sent' :
                       connectionState === 'Pending Received' ? 'Accept Invitation' : 'Connect'}
                    </button>
                    <button 
                      onClick={handleFollowToggle}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 cursor-pointer shadow-md ${
                        isFollowing ? 'border border-slate-200 hover:bg-slate-50 text-slate-600' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button 
                      onClick={() => setCollabModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 cursor-pointer shadow-md shadow-indigo-500/10"
                    >
                      Collaborate
                    </button>
                  </>
                )}
                <button className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 cursor-pointer">
                  Share Profile
                </button>
              </div>
            </div>

            {/* Department Details */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-sans">
              <span className="flex items-center gap-1.5 font-medium"><Briefcase className="w-4 h-4 text-slate-400" /> {department}</span>
              <span className="flex items-center gap-1.5 font-medium"><Award className="w-4 h-4 text-slate-400" /> {institution}</span>
              <span className="flex items-center gap-1.5 font-medium"><MapPin className="w-4 h-4 text-slate-400" /> {locationText}</span>
            </div>

            {/* Academic Social Badges - Icons Only with Real Links */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {identityProviders.map((provider) => {
                const isConnected = provider.connected;
                const linkUrl = provider.url || '#';

                return (
                  <div key={provider.name} className="relative group">
                    {isConnected ? (
                      <a 
                        href={linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-blue-500 shadow-sm flex items-center justify-center hover:shadow-md hover:scale-105 transition-all duration-250"
                      >
                        {providerIcons[provider.name]}
                      </a>
                    ) : (
                      <button 
                        onClick={() => setShowEditModal(true)}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-blue-500 shadow-sm flex items-center justify-center hover:shadow-md hover:scale-105 transition-all duration-250 cursor-pointer"
                      >
                        {providerIcons[provider.name]}
                      </button>
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {provider.name} {isConnected ? '✓' : '(Not Linked)'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Mutual Followers Section */}
            {!isOwnProfile && mutualFollowers && mutualFollowers.length > 0 && (
              <div className="flex items-center space-x-2.5 pt-4 text-xs font-semibold text-slate-500 font-sans border-t border-slate-100 mt-2">
                <div className="flex -space-x-2.5 overflow-hidden">
                  {mutualFollowers.slice(0, 3).map((m) => (
                    <div key={m.user._id} className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-650 shrink-0 overflow-hidden">
                      {m.profile?.profilePhoto ? (
                        <img className="h-full w-full object-cover" src={m.profile.profilePhoto} alt={m.user.fullName} />
                      ) : (
                        m.user.fullName[0]
                      )}
                    </div>
                  ))}
                </div>
                <div className="leading-snug">
                  <span>Followed by </span>
                  {mutualFollowers.slice(0, 2).map((m, idx) => (
                    <React.Fragment key={m.user._id}>
                      <span className="font-bold text-slate-800 hover:text-indigo-600 transition-colors hover:underline cursor-pointer" onClick={() => navigate(`/profile?id=${m.user._id}`)}>
                        {m.user.fullName.split(' ')[0]}
                      </span>
                      {idx === 0 && mutualFollowers.length > 1 && ', '}
                    </React.Fragment>
                  ))}
                  {mutualFollowers.length > 2 && (
                    <>
                      <span> and </span>
                      <span className="font-bold text-slate-800 hover:text-indigo-600 transition-colors hover:underline cursor-pointer" onClick={() => navigate(`/followers?id=${queryId}`)}>
                        +{mutualFollowers.length - 2} others
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="border-t border-slate-100 px-8 flex overflow-x-auto gap-6 shrink-0 bg-slate-50/50">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Changes dynamically based on activeTab) */}
        <div className="lg:col-span-2 flex flex-col gap-8 text-left">
          
          {activeTab === 'About' && (
            <>
              {/* About Section */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-display">About Me</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">{bioText}</p>
                <a href="#" className="text-xs font-bold text-blue-600 hover:underline inline-block">Read more</a>
              </div>

              {/* Academic & Professional Information Details */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" /> Academic & Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
                  {/* Left Column: Personal/Institutional */}
                  <div className="space-y-3.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100/85">
                    <h4 className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase border-b border-slate-200/50 pb-1.5 mb-3">Institutional & Profile Details</h4>
                    
                    {/* Full Name */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Full Name</span>
                        <span className="text-sm font-semibold text-slate-800">{profileData?.user?.fullName || 'Sushil Kumar kushwaha'}</span>
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Date of Birth</span>
                        <span className="text-sm font-semibold text-slate-800">
                          {profileData?.dateOfBirth 
                            ? new Date(profileData.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) 
                            : '15 March 1985'}
                        </span>
                      </div>
                    </div>

                    {/* Designation */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Designation</span>
                        <span className="text-sm font-semibold text-slate-800">{profileData?.designation || 'Associate Professor'}</span>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Layers className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Department</span>
                        <span className="text-sm font-semibold text-slate-800">{profileData?.department || 'Department of Computer Science & Engineering'}</span>
                      </div>
                    </div>

                    {/* Institution */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Award className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Institution</span>
                        <span className="text-sm font-semibold text-slate-800 leading-relaxed">
                          {profileData?.institution || "World's Top 2% Scientist, 2024 @ Stanford University, Associate Professor (BBDITM Lucknow)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Academic Identifiers */}
                  <div className="space-y-3.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100/85">
                    <h4 className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase border-b border-slate-200/50 pb-1.5 mb-3">Academic Identifiers & Profiles</h4>
                    
                    {/* ORCID ID */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                        {providerIcons['ORCID']}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">ORCID ID</span>
                        {profileData?.academicProfile?.orcid || '0000-0002-1234-5678' ? (
                          <a 
                            href={`https://orcid.org/${profileData?.academicProfile?.orcid || '0000-0002-1234-5678'}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1 group/link"
                          >
                            {profileData?.academicProfile?.orcid || '0000-0002-1234-5678'} 
                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400 italic">Not Linked</span>
                        )}
                      </div>
                    </div>

                    {/* Google Scholar */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                        {providerIcons['Google Scholar']}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Google Scholar</span>
                        {profileData?.academicProfile?.googleScholar || 'dCaTOoUAAAAJ' ? (
                          <a 
                            href={`https://scholar.google.com/citations?user=${profileData?.academicProfile?.googleScholar || 'dCaTOoUAAAAJ'}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 group/link"
                          >
                            {profileData?.academicProfile?.googleScholar || 'dCaTOoUAAAAJ'}
                            <ExternalLink className="w-3 h-3 text-blue-500 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400 italic">Not Linked</span>
                        )}
                      </div>
                    </div>

                    {/* Scopus ID */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                        {providerIcons['Scopus']}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Scopus ID</span>
                        {profileData?.academicProfile?.scopusId || '57219908847' ? (
                          <a 
                            href={`https://www.scopus.com/authid/detail.uri?authorId=${profileData?.academicProfile?.scopusId || '57219908847'}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1 group/link"
                          >
                            {profileData?.academicProfile?.scopusId || '57219908847'}
                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400 italic">Not Linked</span>
                        )}
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                        {providerIcons['LinkedIn']}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">LinkedIn</span>
                        {profileData?.academicProfile?.linkedIn || 'https://linkedin.com' ? (
                          <a 
                            href={profileData?.academicProfile?.linkedIn || 'https://linkedin.com'} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 group/link"
                          >
                            View Profile
                            <ExternalLink className="w-3 h-3 text-blue-500 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400 italic">Not Linked</span>
                        )}
                      </div>
                    </div>

                    {/* GitHub */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                        {providerIcons['GitHub']}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">GitHub</span>
                        {profileData?.socialLinks?.github || 'github.com/arjunsharma' ? (
                          <a 
                            href={profileData?.socialLinks?.github?.startsWith('http') ? profileData.socialLinks.github : `https://github.com/${profileData?.socialLinks?.github || 'arjunsharma'}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1 group/link"
                          >
                            {profileData?.socialLinks?.github || 'github.com/arjunsharma'}
                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400 italic">Not Linked</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-sans">
                  {/* Email Card */}
                  <div className="flex items-center gap-4 bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl border border-slate-100/85 hover:shadow-sm transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Email Address</span>
                      <a href={`mailto:${emailText}`} className="font-semibold text-slate-750 text-slate-750 hover:text-blue-650 block truncate leading-tight">
                        {emailText}
                      </a>
                    </div>
                  </div>

                  {/* Phone Card */}
                  <div className="flex items-center gap-4 bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl border border-slate-100/85 hover:shadow-sm transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Phone Number</span>
                      <span className="font-semibold text-slate-750 block leading-tight">
                        +91 98765 43210
                      </span>
                    </div>
                  </div>

                  {/* Website Card */}
                  <div className="flex items-center gap-4 bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl border border-slate-100/85 hover:shadow-sm transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Personal Website</span>
                      <a 
                        href="https://sushilkumar.in" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-semibold text-blue-600 hover:underline block truncate leading-tight"
                      >
                        https://sushilkumar.in
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education Timeline Section */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" /> Education
                  </h3>
                  <button onClick={() => setShowEditModal(true)} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                    Manage
                  </button>
                </div>
                <div className="space-y-6 relative pl-6 border-l border-slate-100 ml-4 text-left">
                  {profileData?.educationList && profileData.educationList.length > 0 ? (
                    profileData.educationList.map((edu) => (
                      <div key={edu._id} className="relative group transition-all duration-300">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50 shadow-sm"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm font-sans">{edu.degree}</h4>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                              {edu.university} • {edu.fieldOfStudy}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-xl text-[10px] font-bold self-start sm:self-center">
                            {edu.startYear} - {edu.endYear || 'Present'}
                          </span>
                        </div>
                        {edu.description && (
                          <p className="text-xs text-slate-400 mt-2 font-sans italic leading-relaxed">{edu.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    [
                      {
                        degree: 'Ph.D. in Computer Science & Engineering',
                        university: 'Amity University',
                        fieldOfStudy: 'Artificial Intelligence',
                        startYear: 2011,
                        endYear: 2016,
                        description: 'Thesis on Deep Learning Optimizations and Neural Architectures.'
                      },
                      {
                        degree: 'M.Tech. in Computer Science',
                        university: 'Indian Institute of Technology, Delhi',
                        fieldOfStudy: 'Computer Engineering',
                        startYear: 2009,
                        endYear: 2011,
                      },
                      {
                        degree: 'B.Tech. in Computer Science',
                        university: 'Delhi Technological University',
                        fieldOfStudy: 'Information Technology',
                        startYear: 2005,
                        endYear: 2009,
                      }
                    ].map((edu, idx) => (
                      <div key={idx} className="relative group transition-all duration-300">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50 shadow-sm"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm font-sans">{edu.degree}</h4>
                            <p className="text-xs text-slate-500 font-semibold mt-1 font-sans">
                              {edu.university} • {edu.fieldOfStudy}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-xl text-[10px] font-bold self-start sm:self-center">
                            {edu.startYear} - {edu.endYear || 'Present'}
                          </span>
                        </div>
                        {edu.description && (
                          <p className="text-xs text-slate-400 mt-2 font-sans italic leading-relaxed">{edu.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Experience Timeline Section */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" /> Experience
                  </h3>
                  <button onClick={() => setShowEditModal(true)} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                    Manage
                  </button>
                </div>
                <div className="space-y-6 relative pl-6 border-l border-slate-100 ml-4 text-left">
                  {profileData?.experienceList && profileData.experienceList.length > 0 ? (
                    profileData.experienceList.map((exp) => (
                      <div key={exp._id} className="relative group transition-all duration-300">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white ring-4 ring-indigo-50 shadow-sm"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm font-sans">{exp.role}</h4>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                              {exp.organization} • {exp.department || exp.employmentType}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-xl text-[10px] font-bold self-start sm:self-center">
                            {exp.startYear} - {exp.endYear || 'Present'}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-slate-400 mt-2 font-sans italic leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    [
                      {
                        role: 'Associate Professor',
                        organization: 'Amity University',
                        department: 'Department of Computer Science & Engineering',
                        employmentType: 'full-time',
                        startYear: 2016,
                        endYear: null,
                        description: 'Teaching graduate classes in Deep Learning and Sensor Routing. Supervising Ph.D. candidates.'
                      },
                      {
                        role: 'Assistant Professor',
                        organization: 'IIT Delhi',
                        department: 'Department of Computer Science',
                        employmentType: 'full-time',
                        startYear: 2013,
                        endYear: 2016,
                      },
                      {
                        role: 'Research Scientist',
                        organization: 'TCS Research, Bangalore',
                        department: 'Innovation Lab',
                        employmentType: 'full-time',
                        startYear: 2011,
                        endYear: 2013,
                      }
                    ].map((exp, idx) => (
                      <div key={idx} className="relative group transition-all duration-300">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white ring-4 ring-indigo-50 shadow-sm"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm font-sans">{exp.role}</h4>
                            <p className="text-xs text-slate-500 font-semibold mt-1 font-sans">
                              {exp.organization} • {exp.department || exp.employmentType}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-xl text-[10px] font-bold self-start sm:self-center">
                            {exp.startYear} - {exp.endYear || 'Present'}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-slate-400 mt-2 font-sans italic leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Research Interests Card */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Research Interests
                  </h3>
                  <button onClick={() => setShowEditModal(true)} className="text-xs font-semibold text-blue-650 text-blue-600 hover:underline cursor-pointer">
                    Manage
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-left">
                  {profileData?.researchAreas && profileData.researchAreas.length > 0 ? (
                    profileData.researchAreas.map((area) => (
                      <span key={area._id} className="px-3.5 py-2 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-all">
                        {area.researchArea?.areaName}
                      </span>
                    ))
                  ) : (
                    ['Wireless Sensor Network', 'Routing Protocol', 'Security', 'IoT', 'Artificial Intelligence', 'Deep Learning', 'Natural Language Processing'].map((area) => (
                      <span key={area} className="px-3.5 py-2 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-all">
                        {area}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Publications Section */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" /> Publications
                  </h3>
                  <button onClick={() => setActiveTab('Publications')} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                    View All ({publications.length})
                  </button>
                </div>
                <div className="space-y-6 divide-y divide-slate-100 text-left">
                  {publications.length > 0 ? (
                    publications.slice(0, 3).map((pub) => (
                      <div key={pub._id} className="pt-5 first:pt-0 space-y-2.5">
                        <div className="flex items-start justify-between gap-4">
                          <h4 
                            onClick={() => navigate(`/publications/${pub._id || pub.slug}`)}
                            className="font-bold text-slate-800 text-sm hover:text-blue-600 hover:underline cursor-pointer leading-snug"
                          >
                            {pub.title}
                          </h4>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100/50 rounded-lg text-[9px] font-extrabold shrink-0">
                            {pub.citationCount} citations
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{pub.abstract}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <div className="flex gap-4">
                            {pub.journal && <span className="italic">{pub.journal}</span>}
                            <span>Year: {pub.publicationYear}</span>
                          </div>
                          <div className="relative group/tooltip shrink-0">
                            <button 
                              onClick={(e) => handleDownloadPub(e, pub)}
                              className="p-1 rounded bg-slate-100 hover:bg-blue-50 hover:scale-110 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 font-bold">
                              Download Publication
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    [
                      {
                        title: 'Energy-Efficient Clustering and Routing Algorithms in Wireless Sensor Networks',
                        abstract: 'This paper proposes a hybrid cluster head selection algorithm that reduces energy dissipation in remote network setups and improves lifetime constraints.',
                        journal: 'IEEE Transactions on Wireless Communications',
                        publicationYear: 2022,
                        citationCount: 45,
                      },
                      {
                        title: 'An Autonomous Sensor Node Recovery Protocol for IoT-enabled Cities',
                        abstract: 'We introduce an autogenous recovery protocol that enables fast packet re-routing in degraded network topologies under dynamic environments.',
                        journal: 'ACM Computing Surveys',
                        publicationYear: 2020,
                        citationCount: 28,
                      }
                    ].map((pub, idx) => (
                      <div key={idx} className="pt-5 first:pt-0 space-y-2.5">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-bold text-slate-800 text-sm hover:text-blue-650 hover:underline cursor-pointer leading-snug">
                            {pub.title}
                          </h4>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100/50 rounded-lg text-[9px] font-extrabold shrink-0">
                            {pub.citationCount} citations
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{pub.abstract}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <div className="flex gap-4">
                            {pub.journal && <span className="italic">{pub.journal}</span>}
                            <span>Year: {pub.publicationYear}</span>
                          </div>
                          <div className="relative group/tooltip shrink-0">
                            <button 
                              onClick={(e) => handleDownloadPub(e, pub)}
                              className="p-1 rounded bg-slate-100 hover:bg-blue-50 hover:scale-110 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 font-bold">
                              Download Publication
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Projects Card */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" /> Projects
                  </h3>
                  <button onClick={() => setShowEditModal(true)} className="text-xs font-semibold text-blue-650 text-blue-600 hover:underline cursor-pointer">
                    Manage
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {[
                    {
                      title: 'Intelligent Routing Protocols for WSNs',
                      desc: 'Designing energy-efficient node cluster algorithms for large-scale heterogeneous networks.',
                      funding: '$45,000',
                      status: 'Active',
                    },
                    {
                      title: 'IoT-enabled Smart Cities Architecture',
                      desc: 'Collaboration on mesh routing frameworks for node recovery under dense city structures.',
                      funding: '$32,000',
                      status: 'Completed',
                    }
                  ].map((proj, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:shadow-sm transition-all duration-300">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide ${
                          proj.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200/30' : 'bg-slate-200/50 text-slate-600'
                        }`}>
                          {proj.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{proj.funding}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs">{proj.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{proj.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements Card */}
              <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <Award className="w-5 h-5 text-rose-500" /> Achievements
                  </h3>
                  <button onClick={() => setShowEditModal(true)} className="text-xs font-semibold text-blue-650 text-blue-600 hover:underline cursor-pointer">
                    Manage
                  </button>
                </div>
                <div className="space-y-4 text-left">
                  {[
                    {
                      title: 'IEEE Senior Member Designation',
                      desc: 'Awarded for significant contributions to wireless communication protocols.',
                      year: '2023'
                    },
                    {
                      title: 'Best Research Paper Award',
                      desc: 'Honored at the IEEE International Conference on Communications (ICC 2022).',
                      year: '2022'
                    },
                    {
                      title: 'Outstanding Faculty Researcher',
                      desc: 'Recognized by Amity University for high-impact publication metrics.',
                      year: '2021'
                    }
                  ].map((ach, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-xs leading-none">{ach.title}</h4>
                          <span className="text-[9px] font-bold text-slate-400">{ach.year}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{ach.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'Activity' && (
            <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 font-display">Recent Activity</h3>
              {publications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400 italic">No recent activity logged.</p>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  {publications.slice(0, 5).map((pub, idx) => (
                    <div key={idx} className="flex gap-4 items-start border-b border-slate-100 pb-4 last:border-0">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                          Shared a new {pub.publicationType?.toLowerCase() || 'publication'}
                        </p>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{pub.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1">{pub.journal || pub.publisher} • {pub.publicationYear}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Publications' && (
            <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 font-display">Publications ({publications.length})</h3>
                <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Add Publication
                </button>
              </div>

              {publications.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <BookMarked className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500 font-medium">No publications found.</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try syncing your Google Scholar profile at the top of the dashboard to auto-populate your publications.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 divide-y divide-slate-100">
                  {publications.map((pub, idx) => (
                    <div key={pub._id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} space-y-3 text-left group`}>
                      <div className="flex items-start justify-between gap-4">
                        <h4 
                          onClick={() => navigate(`/publications/${pub._id || pub.slug}`)}
                          className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {pub.title}
                        </h4>
                        
                        {/* Citations Badge */}
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100/50 rounded-xl text-[10px] font-bold shrink-0">
                          {pub.citationCount} citations
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-sans">
                        {pub.abstract}
                      </p>

                      {/* Co-authors list */}
                      {pub.authors && pub.authors.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400 font-sans">
                          <span className="font-semibold text-slate-500">Authors:</span>
                          {pub.authors.map((author, index) => {
                            // Highlight the current user in bold
                            const isCurrentUser = author.user === user?.user?._id || author.authorName.toLowerCase().includes(fullName.toLowerCase());
                            return (
                              <span key={author._id}>
                                <span className={`${isCurrentUser ? 'font-bold text-blue-600' : 'text-slate-500'}`}>
                                  {author.authorName}
                                </span>
                                {index < pub.authors.length - 1 && ', '}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Paper details footer */}
                      <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-400 font-medium font-sans">
                        <div className="flex flex-wrap items-center gap-4">
                          {pub.journal && (
                            <span className="italic">{pub.journal}</span>
                          )}
                          <span>Year: {pub.publicationYear}</span>
                          {pub.doi && (
                            <span className="hover:text-blue-600 cursor-pointer flex items-center gap-0.5">
                              DOI: {pub.doi} <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {pub.pdfUrl && (
                            <a 
                              href={pub.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              View PDF <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <div className="relative group/tooltip shrink-0">
                          <button 
                            onClick={(e) => handleDownloadPub(e, pub)}
                            className="p-1 rounded bg-slate-100 hover:bg-blue-50 hover:scale-110 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 font-bold">
                            Download Publication
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Education' && (
            <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 font-display">Education History</h3>
                <button onClick={() => setShowEditModal(true)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Manage Education
                </button>
              </div>
              <div className="space-y-8 relative pl-6 border-l border-slate-100 ml-4 text-left">
                {profileData?.educationList && profileData.educationList.length > 0 ? (
                  profileData.educationList.map((edu) => (
                    <div key={edu._id} className="relative group transition-all duration-300">
                      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50 shadow-sm"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm font-sans flex items-center gap-2">
                            {edu.degree}
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            {edu.university} • {edu.fieldOfStudy}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-xl text-[10px] font-bold self-start sm:self-center">
                          {edu.startYear} - {edu.endYear || 'Present'}
                        </span>
                      </div>
                      {edu.description && (
                        <p className="text-xs text-slate-400 mt-2 font-sans italic leading-relaxed">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  [
                    {
                      degree: 'Ph.D. in Computer Science & Engineering',
                      university: 'Amity University',
                      fieldOfStudy: 'Artificial Intelligence',
                      startYear: 2011,
                      endYear: 2016,
                      description: 'Thesis on Deep Learning Optimizations and Neural Architectures.'
                    },
                    {
                      degree: 'M.Tech. in Computer Science',
                      university: 'Indian Institute of Technology, Delhi',
                      fieldOfStudy: 'Computer Engineering',
                      startYear: 2009,
                      endYear: 2011,
                    },
                    {
                      degree: 'B.Tech. in Computer Science',
                      university: 'Delhi Technological University',
                      fieldOfStudy: 'Information Technology',
                      startYear: 2005,
                      endYear: 2009,
                    }
                  ].map((edu, idx) => (
                    <div key={idx} className="relative group transition-all duration-300">
                      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50 shadow-sm"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm font-sans">
                            {edu.degree}
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            {edu.university} • {edu.fieldOfStudy}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-xl text-[10px] font-bold self-start sm:self-center">
                          {edu.startYear} - {edu.endYear || 'Present'}
                        </span>
                      </div>
                      {edu.description && (
                        <p className="text-xs text-slate-400 mt-2 font-sans italic leading-relaxed">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'Experience' && (
            <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 font-display">Professional Experience</h3>
                <button onClick={() => setShowEditModal(true)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Manage Experience
                </button>
              </div>
              <div className="space-y-8 relative pl-6 border-l border-slate-100 ml-4 text-left">
                {profileData?.experienceList && profileData.experienceList.length > 0 ? (
                  profileData.experienceList.map((exp) => (
                    <div key={exp._id} className="relative group transition-all duration-300">
                      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white ring-4 ring-indigo-50 shadow-sm"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm font-sans flex items-center gap-2">
                            {exp.role}
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            {exp.organization} • {exp.department || exp.employmentType}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-xl text-[10px] font-bold self-start sm:self-center">
                          {exp.startYear} - {exp.endYear || 'Present'}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-slate-400 mt-2 font-sans italic leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  [
                    {
                      role: 'Associate Professor',
                      organization: 'Amity University',
                      department: 'Department of Computer Science & Engineering',
                      employmentType: 'full-time',
                      startYear: 2016,
                      endYear: null,
                      description: 'Teaching graduate classes in Deep Learning. Supervising Ph.D. candidates.'
                    },
                    {
                      role: 'Assistant Professor',
                      organization: 'IIT Delhi',
                      department: 'Department of Computer Science',
                      employmentType: 'full-time',
                      startYear: 2013,
                      endYear: 2016,
                    },
                    {
                      role: 'Research Scientist',
                      organization: 'TCS Research, Bangalore',
                      department: 'Innovation Lab',
                      employmentType: 'full-time',
                      startYear: 2011,
                      endYear: 2013,
                    }
                  ].map((exp, idx) => (
                    <div key={idx} className="relative group transition-all duration-300">
                      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white ring-4 ring-indigo-50 shadow-sm"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm font-sans">
                            {exp.role}
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            {exp.organization} • {exp.department || exp.employmentType}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-xl text-[10px] font-bold self-start sm:self-center">
                          {exp.startYear} - {exp.endYear || 'Present'}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-slate-400 mt-2 font-sans italic leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'Research Interests' && (
            <KeywordManager />
          )}

          {activeTab !== 'About' && activeTab !== 'Publications' && activeTab !== 'Education' && activeTab !== 'Experience' && activeTab !== 'Research Interests' && (
            <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-display">{activeTab}</h3>
              <p className="text-sm text-slate-500 font-sans">
                This section contains verified data from your institutional records. Click Edit Profile to add new {activeTab.toLowerCase()}.
              </p>
            </div>
          )}
        </div>

        {/* Right Column (Metrics & Metadata Summary - Sticky) */}
        <div className="flex flex-col gap-8 text-left lg:sticky lg:top-6 self-start h-fit">
          
          {/* Network & Activity Summary Card */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-800 tracking-wide uppercase font-display">Research Network</h3>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-3 font-sans">
              <Link 
                to={`/followers?id=${queryId}`}
                className="bg-slate-50/65 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/10 p-3.5 rounded-2xl text-center block transition-all"
              >
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Followers</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">{followersCount}</span>
              </Link>
              <Link 
                to={`/following?id=${queryId}`}
                className="bg-slate-50/65 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/10 p-3.5 rounded-2xl text-center block transition-all"
              >
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Following</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">{followingCount}</span>
              </Link>
            </div>
          </div>

          {/* Research Metrics Dashboard Card */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase font-display">Research Metrics</h3>
              {profileData?.academicProfile?.googleScholar && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200/40 rounded-lg text-[9px] font-extrabold tracking-wider uppercase">
                  Scholar Synced
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-100/50 hover:shadow-md transition-all duration-300 group text-left">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Publications</span>
                  <BookOpen className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-display">{profileData?.publications || publications.length}</p>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-[85%]"></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-100/50 hover:shadow-md transition-all duration-300 group text-left">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Citations</span>
                  <Sparkles className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-display">{profileData?.citations || 0}</p>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full w-[70%]"></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-100/50 hover:shadow-md transition-all duration-300 group text-left">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">h-index</span>
                  <Award className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-display">{profileData?.hIndex || 0}</p>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full w-[55%]"></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-100/50 hover:shadow-md transition-all duration-300 group text-left">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">i10-index</span>
                  <Layers className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-display">{profileData?.i10Index || 0}</p>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full w-[65%]"></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/5 to-red-500/5 border border-rose-100/50 hover:shadow-md transition-all duration-300 group text-left">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Experience</span>
                  <User className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-display">{profileData?.experience || 10}+ Yrs</p>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full w-[90%]"></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-sky-500/5 border border-cyan-100/50 hover:shadow-md transition-all duration-300 group text-left">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Areas</span>
                  <GraduationCap className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-display">
                  {profileData?.researchAreas?.length || 7}
                </p>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full w-[75%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Citation Graph Card */}
          {profileData?.researchMetrics?.citationsByYear && profileData.researchMetrics.citationsByYear.length > 0 && (
            <div className="glass-card rounded-3xl p-6 bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 tracking-wide uppercase font-display border-b border-slate-100 pb-2 flex items-center justify-between">
                Citation History
                <span className="text-[9px] text-slate-400 capitalize font-medium">annual trends</span>
              </h3>
              <div className="relative w-full pt-2">
                {/* SVG Line/Bar Chart */}
                <svg viewBox="0 0 400 160" className="w-full h-auto overflow-visible">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="140" x2="380" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Graph Data */}
                  {(() => {
                    const data = [...profileData.researchMetrics.citationsByYear].sort((a, b) => a.year - b.year);
                    const maxCitations = Math.max(...data.map(d => d.citations), 5);
                    const points = data.map((d, index) => {
                      const x = 40 + (index * (340 / (data.length - 1 || 1)));
                      const y = 140 - (d.citations * (120 / maxCitations));
                      return { x, y, ...d };
                    });

                    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaD = points.length > 0 
                      ? `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z` 
                      : '';

                    return (
                      <>
                        {/* Shaded Area */}
                        {areaD && <path d={areaD} fill="url(#citationGrad)" opacity="0.15" />}
                        {/* Smooth Line */}
                        {pathD && <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />}
                        
                        {/* Interactive Nodes */}
                        {points.map((p, i) => (
                          <g key={i} className="group/node cursor-pointer">
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="4" 
                              fill="#ffffff" 
                              stroke="#2563EB" 
                              strokeWidth="2" 
                              className="transition-all duration-200 group-hover/node:r-6 group-hover/node:fill-blue-600"
                            />
                            {/* Hover tooltip */}
                            <g className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-200 pointer-events-none">
                              <rect 
                                x={p.x - 30} 
                                y={p.y - 32} 
                                width="60" 
                                height="22" 
                                rx="6" 
                                fill="#0f172a" 
                              />
                              <text 
                                x={p.x} 
                                y={p.y - 17} 
                                fill="#ffffff" 
                                fontSize="9" 
                                fontWeight="bold" 
                                textAnchor="middle"
                              >
                                {p.citations}
                              </text>
                            </g>
                            {/* X-axis labels */}
                            <text 
                              x={p.x} 
                              y="155" 
                              fill="#64748b" 
                              fontSize="8" 
                              fontWeight="bold" 
                              textAnchor="middle"
                            >
                              {p.year}
                            </text>
                          </g>
                        ))}

                        <defs>
                          <linearGradient id="citationGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* Research Areas */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 tracking-wide uppercase font-display border-b border-slate-100 pb-2">Research Areas</h3>
            <div className="flex flex-wrap gap-2">
              {profileData?.researchAreas && profileData.researchAreas.length > 0 ? (
                profileData.researchAreas.map((area) => (
                  <span key={area._id} className="px-3 py-1.5 bg-blue-50/60 hover:bg-blue-100 text-blue-700 border border-blue-100/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                    {area.researchArea?.areaName}
                  </span>
                ))
              ) : (
                ['Artificial Intelligence', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Data Mining', 'AI Ethics', 'Healthcare AI'].map((area) => (
                  <span key={area} className="px-3 py-1.5 bg-blue-50/60 hover:bg-blue-100 text-blue-700 border border-blue-100/30 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 duration-200">
                    {area}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Top Keywords */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 tracking-wide uppercase font-display border-b border-slate-100 pb-2">Top Keywords</h3>
            <div className="flex flex-wrap gap-1.5">
              {profileData?.keywords && profileData.keywords.length > 0 ? (
                profileData.keywords.map((kw) => (
                  <span key={kw._id} className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-lg text-xs font-medium">
                    {kw.keyword?.keyword}
                  </span>
                ))
              ) : (
                ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Mining', 'AI', 'Text Classification', 'Neural Networks'].map((kw) => (
                  <span key={kw} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors">
                    {kw}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Profile Completeness Card */}
          <div className="glass-card rounded-3xl p-6 bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 tracking-wide uppercase font-display border-b border-slate-100 pb-2">Profile Completeness</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#E2E8F0"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#2563EB"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - completeness.percentage / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-sm font-extrabold text-slate-800">{completeness.percentage}%</span>
              </div>

              <div className="text-left space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  {completeness.percentage < 40 ? 'Good start!' : completeness.percentage < 75 ? 'Great progress!' : 'Excellent progress!'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {completeness.percentage < 40 
                    ? 'Complete your profile to increase your visibility.' 
                    : completeness.percentage < 75 
                      ? 'Your profile ranks in the top 35% of computer science researchers.' 
                      : 'Your profile ranks in the top 8% of computer science researchers.'}
                </p>
              </div>
            </div>

            {/* Items Checklist */}
            <div className="space-y-2.5 pt-2 text-xs text-slate-500">
              {completeness.steps.map((step) => (
                <div key={step.label} className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${step.completed ? 'text-green-600' : 'text-slate-300'}`} />
                  <span className={step.completed ? 'text-slate-800 font-medium' : 'text-slate-400'}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <EditProfileModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        initialData={{
          ...profileData,
          publications
        }} 
        onSaveSuccess={() => {
          fetchProfileDetails();
          syncProfile();
        }} 
      />
      <SyncMergeModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSyncComplete={async () => {
          setLoading(true);
          await fetchProfileDetails();
          syncProfile();
          alert('Profile sync completed successfully!');
        }}
      />

      {/* Send Collaboration Request Modal */}
      {collabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh] text-left animate-in fade-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">Send Collaboration Invitation</h3>
                <p className="text-xs text-slate-400 mt-0.5">Invite {fullName} to join a research project.</p>
              </div>
              <button 
                onClick={() => setCollabModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1.5 hover:bg-slate-50 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCollabRequest} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Project Title</label>
                <input
                  type="text"
                  required
                  value={collabForm.projectTitle}
                  onChange={e => setCollabForm({ ...collabForm, projectTitle: e.target.value })}
                  placeholder="e.g. LLM-based Climate Forecasting Models"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Research Area</label>
                  <input
                    type="text"
                    required
                    value={collabForm.researchArea}
                    onChange={e => setCollabForm({ ...collabForm, researchArea: e.target.value })}
                    placeholder="e.g. Climate AI"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Timeline (Months)</label>
                  <input
                    type="text"
                    required
                    value={collabForm.timeline}
                    onChange={e => setCollabForm({ ...collabForm, timeline: e.target.value })}
                    placeholder="e.g. 6-12 Months"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Purpose / Goal of Collaboration</label>
                <textarea
                  required
                  value={collabForm.purpose}
                  onChange={e => setCollabForm({ ...collabForm, purpose: e.target.value })}
                  placeholder="Describe the overarching scientific goal..."
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Expected Contribution from {fullName}</label>
                <textarea
                  required
                  value={collabForm.expectedContribution}
                  onChange={e => setCollabForm({ ...collabForm, expectedContribution: e.target.value })}
                  placeholder="What expertise are you seeking from them?"
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Required Skills (comma-separated)</label>
                <input
                  type="text"
                  value={collabForm.requiredSkills}
                  onChange={e => setCollabForm({ ...collabForm, requiredSkills: e.target.value })}
                  placeholder="e.g. Python, PyTorch, Data Analysis"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <input
                  type="checkbox"
                  id="fundingAvailable"
                  checked={collabForm.fundingAvailable}
                  onChange={e => setCollabForm({ ...collabForm, fundingAvailable: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="fundingAvailable" className="font-bold text-slate-700 text-xs cursor-pointer select-none">
                  Institutional / Project Funding Available
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Personalized Message</label>
                <textarea
                  value={collabForm.message}
                  onChange={e => setCollabForm({ ...collabForm, message: e.target.value })}
                  placeholder="Write a brief, polite introduction..."
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollabModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/10 transition-all"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
