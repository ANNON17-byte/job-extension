import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyJobCategory,
  selectRelevantProjects,
  calculateJobProfileMatch,
} from '../src/utils/matching';
import { AutofillEngine } from '../src/content/autofill-engine';
import { seedProfile } from '../src/data/seed-profile';
import type { FieldMapping } from '../src/types/form';

describe('Job Categorization & Profile Grounding', () => {
  it('classifies Generative AI and LLM roles accurately', () => {
    expect(
      classifyJobCategory('Generative AI Intern', 'Experience with RAG and LLM systems')
    ).toBe('Generative AI Engineer');

    expect(
      classifyJobCategory('Machine Learning Engineer', 'PyTorch deep learning pipelines')
    ).toBe('Machine Learning Engineer');

    expect(
      classifyJobCategory('Frontend Developer', 'React.js and Tailwind CSS interfaces')
    ).toBe('Frontend Developer');
  });

  it('prioritizes Production-Level RAG and GPT-2 for Generative AI jobs', () => {
    const selected = selectRelevantProjects(
      'Generative AI Engineer',
      ['RAG', 'Vector Databases', 'Python', 'LangChain'],
      seedProfile.projects
    );

    expect(selected.length).toBeGreaterThan(0);
    expect(selected[0].name).toBe('Production-Level RAG');
  });

  it('calculates profile match score based strictly on profile evidence', () => {
    const job = {
      title: 'Generative AI Intern',
      requiredSkills: ['Python', 'RAG', 'FAISS', 'pgvector', 'PyTorch'],
      rawText: 'Looking for a GenAI intern with hands-on RAG experience',
    };

    const match = calculateJobProfileMatch(job, seedProfile);
    expect(match.matchedSkills).toContain('Python');
    expect(match.matchedSkills).toContain('PyTorch');
    expect(match.score).toBeGreaterThanOrEqual(75);
    expect(match.missingSkills.length).toBe(0);
  });
});

describe('Autofill Engine Safety Rules', () => {
  let engine: AutofillEngine;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="app-form">
        <input id="user_full_name" name="full_name" type="text" />
        <input id="user_email" name="email" type="email" />
        <input id="prefilled_field" name="prefilled" type="text" value="User Typed This Already" />
      </form>
    `;
    engine = new AutofillEngine();
  });

  it('populates empty inputs with approved mappings', async () => {
    const mappings: FieldMapping[] = [
      {
        fieldId: 'user_full_name',
        fieldName: 'full_name',
        originalLabel: 'Full Name',
        detectedMeaning: 'personal.fullName',
        profilePath: 'personal.fullName',
        suggestedValue: 'Ashmit Yadav',
        confidence: 0.95,
        source: 'label_match',
        status: 'approved',
      },
    ];

    const result = await engine.fillFields(mappings);
    expect(result.filledCount).toBe(1);

    const input = document.getElementById('user_full_name') as HTMLInputElement;
    expect(input.value).toBe('Ashmit Yadav');
  });

  it('never overwrites existing user entered values without explicit overwrite permission', async () => {
    const mappings: FieldMapping[] = [
      {
        fieldId: 'prefilled_field',
        fieldName: 'prefilled',
        originalLabel: 'Pre-filled Field',
        detectedMeaning: 'notes',
        profilePath: 'notes',
        suggestedValue: 'New Overwrite Attempt',
        confidence: 0.95,
        source: 'label_match',
        status: 'approved',
      },
    ];

    const result = await engine.fillFields(mappings, { overwriteExisting: false });
    expect(result.skippedCount).toBe(1);

    const input = document.getElementById('prefilled_field') as HTMLInputElement;
    expect(input.value).toBe('User Typed This Already');
  });

  it('skips fields marked as rejected or missing', async () => {
    const mappings: FieldMapping[] = [
      {
        fieldId: 'user_email',
        fieldName: 'email',
        originalLabel: 'Email',
        detectedMeaning: 'personal.email',
        profilePath: 'personal.email',
        suggestedValue: 'info.ashmit@gmail.com',
        confidence: 0.95,
        source: 'label_match',
        status: 'rejected',
      },
    ];

    const result = await engine.fillFields(mappings);
    expect(result.filledCount).toBe(0);
    expect(result.skippedCount).toBe(1);

    const input = document.getElementById('user_email') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});

