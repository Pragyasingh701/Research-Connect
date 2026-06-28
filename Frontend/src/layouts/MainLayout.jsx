import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Microscope, 
  LogOut, 
  User, 
  Compass, 
  HelpCircle, 
  LayoutDashboard, 
  BookOpen, 
  FolderGit2, 
  Handshake, 
  MessageSquare, 
  Bell, 
  Bookmark, 
  Users2, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Publications', path: '/publications', icon: BookOpen },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Collaborations', path: '/collaborations', icon: Handshake },
    { label: 'Messages', path: '/messages', icon: MessageSquare, badge: 4 },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: 6 },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'Following', path: '/following', icon: Users2 },
    { label: 'Followers', path: '/followers', icon: Users },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  // If user is logged in, show the left sidebar Dashboard layout
  if (user) {
    return (
      <div className="h-screen w-screen flex overflow-hidden bg-[#F8FAFC]">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0">
          {/* Brand Logo */}
          <div className="h-16 flex flex-col justify-center px-6 border-b border-slate-100">
            <Link to="/profile" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/10">
                <Microscope className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 tracking-tight font-display">ResearchConnect</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider -mt-0.5">Connect • Collaborate</span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto text-left">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/profile' && location.pathname.startsWith('/profile'));
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Action Button */}
          <div className="p-4 border-t border-slate-100">
            <button className="flex items-center justify-center gap-2 w-full py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50/50 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> Upload Publication
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full mt-2 py-2 text-slate-500 hover:text-red-600 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout Session
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-sm">
            <div className="w-64 bg-white flex flex-col h-full animate-in slide-in-from-left duration-250">
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-slate-900 font-display">ResearchConnect</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1 text-left">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Bar Header */}
          <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 lg:px-8 z-10 shrink-0">
            {/* Left: Search Bar & Mobile Menu Trigger */}
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="relative w-full max-w-md hidden sm:block">
                <input
                  type="text"
                  placeholder="Search researchers, publications, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Right: Quick actions and Profile Card */}
            <div className="flex items-center gap-4">
              {/* Message notifications */}
              <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer">
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  5
                </span>
              </button>

              {/* Bell alerts */}
              <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  3
                </span>
              </button>

              {/* User Dropdown */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200/80">
                <img
                  src={user.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                  alt={user.user?.fullName || 'User Profile'}
                  className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 tracking-tight leading-none">
                    {user.user?.fullName || 'Dr. Arjun Sharma'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize mt-1">
                    {user.designation || 'Researcher'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 cursor-pointer hidden md:block" />
              </div>
            </div>
          </header>

          {/* Page Routing Contents */}
          <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8 bg-[#F8FAFC]">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  // Guest Header Layout (for Landing, public pages)
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 w-full bg-white/80 border-b border-slate-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
              <Microscope className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold font-display text-gradient">
              ResearchConnect
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Home</Link>
            <a href="#discover" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Discover</a>
            <a href="#collaborate" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Collaborate</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/10 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="w-full border-t border-slate-200 py-6 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} ResearchConnect. All rights reserved.
          </span>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
