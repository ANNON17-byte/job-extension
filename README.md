# ApplyMate — AI-Powered Job & Internship Application Assistant

> Production-ready Chrome Extension (Manifest V3) that detects internship and job application forms, maps verified candidate profile data, provides AI-grounded contextual question generation, and offers an in-page review drawer before manual submission.

---

## 🚀 Key Features

1. **Intelligent Form Detection & Extraction**
   - Automatically detects forms on Workday, Greenhouse, Lever, Ashby, BambooHR, LinkedIn, Indeed, Taleo, and custom careers sites.
   - Dissects HTML `<input>`, `<textarea>`, `<select>`, `<input type="file">`, checkboxes, and radio buttons.
   - Multi-signal contextual extraction: `<label for>`, enclosing labels, `aria-label`, `aria-labelledby`, `placeholder`, and section headers.

2. **Hybrid Field Matching & Confidence Scoring**
   - Exact attribute matching (`name="email"`, `type="tel"`).
   - Label regex and synonym matching (University, CGPA, Degree, Major, Graduation Date, GitHub, LinkedIn, Portfolio).
   - Confidence scoring:
     - 🟢 **Green (≥ 85%)**: High-confidence profile match.
     - 🟡 **Yellow (50% – 84%)**: AI-grounded suggestion or moderate confidence.
     - 🔴 **Red (< 50%)**: Missing or unresolved field.

3. **Grounded Contextual Answer Generation**
   - Formulates responses for questions like *"Why do you want to join us?"*, *"Describe your experience with RAG"*, *"Experience with LLMs"*.
   - **Zero Fabrication Guarantee**: Responses cite only verified facts from the candidate's profile (e.g. Bytesav internship, Production-Level RAG with FAISS/pgvector, GPT-2 small architecture from scratch).
   - Optional user-configured Google Gemini API (`gemini-1.5-flash`, `gemini-2.0-flash`). Works offline with local grounded generator if no key is configured.

4. **Robust Autofill Engine**
   - Full support for React synthetic events via native prototype setters (`Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set`).
   - Supports Vue, Angular, standard inputs, dropdowns, radio buttons, and textareas.
   - **Safety First**: Never overwrites existing user input without permission. **Never automatically submits forms.**

5. **In-Page Review Drawer & Extension Popup**
   - In-page isolated Shadow DOM drawer appears right on the careers page.
   - Popup with 3 distinct states:
     - **State 1**: No application detected on active tab.
     - **State 2**: Opportunity detected & ready with match percentage.
     - **State 3**: Populated and awaiting manual user verification.

6. **Local Application Tracker**
   - Store applied jobs in `chrome.storage.local`.
   - Track statuses: *Interested*, *Preparing*, *Ready to Apply*, *Applied*, *Interview*, *Shortlisted*, *Offer*, *Rejected*.
   - Filter and search by company, position, or status.

---

## 🔑 Google Gemini API Configuration (`env/.env`)

ApplyMate uses a dedicated `env/` folder for environment variables.

1. Open `env/.env` (or copy from `env/.env.example`):
   ```bash
   # File: env/.env
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
   VITE_GEMINI_MODEL=gemini-1.5-flash
   ```
2. Paste your Google Gemini API key into `VITE_GEMINI_API_KEY`.
3. Run `pnpm build` to compile the extension with your key loaded.
4. You can also view or update your API key anytime in the extension dashboard under **Settings & AI**.

---

## 🛠 Tech Stack

- **Framework**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Bundler**: Vite 8 + `@crxjs/vite-plugin`
- **State Management**: Zustand
- **Schema Validation**: Zod
- **Testing**: Vitest + Happy-DOM
- **Browser**: Chrome Extension Manifest V3

---

## 📦 How to Install & Load in Google Chrome

1. Build the extension:
   ```bash
   pnpm build
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the `dist` folder located in:
   ```text
   c:\Users\ASHMIT YADAV NIET\Desktop\resumeextension\dist
   ```
6. The **ApplyMate** extension icon will appear in your Chrome toolbar!

---

## 🧪 Running Unit Tests

```bash
pnpm test
```

All 16 unit tests verify profile validation, Zod schemas, hybrid field matching, job categorization, and autofill safety.

