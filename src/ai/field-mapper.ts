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
    // --- EDUCATION ---
    {
      field: 'education.institution',
      patterns: [/\b(university|college|institution|school|institute|alma\s*mater)\b/i],
      confidence: 0.92,
      getValue: (p) => p.education.institution,
    },
    {
      field: 'education.degree',
      patterns: [/\b(degree|qualification|degree\s*level|education\s*level|course)\b/i],
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
      patterns: [/\b(graduat(ion|ing)|end\s*date|completion\s*date|expected\s*graduat|batch|passing\s*year|year\s*of\s*graduat)\b/i],
      confidence: 0.88,
      getValue: (p, f) => {
        const text = `${f.label} ${f.name}`.toLowerCase();
        // If field specifically asks for year (e.g. "Year of Graduation", "Passing Year", "Batch") or numeric input
        if (/\b(year|batch)\b/i.test(text) || f.type === 'number') {
          const match = p.education.expectedGraduation.match(/\b(20\d\d)\b/);
          if (match) return match[1];
        }
        return p.education.expectedGraduation;
      },
    },

    // --- PERSONAL INFO ---
    {
      field: 'personal.fullName',
      patterns: [
        /\b(full\s*name|candidate\s*name|applicant\s*name|your\s*name|legal\s*name|student\s*name)\b/i,
        /^(name|fullname|candidate_name|applicant_name)$/i,
        /\bname\b/i,
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
      patterns: [/\b(e-?mail|email\s*address|electronic\s*mail|college\s*email)\b/i, /^email$/i],
      confidence: 0.98,
      getValue: (p) => p.personal.email,
    },
    {
      field: 'personal.phone',
      patterns: [/\b(phone|mobile|cell|contact\s*number|telephone|whatsapp)\b/i, /^phone$/i],
      confidence: 0.95,
      getValue: (p) => p.personal.phone,
    },
    {
      field: 'personal.location',
      patterns: [/\b(location|city|current\s*city|residence|current\s*location|where\s*are\s*you\s*(based|located)|state)\b/i],
      confidence: 0.88,
      getValue: (p) => p.personal.location,
    },
    {
      field: 'personal.linkedin',
      patterns: [/\b(linkedin|linked\s*in|linkedin\s*url|linkedin\s*profile|linkedin\s*link)\b/i],
      confidence: 0.95,
      getValue: (p) => p.personal.linkedin || '',
    },
    {
      field: 'personal.github',
      patterns: [/\b(github|git\s*hub|github\s*url|github\s*profile|github\s*link)\b/i],
      confidence: 0.95,
      getValue: (p) => p.personal.github || '',
    },
    {
      field: 'personal.portfolio',
      patterns: [/\b(portfolio|personal\s*website|personal\s*url|homepage|website\s*link)\b/i],
      confidence: 0.95,
      getValue: (p) => p.personal.portfolio || '',
    },
    {
      field: 'personal.resumeLink',
      patterns: [/\b(resume\s*(link|url)|cv\s*(link|url)|drive\s*link|google\s*drive)\b/i],
      confidence: 0.9,
      getValue: (p) => p.personal.portfolio || 'https://ashmityadav.in',
    },

    // --- SOURCE / "HOW DID YOU HEAR ABOUT US?" ---
    {
      field: 'application.source',
      patterns: [
        /\b(how\s*did\s*you\s*(hear|learn|find)|where\s*did\s*you\s*(hear|find|see)|referral\s*source|^source$)\b/i,
      ],
      confidence: 0.9,
      getValue: () => 'LinkedIn',
    },

    // --- WORK AUTHORIZATION & INTERNSHIP AVAILABILITY ---
    {
      field: 'application.workAuth',
      patterns: [/\b(authorized\s*to\s*work|legally\s*authorized|work\s*authorization)\b/i],
      confidence: 0.9,
      getValue: () => 'Yes',
    },
    {
      field: 'application.sponsorship',
      patterns: [/\b(require\s*(visa\s*)?sponsorship|need\s*(visa\s*)?sponsorship)\b/i],
      confidence: 0.9,
      getValue: () => 'No',
    },
    {
      field: 'application.availability',
      patterns: [
        /\b(available\s*for.*internship|duration\s*of\s*internship|immediate\s*join|months?\s*internship|available\s*to\s*start|earliest\s*start|notice\s*period)\b/i,
      ],
      confidence: 0.9,
      getValue: () => 'Yes, available immediately',
    },
    {
      field: 'application.relocation',
      patterns: [/\b(willing\s*to\s*relocate|open\s*to\s*relocation)\b/i],
      confidence: 0.88,
      getValue: () => 'Yes',
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
      patterns: [/\b(programming\s*languages|coding\s*languages|tech\s*stack|languages\s*known|skills|technical\s*skills)\b/i],
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

    // 1. Cover Letter Detection (Textarea or Text field)
    const isCoverLetter = /\b(cover\s*letter|letter\s*of\s*motivation|statement\s*of\s*purpose|personal\s*statement|letter\s*of\s*interest)\b/i.test(
      combinedSignals
    );

    if (isCoverLetter) {
      const coverLetterResult = this.gemini.generateCoverLetter(job, profile, field.maxLength || 450);
      return {
        fieldId: field.id,
        fieldName: field.name,
        originalLabel: field.label || field.placeholder || 'Cover Letter',
        detectedMeaning: 'Cover Letter (AI Tailored)',
        profilePath: 'ai.cover_letter',
        suggestedValue: coverLetterResult.answer,
        confidence: 0.88,
        source: 'ai_generated',
        status: 'approved',
        isAiSuggestion: true,
        explanation: `Tailored for ${job?.company || 'Company'} citing NIET education, Bytesav internship & Production-Level RAG.`,
      };
    }

    // 2. Exact attribute matching
    const attrMatch = this.checkAttributeMatch(field, profile);
    if (attrMatch) {
      return attrMatch;
    }

    // 3. Rule-based pattern matching (Higher priority for deterministic contact / academic details)
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
            status: 'approved',
          };
        }
      }
    }

    // 4. Open-ended Application Questions / Textareas (AI answers)
    const isQuestion =
      field.type === 'textarea' ||
      /\b(why|how|describe|tell\s*us|explain|what\s*makes|goals|project|experience\s*with|challenge|situation|proud\s*of|interest\s*in|strengths|weaknesses)\b/i.test(
        combinedSignals
      ) ||
      combinedSignals.includes('?');

    if (isQuestion) {
      const answerResult = await this.gemini.generateAnswer({
        question: field.label || field.placeholder || field.contextualText || 'Describe your qualifications',
        fieldLabel: field.label,
        maxLength: field.maxLength || 350,
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
        confidence: 0.85,
        source: 'ai_generated',
        status: 'approved',
        isAiSuggestion: true,
        explanation: `Evidence: ${answerResult.evidenceUsed.join(', ')}`,
      };
    }

    // 5. Fallback: Unmapped / Missing information
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

    if (lower.includes('linkedin')) {
      const opt = field.options.find((o) =>
        /linkedin|job\s*board|online|internet|social|career/i.test(o.text)
      );
      if (opt) return opt.value || opt.text;
    }

    if (lower.includes('yes') || lower.includes('immediate')) {
      const opt = field.options.find((o) => /yes|true|authorized|immediate/i.test(o.text) || o.value === 'yes' || o.value === '1');
      if (opt) return opt.value || opt.text;
    }

    return desiredValue;
  }
}
