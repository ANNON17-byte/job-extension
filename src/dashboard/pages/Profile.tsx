import React, { useState } from 'react';
import { useProfileStore } from '../../store/profile-store';
import { Save, Check, User, GraduationCap, Link2, BookOpen } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, updatePersonalInfo, updateEducation } = useProfileStore();

  const [personal, setPersonal] = useState(profile.personal);
  const [education, setEducation] = useState(profile.education);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePersonalInfo(personal);
    await updateEducation(education);
    setSavedMessage('Profile changes saved successfully!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Personal & Academic Profile</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            This verified data forms the ground truth for all autofill and AI-assisted responses.
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
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* 1. Contact & Identity Information */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-sm text-slate-200 border-b border-slate-800/80 pb-3">
          <User className="w-4 h-4 text-blue-400" />
          <span>Personal Details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
            <input
              type="text"
              value={personal.fullName}
              onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Location</label>
            <input
              type="text"
              value={personal.location}
              onChange={(e) => setPersonal({ ...personal, location: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
            <input
              type="email"
              value={personal.email}
              onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              value={personal.phone}
              onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Professional Web Links */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-sm text-slate-200 border-b border-slate-800/80 pb-3">
          <Link2 className="w-4 h-4 text-indigo-400" />
          <span>Professional Profiles & Portfolio</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">LinkedIn URL</label>
            <input
              type="url"
              value={personal.linkedin || ''}
              onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">GitHub Profile</label>
            <input
              type="url"
              value={personal.github || ''}
              onChange={(e) => setPersonal({ ...personal, github: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="https://github.com/..."
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Portfolio / Website</label>
            <input
              type="url"
              value={personal.portfolio || ''}
              onChange={(e) => setPersonal({ ...personal, portfolio: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="https://ashmityadav.in"
            />
          </div>
        </div>
      </div>

      {/* 3. Education & Academic Details */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-sm text-slate-200 border-b border-slate-800/80 pb-3">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span>Education & Academics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-400 mb-1 font-medium">Institution / University</label>
            <input
              type="text"
              value={education.institution}
              onChange={(e) => setEducation({ ...education, institution: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Degree</label>
            <input
              type="text"
              value={education.degree}
              onChange={(e) => setEducation({ ...education, degree: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Specialization / Major</label>
            <input
              type="text"
              value={education.specialization}
              onChange={(e) => setEducation({ ...education, specialization: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Expected Graduation Date</label>
            <input
              type="text"
              value={education.expectedGraduation}
              onChange={(e) => setEducation({ ...education, expectedGraduation: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="e.g. June 2028"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Cumulative GPA / CGPA</label>
            <input
              type="text"
              value={education.gpa || ''}
              onChange={(e) => setEducation({ ...education, gpa: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="e.g. 3.50/4.00"
            />
          </div>
        </div>

        {/* Concentrations & Coursework */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Concentrations (comma separated)
            </label>
            <input
              type="text"
              value={education.concentrations.join(', ')}
              onChange={(e) =>
                setEducation({
                  ...education,
                  concentrations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Relevant Coursework (comma separated)
            </label>
            <input
              type="text"
              value={education.coursework.join(', ')}
              onChange={(e) =>
                setEducation({
                  ...education,
                  coursework: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </form>
  );
};

