import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  Users, UserPlus, Award, Target, MessageSquare, Paperclip, Calendar, Clock,
  CheckCircle, XCircle, ChevronRight, AlertCircle, Plus, Send, RefreshCw, BarChart2, Globe, Bookmark
} from 'lucide-react';

const CollaborationDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // States
  const [statusRecord, setStatusRecord] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [activeProjects, setActiveProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Form States
  const [statusForm, setStatusForm] = useState({ status: '', visibility: 'Public' });
  const [prefsForm, setPrefsForm] = useState({
    researchInterests: '',
    preferredCollaborationType: [],
    collaborationMode: 'Remote',
    availability: 'Flexible',
    preferredCountries: '',
    preferredInstitutions: '',
    preferredLanguages: '',
    preferredTimeZone: '',
    preferredCommunication: 'Platform Chat',
    maxActiveCollaborations: 5,
    experienceLevel: 'Research Scholar',
    fundingAvailable: false,
    travelAvailable: false,
    expectedStartDate: '',
    expectedEndDate: '',
  });

  // Modal States
  const [collabModal, setCollabModal] = useState({ open: false, receiver: null });
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

  // Active Project Workspace States
  const [messageInput, setMessageInput] = useState('');
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', link: '', description: '' });
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Status Badge Metadata
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

  const colTypes = [
    'Research Paper', 'Journal Publication', 'Conference Paper', 'Book Writing', 
    'Grant Proposal', 'Patent', 'Dataset Creation', 'Open Source Project', 
    'Software Development', 'Experiment', 'Literature Review'
  ];

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statusRes, prefsRes, requestsRes, projectsRes, suggestionsRes, analyticsRes] = await Promise.all([
        api.get('/collaboration/status'),
        api.get('/collaboration/preferences'),
        api.get('/collaboration/requests'),
        api.get('/collaboration/projects'),
        api.get('/collaboration/suggestions').catch(() => ({ data: { data: [] } })), // fallback if none
        api.get('/collaboration/analytics'),
      ]);

      setStatusRecord(statusRes.data.data);
      setStatusForm({
        status: statusRes.data.data?.status || 'Open for Collaboration',
        visibility: statusRes.data.data?.visibility || 'Public'
      });

      setPreferences(prefsRes.data.data);
      if (prefsRes.data.data) {
        setPrefsForm({
          researchInterests: prefsRes.data.data.researchInterests?.join(', ') || '',
          preferredCollaborationType: prefsRes.data.data.preferredCollaborationType || [],
          collaborationMode: prefsRes.data.data.collaborationMode || 'Remote',
          availability: prefsRes.data.data.availability || 'Flexible',
          preferredCountries: prefsRes.data.data.preferredCountries?.join(', ') || '',
          preferredInstitutions: prefsRes.data.data.preferredInstitutions?.join(', ') || '',
          preferredLanguages: prefsRes.data.data.preferredLanguages?.join(', ') || '',
          preferredTimeZone: prefsRes.data.data.preferredTimeZone || '',
          preferredCommunication: prefsRes.data.data.preferredCommunication || 'Platform Chat',
          maxActiveCollaborations: prefsRes.data.data.maxActiveCollaborations || 5,
          experienceLevel: prefsRes.data.data.experienceLevel || 'Research Scholar',
          fundingAvailable: prefsRes.data.data.fundingAvailable || false,
          travelAvailable: prefsRes.data.data.travelAvailable || false,
          expectedStartDate: prefsRes.data.data.expectedStartDate ? new Date(prefsRes.data.data.expectedStartDate).toISOString().split('T')[0] : '',
          expectedEndDate: prefsRes.data.data.expectedEndDate ? new Date(prefsRes.data.data.expectedEndDate).toISOString().split('T')[0] : '',
        });
      }

      setRequests(requestsRes.data.data);
      setActiveProjects(projectsRes.data.data);
      setSuggestions(suggestionsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      setError('Failed to fetch collaboration dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = () => fetchData();
    const handleRequestAccepted = () => fetchData();
    const handleMsgReceived = (data) => {
      if (selectedProject && selectedProject._id === data.projectId) {
        setSelectedProject((prev) => ({
          ...prev,
          messages: [...prev.messages, data.message],
        }));
      }
    };
    const handleFileUploaded = (data) => {
      if (selectedProject && selectedProject._id === data.projectId) {
        setSelectedProject((prev) => ({
          ...prev,
          files: [...prev.files, data.file],
        }));
      }
    };

    socket.on('NEW_COLLABORATION_REQUEST', handleNewRequest);
    socket.on('COLLABORATION_REQUEST_ACCEPTED', handleRequestAccepted);
    socket.on('COLLABORATION_MESSAGE_RECEIVED', handleMsgReceived);
    socket.on('COLLABORATION_FILE_UPLOADED', handleFileUploaded);

    return () => {
      socket.off('NEW_COLLABORATION_REQUEST', handleNewRequest);
      socket.off('COLLABORATION_REQUEST_ACCEPTED', handleRequestAccepted);
      socket.off('COLLABORATION_MESSAGE_RECEIVED', handleMsgReceived);
      socket.off('COLLABORATION_FILE_UPLOADED', handleFileUploaded);
    };
  }, [socket, selectedProject]);

  // Toast Helper
  const triggerToast = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  // Status update
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('/collaboration/status', statusForm);
      setStatusRecord(res.data.data);
      triggerToast('Collaboration status updated successfully!');
    } catch (err) {
      triggerToast('Failed to update status', 'error');
    }
  };

  // Preferences update
  const handlePrefsSubmit = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...prefsForm,
        researchInterests: prefsForm.researchInterests.split(',').map(s => s.trim()).filter(Boolean),
        preferredCountries: prefsForm.preferredCountries.split(',').map(s => s.trim()).filter(Boolean),
        preferredInstitutions: prefsForm.preferredInstitutions.split(',').map(s => s.trim()).filter(Boolean),
        preferredLanguages: prefsForm.preferredLanguages.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await api.put('/collaboration/preferences', formatted);
      setPreferences(res.data.data);
      triggerToast('Collaboration preferences saved successfully!');
    } catch (err) {
      triggerToast('Failed to save preferences', 'error');
    }
  };

  // Request actions
  const handleAcceptRequest = async (id) => {
    try {
      await api.patch(`/collaboration/requests/${id}/accept`);
      triggerToast('Collaboration request accepted!');
      fetchData();
    } catch (err) {
      triggerToast('Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await api.patch(`/collaboration/requests/${id}/reject`);
      triggerToast('Collaboration request declined');
      fetchData();
    } catch (err) {
      triggerToast('Failed to decline request', 'error');
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await api.patch(`/collaboration/requests/${id}/cancel`);
      triggerToast('Collaboration request withdrawn');
      fetchData();
    } catch (err) {
      triggerToast('Failed to withdraw request', 'error');
    }
  };

  // Send new collaboration request
  const handleSendCollabRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...collabForm,
        receiverId: collabModal.receiver._id,
        requiredSkills: collabForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/collaboration/requests', payload);
      triggerToast(`Collaboration invitation sent to ${collabModal.receiver.fullName}!`);
      setCollabModal({ open: false, receiver: null });
      setCollabForm({
        projectTitle: '', researchArea: '', purpose: '', expectedContribution: '',
        requiredSkills: '', timeline: '', fundingAvailable: false, message: '', priority: 'Medium'
      });
      fetchData();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to send collaboration request', 'error');
    }
  };

  // Active workspace actions
  const fetchProjectDetails = async (id) => {
    try {
      const res = await api.get(`/collaboration/projects/${id}`);
      setSelectedProject(res.data.data);
    } catch (err) {
      triggerToast('Failed to fetch project details', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    try {
      const res = await api.post(`/collaboration/projects/${selectedProject._id}/messages`, { text: messageInput });
      setSelectedProject((prev) => ({
        ...prev,
        messages: [...prev.messages, { ...res.data.data, sender: { _id: user._id, fullName: user.fullName } }],
      }));
      setMessageInput('');
    } catch (err) {
      triggerToast('Failed to send message', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/collaboration/projects/${selectedProject._id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedProject((prev) => ({
        ...prev,
        files: [...prev.files, { ...res.data.data, uploadedBy: { _id: user._id, fullName: user.fullName } }],
      }));
      triggerToast('File uploaded successfully!');
    } catch (err) {
      triggerToast('File upload failed', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/collaboration/projects/${selectedProject._id}/meetings`, meetingForm);
      setSelectedProject((prev) => ({
        ...prev,
        meetings: [...prev.meetings, res.data.data],
      }));
      setMeetingForm({ title: '', date: '', link: '', description: '' });
      setShowMeetingForm(false);
      triggerToast('Meeting scheduled successfully!');
    } catch (err) {
      triggerToast('Failed to schedule meeting', 'error');
    }
  };

  const handleUpdateProgress = async (val) => {
    try {
      const res = await api.patch(`/collaboration/projects/${selectedProject._id}/progress`, { progress: val });
      setSelectedProject((prev) => ({ ...prev, progress: res.data.data.progress }));
      triggerToast(`Project progress updated to ${val}%`);
    } catch (err) {
      triggerToast('Failed to update progress', 'error');
    }
  };

  const handleCompleteProject = async () => {
    try {
      const res = await api.patch(`/collaboration/projects/${selectedProject._id}/progress`, { status: 'Completed' });
      setSelectedProject((prev) => ({ ...prev, status: 'Completed', progress: 100 }));
      triggerToast('Project marked as completed!');
    } catch (err) {
      triggerToast('Failed to complete project', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading collaboration center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-800">
      {/* Toast banners */}
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
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
            Collaboration Hub
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4">
            Connect and Build Global Research Partnerships
          </h1>
          <p className="text-slate-300 mt-2 text-base md:text-lg">
            Indicate your availability, share preferences, send joint proposals, and work together in secure workspaces.
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 flex flex-col space-y-2">
          <button
            onClick={() => { setActiveTab('status'); setSelectedProject(null); }}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'status'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span>Status & Preferences</span>
          </button>

          <button
            onClick={() => { setActiveTab('requests'); setSelectedProject(null); }}
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <UserPlus className="h-5 w-5" />
              <span>Requests</span>
            </div>
            {(requests.incoming?.filter(r => r.status === 'Pending').length > 0) && (
              <span className="bg-rose-500 text-white text-xs px-2.5 py-0.5 rounded-full">
                {requests.incoming.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('projects'); setSelectedProject(null); }}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <Target className="h-5 w-5" />
            <span>Active Workspaces</span>
          </button>

          <button
            onClick={() => { setActiveTab('suggestions'); setSelectedProject(null); }}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'suggestions'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <Award className="h-5 w-5" />
            <span>AI Matches</span>
          </button>

          <button
            onClick={() => { setActiveTab('analytics'); setSelectedProject(null); }}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
            }`}
          >
            <BarChart2 className="h-5 w-5" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          
          {/* TAB: STATUS & PREFERENCES */}
          {activeTab === 'status' && (
            <div className="space-y-8">
              {/* Status Update Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center text-slate-950">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  My Collaboration Status
                </h2>
                <form onSubmit={handleStatusSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Availability Status</label>
                      <select
                        value={statusForm.status}
                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.icon} {opt.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Visibility Setting</label>
                      <select
                        value={statusForm.visibility}
                        onChange={(e) => setStatusForm({ ...statusForm, visibility: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      >
                        <option value="Public">Public (All Users)</option>
                        <option value="Connections Only">Connections Only</option>
                        <option value="Registered Users">Registered Users Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
                      Update Status
                    </button>
                  </div>
                </form>

                {/* History list */}
                {statusRecord?.history?.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Status History</h4>
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {statusRecord.history.slice(-3).reverse().map((hist, idx) => {
                          const opt = getStatusOption(hist.status);
                          return (
                            <li key={idx}>
                              <div className="relative pb-8">
                                {idx !== 2 && (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                                )}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className={`h-8 w-8 rounded-full ${opt.bg} flex items-center justify-center ring-8 ring-white text-xs`}>
                                      {opt.icon}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-slate-600">
                                        Status changed to <span className="font-semibold text-slate-800">{hist.status}</span>
                                      </p>
                                    </div>
                                    <div className="text-right text-xs whitespace-nowrap text-slate-400">
                                      {new Date(hist.changedAt).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Preferences Form */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center text-slate-950">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Collaboration Preferences
                </h2>
                <form onSubmit={handlePrefsSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Research Interests (Comma Separated)</label>
                      <input
                        type="text"
                        value={prefsForm.researchInterests}
                        onChange={(e) => setPrefsForm({ ...prefsForm, researchInterests: e.target.value })}
                        placeholder="e.g. Artificial Intelligence, NLP, Bioinformatics"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Collaboration Mode</label>
                      <select
                        value={prefsForm.collaborationMode}
                        onChange={(e) => setPrefsForm({ ...prefsForm, collaborationMode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Availability Time commitment</label>
                      <select
                        value={prefsForm.availability}
                        onChange={(e) => setPrefsForm({ ...prefsForm, availability: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Weekends">Weekends</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Experience Level</label>
                      <select
                        value={prefsForm.experienceLevel}
                        onChange={(e) => setPrefsForm({ ...prefsForm, experienceLevel: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      >
                        <option value="Student">Student</option>
                        <option value="Research Scholar">Research Scholar</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Industry Researcher">Industry Researcher</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Preferred Time Zone</label>
                      <input
                        type="text"
                        value={prefsForm.preferredTimeZone}
                        onChange={(e) => setPrefsForm({ ...prefsForm, preferredTimeZone: e.target.value })}
                        placeholder="e.g. UTC+5:30, EST"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Communication Preference</label>
                      <select
                        value={prefsForm.preferredCommunication}
                        onChange={(e) => setPrefsForm({ ...prefsForm, preferredCommunication: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      >
                        <option value="Email">Email</option>
                        <option value="Platform Chat">Platform Chat</option>
                        <option value="Video Meeting">Video Meeting</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Preferred Countries (Comma Separated)</label>
                      <input
                        type="text"
                        value={prefsForm.preferredCountries}
                        onChange={(e) => setPrefsForm({ ...prefsForm, preferredCountries: e.target.value })}
                        placeholder="e.g. USA, UK, Germany"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Preferred Institutions (Comma Separated)</label>
                      <input
                        type="text"
                        value={prefsForm.preferredInstitutions}
                        onChange={(e) => setPrefsForm({ ...prefsForm, preferredInstitutions: e.target.value })}
                        placeholder="e.g. MIT, Stanford University"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Expected Timeline (Start & End Date)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={prefsForm.expectedStartDate}
                          onChange={(e) => setPrefsForm({ ...prefsForm, expectedStartDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700"
                        />
                        <input
                          type="date"
                          value={prefsForm.expectedEndDate}
                          onChange={(e) => setPrefsForm({ ...prefsForm, expectedEndDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4 pt-6">
                      <label className="flex items-center space-x-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={prefsForm.fundingAvailable}
                          onChange={(e) => setPrefsForm({ ...prefsForm, fundingAvailable: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-200 rounded"
                        />
                        <span className="text-sm font-semibold text-slate-600">Funding Available for Projects</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={prefsForm.travelAvailable}
                          onChange={(e) => setPrefsForm({ ...prefsForm, travelAvailable: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-200 rounded"
                        />
                        <span className="text-sm font-semibold text-slate-600">Travel Available for Field Work / Conferences</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Preferred Collaboration Types</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {colTypes.map(type => {
                        const isChecked = prefsForm.preferredCollaborationType.includes(type);
                        return (
                          <label key={type} className={`flex items-center space-x-2 p-2.5 border rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                            isChecked ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const newTypes = isChecked 
                                  ? prefsForm.preferredCollaborationType.filter(t => t !== type)
                                  : [...prefsForm.preferredCollaborationType, type];
                                setPrefsForm({ ...prefsForm, preferredCollaborationType: newTypes });
                              }}
                              className="hidden"
                            />
                            <span>{type}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-colors">
                      Save Preferences
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: COLLABORATION REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-8">
              {/* Incoming Requests */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center text-slate-950">
                  <UserPlus className="h-5 w-5 mr-2 text-emerald-600" />
                  Incoming Collaboration Requests
                </h2>
                {requests.incoming?.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-semibold">No incoming collaboration requests</p>
                    <p className="text-slate-400 text-sm">When other researchers invite you to collaborate, they will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.incoming.map((req) => (
                      <div key={req._id} className="border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 transition-all bg-slate-50/30">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                                {req.priority} Priority
                              </span>
                              <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{req.projectTitle}</h3>
                            <p className="text-sm font-semibold text-slate-500 mb-3">Research Area: <span className="text-slate-700">{req.researchArea}</span></p>
                            
                            <div className="bg-white border border-slate-200/60 rounded-xl p-4 mb-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Purpose / Abstract</p>
                              <p className="text-sm text-slate-600 line-clamp-3">{req.purpose}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {req.requiredSkills.map(skill => (
                                <span key={skill} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-slate-200/40">
                                  {skill}
                                </span>
                              ))}
                            </div>

                            <p className="text-sm text-slate-500">
                              From: <span className="font-semibold text-slate-800">{req.sender?.fullName}</span> ({req.sender?.email})
                            </p>
                          </div>

                          <div className="flex flex-row md:flex-col gap-2 shrink-0 md:items-end">
                            {req.status === 'Pending' ? (
                              <>
                                <button
                                  onClick={() => handleAcceptRequest(req._id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center justify-center w-full"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1.5" /> Accept
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req._id)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm px-4 py-2 rounded-xl transition-colors flex items-center justify-center w-full"
                                >
                                  <XCircle className="h-4 w-4 mr-1.5" /> Decline
                                </button>
                              </>
                            ) : (
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                req.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                              }`}>
                                {req.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center text-slate-950">
                  <Send className="h-5 w-5 mr-2 text-blue-600" />
                  Sent Collaboration Invitations
                </h2>
                {requests.outgoing?.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Send className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-semibold">No sent invitations</p>
                    <p className="text-slate-400 text-sm">Find collaborators under "AI Matches" or via search to send invitations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.outgoing.map((req) => (
                      <div key={req._id} className="border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 transition-all bg-slate-50/30">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                                {req.priority} Priority
                              </span>
                              <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{req.projectTitle}</h3>
                            <p className="text-sm text-slate-500 mb-2">
                              To: <span className="font-semibold text-slate-800">{req.receiver?.fullName}</span> ({req.receiver?.email})
                            </p>
                            <p className="text-sm text-slate-600">{req.message}</p>
                          </div>

                          <div className="flex flex-row md:flex-col gap-2 shrink-0 md:items-end">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              req.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                              req.status === 'Withdrawn' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                              'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                              {req.status}
                            </span>
                            {req.status === 'Pending' && (
                              <button
                                onClick={() => handleCancelRequest(req._id)}
                                className="text-xs font-bold text-rose-600 hover:underline mt-2"
                              >
                                Cancel Request
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ACTIVE WORKSPACES */}
          {activeTab === 'projects' && (
            <div className="space-y-8">
              {!selectedProject ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center text-slate-950">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Active Collaboration Projects
                  </h2>
                  {activeProjects.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                      <Target className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-semibold">No active collaborations found</p>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Once a collaboration request is accepted, a private workspace is generated here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeProjects.map(proj => (
                        <div
                          key={proj._id}
                          onClick={() => fetchProjectDetails(proj._id)}
                          className="border border-slate-200/85 hover:border-blue-500 hover:shadow-md transition-all rounded-2xl p-5 bg-slate-50/30 cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                proj.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                              }`}>
                                {proj.status}
                              </span>
                              <span className="text-xs text-slate-400">Progress: {proj.progress}%</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{proj.title}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">{proj.researchArea}</p>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{proj.purpose}</p>
                          </div>
                          
                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                            <div className="flex -space-x-2 overflow-hidden">
                              {proj.members.map((m, idx) => (
                                <div key={m._id} className="inline-block h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white" title={m.fullName}>
                                  {m.fullName[0]}
                                </div>
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-blue-600 flex items-center">
                              Open Workspace <ChevronRight className="h-4 w-4 ml-0.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ACTIVE PROJECT WORKSPACE VIEW */
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[650px]">
                  
                  {/* Workspace Header */}
                  <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <button
                        onClick={() => setSelectedProject(null)}
                        className="text-xs font-bold text-slate-400 hover:text-white flex items-center mb-2"
                      >
                        &larr; Back to Workspaces
                      </button>
                      <h2 className="text-xl font-bold tracking-tight">{selectedProject.title}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedProject.researchArea}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Project Progress</p>
                        <p className="text-sm font-bold text-emerald-400">{selectedProject.progress}%</p>
                      </div>
                      {selectedProject.status !== 'Completed' ? (
                        <button
                          onClick={handleCompleteProject}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
                        >
                          Mark Completed
                        </button>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-full">
                          ✓ Project Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Workspace Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 flex-1">
                    
                    {/* Chat Area (Col-span 2) */}
                    <div className="md:col-span-2 border-r border-slate-200 flex flex-col h-[500px]">
                      <div className="bg-slate-50/50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Collaboration Chat</span>
                        <span className="text-xs text-slate-400">Messages are end-to-end securely logged</span>
                      </div>

                      {/* Message History */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                        {selectedProject.messages.map((msg, idx) => {
                          const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                          return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                              }`}>
                                {!isMe && (
                                  <p className="text-[10px] font-bold text-blue-600 mb-1">
                                    {msg.sender?.fullName}
                                  </p>
                                )}
                                <p>{msg.text}</p>
                                <span className={`text-[9px] block mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chat input */}
                      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type your message here..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow-sm transition-colors">
                          <Send className="h-5 w-5" />
                        </button>
                      </form>
                    </div>

                    {/* Shared Files & Meetings Sidebar */}
                    <div className="p-4 space-y-6 overflow-y-auto h-[500px]">
                      {/* Progress slider */}
                      {selectedProject.status !== 'Completed' && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Adjust Progress</h4>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedProject.progress}
                            onChange={(e) => handleUpdateProgress(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      )}

                      {/* Shared Files */}
                      <div>
                        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center">
                            <Paperclip className="h-4 w-4 mr-1 text-blue-600" />
                            Shared Files
                          </h4>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-bold text-blue-600 hover:underline"
                            disabled={uploadingFile}
                          >
                            {uploadingFile ? 'Uploading...' : 'Add File'}
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>

                        {selectedProject.files?.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No files shared yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {selectedProject.files.map((file, idx) => (
                              <li key={idx} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/60 p-2 rounded-xl">
                                <span className="font-semibold text-slate-700 truncate max-w-[120px]">{file.name}</span>
                                <a
                                  href={file.url.startsWith('/') ? `http://localhost:5000${file.url}` : file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-bold"
                                >
                                  Download
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Meetings */}
                      <div>
                        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-purple-600" />
                            Meetings
                          </h4>
                          <button
                            onClick={() => setShowMeetingForm(!showMeetingForm)}
                            className="text-xs font-bold text-purple-600 hover:underline"
                          >
                            {showMeetingForm ? 'Cancel' : 'Schedule'}
                          </button>
                        </div>

                        {showMeetingForm && (
                          <form onSubmit={handleScheduleMeeting} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5 mb-4">
                            <input
                              type="text"
                              value={meetingForm.title}
                              onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                              placeholder="Meeting Title"
                              required
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                            />
                            <input
                              type="datetime-local"
                              value={meetingForm.date}
                              onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                              required
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                            />
                            <input
                              type="url"
                              value={meetingForm.link}
                              onChange={(e) => setMeetingForm({ ...meetingForm, link: e.target.value })}
                              placeholder="Meeting Link (Zoom/Meet)"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                            />
                            <textarea
                              value={meetingForm.description}
                              onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                              placeholder="Short Description"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none h-12"
                            />
                            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm w-full">
                              Schedule Meeting
                            </button>
                          </form>
                        )}

                        {selectedProject.meetings?.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No meetings scheduled.</p>
                        ) : (
                          <ul className="space-y-2">
                            {selectedProject.meetings.map((meet, idx) => (
                              <li key={idx} className="bg-purple-50/50 border border-purple-200/40 p-3 rounded-xl space-y-1">
                                <h5 className="font-bold text-slate-850 text-xs">{meet.title}</h5>
                                <p className="text-[10px] text-slate-500">{new Date(meet.date).toLocaleString()}</p>
                                {meet.link && (
                                  <a href={meet.link} target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] text-purple-600 font-bold hover:underline">
                                    Join Meeting &rarr;
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: SUGGESTED COLLABORATORS */}
          {activeTab === 'suggestions' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-1 flex items-center text-slate-950">
                  <Award className="h-5 w-5 mr-2 text-indigo-600" />
                  AI Suggested Collaborators
                </h2>
                <p className="text-sm text-slate-400 mb-6">Our algorithms recommend these researchers based on shared publications, keywords, and co-authorship networks.</p>
                
                {suggestions.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Award className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-semibold">No recommendations available</p>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Make sure you have added keywords to your profile and uploaded your publications so we can find matches.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((sug) => (
                      <div key={sug.user._id} className="border border-slate-200/85 rounded-2xl p-5 hover:border-slate-300 transition-all bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start space-x-4">
                          <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-extrabold shadow-inner shrink-0">
                            {sug.profile.profilePhoto ? (
                              <img src={sug.profile.profilePhoto} alt={sug.user.fullName} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              sug.user.fullName[0]
                            )}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-bold text-slate-900">{sug.user.fullName}</h3>
                              <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {sug.similarityScore}% Match
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mb-2">
                              {sug.profile.designation} at <span className="font-semibold">{sug.profile.institution}</span>, {sug.profile.country}
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2 mb-3 max-w-xl">{sug.profile.bio}</p>

                            <div className="flex flex-wrap gap-1.5">
                              {sug.commonKeywords?.slice(0, 4).map(kw => (
                                <span key={kw} className="bg-indigo-50/50 text-indigo-600 text-[10px] font-medium px-2 py-0.5 rounded border border-indigo-200/30">
                                  {kw.keyword || kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex md:flex-col gap-2 shrink-0 md:items-end w-full md:w-auto">
                          <button
                            onClick={() => setCollabModal({ open: true, receiver: sug.user })}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors flex-1 md:w-full"
                          >
                            Collaborate
                          </button>
                          <a
                            href={`/profile?id=${sug.user._id}`}
                            className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs px-4 py-2.5 rounded-xl text-center transition-all flex-1 md:w-full"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-8 animate-fade-in">
              {/* Analytics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Requests</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.totalRequests}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Accepted Requests</p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1">{analytics.acceptedRequests}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Active Projects</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-1">{analytics.activeProjects}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Completed Projects</p>
                  <p className="text-3xl font-extrabold text-purple-600 mt-1">{analytics.completedProjects}</p>
                </div>
              </div>

              {/* Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Domains */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                    <Target className="h-4 w-4 mr-1.5 text-blue-600" />
                    Top Domains
                  </h3>
                  {analytics.topCollaborationDomains?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No domain statistics available.</p>
                  ) : (
                    <ul className="space-y-3">
                      {analytics.topCollaborationDomains.map((d, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-750">{d.name}</span>
                          <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{d.count} partners</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Countries */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                    <Globe className="h-4 w-4 mr-1.5 text-emerald-600" />
                    Countries
                  </h3>
                  {analytics.countriesCollaboratedWith?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No country statistics available.</p>
                  ) : (
                    <ul className="space-y-3">
                      {analytics.countriesCollaboratedWith.map((c, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-750">{c.name}</span>
                          <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">{c.count} partners</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Institutions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                    <Bookmark className="h-4 w-4 mr-1.5 text-purple-600" />
                    Institutions
                  </h3>
                  {analytics.institutionsCollaboratedWith?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No institution statistics available.</p>
                  ) : (
                    <ul className="space-y-3">
                      {analytics.institutionsCollaboratedWith.map((i, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-755 truncate max-w-[150px]">{i.name}</span>
                          <span className="bg-purple-50 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">{i.count} partners</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL: SEND COLLABORATION INVITATION */}
      {collabModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                Invite <span className="text-blue-600">{collabModal.receiver?.fullName}</span> to Collaborate
              </h3>
              <button
                onClick={() => setCollabModal({ open: false, receiver: null })}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendCollabRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={collabForm.projectTitle}
                  onChange={(e) => setCollabForm({ ...collabForm, projectTitle: e.target.value })}
                  placeholder="e.g. Cross-disciplinary Analysis of Genomes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Research Area</label>
                  <input
                    type="text"
                    required
                    value={collabForm.researchArea}
                    onChange={(e) => setCollabForm({ ...collabForm, researchArea: e.target.value })}
                    placeholder="e.g. Healthcare AI"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Timeline</label>
                  <input
                    type="text"
                    required
                    value={collabForm.timeline}
                    onChange={(e) => setCollabForm({ ...collabForm, timeline: e.target.value })}
                    placeholder="e.g. 6 Months"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose / Goal</label>
                <textarea
                  required
                  value={collabForm.purpose}
                  onChange={(e) => setCollabForm({ ...collabForm, purpose: e.target.value })}
                  placeholder="Describe the main objectives of this collaboration..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expected Contribution</label>
                <textarea
                  required
                  value={collabForm.expectedContribution}
                  onChange={(e) => setCollabForm({ ...collabForm, expectedContribution: e.target.value })}
                  placeholder="What specific tasks/roles do you expect them to play?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Skills (Comma Separated)</label>
                  <input
                    type="text"
                    value={collabForm.requiredSkills}
                    onChange={(e) => setCollabForm({ ...collabForm, requiredSkills: e.target.value })}
                    placeholder="Python, RNA-Seq"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                  <select
                    value={collabForm.priority}
                    onChange={(e) => setCollabForm({ ...collabForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none text-slate-700"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cover Message</label>
                <textarea
                  required
                  value={collabForm.message}
                  onChange={(e) => setCollabForm({ ...collabForm, message: e.target.value })}
                  placeholder="Write a short introductory message..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none h-16"
                />
              </div>

              <div className="flex items-center space-x-3 py-2">
                <input
                  type="checkbox"
                  id="fundingCheck"
                  checked={collabForm.fundingAvailable}
                  onChange={(e) => setCollabForm({ ...collabForm, fundingAvailable: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-200 rounded"
                />
                <label htmlFor="fundingCheck" className="text-xs font-semibold text-slate-600">
                  Funding is available for this project
                </label>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setCollabModal({ open: false, receiver: null })}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors"
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

export default CollaborationDashboard;
