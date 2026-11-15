import type { WorkExperience, Project } from '../types/profile';

/**
 * Example template for experience and projects.
 * Copy this file to `experience.ts` to customize with your own data.
 */
export const userExperience: WorkExperience[] = [
  {
    id: 'exp-1',
    company: 'Example Company',
    position: 'Software Engineer Intern',
    employmentType: 'Remote',
    startDate: 'January 2026',
    endDate: 'April 2026',
    responsibilities: [
      'Developed and maintained backend services.',
      'Wrote automated unit tests and integration tests.',
    ],
  },
];

export const userProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Example Project',
    github: 'https://github.com/example/project',
    technologies: ['TypeScript', 'React', 'Node.js'],
    description: 'A sample project demonstrating clean architecture.',
    implementations: ['REST APIs', 'State management'],
    evaluationMetrics: ['Performance', 'Reliability'],
  },
];

