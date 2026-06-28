import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderGit2, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  Clock, 
  Users2, 
  ChevronRight, 
  Sparkles, 
  FileUp, 
  Bell, 
  UserPlus 
} from 'lucide-react';
import api from '../../services/api';

const ProjectsDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('all');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // AI Suggestions and Widget data (loaded or mocked)
  const [aiCollaborators, setAiCollaborators] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects', {
        params: { search, domain, status, type, sortBy }
      });
      setProjects(response.data.data || []);
      
      // Load or mock widget data
      mockWidgetsData(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const mockWidgetsData = (projectsList) => {
    // 1. AI Suggested Collaborators
    setAiCollaborators([
      { name: 'Dr. Sarah Jenkins', inst: 'MIT', match: 96, skills: 'Machine Learning, NLP', area: 'Artificial Intelligence' },
      { name: 'Prof. Li Wei', inst: 'Tsinghua University', match: 91, skills: 'IoT, Sensors', area: 'Hardware Systems' },
      { name: 'Dr. Elena Rostova', inst: 'Oxford University', match: 87, skills: 'Data Analysis, R', area: 'Bioinformatics' },
    ]);

    // 2. Project activities
    setRecentActivities([
      { user: 'You', action: 'created task', detail: 'Complete Phase 8 Integration Test', project: 'ResearchConnect AI Platform', time: '10 mins ago' },
      { user: 'Dr. Arjun Sharma', action: 'uploaded file', detail: 'Research_Proposal_v2.pdf', project: 'Quantum Computing Sim', time: '2 hours ago' },
      { user: 'Dr. Sarah Jenkins', action: 'joined project', detail: 'as Research Scholar', project: 'Smart Agriculture IoT', time: '1 day ago' },
    ]);

    // 3. Upcoming Deadlines
    setUpcomingDeadlines([
      { title: 'Task: Draft Manuscript', project: 'Quantum Sim', date: 'Jul 04, 2026', delay: false },
      { title: 'Milestone: Mid-term Review', project: 'Smart Agri IoT', date: 'Jul 10, 2026', delay: true },
      { title: 'Funding: Grant Renewal Submit', project: 'ResearchConnect AI', date: 'Jul 18, 2026', delay: false },
    ]);

    // 4. Recent files
    setRecentFiles([
      { name: 'Project_Specification.docx', size: '2.4 MB', project: 'ResearchConnect AI', type: 'DOCX' },
      { name: 'Dataset_agricultural_yield.xlsx', size: '14.8 MB', project: 'Smart Agri IoT', type: 'XLSX' },
      { name: 'QuantumSimulatorCode.zip', size: '5.1 MB', project: 'Quantum Sim', type: 'ZIP' },
    ]);
  };

  useEffect(() => {
    fetchProjects();
  }, [search, domain, status, type, sortBy]);

  // Calculations for Summary Cards
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const draftProjects = projects.filter(p => p.status === 'Draft' || p.status === 'Planning').length;
  const archivedProjects = projects.filter(p => p.status === 'Archived').length;
  
  const totalFunding = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalMembers = projects.reduce((acc, p) => acc + (p.teamCount || 1), 0);

  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Completed': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Draft':
      case 'Planning': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'On Hold': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display text-left">Research Projects</h1>
          <p className="text-slate-500 text-sm mt-1 text-left">Manage your academic research, milestones, grants, and international team collaborations.</p>
        </div>
        <div className="flex justify-start">
          <Link
            to="/projects/new"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/15 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>
      </div>

      {/* 🚀 Summary Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-[#DBEAFE] border border-blue-200/50 rounded-2xl p-4 flex flex-col text-left">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Total</span>
          <span className="text-2xl font-bold text-blue-900 mt-1">{totalProjects}</span>
          <span className="text-xs text-blue-600/80 font-medium mt-1">Projects Workspace</span>
        </div>
        <div className="bg-[#FEF3C7] border border-amber-200/50 rounded-2xl p-4 flex flex-col text-left">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Active</span>
          <span className="text-2xl font-bold text-amber-950 mt-1">{activeProjects}</span>
          <span className="text-xs text-amber-700/80 font-medium mt-1">In progress research</span>
        </div>
        <div className="bg-[#DCFCE7] border border-emerald-200/50 rounded-2xl p-4 flex flex-col text-left">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Completed</span>
          <span className="text-2xl font-bold text-emerald-950 mt-1">{completedProjects}</span>
          <span className="text-xs text-emerald-700/80 font-medium mt-1">Outcomes published</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Planning</span>
          <span className="text-2xl font-bold text-slate-800 mt-1">{draftProjects}</span>
          <span className="text-xs text-slate-400 font-medium mt-1">Milestones mapping</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Funding</span>
          <span className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalFunding)}</span>
          <span className="text-xs text-slate-400 font-medium mt-1">Total grants received</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Collaborators</span>
          <span className="text-2xl font-bold text-slate-800 mt-1">{totalMembers}</span>
          <span className="text-xs text-slate-400 font-medium mt-1">Active team members</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Filters and Project Cards (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filters */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects by title, description or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            </div>

            {/* Filter Selects */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-left">Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="all">All Domains</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Medicine & Health">Medicine & Health</option>
                  <option value="Physics">Physics</option>
                  <option value="Biology">Biology</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-left">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-left">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="Individual">Individual</option>
                  <option value="Team">Team Project</option>
                  <option value="University">University</option>
                  <option value="Funded">Funded Grant</option>
                  <option value="Open Source">Open Source</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-left">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="newest">Newest Created</option>
                  <option value="recently_updated">Recently Updated</option>
                  <option value="most_funded">Most Funded</option>
                  <option value="most_active">Most Active</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projects Listing */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200/80 rounded-2xl gap-4">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm font-medium">Fetching research projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <FolderGit2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Projects Found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">Create a new workspace to start tracking tasks, files, milestones, and funding.</p>
              <Link
                to="/projects/new"
                className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Start New Project
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div 
                  key={project._id}
                  className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col sm:flex-row gap-5"
                >
                  {/* Left Logo / Banner representation */}
                  <div className="w-12 h-12 bg-[#EDE9FE] text-blue-600 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner font-bold text-lg">
                    {project.title.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col text-left">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <Link 
                          to={`/projects/${project._id}`}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {project.title}
                        </Link>
                        {project.shortTitle && (
                          <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">
                            {project.shortTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md border border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider">
                          {project.visibility}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                        {project.researchDomain}
                      </span>
                      {project.keywords.slice(0, 3).map((kw, idx) => (
                        <span key={idx} className="text-[10px] font-medium px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">
                          {kw}
                        </span>
                      ))}
                    </div>

                    {/* Progress Bar & Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100">
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2.5 flex-1 max-w-xs">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{project.progress || 0}% Complete</span>
                      </div>

                      {/* Details & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Users2 className="w-4 h-4 text-slate-400" />
                          <span>{project.teamCount || 1} team members</span>
                        </div>
                        {project.budget > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span>{formatCurrency(project.budget)} budget</span>
                          </div>
                        )}
                        <Link 
                          to={`/projects/${project._id}`}
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Workspace <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6 text-left">
          
          {/* Widget 1: AI Suggested Collaborators */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 font-display">AI Suggested Collaborators</h3>
            </div>
            <div className="space-y-3.5">
              {aiCollaborators.map((c, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{c.inst} • {c.area}</span>
                    <span className="text-[9px] text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100 mt-1.5 w-fit">
                      Skills: {c.skills}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                      {c.match}%
                    </span>
                    <button className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-100 rounded-md px-1.5 py-0.5 transition-colors cursor-pointer">
                      <UserPlus className="w-2.5 h-2.5" /> Invite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Upcoming Deadlines */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 font-display">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-3">
              {upcomingDeadlines.map((dl, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 border-l-2 pl-3 border-amber-500">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{dl.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{dl.project}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      dl.delay ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {dl.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Recent Activity */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 font-display">Project Activity</h3>
            </div>
            <div className="space-y-4">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs leading-normal">
                  <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-slate-600 text-[10px]">
                    {act.user.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-600">
                      <span className="font-bold text-slate-800">{act.user}</span> {act.action} <span className="font-semibold text-slate-800">"{act.detail}"</span> in <span className="italic text-slate-500">{act.project}</span>
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 4: Recent Files */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-display">Recent Files</h3>
            </div>
            <div className="space-y-3">
              {recentFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 font-bold text-[9px]">
                      {file.type}
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-slate-800 block truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">{file.project}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">{file.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsDashboard;
