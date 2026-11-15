import React, { useState, useEffect } from 'react';
import { storageService, type ExtensionSettings, defaultSettings } from '../../services/storage';
import { useProfileStore } from '../../store/profile-store';
import {
  Key,
  Shield,
  RotateCcw,
  Download,
  Upload,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { profile, resetToSeed } = useProfileStore();
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    storageService.getSettings().then(setSettings);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await storageService.saveSettings(settings);
    setSavedMessage('Settings updated successfully!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleResetSeed = async () => {
    if (window.confirm('Reset all profile data back to the original verified seed? Any custom changes will be replaced.')) {
      await resetToSeed();
      setSavedMessage('Profile reset to initial seed data!');
      setTimeout(() => setSavedMessage(null), 3000);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `applymate-profile-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Extension & AI Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure external AI provider, security boundaries, and data backup.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMessage && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {savedMessage}
            </span>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
          >
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* 1. Gemini AI Provider Configuration */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-sm text-slate-200 border-b border-slate-800/80 pb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Gemini AI Provider Configuration (Optional)</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          ApplyMate works 100% offline using deterministic semantic heuristics. You can optionally supply your personal Google Gemini API key for advanced contextual question generation.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Google Gemini API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.geminiApiKey || ''}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Never bundled or shared. Stored purely inside your local browser instance via chrome.storage.local.
            </span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Model</label>
            <select
              value={settings.geminiModel || 'gemini-1.5-flash'}
              onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Recommended)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (In-depth)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Security & Privacy Guarantees */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm text-slate-200 border-b border-slate-800/80 pb-3">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Security & Privacy Architecture</span>
        </div>

        <ul className="text-xs text-slate-300 space-y-2">
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>All personal profile data remains stored locally inside <code>chrome.storage.local</code>.</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Never automatically submits applications. You inspect and submit every application manually.</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Does not collect browsing history or store account passwords.</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>No remote telemetry or analytics servers. Zero tracking.</span>
          </li>
        </ul>
      </div>

      {/* 3. Data Backup & Reset */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-sm text-slate-200 border-b border-slate-800/80 pb-3">
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Profile Backup & Reset</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Profile JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetSeed}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Seed Profile</span>
          </button>
        </div>
      </div>
    </form>
  );
};

