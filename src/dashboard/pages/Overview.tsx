import React from 'react';
import { useProfileStore } from '../../store/profile-store';
import { useApplicationStore } from '../../store/application-store';
import { calculateProfileCompleteness } from '../../utils/validation';
import {
  Sparkles,
  Briefcase,
  CheckCircle2,
  Clock,
  Award,
  ExternalLink,
  ChevronRight,
  FolderGit2,
  GraduationCap,
} from 'lucide-react';

interface OverviewProps {
  onNavigate: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const { profile } = useProfileStore();
  const { applications } = useApplicationStore();

  const completeness = calculateProfileCompleteness(profile);

  const appliedCount = applications.filter((a) => a.status === 'applied').length;
  const inProgressCount = applications.filter((a) =>
    ['interested', 'preparing', 'ready_to_apply'].includes(a.status)
  ).length;
  const interviewCount = applications.filter((a) => a.status === 'interview').length;
  const offerCount = applications.filter((a) => a.status === 'offer').length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Application Copilot</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {profile.personal.fullName.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              ApplyMate detects internship & job applications on any careers portal, matches your verified profile, and populates fields ready for your final manual review.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('applications')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              <span>Track Applications</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Manage Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Profile Completion</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{completeness.percentage}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${completeness.percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>In Preparation</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{inProgressCount}</div>
          <div className="text-xs text-slate-500 mt-2">Forms ready to apply</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Applications Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{appliedCount}</div>
          <div className="text-xs text-slate-500 mt-2">Explicit user confirmed</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Interviews & Offers</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{interviewCount + offerCount}</div>
          <div className="text-xs text-slate-500 mt-2">
            {interviewCount} interviews, {offerCount} offers
          </div>
        </div>
      </div>

      {/* Profile Highlights Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Education & Experience Highlight */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-200">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Current Academic & Career Status</span>
            </div>
            <button
              onClick={() => onNavigate('education')}
              className="text-xs text-blue-400 hover:underline"
            >
              View
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="font-medium text-slate-200">{profile.education.institution}</div>
              <div className="text-slate-400">
                {profile.education.degree} • {profile.education.specialization} (GPA: {profile.education.gpa})
              </div>
              <div className="text-slate-500 mt-0.5">
                Expected: {profile.education.expectedGraduation}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/50">
              <span className="text-slate-400 font-medium">Recent Experience:</span>
              <div className="mt-1 font-medium text-slate-200">
                {profile.experience[0]?.position} at {profile.experience[0]?.company}
              </div>
              <div className="text-slate-500">
                {profile.experience[0]?.startDate} – {profile.experience[0]?.endDate} ({profile.experience[0]?.employmentType})
              </div>
            </div>
          </div>
        </div>

        {/* Featured Projects Highlight */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-200">
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <span>Grounded Projects ({profile.projects.length})</span>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-blue-400 hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {profile.projects.slice(0, 2).map((proj) => (
              <div key={proj.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/60">
                <div className="flex items-center justify-between font-medium text-slate-200">
                  <span>{proj.name}</span>
                  {proj.github && (
                    <a
                      href={proj.github}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">
                  {proj.description}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {proj.technologies.slice(0, 5).map((tech) => (
                    <span
                      key={tech}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700/50"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

