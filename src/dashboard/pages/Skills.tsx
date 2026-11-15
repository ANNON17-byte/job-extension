import React, { useState } from 'react';
import { useProfileStore } from '../../store/profile-store';
import type { SkillCategories } from '../../types/profile';
import { Code2, Plus, X, Layers, Database, Cpu, Brain, Cloud, Wrench, Globe } from 'lucide-react';

interface CategoryConfig {
  key: keyof SkillCategories;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export const SkillsPage: React.FC = () => {
  const { profile, addSkill, removeSkill } = useProfileStore();
  const [newSkillText, setNewSkillText] = useState<{ [K in keyof SkillCategories]?: string }>({});

  const categories: CategoryConfig[] = [
    {
      key: 'programmingLanguages',
      title: 'Programming Languages',
      icon: <Code2 className="w-4 h-4 text-blue-400" />,
      description: 'Core languages used for systems, scripting, and data pipelines.',
    },
    {
      key: 'frontend',
      title: 'Frontend & UI Frameworks',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      description: 'Client-side web development, reactive UI, and styling.',
    },
    {
      key: 'backendAndApis',
      title: 'Backend & APIs',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      description: 'Server runtimes, HTTP/REST services, and real-time sockets.',
    },
    {
      key: 'databasesAndCaching',
      title: 'Databases & Vector Storage',
      icon: <Database className="w-4 h-4 text-amber-400" />,
      description: 'Relational, document, caching, and vector indexing.',
    },
    {
      key: 'aiAndMachineLearning',
      title: 'AI & Machine Learning Frameworks',
      icon: <Cpu className="w-4 h-4 text-purple-400" />,
      description: 'Deep learning frameworks, agentic libraries, and scientific computing.',
    },
    {
      key: 'aiMlConcepts',
      title: 'AI/ML Architecture & Concepts',
      icon: <Brain className="w-4 h-4 text-pink-400" />,
      description: 'Retrieval systems, embeddings, prompt engineering, and evaluation.',
    },
    {
      key: 'cloudAndDevOps',
      title: 'Cloud & DevOps',
      icon: <Cloud className="w-4 h-4 text-sky-400" />,
      description: 'Containers, deployment pipelines, and cloud environments.',
    },
    {
      key: 'toolsAndPractices',
      title: 'Tools & Engineering Practices',
      icon: <Wrench className="w-4 h-4 text-orange-400" />,
      description: 'Version control, commerce platforms, and agile design methodologies.',
    },
  ];

  const handleAdd = async (category: keyof SkillCategories) => {
    const text = newSkillText[category]?.trim();
    if (text) {
      await addSkill(category, text);
      setNewSkillText({ ...newSkillText, [category]: '' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: keyof SkillCategories) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(category);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight">Technical Skills Database</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Categorized technical taxonomy used by the job-profile matching engine to calculate real candidate suitability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const skillsList = profile.skills[cat.key] || [];

          return (
            <div
              key={cat.key}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {cat.icon}
                  <span className="font-semibold text-xs text-slate-200">{cat.title}</span>
                  <span className="text-[10px] text-slate-500 ml-auto">{skillsList.length} skills</span>
                </div>
                <p className="text-[11px] text-slate-400">{cat.description}</p>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 text-xs text-slate-200"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(cat.key, skill)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Add Input */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillText[cat.key] || ''}
                  onChange={(e) =>
                    setNewSkillText({ ...newSkillText, [cat.key]: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, cat.key)}
                  placeholder="Add skill..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleAdd(cat.key)}
                  className="p-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors cursor-pointer"
                  title="Add skill"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

