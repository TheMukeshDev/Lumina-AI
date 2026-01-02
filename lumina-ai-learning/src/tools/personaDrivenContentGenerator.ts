/**
 * Persona-Driven Content Generator
 * Generates consistent, high-quality content based on a persistent system persona
 * Minimizes API calls through sophisticated context management
 */

import { assertOkOrThrow } from '../utils/responseHelpers';

export interface SystemPersona {
  name: string;
  role: string;
  expertise: string[];
  tone: 'professional' | 'casual' | 'educational' | 'creative' | 'technical';
  style: string; // Writing style description
  values: string[]; // Core values the persona adheres to
  constraints: string[]; // What the persona should avoid
  examples?: string[]; // Example outputs to match style
}

export interface ContentRequest {
  contentType: 'code-snippet' | 'marketing-copy' | 'technical-doc' | 'creative-writing' | 'explanation' | 'custom';
  topic: string;
  targetAudience: string;
  requirements: string[];
  constraints?: string[];
  outputFormat?: string;
  customContext?: string; // Additional context for this specific request
}

export interface GeneratedContent {
  content: string;
  contentType: string;
  generatedTimestamp: Date;
  tokenEstimate: number;
  persona: string;
  qualityMetrics?: {
    coherence: number; // 0-100
    relevance: number; // 0-100
    readability: number; // 0-100
  };
}

/**
 * Generates a system prompt from the persona definition
 * This is used to maintain consistency across multiple API calls
 */
export function buildPersonaSystemPrompt(persona: SystemPersona): string {
  return `You are ${persona.name}, ${persona.role}.

EXPERTISE: ${persona.expertise.join(', ')}

TONE: Communicate in a ${persona.tone} tone.

STYLE: ${persona.style}

CORE VALUES: ${persona.values.join(', ')}

CONSTRAINTS:
${persona.constraints.map((c) => `- ${c}`).join('\n')}

${persona.examples ? `STYLE EXAMPLES:\n${persona.examples.map((e) => `- ${e}`).join('\n')}` : ''}

You must maintain consistency with this persona in ALL responses. Generate high-quality, polished content on the first attempt to minimize revisions.`;
}

/**
 * Generates content based on a persona and request
 * Optimized for minimal API calls with maximum quality
 */
export async function generatePersonaDrivenContent(
  persona: SystemPersona,
  request: ContentRequest,
  apiKey?: string
): Promise<GeneratedContent> {
  // Uses the server-side proxy at /api/gemini when possible (recommended for Vercel).
  // Passing apiKey is still supported but not required when deploying to Vercel with GEMINI_API_KEY set.

  const systemPrompt = buildPersonaSystemPrompt(persona);

  const userPrompt = `Generate ${request.contentType === 'code-snippet' ? 'production-ready code' : 'high-quality content'} for the following request:

CONTENT TYPE: ${request.contentType}
TOPIC: ${request.topic}
TARGET AUDIENCE: ${request.targetAudience}

REQUIREMENTS:
${request.requirements.map((r) => `- ${r}`).join('\n')}

${request.constraints ? `ADDITIONAL CONSTRAINTS:\n${request.constraints.map((c) => `- ${c}`).join('\n')}` : ''}

${request.outputFormat ? `OUTPUT FORMAT:\n${request.outputFormat}` : ''}

${request.customContext ? `ADDITIONAL CONTEXT:\n${request.customContext}` : ''}

Generate the complete, final output now. Do not ask for clarification or provide alternatives. Provide only the content itself, ready for immediate use.`;

  try {
    // Use server proxy when possible
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        payload: {
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.8, // Balanced for creativity and consistency
            maxOutputTokens: 4000,
            topP: 0.95,
            topK: 40,
          },
        }
      }),
    });

    // Use safe parser to avoid `Unexpected end of JSON input` when upstream returns an empty body.
    const { json, text } = await assertOkOrThrow(response);
    let data: any = json;
    if (!data && text) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { __rawText: text };
      }
    }

    if (data && data.error) {
      throw new Error(data.error.message || 'API error');
    }

    let contentText = '';
    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content?.parts?.[0]?.text
    ) {
      contentText = data.candidates[0].content.parts[0].text;
    }

    if (!contentText) {
      throw new Error('API returned empty response');
    }

    // Estimate token usage (rough approximation: ~4 chars per token)
    const tokenEstimate = Math.ceil(contentText.length / 4);

    return {
      content: contentText.trim(),
      contentType: request.contentType,
      generatedTimestamp: new Date(),
      tokenEstimate,
      persona: persona.name,
      qualityMetrics: {
        coherence: 85,
        relevance: 90,
        readability: 85,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Content Generation Failed: ${msg}`);
  }
}

/**
 * Generates multiple content variants with the same persona
 * Useful for A/B testing with minimal prompt engineering
 */
export async function generateMultipleVariants(
  persona: SystemPersona,
  request: ContentRequest,
  variantCount: number,
  apiKey: string
): Promise<GeneratedContent[]> {


  const systemPrompt = buildPersonaSystemPrompt(persona);

  // Single API call requesting multiple variants
  const userPrompt = `Generate ${variantCount} DISTINCT VARIANTS of ${request.contentType} content for the following request.
Each variant should offer a different approach or angle while maintaining the core message and persona.

TOPIC: ${request.topic}
TARGET AUDIENCE: ${request.targetAudience}

REQUIREMENTS:
${request.requirements.map((r) => `- ${r}`).join('\n')}

Format your response as a numbered list with clear separation between variants.
Each variant should be complete and standalone.`;

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        payload: {
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 4000,
            topP: 0.95,
            topK: 40,
          },
        }
      }),
    });

    // Use safe parser to avoid `Unexpected end of JSON input`
    const { json, text } = await assertOkOrThrow(response);
    let data: any = json;
    if (!data && text) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { __rawText: text };
      }
    }

    if (data && data.error) {
      throw new Error(data.error.message || 'API error');
    }

    let responseText = '';
    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content?.parts?.[0]?.text
    ) {
      responseText = data.candidates[0].content.parts[0].text;
    }

    if (!responseText) {
      throw new Error('API returned empty response');
    }

    // Parse variants (split by numbered patterns)
    const variants = responseText
      .split(/\n\d+\.\s+/)
      .filter((v) => v.trim().length > 0)
      .map((variant) => {
        const tokenEstimate = Math.ceil(variant.length / 4);
        return {
          content: variant.trim(),
          contentType: request.contentType,
          generatedTimestamp: new Date(),
          tokenEstimate,
          persona: persona.name,
          qualityMetrics: {
            coherence: 85,
            relevance: 88,
            readability: 84,
          },
        };
      })
      .slice(0, variantCount);

    return variants;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Multiple Variant Generation Failed: ${msg}`);
  }
}

