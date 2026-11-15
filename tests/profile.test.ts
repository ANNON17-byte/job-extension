import { describe, it, expect } from 'vitest';
import { seedProfile } from '../src/data/seed-profile';
import { ProfileSchema } from '../src/types/profile';
import { validateProfile, calculateProfileCompleteness } from '../src/utils/validation';

describe('Profile Validation & Seed Integrity', () => {
  it('validates seed profile against Zod schema without errors', () => {
    const parsed = ProfileSchema.safeParse(seedProfile);
    expect(parsed.success).toBe(true);
  });

  it('contains Ashmit Yadav exact verified personal details', () => {
    expect(seedProfile.personal.fullName).toBe('Ashmit Yadav');
    expect(seedProfile.personal.email).toBe('info.ashmit@gmail.com');
    expect(seedProfile.personal.phone).toBe('+91 9918510327');
    expect(seedProfile.personal.location).toBe('Greater Noida, Uttar Pradesh, India');
    expect(seedProfile.personal.github).toBe('https://github.com/ANNON17-byte');
    expect(seedProfile.personal.linkedin).toContain('ashmit-yadav-49b445327');
    expect(seedProfile.personal.portfolio).toBe('https://ashmityadav.in');
  });

  it('contains NIET Computer Science B.Tech academic details', () => {
    expect(seedProfile.education.institution).toBe(
      'Noida Institute of Engineering and Technology (NIET)'
    );
    expect(seedProfile.education.degree).toBe('Bachelor of Technology (B.Tech)');
    expect(seedProfile.education.specialization).toBe('Computer Science and Engineering');
    expect(seedProfile.education.expectedGraduation).toBe('June 2028');
    expect(seedProfile.education.gpa).toBe('3.50/4.00');
    expect(seedProfile.education.concentrations).toContain('Generative AI');
    expect(seedProfile.education.concentrations).toContain('Large Language Models');
  });

  it('contains all 3 verified experiences: Bytesav, Tipy Tipy Tap, Shigora.com', () => {
    expect(seedProfile.experience.length).toBe(3);
    const companies = seedProfile.experience.map((e) => e.company);
    expect(companies).toContain('Bytesav');
    expect(companies).toContain('Tipy Tipy Tap');
    expect(companies).toContain('Shigora.com');
  });

  it('contains structured verified projects: Production-Level RAG and GPT-2 (124M)', () => {
    expect(seedProfile.projects.length).toBe(2);
    const names = seedProfile.projects.map((p) => p.name);
    expect(names).toContain('Production-Level RAG');
    expect(names).toContain('GPT-2 (124M) From Scratch');

    const rag = seedProfile.projects.find((p) => p.name.includes('RAG'));
    expect(rag?.technologies).toContain('pgvector');
    expect(rag?.technologies).toContain('FAISS');
    expect(rag?.evaluationMetrics).toContain('Context Precision');
  });

  it('calculates 100% completeness on full profile', () => {
    const result = calculateProfileCompleteness(seedProfile);
    expect(result.percentage).toBe(100);
    expect(result.missingFields.length).toBe(0);
  });
});

