import { describe, it, expect } from 'vitest';
import { FieldMapper } from '../src/ai/field-mapper';
import { seedProfile } from '../src/data/seed-profile';
import type { DetectedField } from '../src/types/form';

describe('Hybrid Field Matching Engine', () => {
  const mapper = new FieldMapper();

  it('correctly maps university / college field to education.institution with high confidence', async () => {
    const field: DetectedField = {
      id: 'field-1',
      name: 'university',
      htmlId: 'university_id',
      type: 'text',
      label: 'Enter your current university',
      placeholder: 'College or University name',
      ariaLabel: '',
      required: true,
      currentValue: '',
      options: [],
      contextualText: 'Education Background',
    };

    const mappings = await mapper.mapFields([field], seedProfile);
    expect(mappings.length).toBe(1);
    expect(mappings[0].profilePath).toBe('education.institution');
    expect(mappings[0].suggestedValue).toBe(
      'Noida Institute of Engineering and Technology (NIET)'
    );
    expect(mappings[0].confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('correctly maps CGPA / GPA field to education.gpa', async () => {
    const field: DetectedField = {
      id: 'field-gpa',
      name: 'cgpa',
      htmlId: 'cgpa_input',
      type: 'text',
      label: 'Provide your CGPA',
      placeholder: 'e.g. 3.5',
      ariaLabel: '',
      required: false,
      currentValue: '',
      options: [],
      contextualText: '',
    };

    const mappings = await mapper.mapFields([field], seedProfile);
    expect(mappings[0].profilePath).toBe('education.gpa');
    expect(mappings[0].suggestedValue).toBe('3.50/4.00');
  });

  it('correctly maps GitHub link to personal.github', async () => {
    const field: DetectedField = {
      id: 'field-gh',
      name: 'github_profile',
      htmlId: '',
      type: 'url',
      label: 'Link to your GitHub',
      placeholder: 'https://github.com/...',
      ariaLabel: '',
      required: false,
      currentValue: '',
      options: [],
      contextualText: '',
    };

    const mappings = await mapper.mapFields([field], seedProfile);
    expect(mappings[0].profilePath).toBe('personal.github');
    expect(mappings[0].suggestedValue).toBe('https://github.com/ANNON17-byte');
  });

  it('correctly identifies contextual questions and tags as AI suggestions', async () => {
    const field: DetectedField = {
      id: 'field-rag-q',
      name: 'rag_experience',
      htmlId: 'q_rag',
      type: 'textarea',
      label: 'Describe your experience with Retrieval-Augmented Generation',
      placeholder: '',
      ariaLabel: '',
      required: true,
      currentValue: '',
      options: [],
      contextualText: '',
    };

    const mappings = await mapper.mapFields([field], seedProfile);
    expect(mappings[0].source).toBe('ai_generated');
    expect(mappings[0].isAiSuggestion).toBe(true);
    expect(mappings[0].suggestedValue).toContain('Bytesav');
    expect(mappings[0].suggestedValue).toContain('Production-Level RAG');
  });

  it('generates a tailored cover letter based on job context and profile', async () => {
    const field: DetectedField = {
      id: 'field-cover',
      name: 'cover_letter',
      htmlId: 'cover_letter_box',
      type: 'textarea',
      label: 'Cover Letter',
      placeholder: 'Add a cover letter for the hiring manager',
      ariaLabel: '',
      required: false,
      currentValue: '',
      options: [],
      contextualText: '',
    };

    const job = {
      company: 'Anthropic',
      title: 'AI Research Intern',
      requiredSkills: ['Python', 'PyTorch', 'RAG'],
    };

    const mappings = await mapper.mapFields([field], seedProfile, job);
    expect(mappings[0].profilePath).toBe('ai.cover_letter');
    expect(mappings[0].suggestedValue).toContain('Anthropic');
    expect(mappings[0].suggestedValue).toContain('AI Research Intern');
    expect(mappings[0].suggestedValue).toContain('Bytesav');
    expect(mappings[0].suggestedValue).toContain('Production-Level RAG');
  });

  it('correctly populates "How did you hear about us?" source field', async () => {
    const field: DetectedField = {
      id: 'field-source',
      name: 'referral_source',
      htmlId: '',
      type: 'text',
      label: 'How did you hear about us?',
      placeholder: '',
      ariaLabel: '',
      required: false,
      currentValue: '',
      options: [],
      contextualText: '',
    };

    const mappings = await mapper.mapFields([field], seedProfile);
    expect(mappings[0].profilePath).toBe('application.source');
    expect(mappings[0].suggestedValue).toContain('LinkedIn');
  });
});
