import type { DetectedField, FieldMapping, JobDescription } from '../types/form';
import type { Profile } from '../types/profile';
import { GeminiProvider } from './gemini';

interface FieldRule {
  field: string;
  patterns: RegExp[];
  confidence: number;
  getValue: (profile: Profile, field: DetectedField, job?: Partial<JobDescription>) => string;
}

export class FieldMapper {
  private gemini: GeminiProvider;

  constructor(geminiApiKey?: string) {
    this.gemini = new GeminiProvider(geminiApiKey);
  }

  // Pre-compiled deterministic and synonym patterns
  private rules: FieldRule[] = [
    // --- EDUCATION (higher priority than generic name) ---
    {
      field: 'education.institution',
      patterns: [/\b(university|college|institution|school|alma\s*mater)\b/i],
      confidence: 0.92,
      getValue: (p) => p.education.institution,
    },
    {
      field: 'education.degree',
      patterns: [/\b(degree|qualification|degree\s*level|education\s*level)\b/i],
      confidence: 0.88,
      getValue: (p) => p.education.degree,
    },
    {
      field: 'education.specialization',
      patterns: [/\b(major|field\s*of\s*study|specialization|discipline|branch|stream)\b/i],
      confidence: 0.88,
      getValue: (p) => p.education.specialization,
    },
    {
      field: 'education.gpa',
      patterns: [/\b(gpa|cgpa|grade\s*point|percentage|score|marks)\b/i],
      confidence: 0.9,
      getValue: (p) => p.education.gpa || '',
    },
    {
      field: 'education.expectedGraduation',
      patterns: [/\b(graduat(ion|ing)|end\s*date|completion\s*date|expected\s*graduat)\b/i],
      confidence: 0.85,
      getValue: (p) => p.education.expectedGraduation,
    },

    // --- PERSONAL INFO ---
    {
      field: 'personal.fullName',
      patterns: [
        /\b(full\s*name|candidate\s*name|applicant\s*name|your\s*name|legal\s*name)\b/i,
        /^(name|fullname|candidate_name)$/i,
      ],
      confidence: 0.95,
      getValue: (p) => p.personal.fullName,
    },
    {
      field: 'personal.firstName',
      patterns: [/\b(first\s*name|given\s*name|fname)\b/i, /^first_?name$/i],
      confidence: 0.95,
      getValue: (p) => p.personal.fullName.split(' ')[0] || '',
    },
    {
      field: 'personal.lastName',
      patterns: [/\b(last\s*name|surname|family\s*name|lname)\b/i, /^last_?name$/i],
      confidence: 0.95,
      getValue: (p) => p.personal.fullName.split(' ').slice(1).join(' ') || '',
    },
    {
      field: 'personal.email',
      patterns: [/\b(e-?mail|email\s*address|electronic\s*mail)\b/i, /^email$/i],
      confidence: 0.98,
      getValue: (p) => p.personal.email,
    },
    {
      field: 'personal.phone',
      patterns: [/\b(phone|mobile|cell|contact\s*number|telephone)\b/i, /^phone$/i],
      confidence: 0.95,
      getValue: (p) => p.personal.phone,
    },
    {
      field: 'personal.location',
      patterns: [/\b(location|city|current\s*city|residence|current\s*location)\b/i],
      confidence: 0.85,
      getValue: (p) => p.personal.location,
    },
    {
      field: 'personal.linkedin',
      patterns: [/\b(linkedin|linked\s*in|linkedin\s*url|linkedin\s*profile)\b/i],
      confidence: 0.95,
      getValue: (p) => p.personal.linkedin || '',
    },
    {
      field: 'personal.github',
      patterns: [/\b(github|git\s*hub|github\s*url|github\s*profile)\b/i],
      confidence: 0.95,
      getValue: (p) => p.personal.github || '',
    },
    {
      field: 'personal.portfolio',
      patterns: [/\b(portfolio|personal\s*website|personal\s*url|homepage)\b/i],
      confidence: 0.95,
      getValue: (p) => p.personal.portfolio || '',
    },

    // --- WORK & EXPERIENCE ---
    {
      field: 'experience.currentCompany',
      patterns: [/\b(current\s*company|most\s*recent\s*company|current\s*employer)\b/i],
      confidence: 0.85,
      getValue: (p) => p.experience[0]?.company || '',
    },
    {
      field: 'experience.currentTitle',
      patterns: [/\b(current\s*title|current\s*position|current\s*role)\b/i],
      confidence: 0.85,
      getValue: (p) => p.experience[0]?.position || '',
    },

    // --- SKILLS & CONCEPTS (short tag inputs) ---
    {
      field: 'skills.programmingLanguages',
      patterns: [/\b(programming\s*languages|coding\s*languages|tech\s*stack|languages\s*known)\b/i],
      confidence: 0.88,
      getValue: (p) => p.skills.programmingLanguages.join(', '),
    },
    {
      field: 'skills.aiMlConcepts',
      patterns: [/\b(ai\s*skills|ai\s*concepts|ml\s*concepts)\b/i],
      confidence: 0.85,
      getValue: (p) => p.skills.aiMlConcepts.join(', '),
    },
  ];

