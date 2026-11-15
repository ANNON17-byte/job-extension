import React, { useEffect, useState } from 'react';
import { useProfileStore } from '../store/profile-store';
import { calculateProfileCompleteness } from '../utils/validation';
import { sendTabMessage } from '../services/messaging';
import type { FormDetectionResult, FieldMapping, JobDescription } from '../types/form';
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronRight,
  Briefcase,
  ShieldCheck,
  SendHorizontal,
} from 'lucide-react';

export const PopupApp: React.FC = () => {
  const { profile, loadProfile } = useProfileStore();
  const [currentTab, setCurrentTab] = useState<{ id?: number; url?: string; title?: string }>({});
  const [detection, setDetection] = useState<FormDetectionResult | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [jobDescription, setJobDescription] = useState<Partial<JobDescription> | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPopulated, setIsPopulated] = useState<boolean>(false);

  useEffect(() => {
    loadProfile();

    // Query active tab
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
          setCurrentTab({
            id: activeTab.id,
            url: activeTab.url,
            title: activeTab.title,
          });

          if (activeTab.id) {
            chrome.tabs.sendMessage(
              activeTab.id,
              { type: 'DETECT_PAGE_FORM' },
              (response) => {
                setIsLoading(false);
                if (response && response.success && response.data) {
                  setDetection(response.data.detection);
                  setMappings(response.data.mappings || []);
                  setJobDescription(response.data.jobDescription || null);
                  setMatchScore(response.data.matchScore || 0);

                  const filled = (response.data.mappings || []).some(
                    (m: FieldMapping) => m.status === 'filled'
                  );
                  setIsPopulated(filled);
                }
              }
            );
          } else {
            setIsLoading(false);
          }
        }
      });
    } else {
      setIsLoading(false);
    }
  }, [loadProfile]);

  const completeness = calculateProfileCompleteness(profile);

  const openDashboard = (page?: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      const url = chrome.runtime.getURL(`dashboard.html${page ? `#${page}` : ''}`);
      chrome.tabs.create({ url });
    } else {
      window.open(`/dashboard.html${page ? `#${page}` : ''}`, '_blank');
    }
  };

  const handleTriggerAutofill = async () => {
    if (currentTab.id) {
      await sendTabMessage(currentTab.id, 'TRIGGER_AUTOFILL');
      setIsPopulated(true);
      window.close();
    }
  };

  const handleOpenReview = async () => {
    if (currentTab.id) {
      await sendTabMessage(currentTab.id, 'OPEN_REVIEW_PANEL');
      window.close();
    }
  };

  // Determine state
  const hasAppForm = detection?.isApplicationForm || (detection?.fields && detection.fields.length > 0);
  const popupState: 1 | 2 | 3 = isPopulated ? 3 : hasAppForm ? 2 : 1;

  const currentHost = currentTab.url ? new URL(currentTab.url).hostname : 'Current Page';

  return (
    <div className="w-[380px] bg-slate-950 text-slate-100 font-sans p-4 antialiased select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white">ApplyMate</span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
              AI Assistant
            </span>
          </div>
        </div>
        <button
          onClick={() => openDashboard('settings')}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Website Context Bar */}
      <div className="bg-slate-900/90 border border-slate-800/70 rounded-lg px-3 py-2 text-xs flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2 truncate max-w-[240px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="truncate text-slate-300 font-medium">{currentHost}</span>
        </div>
        <span className="text-[11px] text-slate-400">
          {hasAppForm ? `${detection?.fields.length || 0} fields` : 'No form'}
        </span>
      </div>

      {/* STATE 1: NO APPLICATION FORM DETECTED */}
      {popupState === 1 && (
        <div className="space-y-3.5 py-2">
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2.5">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-200 mb-1">No Application Detected</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Navigate to a job or internship application page (Greenhouse, Lever, LinkedIn, Workday, etc.) to trigger smart autofill.
            </p>
          </div>

          {/* Profile Completeness Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Profile Completion</span>
              <span className="font-semibold text-blue-400">{completeness.percentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completeness.percentage}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>{profile.personal.fullName}</span>
              <button
                onClick={() => openDashboard('profile')}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 hover:underline"
              >
                Edit Profile <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: APPLICATION FORM DETECTED & READY */}
      {popupState === 2 && (
        <div className="space-y-3 py-1">
          {/* Target Job Info Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/30 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                  Opportunity Detected
                </span>
                <h3 className="font-bold text-sm text-white mt-0.5 line-clamp-1">
                  {jobDescription?.title || detection?.detectedJobTitle || 'Job Opening'}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {jobDescription?.company || detection?.detectedCompany || 'Hiring Organization'}
                </p>
              </div>
              {matchScore > 0 && (
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">{matchScore}%</div>
                  <div className="text-[10px] text-slate-400">Match</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {detection?.fields.length || mappings.length} fields mapped
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {jobDescription?.category || 'AI / Software'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleTriggerAutofill}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Autofill & Review Application</span>
            </button>

            <button
              onClick={handleOpenReview}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Inspect Field Mappings</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: APPLICATION POPULATED & AWAITING USER REVIEW */}
      {popupState === 3 && (
        <div className="space-y-3 py-1">
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 text-center space-y-1.5">
            <div className="w-9 h-9 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-emerald-300">Fields Populated</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Form has been populated with your verified profile information. Please review every field before submitting.
            </p>
          </div>

          <button
            onClick={handleOpenReview}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Open Review Drawer</span>
          </button>
        </div>
      )}

      {/* Bottom Safety & Link Section */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Manual Submission Only</span>
        </div>
        <button
          onClick={() => openDashboard()}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
        >
          Full Dashboard <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

