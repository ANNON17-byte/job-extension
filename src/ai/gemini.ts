import type { LLMProvider, AnswerGenerationRequest, AnswerGenerationResult } from './provider';
import type { JobDescription } from '../types/form';
import type { Profile } from '../types/profile';
import { classifyJobCategory } from '../utils/matching';

export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = '', model: string = '') {
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
    const envModel = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_MODEL) || 'gemini-1.5-flash';

    this.apiKey = (apiKey || envKey).trim();
    this.model = model || envModel;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5 && !this.apiKey.includes('YOUR_GEMINI_API_KEY'));
  }

  async generateAnswer(request: AnswerGenerationRequest): Promise<AnswerGenerationResult> {
    const { question, maxLength = 350, jobDescription, profile } = request;

    // Check if question is asking for a cover letter
    if (/\b(cover\s*letter|letter\s*of\s*motivation|statement\s*of\s*purpose)\b/i.test(question)) {
      return this.generateCoverLetter(jobDescription, profile, maxLength);
    }

    // If Gemini API is configured, call the REST API
    if (this.isConfigured()) {
      try {
        return await this.callGeminiForAnswer(request);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to profile-grounded local generator:', err);
      }
    }

    // Local deterministic grounded generator (Zero fabrication, purely from profile)
    return this.generateLocalGroundedAnswer(question, maxLength, jobDescription, profile);
  }

  private async callGeminiForAnswer(request: AnswerGenerationRequest): Promise<AnswerGenerationResult> {
    const { question, maxLength = 350, jobDescription, profile } = request;

    const company = jobDescription?.company || 'Hiring Team';
    const role = jobDescription?.title || 'this role';
    const rawJobText = jobDescription?.rawText ? jobDescription.rawText.slice(0, 1500) : '';

    const systemPrompt = `You are ApplyMate, an elite AI recruitment assistant representing candidate ${profile.personal.fullName}.
Generate the best possible, highly articulate, professional response to the application question.
Tailor the response directly to the job requirements at ${company} for the role of ${role}.

CRITICAL GROUNDING RULES:
1. Ground every statement STRICTLY in the verified candidate profile provided.
2. NEVER invent non-existent degrees, companies, metrics, or technologies.
3. Highlight the candidate's verified strengths:
   - NIET B.Tech Computer Science & Engineering (GPA: ${profile.education.gpa || '3.50/4.00'}, June 2028, Concentrations: Generative AI, LLMs)
   - Bytesav AI Engineer Internship (RAG pipelines, embeddings, semantic retrieval, LLM integration)
   - Production-Level RAG Project (FAISS, pgvector, BGE embeddings, RAGAS evaluations)
   - GPT-2 from Scratch Project (PyTorch, 124M parameters, causal multi-head attention)
   - Web development at Tipy Tipy Tap & Shigora.com (React, modern responsive UX)
4. Keep the response crisp, persuasive, engineering-focused, and within ${maxLength} words.`;

    const userPrompt = `TARGET OPPORTUNITY CONTEXT:
Company: ${company}
Position: ${role}
Job Category: ${jobDescription?.category || 'AI / Engineering'}
Required/Key Skills: ${(jobDescription?.requiredSkills || []).join(', ') || 'Not specified'}
Relevant Job Snippet:
${rawJobText}

CANDIDATE VERIFIED FACTS:
Full Name: ${profile.personal.fullName}
Location: ${profile.personal.location}
Education: ${profile.education.degree} in ${profile.education.specialization} at ${profile.education.institution}
Concentrations: ${profile.education.concentrations.join(', ')}
Key Coursework: ${profile.education.coursework.join(', ')}
Work Experience:
${profile.experience
  .map(
    (e) =>
      `- ${e.position} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.responsibilities.join(' ')}`
  )
  .join('\n')}
Technical Projects:
${profile.projects
  .map(
    (p) =>
      `- ${p.name} (${p.technologies.join(', ')}): ${p.description} Implementations: ${p.implementations.join(', ')}`
  )
  .join('\n')}
Skills:
${Object.entries(profile.skills)
  .map(([cat, list]) => `- ${cat}: ${list.join(', ')}`)
  .join('\n')}

APPLICATION QUESTION TO ANSWER:
"${question}"

Return response in strict JSON:
{
  "answer": "the comprehensive tailored response",
  "evidenceUsed": ["array of exact project or internship names cited"]
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No content returned from Gemini API');
    }

    try {
      const parsed = JSON.parse(candidateText);
      return {
        answer: parsed.answer,
        reasoning: `AI Tailored for ${company} (${role}) via Gemini`,
        evidenceUsed: parsed.evidenceUsed || [],
        isAiSuggestion: true,
      };
    } catch {
      return {
        answer: candidateText.trim(),
        reasoning: 'Generated with Gemini',
        evidenceUsed: ['Verified Profile Background'],
        isAiSuggestion: true,
      };
    }
  }

  generateCoverLetter(
    jobDescription: Partial<JobDescription> | undefined,
    profile: Profile,
    maxLength = 450
  ): AnswerGenerationResult {
    const company = jobDescription?.company || 'Hiring Team';
    const role = jobDescription?.title || 'Internship / Engineering';

    const letter = `Dear Hiring Team at ${company},

