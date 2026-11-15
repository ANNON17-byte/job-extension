import type { Profile, Project, WorkExperience } from '../types/profile';
import type { JobCategory, JobDescription } from '../types/form';

export function getAllSkillsList(profile: Profile): string[] {
  const s = profile.skills;
  return [
    ...s.programmingLanguages,
    ...s.frontend,
    ...s.backendAndApis,
    ...s.databasesAndCaching,
    ...s.aiAndMachineLearning,
    ...s.aiMlConcepts,
    ...s.cloudAndDevOps,
    ...s.toolsAndPractices,
  ];
}

export function classifyJobCategory(title: string, description: string): JobCategory {
  const combined = `${title} ${description}`.toLowerCase();

  if (
    combined.includes('generative ai') ||
    combined.includes('gen ai') ||
    combined.includes('genai') ||
    combined.includes('rag') ||
    combined.includes('prompt engineer')
  ) {
    return 'Generative AI Engineer';
  }

  if (
    combined.includes('llm') ||
    combined.includes('large language model') ||
    combined.includes('nlp') ||
    combined.includes('natural language processing')
  ) {
    return 'LLM Engineer';
  }

  if (
    combined.includes('machine learning') ||
    combined.includes('deep learning') ||
    combined.includes('ml engineer') ||
    combined.includes('pytorch') ||
    combined.includes('tensorflow')
  ) {
    return 'Machine Learning Engineer';
  }

  if (combined.includes('ai engineer') || combined.includes('artificial intelligence')) {
    return 'AI Engineer';
  }

  if (combined.includes('data scientist') || combined.includes('data science')) {
    return 'Data Scientist';
  }

  if (combined.includes('data analyst') || combined.includes('business intelligence')) {
    return 'Data Analyst';
  }

  if (
    combined.includes('frontend') ||
    combined.includes('front-end') ||
    combined.includes('ui developer') ||
    combined.includes('react')
  ) {
    return 'Frontend Developer';
  }

  if (
    combined.includes('backend') ||
    combined.includes('back-end') ||
    combined.includes('api developer') ||
    combined.includes('node') ||
    combined.includes('django')
  ) {
    return 'Backend Developer';
  }

  if (
    combined.includes('full stack') ||
    combined.includes('fullstack') ||
    combined.includes('full-stack')
  ) {
    return 'Full Stack Developer';
  }

  if (
    combined.includes('software engineer') ||
    combined.includes('software developer') ||
    combined.includes('sde') ||
    combined.includes('swe')
  ) {
    return 'Software Engineer';
  }

  return 'Other';
}

export function selectRelevantProjects(
  category: JobCategory,
  requiredSkills: string[],
  projects: Project[]
): Project[] {
  const scored = projects.map((proj) => {
    let score = 0;
    const projTechLower = proj.technologies.map((t) => t.toLowerCase());
    const projDescLower = `${proj.description} ${proj.implementations.join(' ')}`.toLowerCase();

    // Check category relevance
    if (category === 'Generative AI Engineer' || category === 'LLM Engineer') {
      if (proj.name.includes('RAG') || proj.name.includes('GPT')) score += 5;
      if (projTechLower.includes('faiss') || projTechLower.includes('pgvector')) score += 3;
      if (projTechLower.includes('pytorch') || projTechLower.includes('tiktoken')) score += 3;
    } else if (category === 'Machine Learning Engineer' || category === 'AI Engineer') {
      if (projTechLower.includes('pytorch') || projTechLower.includes('sentence transformers')) score += 4;
      if (proj.name.includes('GPT') || proj.name.includes('RAG')) score += 3;
    } else if (category === 'Backend Developer') {
      if (projTechLower.includes('postgresql') || projTechLower.includes('supabase')) score += 4;
    }

    // Check required skill overlaps
    for (const skill of requiredSkills) {
      const sLower = skill.toLowerCase();
      if (projTechLower.some((t) => t.includes(sLower) || sLower.includes(t))) {
        score += 2;
      }
      if (projDescLower.includes(sLower)) {
        score += 1;
      }
    }

    return { proj, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.proj);
}

export function selectRelevantExperience(
  category: JobCategory,
  experiences: WorkExperience[]
): WorkExperience[] {
  return [...experiences].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (category.includes('AI') || category.includes('LLM') || category.includes('Machine Learning')) {
      if (a.position.includes('AI') || a.company === 'Bytesav') scoreA += 5;
      if (b.position.includes('AI') || b.company === 'Bytesav') scoreB += 5;
    } else if (category.includes('Frontend') || category.includes('Web')) {
      if (a.position.includes('Web') || a.position.includes('Design')) scoreA += 4;
      if (b.position.includes('Web') || b.position.includes('Design')) scoreB += 4;
    }

    return scoreB - scoreA;
  });
}

export function calculateJobProfileMatch(
  job: Partial<JobDescription>,
  profile: Profile
): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  relevantProjects: Project[];
  relevantExperience: WorkExperience[];
} {
  const allUserSkills = getAllSkillsList(profile);
  const userSkillsLower = allUserSkills.map((s) => s.toLowerCase());

  const required = job.requiredSkills || [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of required) {
    const sLower = skill.toLowerCase().trim();
    if (!sLower) continue;

    const matched = userSkillsLower.some(
      (userSkill) =>
        userSkill === sLower ||
        userSkill.includes(sLower) ||
        sLower.includes(userSkill)
    );

    if (matched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Calculate score grounded strictly in verifiable profile data
  let score = 0;
  if (required.length > 0) {
    score = Math.round((matchedSkills.length / required.length) * 85);
  } else {
    // If no specific required skills extracted, base on category alignment
    score = 70;
  }

  // Add bonus for relevant projects and experiences
  const category = job.category || classifyJobCategory(job.title || '', job.rawText || '');
  const relevantProjects = selectRelevantProjects(category, required, profile.projects);
  const relevantExperience = selectRelevantExperience(category, profile.experience);

  if (relevantProjects.length > 0) score += 10;
  if (relevantExperience.length > 0) score += 5;

  score = Math.min(100, Math.max(0, score));

  return {
    score,
    matchedSkills,
    missingSkills,
    relevantProjects,
    relevantExperience,
  };
}

