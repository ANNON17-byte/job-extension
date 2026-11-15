import { z } from 'zod';

export const PersonalInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  location: z.string().min(1, 'Location is required'),
  linkedin: z.string().url('Invalid LinkedIn URL').or(z.literal('')),
  github: z.string().url('Invalid GitHub URL').or(z.literal('')),
  portfolio: z.string().url('Invalid portfolio URL').or(z.literal('')),
});

export const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  expectedGraduation: z.string().min(1, 'Expected graduation is required'),
  gpa: z.string().optional(),
  concentrations: z.array(z.string()),
  coursework: z.array(z.string()),
});

export const WorkExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  employmentType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  responsibilities: z.array(z.string()),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required'),
  github: z.string().optional(),
  technologies: z.array(z.string()),
  description: z.string(),
  implementations: z.array(z.string()),
  evaluationMetrics: z.array(z.string()).optional(),
});

export const SkillCategoriesSchema = z.object({
  programmingLanguages: z.array(z.string()),
  frontend: z.array(z.string()),
  backendAndApis: z.array(z.string()),
  databasesAndCaching: z.array(z.string()),
  aiAndMachineLearning: z.array(z.string()),
  aiMlConcepts: z.array(z.string()),
  cloudAndDevOps: z.array(z.string()),
  toolsAndPractices: z.array(z.string()),
});

export const ProfileSchema = z.object({
  personal: PersonalInfoSchema,
  education: EducationSchema,
  experience: z.array(WorkExperienceSchema),
  projects: z.array(ProjectSchema),
  skills: SkillCategoriesSchema,
  onboardingCompleted: z.boolean().default(false),
  lastUpdated: z.string().optional(),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type SkillCategories = z.infer<typeof SkillCategoriesSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

