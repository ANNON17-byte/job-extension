import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../store/profile-store';
import { calculateProfileCompleteness } from '../utils/validation';
import { Overview } from './pages/Overview';
import { ProfilePage } from './pages/Profile';
import { ExperiencePage } from './pages/Experience';
import { ProjectsPage } from './pages/Projects';
import { SkillsPage } from './pages/Skills';
import { ApplicationsPage } from './pages/Applications';
import { SettingsPage } from './pages/Settings';
import {
  Sparkles,
  LayoutDashboard,
  User,
  Briefcase,
  FolderGit2,
  Cpu,
  Layers,
  Settings,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const DashboardApp: React.FC = () => {
  const { profile, loadProfile } = useProfileStore();
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    loadProfile();

    // Check hash for initial tab
    const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'profile', 'experience', 'projects', 'skills', 'applications', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [loadProfile]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const completeness = calculateProfileCompleteness(profile);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills Database', icon: <Cpu className="w-4 h-4" /> },
    { id: 'applications', label: 'Applications', icon: <Layers className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & AI', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>ApplyMate</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Application Copilot</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card in Sidebar Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Profile Health</span>
              <span className="font-semibold text-emerald-400">{completeness.percentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${completeness.percentage}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {profile.personal.fullName}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zero auto-submit guarantee</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        {activeTab === 'overview' && <Overview onNavigate={handleTabChange} />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'experience' && <ExperiencePage />}
        {activeTab === 'projects' && <ProjectsPage />}
        {activeTab === 'skills' && <SkillsPage />}
        {activeTab === 'applications' && <ApplicationsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
};

