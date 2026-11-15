import React, { useState, useEffect } from 'react';
import { useApplicationStore } from '../../store/application-store';
import type { Application, ApplicationStatus } from '../../types/application';
import {
  Briefcase,
  Search,
  ExternalLink,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  interested: {
    label: 'Interested',
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  },
  preparing: {
    label: 'Preparing',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  ready_to_apply: {
    label: 'Ready to Apply',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  applied: {
    label: 'Applied',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  interview: {
    label: 'Interview',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  shortlisted: {
    label: 'Shortlisted',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  offer: {
    label: 'Offer 🎉',
    bg: 'bg-green-500/20',
    text: 'text-green-300',
    border: 'border-green-500/30',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
  },
};

export const ApplicationsPage: React.FC = () => {
  const {
    applications,
    filter,
    loadApplications,
    updateStatus,
    updateApplication,
    deleteApplication,
    setFilter,
    getFilteredApplications,
  } = useApplicationStore();

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filtered = getFilteredApplications();

  const handleNotesSave = async (id: string) => {
    await updateApplication(id, { notes: editingNotes });
    if (selectedApp?.id === id) {
      setSelectedApp({ ...selectedApp, notes: editingNotes });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Application Tracker</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Local tracker for all detected and submitted job applications. Never marked applied without your consent.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter.searchQuery}
              onChange={(e) => setFilter({ searchQuery: e.target.value })}
              placeholder="Search company or position..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-52"
            />
          </div>

          <select
            value={filter.status || 'all'}
            onChange={(e) => setFilter({ status: e.target.value as any })}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="ready_to_apply">Ready to Apply</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-sm text-slate-300">No applications recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            When you visit a job posting with ApplyMate active, you can save it to your local tracker directly from the review drawer.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const statusMeta = STATUS_CONFIG[app.status] || STATUS_CONFIG.interested;

            return (
              <div
                key={app.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{app.position}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                    >
                      {statusMeta.label}
                    </span>
                    {app.matchScore ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {app.matchScore}% Match
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-300">{app.company}</span>
                    <span>•</span>
                    <span className="text-slate-500">Added: {app.dateAdded}</span>
                    {app.dateApplied && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">Applied: {app.dateApplied}</span>
                      </>
                    )}
                  </div>

                  {app.notes && (
                    <p className="text-[11px] text-slate-400 italic pt-1 max-w-xl line-clamp-1">
                      "{app.notes}"
                    </p>
                  )}
                </div>

                {/* Status Switcher & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="interested">Interested</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready_to_apply">Ready to Apply</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                      title="Open Job URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => deleteApplication(app.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

