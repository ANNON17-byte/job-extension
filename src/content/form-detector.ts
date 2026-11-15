import type { FormDetectionResult, DetectedField, JobDescription } from '../types/form';
import { FieldExtractor } from './field-extractor';
import { classifyJobCategory } from '../utils/matching';

export class FormDetector {
  private extractor = new FieldExtractor();
  private observer: MutationObserver | null = null;
  private onFormDetectedCallback?: (result: FormDetectionResult) => void;

  detect(): FormDetectionResult {
    const fields = this.extractor.extractFields();
    const hasForm = fields.length > 0;
    const isApplicationForm = this.checkIsApplicationForm(fields);

    const { company, title } = this.extractCompanyAndJobTitle();

    return {
      hasForm,
      isApplicationForm,
      formCount: document.querySelectorAll('form').length || (hasForm ? 1 : 0),
      fields,
      pageUrl: window.location.href,
      pageTitle: document.title,
      detectedCompany: company,
      detectedJobTitle: title,
    };
  }

  private checkIsApplicationForm(fields: DetectedField[]): boolean {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();

    // 1. Check Known ATS and Job Boards in URL
    const atsPatterns = [
      'greenhouse.io',
      'lever.co',
      'workday.com',
      'myworkdayjobs.com',
      'ashbyhq.com',
      'bamboohr.com',
      'smartrecruiters.com',
      'icims.com',
      'taleo.net',
      'linkedin.com/jobs',
      'indeed.com',
      'joinhandshake.com',
      'wellfound.com',
      '/careers',
      '/jobs',
      '/apply',
      '/internships',
    ];

    const isAtsUrl = atsPatterns.some((pattern) => url.includes(pattern));

    // 2. Check keywords in Page Title or Header
    const applicationKeywords = [
      'application',
      'apply',
      'intern',
      'internship',
      'career',
      'job',
      'opening',
      'candidate',
      'resume',
      'curriculum vitae',
    ];

    const hasKeywordInTitle = applicationKeywords.some((kw) => title.includes(kw));

    // 3. Check Detected Field Attributes (email, resume file, phone, linkedin, github)
    let score = 0;
    if (isAtsUrl) score += 3;
    if (hasKeywordInTitle) score += 2;

    for (const f of fields) {
      const combined = `${f.name} ${f.label} ${f.placeholder} ${f.type}`.toLowerCase();
      if (combined.includes('resume') || f.type === 'file') score += 3;
      if (f.type === 'email' || combined.includes('email')) score += 2;
      if (f.type === 'tel' || combined.includes('phone')) score += 2;
      if (combined.includes('linkedin') || combined.includes('github') || combined.includes('portfolio')) score += 2;
      if (combined.includes('education') || combined.includes('university') || combined.includes('degree')) score += 2;
    }

    return score >= 4 || (isAtsUrl && fields.length >= 2);
  }

  private extractCompanyAndJobTitle(): { company?: string; title?: string } {
    let company: string | undefined;
    let title: string | undefined;

    // 1. Check Greenhouse / Lever meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');

    if (ogSiteName) {
      company = ogSiteName.trim();
    }

    if (ogTitle) {
      // Often in format "Job Title - Company" or "Job Title at Company"
      const parts = ogTitle.split(/ - | at | \| /);
      if (parts.length >= 2) {
        title = parts[0].trim();
        if (!company) company = parts[1].trim();
      } else {
        title = ogTitle.trim();
      }
    }

    // 2. Check DOM headings (h1, h2)
    if (!title) {
      const h1 = document.querySelector('h1');
      if (h1 && h1.textContent) {
        const text = h1.textContent.trim();
        if (text.length > 3 && text.length < 80) {
          title = text;
        }
      }
    }

    // 3. Fallback to document title
    if (!title && document.title) {
      const docParts = document.title.split(/ - | \| |: /);
      if (docParts.length >= 2) {
        title = docParts[0].trim();
        if (!company) company = docParts[1].trim();
      } else {
        title = document.title.trim();
      }
    }

    // 4. Fallback hostname for company
    if (!company) {
      try {
        const host = window.location.hostname.replace('www.', '').split('.')[0];
        if (host && !['jobs', 'careers', 'boards'].includes(host)) {
          company = host.charAt(0).toUpperCase() + host.slice(1);
        }
      } catch {
        // ignore
      }
    }

    return { company, title };
  }

  extractJobDescription(): Partial<JobDescription> {
    const { company = 'Company', title = 'Opportunity' } = this.extractCompanyAndJobTitle();
    const bodyText = document.body ? document.body.innerText || '' : '';
    const category = classifyJobCategory(title, bodyText);

    return {
      company,
      title,
      category,
      rawText: bodyText.slice(0, 4000),
    };
  }

  startObserving(callback: (result: FormDetectionResult) => void): void {
    this.onFormDetectedCallback = callback;
    if (this.observer) this.observer.disconnect();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    this.observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const result = this.detect();
        if (result.hasForm && this.onFormDetectedCallback) {
          this.onFormDetectedCallback(result);
        }
      }, 800);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  }

  stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