  async mapFields(
    fields: DetectedField[],
    profile: Profile,
    job?: Partial<JobDescription>
  ): Promise<FieldMapping[]> {
    const mappings: FieldMapping[] = [];

    for (const field of fields) {
      if (field.type === 'hidden' || field.type === 'password') {
        continue;
      }

      const match = await this.mapSingleField(field, profile, job);
      mappings.push(match);
    }

    return mappings;
  }

  private async mapSingleField(
    field: DetectedField,
    profile: Profile,
    job?: Partial<JobDescription>
  ): Promise<FieldMapping> {
    const combinedSignals = [
      field.label,
      field.placeholder,
      field.name,
      field.htmlId,
      field.ariaLabel,
      field.contextualText,
    ]
      .filter(Boolean)
      .join(' ');

    // 1. Question / Long-form Textarea detection runs FIRST to prevent simple keyword collisions
    const isQuestion =
      field.type === 'textarea' ||
      /\b(why|how|describe|tell\s*us|explain|what\s*makes|goals|project|experience\s*with)\b/i.test(
        combinedSignals
      );

    if (isQuestion) {
      const answerResult = await this.gemini.generateAnswer({
        question: field.label || field.placeholder || field.contextualText || 'Describe your qualifications',
        fieldLabel: field.label,
        maxLength: field.maxLength || 250,
        jobDescription: job,
        profile,
      });

      return {
        fieldId: field.id,
        fieldName: field.name,
        originalLabel: field.label || field.placeholder || field.name,
        detectedMeaning: 'Application Question (AI Generated)',
        profilePath: 'ai.answer',
        suggestedValue: answerResult.answer,
        confidence: 0.75,
        source: 'ai_generated',
        status: 'pending', // Always requires user review!
        isAiSuggestion: true,
        explanation: `Evidence: ${answerResult.evidenceUsed.join(', ')}`,
      };
    }

    // 2. Exact attribute matching
    const attrMatch = this.checkAttributeMatch(field, profile);
    if (attrMatch) {
      return attrMatch;
    }

    // 3. Rule-based pattern matching
    for (const rule of this.rules) {
      const isMatch = rule.patterns.some((pattern) => pattern.test(combinedSignals));
      if (isMatch) {
        const value = rule.getValue(profile, field, job);
        if (value) {
          const finalVal = field.type === 'select' ? this.matchSelectOption(field, value) : value;

          return {
            fieldId: field.id,
            fieldName: field.name,
            originalLabel: field.label || field.placeholder || field.name,
            detectedMeaning: rule.field,
            profilePath: rule.field,
            suggestedValue: finalVal,
            confidence: rule.confidence,
            source: 'label_match',
            status: rule.confidence >= 0.85 ? 'approved' : 'pending',
          };
        }
      }
    }

    // 4. Fallback: Unmapped / Missing information
    return {
      fieldId: field.id,
      fieldName: field.name,
      originalLabel: field.label || field.placeholder || field.name || 'Unlabeled field',
      detectedMeaning: 'Unknown field',
      profilePath: '',
      suggestedValue: '',
      confidence: 0.1,
      source: 'semantic_match',
      status: 'missing',
    };
  }

  private checkAttributeMatch(field: DetectedField, profile: Profile): FieldMapping | null {
    const nameLower = (field.name || '').toLowerCase();
    const typeLower = (field.type || '').toLowerCase();

    if (typeLower === 'email' || nameLower === 'email') {
      return {
        fieldId: field.id,
        fieldName: field.name,
        originalLabel: field.label || 'Email',
        detectedMeaning: 'personal.email',
        profilePath: 'personal.email',
        suggestedValue: profile.personal.email,
        confidence: 1.0,
        source: 'exact_match',
        status: 'approved',
      };
    }

    if (typeLower === 'tel' || nameLower === 'phone' || nameLower === 'tel' || nameLower === 'mobile') {
      return {
        fieldId: field.id,
        fieldName: field.name,
        originalLabel: field.label || 'Phone',
        detectedMeaning: 'personal.phone',
        profilePath: 'personal.phone',
        suggestedValue: profile.personal.phone,
        confidence: 1.0,
        source: 'exact_match',
        status: 'approved',
      };
    }

    return null;
  }

  private matchSelectOption(field: DetectedField, desiredValue: string): string {
    if (!field.options || field.options.length === 0) return desiredValue;
    const lower = desiredValue.toLowerCase();

    const exact = field.options.find(
      (opt) => opt.value.toLowerCase() === lower || opt.text.toLowerCase() === lower
    );
    if (exact) return exact.value || exact.text;

    const substring = field.options.find(
      (opt) => opt.text.toLowerCase().includes(lower) || lower.includes(opt.text.toLowerCase())
    );
    if (substring) return substring.value || substring.text;

    return desiredValue;
  }
}
