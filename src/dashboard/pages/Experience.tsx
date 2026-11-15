import React, { useState } from 'react';
import { useProfileStore } from '../../store/profile-store';
import type { WorkExperience } from '../../types/profile';
import { Briefcase, Plus, Trash2, Edit3, Check, X, Calendar } from 'lucide-react';

export const ExperiencePage: React.FC = () => {
  const { profile, addExperience, updateExperience, deleteExperience } = useProfileStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [form, setForm] = useState<Partial<WorkExperience>>({
    company: '',
    position: '',
    employmentType: 'Remote',
    startDate: '',
    endDate: '',
    responsibilities: [],
  });
  const [respInput, setRespInput] = useState('');

  const startEdit = (exp: WorkExperience) => {
    setEditingId(exp.id);
    setForm(exp);
    setRespInput(exp.responsibilities.join('\n'));
    setIsAddingNew(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm({
      id: `exp-${Date.now()}`,
      company: '',
      position: '',
      employmentType: 'Remote',
      startDate: '',
      endDate: 'Present',
      responsibilities: [],
    });
    setRespInput('');
    setIsAddingNew(true);
  };

  const cancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const save = async () => {
    const responsibilities = respInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (isAddingNew) {
      if (!form.company || !form.position) return;
      await addExperience({
        id: form.id || `exp-${Date.now()}`,
        company: form.company,
        position: form.position,
        employmentType: form.employmentType || 'Remote',
        startDate: form.startDate || '',
        endDate: form.endDate || '',
        responsibilities,
      });
      setIsAddingNew(false);
    } else if (editingId) {
      await updateExperience(editingId, {
        ...form,
        responsibilities,
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Work Experience</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified internships and employment history for grounding application responses.
          </p>
        </div>
        {!isAddingNew && (
          <button
            onClick={startAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Experience</span>
          </button>
        )}
      </div>

      {/* Editor Modal/Card */}
      {(isAddingNew || editingId) && (
        <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-white">
              {isAddingNew ? 'Add New Work Experience' : 'Edit Work Experience'}
            </h3>
            <button onClick={cancel} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Company Name</label>
              <input
                type="text"
                value={form.company || ''}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Bytesav"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Position / Role</label>
              <input
                type="text"
                value={form.position || ''}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="e.g. AI Engineer Intern"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Employment Type</label>
              <select
                value={form.employmentType || 'Remote'}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Start Date</label>
                <input
                  type="text"
                  value={form.startDate || ''}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. August 2026"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">End Date</label>
                <input
                  type="text"
                  value={form.endDate || ''}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. October 2026"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">
                Responsibilities (one bullet point per line)
              </label>
              <textarea
                rows={4}
                value={respInput}
                onChange={(e) => setRespInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Built RAG-based tools...&#10;Integrated LLMs to generate context-aware answers..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={cancel}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Entry</span>
            </button>
          </div>
        </div>
      )}

      {/* Experience List */}
      <div className="space-y-4">
        {profile.experience.map((exp) => (
          <div
            key={exp.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700/80 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white">{exp.position}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {exp.employmentType}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-300 mt-0.5">{exp.company}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(exp)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteExperience(exp.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ul className="mt-4 space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              {exp.responsibilities.map((resp, idx) => (
                <li key={idx} className="leading-relaxed">
                  {resp}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

