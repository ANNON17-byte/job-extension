import React, { useState } from 'react';
import { useProfileStore } from '../../store/profile-store';
import type { Project } from '../../types/profile';
import { FolderGit2, Plus, Trash2, Edit3, Check, X, ExternalLink, Cpu } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { profile, addProject, updateProject, deleteProject } = useProfileStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [form, setForm] = useState<Partial<Project>>({
    name: '',
    github: '',
    description: '',
    technologies: [],
    implementations: [],
    evaluationMetrics: [],
  });

  const [techInput, setTechInput] = useState('');
  const [implInput, setImplInput] = useState('');
  const [metricsInput, setMetricsInput] = useState('');

  const startEdit = (proj: Project) => {
    setEditingId(proj.id);
    setForm(proj);
    setTechInput(proj.technologies.join(', '));
    setImplInput(proj.implementations.join('\n'));
    setMetricsInput((proj.evaluationMetrics || []).join(', '));
    setIsAddingNew(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm({
      id: `proj-${Date.now()}`,
      name: '',
      github: '',
      description: '',
      technologies: [],
      implementations: [],
      evaluationMetrics: [],
    });
    setTechInput('');
    setImplInput('');
    setMetricsInput('');
    setIsAddingNew(true);
  };

  const cancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const save = async () => {
    const technologies = techInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const implementations = implInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const evaluationMetrics = metricsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (isAddingNew) {
      if (!form.name) return;
      await addProject({
        id: form.id || `proj-${Date.now()}`,
        name: form.name,
        github: form.github || '',
        description: form.description || '',
        technologies,
        implementations,
        evaluationMetrics: evaluationMetrics.length > 0 ? evaluationMetrics : undefined,
      });
      setIsAddingNew(false);
    } else if (editingId) {
      await updateProject(editingId, {
        ...form,
        technologies,
        implementations,
        evaluationMetrics: evaluationMetrics.length > 0 ? evaluationMetrics : undefined,
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Technical Projects Database</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ApplyMate dynamically prioritizes relevant projects based on job description requirements.
          </p>
        </div>
        {!isAddingNew && (
          <button
            onClick={startAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {/* Project Form */}
      {(isAddingNew || editingId) && (
        <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-white">
              {isAddingNew ? 'Add Project' : 'Edit Project'}
            </h3>
            <button onClick={cancel} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Project Name</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Production-Level RAG"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">GitHub Repository URL</label>
              <input
                type="url"
                value={form.github || ''}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="https://github.com/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">Technologies (comma separated)</label>
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Python, PyTorch, FAISS, PostgreSQL, pgvector..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">Description</label>
              <textarea
                rows={2}
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="High-level overview of the project architecture and purpose..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">
                Implementations (one bullet point per line)
              </label>
              <textarea
                rows={4}
                value={implInput}
                onChange={(e) => setImplInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Recursive chunking.&#10;Open-source BGE embeddings.&#10;FAISS vector storage..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">
                Evaluation Metrics (optional, comma separated)
              </label>
              <input
                type="text"
                value={metricsInput}
                onChange={(e) => setMetricsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Context Precision, Context Recall, Faithfulness..."
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
              <span>Save Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        {profile.projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700/80 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white">{proj.name}</span>
                  {proj.github && (
                    <a
                      href={proj.github}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                    >
                      <span>Repository</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{proj.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(proj)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteProject(proj.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Technologies Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {proj.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Implementations List */}
            <div className="pt-2 border-t border-slate-800/60 text-xs">
              <span className="text-slate-400 font-medium">Key Implementations:</span>
              <ul className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-300 list-disc list-inside">
                {proj.implementations.map((impl, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {impl}
                  </li>
                ))}
              </ul>
            </div>

            {/* Metrics if present */}
            {proj.evaluationMetrics && proj.evaluationMetrics.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60 text-xs flex items-center gap-2">
                <span className="text-slate-400 font-medium">Evaluation Metrics:</span>
                <div className="flex gap-1.5">
                  {proj.evaluationMetrics.map((metric) => (
                    <span
                      key={metric}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] border border-emerald-500/20 font-medium"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

