export type FieldInputType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'number'
  | 'date'
  | 'password'
  | 'hidden'
  | 'other';

export interface SelectOption {
  value: string;
  text: string;
}

export interface DetectedField {
  id: string; // unique internal selector or identifier
  elementPath?: string;
  name: string;
  htmlId: string;
  type: FieldInputType;
  label: string;
  placeholder: string;
  ariaLabel: string;
  required: boolean;
  currentValue: string;
  options: SelectOption[];
  contextualText: string;
  maxLength?: number;
}

export type MappingSource =
  | 'exact_match'
  | 'label_match'
  | 'synonym_match'
  | 'semantic_match'
  | 'ai_generated'
  | 'user_edited';

export type MappingStatus = 'approved' | 'pending' | 'rejected' | 'missing' | 'filled';

export interface FieldMapping {
  fieldId: string;
  fieldName: string;
  originalLabel: string;
  detectedMeaning: string;
  profilePath: string; // e.g. "personal.fullName", "education.institution", "skills.aiMlConcepts"
  suggestedValue: string;
  confidence: number; // 0.0 to 1.0
  source: MappingSource;
  status: MappingStatus;
  isAiSuggestion?: boolean;
  explanation?: string;
  userModifiedValue?: string;
}

export interface FormDetectionResult {
  hasForm: boolean;
  isApplicationForm: boolean;
  formCount: number;
  fields: DetectedField[];
  pageUrl: string;
  pageTitle: string;
  detectedCompany?: string;
  detectedJobTitle?: string;
}

export interface JobDescription {
  company: string;
  title: string;
  category: JobCategory;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements: string;
  experienceRequirements: string;
  duration: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site' | 'Unspecified';
  deadline: string;
  rawText: string;
}

export type JobCategory =
  | 'AI Engineer'
  | 'Machine Learning Engineer'
  | 'Generative AI Engineer'
  | 'LLM Engineer'
  | 'Data Scientist'
  | 'Data Analyst'
  | 'Backend Developer'
  | 'Full Stack Developer'
  | 'Frontend Developer'
  | 'Software Engineer'
  | 'Other';

export interface AutofillProgress {
  total: number;
  filled: number;
  pending: number;
  skipped: number;
}

