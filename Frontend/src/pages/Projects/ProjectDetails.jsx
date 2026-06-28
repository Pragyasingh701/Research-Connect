import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FolderGit2, 
  Users2, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  Activity, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Clock, 
  Plus, 
  FileUp, 
  Trash2, 
  CheckSquare, 
  Eye, 
  MessageSquare, 
  Send, 
  ChevronRight, 
  ExternalLink,
  Shield,
  Upload,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // Data State
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [publications, setPublications] = useState([]);
  const [funding, setFunding] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [membership, setMembership] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Interactive Form Dialog Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'Medium', assignee: '', deadline: '', labels: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [checklistText, setChecklistText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [taskComments, setTaskComments] = useState([]);

  // Invite member
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('External Collaborator');
  const [invitePermission, setInvitePermission] = useState('Viewer');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Add Publication
  const [pubForm, setPubForm] = useState({ title: '', status: 'Draft Papers', authors: '', doi: '', url: '' });

  // Update Funding
  const [fundingForm, setFundingForm] = useState({ agency: '', grantNumber: '', budget: '', amountReceived: '', sponsor: '', proposalStatus: 'Applied' });

  // Files state
  const [currentFolder, setCurrentFolder] = useState('/');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Settings
  const [settingsForm, setSettingsForm] = useState({ title: '', description: '', visibility: 'Public', status: 'Draft' });

  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Project activity log
  const [activityLogs, setActivityLogs] = useState([]);

  const fetchProjectData = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      const { project, members, tasks, files, publications, funding, analytics, membership } = response.data.data;
      setProject(project);
      setMembers(members);
      setTasks(tasks);
      setFiles(files);
      setPublications(publications);
      setFunding(funding);
      setAnalytics(analytics);
      setMembership(membership);
      
      setSettingsForm({
        title: project.title,
        description: project.description,
        visibility: project.visibility,
        status: project.status,
      });

      if (funding) {
        setFundingForm({
          agency: funding.agency,
          grantNumber: funding.grantNumber || '',
          budget: funding.budget,
          amountReceived: funding.amountReceived || 0,
          sponsor: funding.sponsor || '',
          proposalStatus: funding.proposalStatus,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSuggestions = async () => {
    setLoadingAi(true);
    try {
      const response = await api.get(`/projects/${id}/ai-suggestions`);
      setAiSuggestions(response.data.data);
    } catch (err) {
      console.error('Failed to load AI suggestions:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const fetchProjectActivity = async () => {
    try {
      const response = await api.get(`/projects/${id}/analytics`);
      setActivityLogs(response.data.data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  useEffect(() => {
    fetchProjectData();
    fetchProjectActivity();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'overview' && !aiSuggestions) {
      fetchAiSuggestions();
    }
    if (activeTab === 'activity') {
      fetchProjectActivity();
    }
  }, [activeTab]);

  const isOwnerOrAdmin = () => {
    if (!membership) return false;
    return membership.permission === 'Owner' || membership.permission === 'Admin';
  };

  const isEditor = () => {
    if (!membership) return false;
    return membership.permission === 'Owner' || membership.permission === 'Admin' || membership.permission === 'Editor';
  };

  /* ==========================================================================
     FOLLOW AND JOIN HANDLERS
     ========================================================================== */
  const handleFollowToggle = async () => {
    try {
      const isFollowing = project.followers?.includes(currentUser.id || currentUser._id);
      const url = `/projects/${id}/${isFollowing ? 'unfollow' : 'follow'}`;
      const response = await api.post(url);
      setProject({
        ...project,
        followers: response.data.data.followers,
        followersCount: response.data.data.followersCount,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinProject = async () => {
    try {
      await api.post(`/projects/${id}/join`, { role: 'External Collaborator' });
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request collaboration.');
    }
  };

  /* ==========================================================================
     TEAM HANDLERS
     ========================================================================== */
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    try {
      await api.post(`/projects/${id}/members/invite`, {
        email: inviteEmail,
        role: inviteRole,
        permission: invitePermission,
      });
      setInviteEmail('');
      setInviteSuccess('Invitation successfully sent to researcher!');
      fetchProjectData();
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Invitation failed');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  /* ==========================================================================
     KANBAN BOARD HANDLERS (DRAG & DROP)
     ========================================================================== */
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    
    try {
      // Update status on UI immediately
      setTasks(prevTasks => prevTasks.map(t => t._id === taskId ? { ...t, status: targetStatus } : t));
      
      await api.patch(`/projects/${id}/tasks/${taskId}/status`, { status: targetStatus });
      fetchProjectData();
    } catch (err) {
      console.error('Failed to change task status:', err);
      fetchProjectData();
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/tasks`, taskForm);
      setTaskForm({ title: '', description: '', priority: 'Medium', assignee: '', deadline: '', labels: '' });
      setShowTaskModal(false);
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Task creation failed');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      fetchProjectData();
      if (selectedTask?._id === taskId) setSelectedTask(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Task deletion failed');
    }
  };

  // Checklist & comments inside task details
  const loadTaskComments = async (taskId) => {
    try {
      const res = await api.get(`/projects/${id}/comments`, { params: { taskId } });
      setTaskComments(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    loadTaskComments(task._id);
  };

  const handleAddChecklist = async () => {
    if (!checklistText.trim()) return;
    const updatedChecklist = [...(selectedTask.checklist || []), { text: checklistText, isCompleted: false }];
    
    try {
      const res = await api.put(`/projects/${id}/tasks/${selectedTask._id}`, { checklist: updatedChecklist });
      setSelectedTask(res.data.data);
      setChecklistText('');
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleChecklist = async (idx) => {
    const updatedChecklist = [...selectedTask.checklist];
    updatedChecklist[idx].isCompleted = !updatedChecklist[idx].isCompleted;
    
    try {
      const res = await api.put(`/projects/${id}/tasks/${selectedTask._id}`, { checklist: updatedChecklist });
      setSelectedTask(res.data.data);
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/projects/${id}/comments`, {
        content: commentText,
        taskId: selectedTask._id,
      });
      setTaskComments([...taskComments, res.data.data]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  /* ==========================================================================
     FILES UPLOAD HANDLERS
     ========================================================================== */
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setUploadProgress(true);
    
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', currentFolder);

    try {
      await api.post(`/projects/${id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFileToUpload(null);
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await api.delete(`/projects/${id}/files/${fileId}`);
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  /* ==========================================================================
     PUBLICATIONS HANDLERS
     ========================================================================== */
  const handleLinkPublication = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/publications`, pubForm);
      setPubForm({ title: '', status: 'Draft Papers', authors: '', doi: '', url: '' });
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Link failed');
    }
  };

  const handleUnlinkPublication = async (pubId) => {
    if (!window.confirm('Unlink this publication?')) return;
    try {
      await api.delete(`/projects/${id}/publications/${pubId}`);
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  /* ==========================================================================
     FUNDING HANDLERS
     ========================================================================== */
  const handleFundingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${id}/funding`, fundingForm);
      fetchProjectData();
      alert('Funding and grants tracker updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Funding update failed');
    }
  };

  /* ==========================================================================
     SETTINGS & ARCHIVE HANDLERS
     ========================================================================== */
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${id}`, settingsForm);
      fetchProjectData();
      alert('Project settings saved!');
    } catch (err) {
      alert(err.response?.data?.message || 'Settings update failed');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('⚠️ WARNING: Deleting this project will erase ALL associated tasks, files, funding, and membership data permanently. Proceed?')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Project deletion failed');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-semibold tracking-wide">Initializing Research Connect Workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-6 rounded-2xl max-w-lg mx-auto mt-20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold">Workspace Access Denied</h3>
        <p className="mt-1">{error}</p>
        <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer">
          Back to Projects Dashboard
        </button>
      </div>
    );
  }

  const isUserFollowing = project?.followers?.includes(currentUser.id || currentUser._id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Hero Workspace Header */}
      <div className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {/* Banner representation */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
        
        {/* Detail Hero Section */}
        <div className="px-6 py-6 sm:px-8 relative flex flex-col md:flex-row items-start justify-between gap-6 -mt-10">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-20 h-20 bg-white border-4 border-white shadow-md rounded-2xl flex items-center justify-center shrink-0 text-3xl font-extrabold text-blue-600">
              {project.title.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="text-left mt-10 sm:mt-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
                  {project.title}
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md uppercase tracking-wider">
                  {project.status}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-md uppercase tracking-wider">
                  {project.visibility}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Domain: <span className="text-slate-800">{project.researchDomain}</span> {project.researchArea && `• ${project.researchArea}`}
              </p>
              
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.keywords?.map((kw, idx) => (
                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {membership ? (
              <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Team: {membership.role}
              </span>
            ) : (
              <button 
                onClick={handleJoinProject}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Join Project
              </button>
            )}

            <button 
              onClick={handleFollowToggle}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                isUserFollowing 
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' 
                  : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {isUserFollowing ? 'Following' : 'Follow Project'}
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="px-6 sm:px-8 pb-5 flex items-center gap-4 border-t border-slate-100 pt-4">
          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${analytics?.progress || 0}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 shrink-0">{analytics?.progress || 0}% Complete</span>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-20 py-2 border-b border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: FolderGit2 },
          { id: 'team', label: 'Team', icon: Users2 },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'timeline', label: 'Timeline', icon: Calendar },
          { id: 'files', label: 'Files', icon: FolderOpen },
          { id: 'publications', label: 'Publications', icon: BookOpen },
          { id: 'funding', label: 'Funding', icon: DollarSign },
          { id: 'activity', label: 'Activity', icon: Clock },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents Container */}
      <div className="min-h-[400px]">
        
        {/* ==================== TAB: OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6 text-left">
              {/* Description */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 font-display">About Research</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </div>

              {/* Objectives */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 font-display">Project Objectives</h3>
                <div className="space-y-3">
                  {project.objectives?.map((obj, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-slate-700 text-sm">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Outcomes */}
              {project.expectedOutcomes && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 font-display">Expected Outcomes</h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{project.expectedOutcomes}</p>
                </div>
              )}
            </div>

            {/* AI Assistant recommendations column */}
            <div className="space-y-6 text-left">
              <div className="bg-gradient-to-br from-[#EDE9FE] to-white border border-purple-200/60 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-purple-100 pb-3">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900 font-display">AI Research Assistant</h3>
                </div>

                {loadingAi ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <span className="text-[10px] text-purple-600 font-bold">AI Computing Analysis...</span>
                  </div>
                ) : aiSuggestions ? (
                  <div className="space-y-5 mt-4">
                    {/* Suggested Collaborators */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Suggested Collaborators</span>
                      <div className="space-y-2">
                        {aiSuggestions.suggestedCollaborators?.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 bg-purple-50/50 rounded-xl border border-purple-100/50">
                            <div>
                              <span className="font-bold text-slate-800">{c.profile?.user?.fullName || c.name}</span>
                              <span className="text-[10px] text-slate-400 block">{c.reason}</span>
                            </div>
                            <span className="font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-md text-[10px]">
                              {c.matchScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Recommended Keywords</span>
                      <div className="flex flex-wrap gap-1">
                        {aiSuggestions.missingKeywords?.map((kw, idx) => (
                          <span key={idx} className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg">
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Risk Log */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Risk Evaluation</span>
                      {aiSuggestions.risks?.map((risk, idx) => (
                        <div key={idx} className="text-xs p-3 bg-red-50/50 text-red-800 rounded-xl border border-red-100 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold block">{risk.factor} ({risk.level})</span>
                            <span className="text-[10px] text-red-700 mt-0.5 block leading-relaxed">{risk.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Journals & Conferences */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Suggested Publication Venues</span>
                      <div className="space-y-1 text-xs">
                        {aiSuggestions.journals?.slice(0, 2).map((j, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                            <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
                            <span className="truncate">{j} (Journal)</span>
                          </div>
                        ))}
                        {aiSuggestions.conferences?.slice(0, 2).map((c, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                            <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
                            <span className="truncate">{c} (Conf)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={fetchAiSuggestions} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold w-full cursor-pointer">
                    Generate AI Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: TEAM ==================== */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 text-left">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 font-display">Active Team</h3>
              <div className="space-y-3">
                {members.map((m) => (
                  <div key={m._id} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.user?.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                        alt={m.user?.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      />
                      <div className="text-left">
                        <span className="text-sm font-bold text-slate-900">{m.user?.fullName}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">{m.role} • {m.permission}</span>
                        {m.status === 'Pending' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md mt-1 block w-fit">
                            PENDING ACCEPTANCE
                          </span>
                        )}
                      </div>
                    </div>
                    {isOwnerOrAdmin() && m.permission !== 'Owner' && (
                      <button 
                        onClick={() => handleRemoveMember(m.user._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite members panel */}
            <div className="text-left space-y-4">
              {isOwnerOrAdmin() ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 font-display">Invite Researchers</h3>
                  
                  {inviteSuccess && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-lg">{inviteSuccess}</div>}
                  {inviteError && <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg">{inviteError}</div>}

                  <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">User Email</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="researcher@university.edu"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Co-Principal Investigator">Co-Principal Investigator</option>
                        <option value="Research Supervisor">Research Supervisor</option>
                        <option value="Research Associate">Research Associate</option>
                        <option value="Research Scholar">Research Scholar</option>
                        <option value="Student">Student</option>
                        <option value="Developer">Developer</option>
                        <option value="Data Analyst">Data Analyst</option>
                        <option value="Reviewer">Reviewer</option>
                        <option value="External Collaborator">External Collaborator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Permissions Mapping</label>
                      <select
                        value={invitePermission}
                        onChange={(e) => setInvitePermission(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Admin">Admin (Can edit settings & invite)</option>
                        <option value="Editor">Editor (Can edit tasks & files)</option>
                        <option value="Viewer">Viewer (Can comment & view only)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Send Invitation
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-slate-400 text-xs">
                  Only project owners and admins can invite new team members.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: TASKS (KANBAN) ==================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-display text-left">Kanban Board</h3>
              {isEditor() && (
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              )}
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Todo', 'In Progress', 'Review', 'Completed'].map((colStatus) => {
                const columnTasks = tasks.filter((t) => t.status === colStatus);
                return (
                  <div
                    key={colStatus}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, colStatus)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[300px] flex flex-col gap-3 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{colStatus}</span>
                      <span className="text-[10px] font-extrabold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[500px] no-scrollbar">
                      {columnTasks.map((t) => (
                        <div
                          key={t._id}
                          draggable={isEditor()}
                          onDragStart={(e) => handleDragStart(e, t._id)}
                          onClick={() => openTaskDetail(t)}
                          className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 shadow-sm transition-all hover:shadow cursor-pointer space-y-2 text-left"
                        >
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            t.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                            t.priority === 'High' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            t.priority === 'Medium' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {t.priority}
                          </span>
                          
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{t.title}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>
                          
                          {t.deadline && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(t.deadline).toLocaleDateString()}</span>
                            </div>
                          )}

                          {t.assignee && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
                              <img
                                src={t.assignee.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                                alt={t.assignee.fullName}
                                className="w-5 h-5 rounded-full object-cover border border-slate-100"
                              />
                              <span className="text-[9px] font-bold text-slate-500 truncate">{t.assignee.fullName}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Task Creation Modal */}
            {showTaskModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  <h3 className="text-base font-bold text-slate-900 font-display mb-4 text-left">Add Project Task</h3>
                  <form onSubmit={handleCreateTask} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Title *</label>
                      <input
                        type="text"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Description</label>
                      <textarea
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        rows="3"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                        <select
                          value={taskForm.priority}
                          onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assignee</label>
                        <select
                          value={taskForm.assignee}
                          onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">Unassigned</option>
                          {members.filter(m => m.status === 'Active').map(m => (
                            <option key={m.user._id} value={m.user._id}>{m.user.fullName}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deadline</label>
                      <input
                        type="date"
                        value={taskForm.deadline}
                        onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowTaskModal(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                      >
                        Create Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col md:flex-row max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {/* Left task details */}
                  <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100 text-left">
                    <div className="flex items-start justify-between gap-4">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        selectedTask.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                        selectedTask.priority === 'High' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {selectedTask.priority}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Status: <span className="text-slate-800">{selectedTask.status}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-display mt-2">{selectedTask.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-wrap">{selectedTask.description || 'No description provided.'}</p>

                    {/* Checklist */}
                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Checklist</span>
                      
                      <div className="space-y-2">
                        {selectedTask.checklist?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => toggleChecklist(idx)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {isEditor() && (
                        <div className="flex gap-2 mt-3">
                          <input
                            type="text"
                            placeholder="Add sub-task..."
                            value={checklistText}
                            onChange={(e) => setChecklistText(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          <button
                            onClick={handleAddChecklist}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right task discussion comments */}
                  <div className="w-full md:w-80 bg-slate-50 p-6 overflow-y-auto flex flex-col justify-between max-h-[85vh]">
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-2">Comments</span>
                      
                      <div className="space-y-3">
                        {taskComments.length === 0 ? (
                          <span className="text-[10px] text-slate-400 block text-center py-6">No discussion comments yet.</span>
                        ) : (
                          taskComments.map((c) => (
                            <div key={c._id} className="text-xs bg-white border border-slate-200/50 p-2.5 rounded-xl">
                              <span className="font-bold text-slate-800">{c.author?.fullName}</span>
                              <p className="text-slate-500 mt-1">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-1.5 shrink-0 mt-auto">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="submit"
                        className="p-2 bg-blue-600 text-white rounded-lg cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    <button
                      onClick={() => { setSelectedTask(null); setTaskComments([]); }}
                      className="mt-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold w-full cursor-pointer shrink-0"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: TIMELINE ==================== */}
        {activeTab === 'timeline' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 font-display">Timeline & Deadlines</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Deadlines list */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Milestones & Deadlines</span>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 border-l-2 pl-3 border-blue-600">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">Project Launch & Spec Definition</span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Start Milestone</span>
                    </div>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Now'}
                    </span>
                  </div>

                  {tasks.filter(t => t.deadline).map((t) => (
                    <div key={t._id} className="flex items-center gap-3 border-l-2 pl-3 border-amber-500">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{t.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Task Deadline</span>
                      </div>
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md shrink-0">
                        {new Date(t.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  ))}

                  {project.endDate && (
                    <div className="flex items-center gap-3 border-l-2 pl-3 border-emerald-500">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Expected Project Completion</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">End Date</span>
                      </div>
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
                        {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Simple visual Gantt representation */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gantt Chart Representation</span>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-20 font-semibold text-slate-500 truncate">Project Scope</span>
                    <div className="flex-1 bg-blue-100 h-4 rounded border border-blue-200 relative flex items-center justify-center font-bold text-[9px] text-blue-700">
                      Duration
                    </div>
                  </div>

                  {tasks.filter(t => t.deadline).slice(0, 3).map((t, idx) => (
                    <div key={t._id} className="flex items-center gap-3 text-xs">
                      <span className="w-20 font-semibold text-slate-500 truncate">{t.title}</span>
                      <div className="flex-1 bg-slate-200 h-4 rounded relative overflow-hidden">
                        <div 
                          className="bg-amber-400 border-l border-r border-amber-500 h-full rounded absolute"
                          style={{
                            left: `${20 + idx * 15}%`,
                            right: `${40 - idx * 10}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: FILES ==================== */}
        {activeTab === 'files' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-900 font-display">Project Document Vault</span>
              </div>
              
              {isEditor() && (
                <form onSubmit={handleUploadFile} className="flex items-center gap-3">
                  <input
                    type="file"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                    required
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    disabled={uploadProgress}
                  >
                    <Upload className="w-3.5 h-3.5" /> {uploadProgress ? 'Uploading...' : 'Upload'}
                  </button>
                </form>
              )}
            </div>

            {/* Files List */}
            {files.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No documents uploaded in this project vault yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Folder</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Uploaded By</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {files.map((file) => (
                      <tr key={file._id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-800 truncate max-w-xs">{file.name}</td>
                        <td className="py-3 text-slate-500 font-mono">{file.folder}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-semibold text-[9px] uppercase">
                            {file.type}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="py-3 text-slate-500">{file.uploadedBy?.fullName}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>
                            {isEditor() && (
                              <button
                                onClick={() => handleDeleteFile(file._id)}
                                className="text-red-500 hover:text-red-700 font-bold"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: PUBLICATIONS ==================== */}
        {activeTab === 'publications' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 text-left">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 font-display">Linked Publications</h3>
              {publications.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center text-slate-400 text-sm shadow-sm">
                  No linked academic publications yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {publications.map((pub) => (
                    <div key={pub._id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{pub.title}</h4>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase mt-0.5">Authors: {pub.authors?.join(', ')}</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                            {pub.status}
                          </span>
                          {pub.doi && (
                            <span className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border">
                              DOI: {pub.doi}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {pub.url && (
                          <a href={pub.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-bold">
                            View
                          </a>
                        )}
                        {isEditor() && (
                          <button
                            onClick={() => handleUnlinkPublication(pub._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add publication form */}
            <div className="text-left">
              {isEditor() ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 font-display">Link Publication</h3>
                  <form onSubmit={handleLinkPublication} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Publication Title *</label>
                      <input
                        type="text"
                        value={pubForm.title}
                        onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Format Type</label>
                      <select
                        value={pubForm.status}
                        onChange={(e) => setPubForm({ ...pubForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Published Papers">Published Paper</option>
                        <option value="Draft Papers">Draft Paper</option>
                        <option value="Conference Papers">Conference Paper</option>
                        <option value="Patents">Patent</option>
                        <option value="Posters">Poster</option>
                        <option value="Presentations">Presentation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Authors (Comma separated)</label>
                      <input
                        type="text"
                        value={pubForm.authors}
                        onChange={(e) => setPubForm({ ...pubForm, authors: e.target.value })}
                        placeholder="e.g. A. Sharma, S. Jenkins"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">DOI</label>
                        <input
                          type="text"
                          value={pubForm.doi}
                          onChange={(e) => setPubForm({ ...pubForm, doi: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL</label>
                        <input
                          type="text"
                          value={pubForm.url}
                          onChange={(e) => setPubForm({ ...pubForm, url: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Link Document
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-slate-400 text-xs">
                  Only project editors can link publication documents.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: FUNDING ==================== */}
        {activeTab === 'funding' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6 text-left">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-display">Grant Tracker</h3>
              
              {funding ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grant Agency</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">{funding.agency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grant Number</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">{funding.grantNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proposal Status</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-md mt-1 inline-block">
                        {funding.proposalStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sponsor</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">{funding.sponsor || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Budget Allocation Progress Bar */}
                  <div className="border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Budget Utilization</span>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (funding.amountReceived / funding.budget) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {((funding.amountReceived / funding.budget) * 100).toFixed(0)}% Utilized
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-slate-400 font-semibold">Spent: {funding.amountReceived} {funding.currency}</span>
                      <span className="text-slate-800 font-extrabold">Total: {funding.budget} {funding.currency}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center text-slate-400 text-sm shadow-sm">
                  No grants or funding tracking loaded for this project workspace.
                </div>
              )}
            </div>

            {/* Modify funding */}
            <div className="text-left">
              {isOwnerOrAdmin() ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 font-display">Update Funding Details</h3>
                  <form onSubmit={handleFundingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Granting Agency *</label>
                      <input
                        type="text"
                        value={fundingForm.agency}
                        onChange={(e) => setFundingForm({ ...fundingForm, agency: e.target.value })}
                        placeholder="e.g. National Science Foundation"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Budget *</label>
                        <input
                          type="number"
                          value={fundingForm.budget}
                          onChange={(e) => setFundingForm({ ...fundingForm, budget: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount Received</label>
                        <input
                          type="number"
                          value={fundingForm.amountReceived}
                          onChange={(e) => setFundingForm({ ...fundingForm, amountReceived: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grant Number</label>
                        <input
                          type="text"
                          value={fundingForm.grantNumber}
                          onChange={(e) => setFundingForm({ ...fundingForm, grantNumber: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Proposal Status</label>
                        <select
                          value={fundingForm.proposalStatus}
                          onChange={(e) => setFundingForm({ ...fundingForm, proposalStatus: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sponsor</label>
                      <input
                        type="text"
                        value={fundingForm.sponsor}
                        onChange={(e) => setFundingForm({ ...fundingForm, sponsor: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Save Tracker
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-slate-400 text-xs">
                  Only project owners and admins can edit grant parameters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: ACTIVITY ==================== */}
        {activeTab === 'activity' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6 font-display">Activity Stream</h3>
            
            <div className="space-y-6 relative border-l border-slate-200 pl-6 ml-3">
              {activityLogs.map((log) => (
                <div key={log._id} className="relative">
                  {/* Dot indicator */}
                  <div className="absolute -left-9 top-1.5 w-6.5 h-6.5 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center">
                    <Activity className="w-3 h-3 text-blue-600" />
                  </div>
                  
                  <div className="text-xs leading-normal">
                    <span className="font-bold text-slate-900">{log.user?.fullName}</span>{' '}
                    <span className="text-slate-500">{log.details}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: ANALYTICS ==================== */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Task completion gauge */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-display">Task Status Distribution</h3>
              
              <div className="flex flex-col items-center py-6 justify-center">
                {/* SVG Ring Donut */}
                <svg className="w-32 h-32" viewBox="0 0 36 36">
                  <circle className="stroke-slate-100 fill-none" cx="18" cy="18" r="15.915" strokeWidth="3" />
                  <circle 
                    className="stroke-blue-600 fill-none transition-all duration-500" 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    strokeWidth="3.2" 
                    strokeDasharray={`${analytics?.progress || 0} ${100 - (analytics?.progress || 0)}`}
                    strokeDashoffset="25"
                  />
                  <text className="fill-slate-800 font-bold" x="18" y="20.5" textAnchor="middle" fontSize="6.5">
                    {analytics?.progress || 0}%
                  </text>
                </svg>
                <div className="mt-4 text-xs font-semibold text-slate-500">
                  {analytics?.completedTasks} of { (analytics?.completedTasks || 0) + (analytics?.pendingTasks || 0) } tasks finished
                </div>
              </div>
            </div>

            {/* Team Contribution stats */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-display">Team Contribution (Completed Tasks)</h3>
              
              <div className="space-y-4 py-4">
                {analytics?.teamProductivity?.map((teamProd, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{teamProd.user?.fullName}</span>
                      <span className="text-slate-500 font-semibold">{teamProd.completedTasksCount} Completed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (teamProd.completedTasksCount / (analytics.completedTasks || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!analytics?.teamProductivity || analytics.teamProductivity.length === 0) && (
                  <span className="text-xs text-slate-400 block text-center">No productivity mapping computed yet.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left max-w-xl mx-auto space-y-8">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 font-display">Update Workspace Details</h3>
              
              {isOwnerOrAdmin() ? (
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project Title</label>
                    <input
                      type="text"
                      value={settingsForm.title}
                      onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project Description</label>
                    <textarea
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      rows="4"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Visibility</label>
                      <select
                        value={settingsForm.visibility}
                        onChange={(e) => setSettingsForm({ ...settingsForm, visibility: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Public">Public</option>
                        <option value="Private">Private</option>
                        <option value="Institution Only">Institution Only</option>
                        <option value="Invite Only">Invite Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        value={settingsForm.status}
                        onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Save Settings
                  </button>
                </form>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-50 p-4 border rounded-xl">
                  Only the project owners or administrators have write access to rename or reconfigure the project settings.
                </div>
              )}
            </div>

            {/* Critical actions */}
            {membership?.permission === 'Owner' && (
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">Danger Zone</span>
                <div className="p-4 border border-red-200 bg-red-50/50 rounded-xl flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Delete Project Workspace</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Erases all comments, files, tasks, and members from database permanently.</span>
                  </div>
                  <button
                    onClick={handleDeleteProject}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectDetails;