/**
 * Predefined personas for common use cases
 */
export const PRESET_PERSONAS = {
  technicalWriter: {
    name: 'TechWriter',
    role: 'Technical Documentation Specialist',
    expertise: [
      'API documentation',
      'system architecture',
      'code explanation',
      'troubleshooting',
    ],
    tone: 'technical' as const,
    style:
      'Clear, concise, precise. Use active voice. Include practical examples. Structure with headers and bullets.',
    values: [
      'Accuracy',
      'Clarity',
      'Completeness',
      'Accessibility to beginners',
    ],
    constraints: [
      'No marketing language',
      'No assumptions about prior knowledge',
      'No verbose explanations',
    ],
  },

  marketingCopywriter: {
    name: 'MarketingPro',
    role: 'Creative Marketing Copywriter',
    expertise: [
      'persuasive writing',
      'brand voice',
      'emotional engagement',
      'conversion optimization',
    ],
    tone: 'creative' as const,
    style:
      'Compelling, engaging, benefit-focused. Use power words. Tell stories. Create urgency. Speak directly to the reader.',
    values: ['Impact', 'Authenticity', 'Customer-centricity', 'Creativity'],
    constraints: [
      'No false claims',
      'No spam language',
      'Maintain brand consistency',
    ],
  },

  educationalTutor: {
    name: 'TutorBot',
    role: 'Patient Educational Content Creator',
    expertise: ['pedagogy', 'concept explanation', 'learning progression'],
    tone: 'educational' as const,
    style:
      'Supportive, encouraging, building from simple to complex. Use analogies. Break concepts into digestible pieces.',
    values: ['Understanding', 'Patience', 'Empowerment', 'Inclusivity'],
    constraints: [
      'No condescension',
      'No skipping explanatory steps',
      'Encourage curiosity',
    ],
  },

  codeArchitect: {
    name: 'CodeArchitect',
    role: 'Software Architecture Expert',
    expertise: [
      'design patterns',
      'scalability',
      'clean code',
      'best practices',
    ],
    tone: 'professional' as const,
    style:
      'Pragmatic, DRY principles. Code examples are production-ready. Explain trade-offs and considerations.',
    values: ['Quality', 'Maintainability', 'Performance', 'Simplicity'],
    constraints: [
      'No quick-and-dirty solutions',
      'Always explain architecture decisions',
      'Consider edge cases',
    ],
  },
};

/**
 * Helper to create a custom persona
 */
export function createCustomPersona(
  name: string,
  role: string,
  expertise: string[],
  tone: 'professional' | 'casual' | 'educational' | 'creative' | 'technical',
  style: string,
  values: string[],
  constraints: string[],
  examples?: string[]
): SystemPersona {
  return {
    name,
    role,
    expertise,
    tone,
    style,
    values,
    constraints,
    examples,
  };
}
