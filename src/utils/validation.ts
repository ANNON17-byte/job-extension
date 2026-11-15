import { ProfileSchema, type Profile } from '../types/profile';

export function validateProfile(data: unknown): { valid: boolean; errors: string[] } {
  const result = ProfileSchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`
  );
  return { valid: false, errors };
}

export function calculateProfileCompleteness(profile: Profile): {
  percentage: number;
  completedSections: number;
  totalSections: number;
  missingFields: string[];
} {
  const missing: string[] = [];
  let completed = 0;
  const total = 5;

  // 1. Personal
  const p = profile.personal;
  if (p.fullName && p.email && p.phone && p.location) {
    completed++;
  } else {
    if (!p.fullName) missing.push('Full Name');
    if (!p.email) missing.push('Email');
    if (!p.phone) missing.push('Phone');
    if (!p.location) missing.push('Location');
  }

  // 2. Education
  const e = profile.education;
  if (e.institution && e.degree && e.specialization && e.expectedGraduation) {
    completed++;
  } else {
    missing.push('Education details');
  }

  // 3. Experience
  if (profile.experience && profile.experience.length > 0) {
    completed++;
  } else {
    missing.push('Work experience');
  }

  // 4. Projects
  if (profile.projects && profile.projects.length > 0) {
    completed++;
  } else {
    missing.push('Projects');
  }

  // 5. Skills
  const s = profile.skills;
  const hasSkills =
    s.programmingLanguages.length > 0 ||
    s.frontend.length > 0 ||
    s.aiAndMachineLearning.length > 0;
  if (hasSkills) {
    completed++;
  } else {
    missing.push('Technical skills');
  }

  const percentage = Math.round((completed / total) * 100);

  return {
    percentage,
    completedSections: completed,
    totalSections: total,
    missingFields: missing,
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

