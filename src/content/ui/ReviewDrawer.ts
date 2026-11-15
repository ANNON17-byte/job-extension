import type { FieldMapping, FormDetectionResult, JobDescription } from '../../types/form';
import type { Profile } from '../../types/profile';
import { getConfidenceColor, getConfidenceLabel } from '../../utils/confidence';

export class InPageReviewDrawer {
  private container: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private isOpen = false;
  private mappings: FieldMapping[] = [];
  private jobInfo?: Partial<JobDescription>;
  private matchScore = 0;
  private onApplyCallback?: (mappings: FieldMapping[]) => void;
  private onSaveAppCallback?: () => void;

  init(
    onApply: (mappings: FieldMapping[]) => void,
    onSaveApp?: () => void
  ): void {
    this.onApplyCallback = onApply;
    this.onSaveAppCallback = onSaveApp;

    if (document.getElementById('applymate-root')) {
      return;
    }

    this.container = document.createElement('div');
    this.container.id = 'applymate-root';
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '2147483647';
    this.container.style.bottom = '20px';
    this.container.style.right = '20px';
    this.container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    this.shadow = this.container.attachShadow({ mode: 'open' });
    document.body.appendChild(this.container);

    this.render();
  }

  updateData(
    mappings: FieldMapping[],
    jobInfo?: Partial<JobDescription>,
    matchScore = 0
  ): void {
    this.mappings = mappings;
    this.jobInfo = jobInfo;
    this.matchScore = matchScore;
    this.render();
  }

  open(): void {
    this.isOpen = true;
    this.render();
  }

  close(): void {
    this.isOpen = false;
    this.render();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.render();
  }

