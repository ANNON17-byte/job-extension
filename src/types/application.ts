import { z } from 'zod';

export const ApplicationStatusEnum = z.enum([
  'interested',
  'preparing',
  'ready_to_apply',
  'applied',
  'interview',
  'rejected',
  'shortlisted',
  'offer',
]);

export const ApplicationSchema = z.object({
  id: z.string(),
  company: z.string(),
  position: z.string(),
  jobUrl: z.string(),
  dateAdded: z.string(),
  dateApplied: z.string().optional(),
  jobCategory: z.string().optional(),
  resumeVersion: z.string().optional(),
  status: ApplicationStatusEnum,
  notes: z.string().optional(),
  jobDescription: z.string().optional(),
  matchScore: z.number().min(0).max(100).optional(),
});

export type ApplicationStatus = z.infer<typeof ApplicationStatusEnum>;
export type Application = z.infer<typeof ApplicationSchema>;

export interface ApplicationFilter {
  searchQuery: string;
  status?: ApplicationStatus | 'all';
  jobCategory?: string | 'all';
}

