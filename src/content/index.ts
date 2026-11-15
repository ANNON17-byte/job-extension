import { FormDetector } from './form-detector';
import { FieldMapper } from '../ai/field-mapper';
import { AutofillEngine } from './autofill-engine';
import { InPageReviewDrawer } from './ui/ReviewDrawer';
import { storageService } from '../services/storage';
import { calculateJobProfileMatch } from '../utils/matching';
import type { FieldMapping, FormDetectionResult, JobDescription } from '../types/form';
import type { Profile } from '../types/profile';
import type { ExtensionMessage } from '../services/messaging';

class ContentAssistant {
  private detector = new FormDetector();
  private mapper = new FieldMapper();
  private autofill = new AutofillEngine();
  private drawer = new InPageReviewDrawer();

  private profile: Profile | null = null;
  private currentDetection: FormDetectionResult | null = null;
  private currentMappings: FieldMapping[] = [];
  private jobDescription: Partial<JobDescription> | null = null;
  private matchScore = 0;

  async init(): Promise<void> {
    // 1. Fetch saved profile and settings
    this.profile = await storageService.getProfile();
    const settings = await storageService.getSettings();
    if (settings.geminiApiKey) {
      this.mapper = new FieldMapper(settings.geminiApiKey);
    }

    // 2. Perform initial detection
    this.detectAndPrepare();

    // 3. Observe dynamic SPA DOM changes
    this.detector.startObserving(() => {
      this.detectAndPrepare();
    });

    // 4. Setup Chrome runtime message listener
    this.setupMessageListener();
  }

  private async detectAndPrepare(): Promise<void> {
    const result = this.detector.detect();
    this.currentDetection = result;

    if (!result.hasForm) return;

    if (!this.profile) {
      this.profile = await storageService.getProfile();
    }

    // Extract job details
    this.jobDescription = this.detector.extractJobDescription();
    const matchAnalysis = calculateJobProfileMatch(this.jobDescription, this.profile);
    this.matchScore = matchAnalysis.score;

    // Map fields
    this.currentMappings = await this.mapper.mapFields(
      result.fields,
      this.profile,
      this.jobDescription
    );

    // Initialize/update floating review drawer
    this.drawer.init(
      (approvedMappings) => this.applyFields(approvedMappings),
      () => this.saveCurrentApplication()
    );

    this.drawer.updateData(this.currentMappings, this.jobDescription, this.matchScore);

    // Notify background worker
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'PAGE_FORM_DETECTED',
        payload: {
          hasForm: result.hasForm,
          isApplicationForm: result.isApplicationForm,
          fieldCount: result.fields.length,
          company: result.detectedCompany || this.jobDescription.company,
          title: result.detectedJobTitle || this.jobDescription.title,
          matchScore: this.matchScore,
        },
      });
    }
  }

  private async applyFields(mappings: FieldMapping[]): Promise<void> {
    const result = await this.autofill.fillFields(mappings);
    console.log(`ApplyMate: Filled ${result.filledCount} fields, skipped ${result.skippedCount}`);

    // Update mappings state
    this.currentMappings = mappings;
    this.drawer.updateData(this.currentMappings, this.jobDescription || undefined, this.matchScore);

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'AUTOFILL_COMPLETE',
        payload: result,
      });
    }
  }

  private async saveCurrentApplication(): Promise<void> {
    if (!this.jobDescription) return;

    await storageService.addApplication({
      id: `${Date.now()}`,
      company: this.jobDescription.company || 'Unknown Company',
      position: this.jobDescription.title || 'Intern / Engineer',
      jobUrl: window.location.href,
      dateAdded: new Date().toISOString().split('T')[0],
      jobCategory: this.jobDescription.category || 'Other',
      status: 'ready_to_apply',
      matchScore: this.matchScore,
      notes: `Detected on ${window.location.hostname}. ${this.currentMappings.length} application fields identified.`,
    });
  }

  private setupMessageListener(): void {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      return;
    }

    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
      ) => {
        switch (message.type) {
          case 'DETECT_PAGE_FORM': {
            sendResponse({
              success: true,
              data: {
                detection: this.currentDetection,
                mappings: this.currentMappings,
                jobDescription: this.jobDescription,
                matchScore: this.matchScore,
              },
            });
            break;
          }
          case 'TRIGGER_AUTOFILL': {
            this.drawer.open();
            sendResponse({ success: true });
            break;
          }
          case 'OPEN_REVIEW_PANEL': {
            this.drawer.open();
            sendResponse({ success: true });
            break;
          }
          case 'CLOSE_REVIEW_PANEL': {
            this.drawer.close();
            sendResponse({ success: true });
            break;
          }
          default:
            sendResponse({ success: false, error: 'Unknown message type' });
        }
        return true;
      }
    );
  }
}

// Instantiate and initialize assistant
const assistant = new ContentAssistant();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => assistant.init());
} else {
  assistant.init();
}