  private render(): void {
    if (!this.shadow) return;

    const highConfidenceCount = this.mappings.filter((m) => m.confidence >= 0.85).length;
    const aiCount = this.mappings.filter((m) => m.source === 'ai_generated').length;
    const missingCount = this.mappings.filter((m) => m.status === 'missing').length;

    this.shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .badge-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          border-radius: 9999px;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          user-select: none;
        }
        .badge-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.5);
          background: #1e293b;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .drawer-overlay {
          display: ${this.isOpen ? 'flex' : 'none'};
          flex-direction: column;
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 440px;
          max-height: 82vh;
          background: #090d16;
          color: #e2e8f0;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          overflow: hidden;
          z-index: 999999;
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .drawer-header {
          padding: 16px 20px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .drawer-body {
          padding: 16px 20px;
          overflow-y: auto;
          max-height: calc(82vh - 160px);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .field-card {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 0.15s;
        }
        .field-card:hover {
          border-color: rgba(255, 255, 255, 0.18);
        }
        .field-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 6px;
        }
        .status-green { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        .status-yellow { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .status-red { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
        .field-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 13px;
          outline: none;
          resize: vertical;
        }
        .field-input:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
        }
        .field-actions {
          display: flex;
          gap: 6px;
          justify-content: flex-end;
          margin-top: 4px;
        }
        .btn-action {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 3px 8px;
          font-size: 11px;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-action:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .drawer-footer {
          padding: 14px 20px;
          background: rgba(15, 23, 42, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-apply {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: #fff;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.15s;
        }
        .btn-apply:hover { opacity: 0.92; }
        .disclaimer {
          font-size: 11px;
          color: #64748b;
          text-align: center;
          line-height: 1.4;
        }
      </style>

      <!-- FLOATING PILL -->
      <div id="btn-toggle" class="badge-pill" style="display: ${this.isOpen ? 'none' : 'flex'}">
        <span class="pulse-dot"></span>
        <span>ApplyMate: <strong>${this.mappings.length} Fields</strong></span>
        ${this.matchScore > 0 ? `<span style="background: rgba(16, 185, 129, 0.25); color: #34d399; padding: 2px 6px; border-radius: 9999px; font-size: 11px;">${this.matchScore}% Match</span>` : ''}
      </div>

      <!-- EXPANDED DRAWER -->
      <div class="drawer-overlay">
        <div class="drawer-header">
          <div>
            <div style="font-size: 14px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">
              <span>⚡ ApplyMate Assistant</span>
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
              ${this.jobInfo?.company ? `<strong>${this.jobInfo.company}</strong>` : 'Application Form'}
              ${this.jobInfo?.title ? ` • ${this.jobInfo.title}` : ''}
            </div>
          </div>
          <button id="btn-close" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
        </div>

        <div class="drawer-body">
          <div style="display: flex; gap: 8px; padding-bottom: 4px;">
            <div style="flex: 1; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 8px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #34d399;">${highConfidenceCount}</div>
              <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Profile Matched</div>
            </div>
            <div style="flex: 1; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 8px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #fbbf24;">${aiCount}</div>
              <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">AI Suggestions</div>
            </div>
            <div style="flex: 1; background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: 8px; padding: 8px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #fb7185;">${missingCount}</div>
              <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Missing / Manual</div>
            </div>
          </div>

          ${this.mappings
            .map((m, index) => {
              const isGreen = m.confidence >= 0.85;
              const isYellow = m.source === 'ai_generated' || (m.confidence >= 0.5 && m.confidence < 0.85);
              const badgeClass = isGreen ? 'status-green' : isYellow ? 'status-yellow' : 'status-red';
              const labelText = isGreen ? 'Profile Matched' : isYellow ? 'AI Suggestion' : 'Uncertain';
              const val = m.userModifiedValue ?? m.suggestedValue;
              const isLong = val && val.length > 50;

              return `
                <div class="field-card" data-index="${index}">
                  <div class="field-top">
                    <span class="field-label">${m.originalLabel || m.fieldName}</span>
                    <span class="status-badge ${badgeClass}">${labelText} (${Math.round(m.confidence * 100)}%)</span>
                  </div>
                  ${
                    isLong
                      ? `<textarea class="field-input" rows="3" data-index="${index}">${val}</textarea>`
                      : `<input class="field-input" type="text" data-index="${index}" value="${val.replace(/"/g, '&quot;')}" />`
                  }
                  <div class="field-actions">
                    <button class="btn-action btn-clear" data-index="${index}">Clear</button>
                    <button class="btn-action btn-approve" data-index="${index}" style="color: #34d399;">✓ Approve</button>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

        <div class="drawer-footer">
          <button id="btn-fill-approved" class="btn-apply">
            <span>✨ Populate Approved Fields</span>
          </button>
          ${
            this.onSaveAppCallback
              ? `<button id="btn-save-app" class="btn-action" style="padding: 8px; font-size: 12px; width: 100%; border-radius: 6px;">
                  💾 Save to Application Tracker
                </button>`
              : ''
          }
          <div class="disclaimer">
            🔒 ApplyMate never automatically submits applications. Review and manually click submit on the company's page.
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    const toggleBtn = this.shadow.getElementById('btn-toggle');
    toggleBtn?.addEventListener('click', () => this.open());

    const closeBtn = this.shadow.getElementById('btn-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Field input changes
    const inputs = this.shadow.querySelectorAll('.field-input');
    inputs.forEach((input) => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const index = parseInt(target.getAttribute('data-index') || '-1', 10);
        if (index >= 0 && this.mappings[index]) {
          this.mappings[index].userModifiedValue = target.value;
          this.mappings[index].status = 'approved';
        }
      });
    });

    // Clear actions
    this.shadow.querySelectorAll('.btn-clear').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const index = parseInt(target.getAttribute('data-index') || '-1', 10);
        if (index >= 0 && this.mappings[index]) {
          this.mappings[index].userModifiedValue = '';
          this.mappings[index].status = 'rejected';
          this.render();
        }
      });
    });

    // Approve actions
    this.shadow.querySelectorAll('.btn-approve').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const index = parseInt(target.getAttribute('data-index') || '-1', 10);
        if (index >= 0 && this.mappings[index]) {
          this.mappings[index].status = 'approved';
          target.textContent = 'Approved ✓';
          (target as HTMLButtonElement).style.opacity = '0.6';
        }
      });
    });

    // Fill approved fields button
    const fillBtn = this.shadow.getElementById('btn-fill-approved');
    fillBtn?.addEventListener('click', () => {
      if (this.onApplyCallback) {
        this.onApplyCallback(this.mappings);
        fillBtn.textContent = 'Fields Populated! ✨';
        setTimeout(() => {
          this.close();
        }, 800);
      }
    });

    // Save app button
    const saveAppBtn = this.shadow.getElementById('btn-save-app');
    saveAppBtn?.addEventListener('click', () => {
      if (this.onSaveAppCallback) {
        this.onSaveAppCallback();
        saveAppBtn.textContent = 'Saved to Tracker! ✓';
      }
    });
  }
}

