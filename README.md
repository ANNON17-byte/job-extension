# ⚡ ApplyMate — AI-Powered Job & Internship Application Assistant

> **Production-grade Chrome Extension (Manifest V3)** that intelligently detects job and internship applications on any ATS or portal, extracts requirements, generates grounded AI answers tailored to the job description, and populates forms ready for manual review.

---

## 🎯 Core Philosophy & Principles

- **Zero Automated Submissions**: ApplyMate never submits forms automatically. You maintain 100% control, reviewing, editing, and approving every field before manually clicking submit.
- **Zero Hallucination Guarantee**: All answers, project references, and skills are strictly grounded in your verified profile (*NIET Computer Science, Bytesav AI internship, Production-Level RAG, GPT-2 from Scratch*).
- **Privacy by Design**: Personal profile data remains local inside `chrome.storage.local`. External AI processing is optional and never collects browsing history or website credentials.

---

## 🚀 Key Features

### 1. 📋 Universal Application Form Detection
- **Major ATS Platforms**: Greenhouse, Lever, Workday, Ashby, BambooHR, LinkedIn Easy Apply, Indeed, Handshake, Taleo, and custom career portals.
- **Native Google Forms Support**: Full compatibility with `docs.google.com/forms` — detects questions without standard `<label>` tags, parses multi-ID `aria-labelledby`, and fires native Google `jsaction` events.
- **Deep DOM Inspection**: Extracts inputs, textareas, native selects, radio buttons, checkboxes, file uploaders, and custom component frameworks.

### 2. 🤖 Grounded Contextual Answer Generation
- **Automated Tailored Cover Letters**: Reads the live job title, company name, and requirements to synthesize a custom, highly persuasive cover letter citing your verified degree, internship experience, and technical projects.
- **Open-Ended Recruitment Questions**:
  - *"Why do you want to join us?"*
  - *"Describe your experience with RAG / LLMs / Python"*
  - *"Tell us about a technical challenge you overcame"*
  - *"What are your career goals?"*
- **"How Did You Hear About Us?"**: Automatically populates referral source fields and matches dropdown options (`LinkedIn`, `Company Careers Page`, `Job Board`).
- **Work Eligibility**: Answers authorization, sponsorship, relocation, and availability questions.

### 3. 🎯 Job-to-Profile Match Scoring
- Scans job postings for required and preferred skills.
- Classifies opportunities into categories: *Generative AI Engineer, LLM Engineer, Machine Learning Engineer, Backend Developer, Frontend Developer, Full Stack Developer, etc.*
- Calculates an **evidence-based match percentage** using verifiable profile data.

### 4. ⚡ Seamless Autofill Engine
- **Framework-Aware Injection**: Uses native property setters and dispatches synthetic events (`focus`, `input`, `change`, `blur`) for React, Vue, Angular, and Google Forms.
- **Preserves Existing Data**: Will not overwrite existing user-entered text without explicit user approval.

### 5. 🎛️ In-Page Review Drawer & 3-State Popup
- **Isolated Shadow DOM Drawer**: Slides out on the actual job page so you can edit, clear, approve, and populate fields without switching tabs.
- **Color-Coded Statuses**:
  - 🟢 **Green (≥ 85%)**: High-confidence profile match.
  - 🟡 **Yellow (50% – 84%)**: AI suggestion requiring user review.
  - 🔴 **Red (< 50%)**: Missing information flagged for manual entry.
- **3-State Extension Popup**:
  - **State 1**: No application detected on active tab.
  - **State 2**: Opportunity detected & ready with match score.
  - **State 3**: Form populated and awaiting manual review.

### 6. 📊 Full-Featured Dashboard & Application Tracker
- **Linear/Raycast Aesthetic**: Clean dark mode with subtle borders and responsive layout.
- **Tabs**:
  - **Overview**: Profile health score, active application statistics, and recent activity.
  - **My Profile**: Full Name, Location, Contact, Academic Info, GPA, Concentrations, Coursework.
  - **Experience**: Manage work experience (*Bytesav*, *Tipy Tipy Tap*, *Shigora.com*).
  - **Projects**: Manage technical projects (*Production-Level RAG*, *GPT-2 From Scratch*).
  - **Skills Database**: Categorized skill taxonomy across 8 technical domains.
  - **Application Tracker**: Filterable, searchable local tracker for saved applications (*Interested*, *Preparing*, *Ready to Apply*, *Applied*, *Interview*, *Shortlisted*, *Offer*, *Rejected*).
  - **Settings & AI**: Gemini API key management, model selection, and JSON profile export/backup.

---

## 🔒 Privacy & Git Security Architecture

To keep personal details and API keys private when pushing to GitHub:

1. **Environment Variables**:
   - `env/.env` is ignored by Git.
   - `env/.env.example` is tracked as a template.
2. **Personal Experience Data**:
   - `src/data/experience.ts` contains personal data and is ignored by Git.
   - `src/data/experience.example.ts` is tracked as the public template.
   - `package.json` contains an automated `"prepare"` lifecycle script that automatically generates `src/data/experience.ts` and `env/.env` from templates if cloned fresh.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Bundler**: Vite 8 + `@crxjs/vite-plugin`
- **State Management**: Zustand
- **Schema Validation**: Zod
- **Testing**: Vitest + Happy-DOM
- **Extension Platform**: Chrome Extension Manifest V3

---

## 📦 How to Install & Load in Google Chrome / Brave

1. **Build the extension**:
   ```bash
   pnpm install
   pnpm build
   ```
2. **Open Extensions Manager**:
   - In Chrome: `chrome://extensions/`
   - In Brave: `brave://extensions/`
3. **Enable Developer Mode** (toggle in the top-right corner).
4. **Click "Load unpacked"** (top-left button).
5. **Select the `dist` folder**:
   ```text
   C:\Users\ASHMIT YADAV NIET\Desktop\resumeextension\dist
   ```
   > ⚠️ **Important**: Do not select the root project folder — select the compiled `dist` subfolder.
6. Click the puzzle icon (🧩) in the browser toolbar and pin **ApplyMate** (📌).

---

## 🔑 Google Gemini API Configuration (Optional)

ApplyMate works 100% offline using deterministic heuristics. To enable advanced Gemini answer generation:

1. Open `env/.env`:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_MODEL=gemini-1.5-flash
   ```
2. Rebuild the extension:
   ```bash
   pnpm build
   ```
3. Reload the extension in `chrome://extensions` (click the 🔄 icon).

---

## 🧪 Running Unit Tests

Run the complete test suite (21 unit tests covering profile schemas, hybrid matching, job categorization, autofill safety, and Google Forms integration):

```bash
pnpm test
```

All 21 tests pass across:
- `tests/profile.test.ts`
- `tests/field-mapping.test.ts`
- `tests/matching-and-autofill.test.ts`
- `tests/google-forms.test.ts`
