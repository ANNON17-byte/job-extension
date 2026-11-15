import { describe, it, expect, beforeEach } from 'vitest';
import { FieldExtractor } from '../src/content/field-extractor';
import { FieldMapper } from '../src/ai/field-mapper';
import { AutofillEngine } from '../src/content/autofill-engine';
import { seedProfile } from '../src/data/seed-profile';

describe('Google Forms Detection & Autofill Integration', () => {
  beforeEach(() => {
    // Exact realistic DOM representation of a Google Form application
    document.body.innerHTML = `
      <div class="m2">
        <!-- Question 1: Full Name -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div role="heading" aria-level="3" id="i1" class="M7eMe">
              Full Name <span class="v3Duub" aria-label="Required question">*</span>
            </div>
            <div class="Xb9hP">
              <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" autocomplete="off" aria-labelledby="i1 i4" value="" />
            </div>
          </div>
        </div>

        <!-- Question 2: Email Address -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div role="heading" aria-level="3" id="i5" class="M7eMe">
              Email Address <span class="v3Duub" aria-label="Required question">*</span>
            </div>
            <div class="Xb9hP">
              <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" autocomplete="off" aria-labelledby="i5 i8" value="" />
            </div>
          </div>
        </div>

        <!-- Question 3: Contact / Phone Number -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div role="heading" aria-level="3" id="i9" class="M7eMe">
              Phone / Contact Number <span class="v3Duub">*</span>
            </div>
            <div class="Xb9hP">
              <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" autocomplete="off" aria-labelledby="i9 i12" value="" />
            </div>
          </div>
        </div>

        <!-- Question 4: College / University -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div role="heading" aria-level="3" id="i13" class="M7eMe">
              College or University Name
            </div>
            <div class="Xb9hP">
              <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" autocomplete="off" aria-labelledby="i13 i16" value="" />
            </div>
          </div>
        </div>

        <!-- Question 5: Degree / Branch -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div role="heading" aria-level="3" id="i17" class="M7eMe">
              Degree & Branch
            </div>
            <div class="Xb9hP">
              <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" autocomplete="off" aria-labelledby="i17 i20" value="" />
            </div>
          </div>
        </div>

        <!-- Question 6: LinkedIn / Portfolio Link -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div role="heading" aria-level="3" id="i21" class="M7eMe">
              LinkedIn Profile Link
            </div>
            <div class="Xb9hP">
              <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" autocomplete="off" aria-labelledby="i21 i24" value="" />
            </div>
          </div>
        </div>

        <!-- Question 7: Why do you want to join us? -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div role="heading" aria-level="3" id="i25" class="M7eMe">
              Why do you want to join our internship program?
            </div>
            <div class="Xb9hP">
              <textarea class="KHxj8b tL9Produce" jsname="YPqjbf" aria-labelledby="i25 i28"></textarea>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  it('correctly extracts labels from all 7 Google Form fields', () => {
    const extractor = new FieldExtractor();
    const fields = extractor.extractFields();

    expect(fields.length).toBe(7);
    expect(fields[0].label).toBe('Full Name');
    expect(fields[1].label).toBe('Email Address');
    expect(fields[2].label).toBe('Phone / Contact Number');
    expect(fields[3].label).toBe('College or University Name');
    expect(fields[4].label).toBe('Degree & Branch');
    expect(fields[5].label).toBe('LinkedIn Profile Link');
    expect(fields[6].label).toBe('Why do you want to join our internship program?');
  });

  it('maps all 7 Google Form fields to candidate profile and AI answers', async () => {
    const extractor = new FieldExtractor();
    const fields = extractor.extractFields();
    const mapper = new FieldMapper();

    const mappings = await mapper.mapFields(fields, seedProfile, {
      company: 'TechCorp',
      title: 'AI Intern',
    });

    expect(mappings.length).toBe(7);

    // 1. Name
    expect(mappings[0].suggestedValue).toBe('Ashmit Yadav');
    expect(mappings[0].status).not.toBe('missing');

    // 2. Email
    expect(mappings[1].suggestedValue).toBe('info.ashmit@gmail.com');
    expect(mappings[1].status).not.toBe('missing');

    // 3. Phone
    expect(mappings[2].suggestedValue).toBe('+91 9918510327');
    expect(mappings[2].status).not.toBe('missing');

    // 4. College
    expect(mappings[3].suggestedValue).toBe(
      'Noida Institute of Engineering and Technology (NIET)'
    );
    expect(mappings[3].status).not.toBe('missing');

    // 5. Degree
    expect(mappings[4].suggestedValue).toBe('Bachelor of Technology (B.Tech)');
    expect(mappings[4].status).not.toBe('missing');

    // 6. LinkedIn
    expect(mappings[5].suggestedValue).toBe(
      'https://www.linkedin.com/in/ashmit-yadav-49b445327'
    );
    expect(mappings[5].status).not.toBe('missing');

    // 7. Why join question (AI answer)
    expect(mappings[6].suggestedValue).toContain('NIET');
    expect(mappings[6].suggestedValue).toContain('Bytesav');
    expect(mappings[6].status).not.toBe('missing');
  });

  it('populates all 7 fields in the Google Form without skipping', async () => {
    const extractor = new FieldExtractor();
    const fields = extractor.extractFields();
    const mapper = new FieldMapper();

    const mappings = await mapper.mapFields(fields, seedProfile, {
      company: 'TechCorp',
      title: 'AI Intern',
    });

    const autofill = new AutofillEngine();
    const result = await autofill.fillFields(mappings);

    expect(result.filledCount).toBe(7);
    expect(result.skippedCount).toBe(0);

    const inputs = document.querySelectorAll('input.whsOnd');
    expect((inputs[0] as HTMLInputElement).value).toBe('Ashmit Yadav');
    expect((inputs[1] as HTMLInputElement).value).toBe('info.ashmit@gmail.com');
    expect((inputs[2] as HTMLInputElement).value).toBe('+91 9918510327');
    expect((inputs[3] as HTMLInputElement).value).toBe(
      'Noida Institute of Engineering and Technology (NIET)'
    );

    const textarea = document.querySelector('textarea.KHxj8b') as HTMLTextAreaElement;
    expect(textarea.value.length).toBeGreaterThan(20);
  });
});