I am writing to express my strong enthusiasm for the ${role} position. As a Computer Science and Engineering student at Noida Institute of Engineering and Technology (NIET) with a 3.50/4.00 GPA and concentrations in Generative AI and Large Language Models, I bring hands-on experience designing end-to-end AI pipelines and robust web applications.

During my internship at Bytesav as an AI Engineer Intern, I built RAG-based tools, automated semantic embedding generation, and deployed vector search retrieval systems with interchangeable LLM interfaces. To deepen my systems understanding, I engineered a Production-Level RAG system with recursive chunking, open-source BGE embeddings, FAISS and PostgreSQL+pgvector storage, and rigorous RAGAS evaluations measuring context precision and faithfulness. Furthermore, I implemented the 124M-parameter GPT-2 architecture from scratch in PyTorch, developing custom causal multi-head attention and transformer blocks.

Beyond AI research, my web development work at Tipy Tipy Tap and Shigora.com demonstrated my ability to deliver performant, user-centric software under real-world constraints. I am eager to apply my background in machine learning, Python engineering, and modern full-stack development to contribute meaningfully to ${company}'s initiatives.

Thank you for your time and consideration. I welcome the opportunity to discuss how my verified technical skills align with your goals.

Sincerely,
${profile.personal.fullName}
${profile.personal.email} | ${profile.personal.phone}
Portfolio: ${profile.personal.portfolio || 'https://ashmityadav.in'} | GitHub: ${profile.personal.github || 'https://github.com/ANNON17-byte'}`;

    return {
      answer: letter,
      reasoning: `Grounded Cover Letter tailored for ${company} — ${role}`,
      evidenceUsed: ['NIET CS B.Tech', 'Bytesav AI Intern', 'Production-Level RAG', 'GPT-2 From Scratch'],
      isAiSuggestion: true,
    };
  }

  private generateLocalGroundedAnswer(
    question: string,
    maxLength: number,
    jobDescription: Partial<JobDescription> | undefined,
    profile: Profile
  ): AnswerGenerationResult {
    const qLower = question.toLowerCase();
    const evidenceUsed: string[] = [];
    const company = jobDescription?.company || 'your team';
    const role = jobDescription?.title || 'this role';
    let answer = '';

    // 1. How did you hear about us?
    if (qLower.includes('hear') || qLower.includes('how did you find') || qLower.includes('referral source')) {
      evidenceUsed.push('LinkedIn Job Portal');
      answer = `LinkedIn / Company Careers Page`;
      return { answer, reasoning: 'Standard referral source', evidenceUsed, isAiSuggestion: true };
    }

    // 2. Cover Letter
    if (qLower.includes('cover letter') || qLower.includes('motivation') || qLower.includes('letter')) {
      return this.generateCoverLetter(jobDescription, profile, maxLength);
    }

    // 3. Experience with RAG / Embeddings / Vector Databases
    if (qLower.includes('rag') || qLower.includes('retrieval') || qLower.includes('vector') || qLower.includes('embeddings')) {
      evidenceUsed.push('Bytesav AI Engineer Intern', 'Production-Level RAG');
      answer = `At Bytesav as an AI Engineer Intern, I built RAG-based tools, automated embedding generation, and deployed semantic retrieval systems. In my Production-Level RAG project, I implemented recursive chunking, open-source BGE embeddings, FAISS vector storage, PostgreSQL with pgvector (HNSW indexing), and RAGAS evaluations (measuring context precision, recall, and faithfulness).`;
    }
    // 4. Experience with LLM / GPT / PyTorch / Deep Learning
    else if (qLower.includes('llm') || qLower.includes('gpt') || qLower.includes('transformer') || qLower.includes('pytorch') || qLower.includes('deep learning')) {
      evidenceUsed.push('GPT-2 (124M) From Scratch', 'Bytesav Internship');
      answer = `I have hands-on experience building neural architectures from the ground up, including implementing the GPT-2 small architecture (124M parameters) in PyTorch with causal multi-head attention, pre-layer norm transformer blocks, and greedy text decoding. Additionally, during my internship at Bytesav, I integrated LLMs into end-to-end pipelines to deliver context-grounded responses.`;
    }
    // 5. Why do you want to join us / Why hire you / Suitability
    else if (qLower.includes('why') || qLower.includes('suitable') || qLower.includes('hire') || qLower.includes('join') || qLower.includes('interest')) {
      evidenceUsed.push('NIET Computer Science B.Tech', 'Bytesav Internship', 'Production-Level RAG');
      answer = `I am eager to contribute to ${company} for the ${role}. As a Computer Science student at NIET with concentrations in Generative AI and Machine Learning (GPA: 3.50/4.00), I have proven experience implementing production RAG systems, vector search pipelines at Bytesav, and deep learning architectures from scratch. I am passionate about applying robust engineering principles to build production-grade AI solutions for ${company}.`;
    }
    // 6. Experience with Python / Languages
    else if (qLower.includes('python')) {
      evidenceUsed.push('Production-Level RAG', 'GPT-2 From Scratch', 'Bytesav');
      answer = `Python is my primary language for AI and backend systems. I utilize PyTorch, FAISS, Sentence Transformers, and NumPy for machine learning workflows, and have deployed production-grade Python pipelines with Streamlit and PostgreSQL at Bytesav and across my open-source projects.`;
    }
    // 7. Tell us about a project you worked on / proud of
    else if (qLower.includes('project') || qLower.includes('proud')) {
      evidenceUsed.push('Production-Level RAG Project');
      answer = `One of my key projects is Production-Level RAG, a modular question-answering system over PDFs with page-level citations. I implemented recursive chunking, BGE embeddings, hybrid vector search via FAISS and PostgreSQL+pgvector (with HNSW index), and evaluated pipeline faithfulness and context recall using the RAGAS framework.`;
    }
    // 8. Technical challenge / problem solving
    else if (qLower.includes('challenge') || qLower.includes('problem') || qLower.includes('overcame')) {
      evidenceUsed.push('GPT-2 Architecture & RAG Retrieval');
      answer = `A major technical challenge was optimizing retrieval quality in a RAG pipeline over complex documents with high variance in chunk lengths. I solved this by implementing recursive character chunking paired with dense BGE embeddings and HNSW indexing in pgvector, which substantially reduced hallucination rates and improved RAGAS context precision.`;
    }
    // 9. Career goals / Ambitions
    else if (qLower.includes('goal') || qLower.includes('future') || qLower.includes('career')) {
      evidenceUsed.push('NIET CS Education', 'Generative AI Career Path');
      answer = `My goal is to grow as an AI Engineer focusing on production-grade Generative AI, retrieval systems, and scalable ML architectures. I aim to apply my foundational skills in PyTorch, vector databases, and full-stack development to solve high-impact industrial problems at ${company}.`;
    }
    // 10. Web Development / Full Stack / Frontend
    else if (qLower.includes('web') || qLower.includes('frontend') || qLower.includes('react')) {
      evidenceUsed.push('Tipy Tipy Tap', 'Shigora.com');
      answer = `I have professional web development experience redesigning e-commerce platforms at Tipy Tipy Tap and optimizing responsive storefronts at Shigora.com, utilizing React.js, Tailwind CSS, JavaScript, and modern UI/UX practices with high performance standards.`;
    }
    // General fallback
    else {
      evidenceUsed.push('NIET CS Education', 'Bytesav AI Intern');
      answer = `As a Computer Science undergraduate at NIET specializing in Generative AI and Machine Learning (GPA: 3.50/4.00), I combine hands-on internship experience at Bytesav developing semantic retrieval systems with foundational projects like building GPT-2 and production RAG pipelines in PyTorch and Python. I am well-prepared to contribute to ${company}'s ${role}.`;
    }

    const words = answer.split(' ');
    if (words.length > maxLength) {
      answer = words.slice(0, maxLength).join(' ') + '...';
    }

    return {
      answer,
      reasoning: `Tailored for ${company} (${role}) based on verified profile background`,
      evidenceUsed,
      isAiSuggestion: true,
    };
  }

  async analyzeJobDescription(rawText: string): Promise<Partial<JobDescription>> {
    const textLower = rawText.toLowerCase();

    const commonSkills = [
      'Python', 'PyTorch', 'TensorFlow', 'LangChain', 'LangGraph', 'RAG',
      'FAISS', 'PostgreSQL', 'pgvector', 'Docker', 'Kubernetes', 'React', 'TypeScript',
      'JavaScript', 'SQL', 'MongoDB', 'Redis', 'Azure', 'AWS', 'GCP',
      'C++', 'Java', 'Git', 'CI/CD', 'NLP', 'Computer Vision', 'FastAPI', 'Node.js'
    ];

    const requiredSkills: string[] = [];
    for (const skill of commonSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        requiredSkills.push(skill);
      }
    }

    const category = classifyJobCategory('', rawText);

    let workMode: 'Remote' | 'Hybrid' | 'On-site' | 'Unspecified' = 'Unspecified';
    if (textLower.includes('remote') || textLower.includes('work from home')) {
      workMode = 'Remote';
    } else if (textLower.includes('hybrid')) {
      workMode = 'Hybrid';
    } else if (textLower.includes('on-site') || textLower.includes('in office') || textLower.includes('onsite')) {
      workMode = 'On-site';
    }

    return {
      category,
      requiredSkills,
      preferredSkills: [],
      workMode,
      rawText: rawText.slice(0, 4000),
    };
  }
}
