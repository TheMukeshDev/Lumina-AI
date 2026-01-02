/**
 * Dynamic Learning Summary Tool (DLT)
 * Analyzes uploaded text documents and generates 5 unique, complex questions
 * Uses Gemini's reasoning capabilities to create contextual questions
 */

export interface DocumentQuestion {
  id: string;
  question: string;
  difficulty: 'intermediate' | 'advanced' | 'expert';
  topic: string;
  context: string; // Key excerpt from document this question is based on
}

export interface DocumentAnalysis {
  documentTitle: string;
  documentLength: number;
  summary: string;
  keyTopics: string[];
  mainThemes: string[];
  questions: DocumentQuestion[];
  generateTimestamp: Date;
}

export interface UserFeedback {
  questionId: string;
  userResponse: string;
  clarity: 1 | 2 | 3 | 4 | 5; // 1 = unclear, 5 = very clear
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = too easy, 5 = too hard
  isCorrect?: boolean;
  notes?: string;
}

import { assertOkOrThrow } from '../utils/responseHelpers';

export async function analyzeLargeDocument(
  documentText: string,
  documentTitle: string,
  apiKey?: string
): Promise<DocumentAnalysis> {
  // This function prefers using the server-side proxy at /api/gemini (for Vercel deployments).
  // If an apiKey is provided it will still work, but it's recommended to set GEMINI_API_KEY on the server and call the proxy.
  // No client-side API key is required when using the server proxy.

  // Truncate document for analysis if too large (Gemini has context limits)
  const maxChars = 20000;
  const truncatedText = documentText.substring(0, maxChars);
  const isTruncated = documentText.length > maxChars;

  const systemPrompt = `You are an expert educational curriculum designer and critical thinking instructor. 
Your task is to analyze a document and generate exactly 5 unique, complex, thought-provoking questions.

Requirements:
1. Questions should progressively increase in complexity (2 intermediate, 2 advanced, 1 expert level)
2. Each question must target a different key concept or theme from the document
3. Questions should require synthesis, analysis, or application of knowledge (not simple recall)
4. Provide the specific context/excerpt from the document each question is based on
5. Return ONLY valid JSON, no other text

Use this exact JSON format:
{
  "summary": "2-3 sentence comprehensive summary of the document",
  "key_topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "main_themes": ["theme1", "theme2", "theme3"],
  "questions": [
    {
      "id": "q1",
      "question": "the actual question text",
      "difficulty": "intermediate" | "advanced" | "expert",
      "topic": "the topic this question covers",
      "context": "exact excerpt or concept from document this is based on"
    }
  ]
}`;

  const userPrompt = `Analyze the following document and generate exactly 5 unique, complex questions.
${isTruncated ? `[NOTE: Document was truncated to 20000 characters]` : ''}

DOCUMENT TITLE: ${documentTitle}

DOCUMENT TEXT:
${truncatedText}`;

  try {
    // Prefer server proxy at /api/gemini (server should set GEMINI_API_KEY). We still keep the ability to pass apiKey if necessary.
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
            responseMimeType: 'application/json',
            temperature: 0.8,
            maxOutputTokens: 3000,
            topP: 0.95,
            topK: 40,
          },
        }
      }),
    });

    // Use a safe parser - upstream may return empty or non-JSON bodies which cause response.json() to throw.
    const { json, text } = await assertOkOrThrow(response);

    // Prefer parsed JSON but fall back to raw text (kept under __rawText) so downstream code can still inspect it.
    let data: any = json;
    if (!data && text) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { __rawText: text };
      }
    }

    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }

    let jsonText = '';
    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content?.parts?.[0]?.text
    ) {
      jsonText = data.candidates[0].content.parts[0].text;
    }

    if (!jsonText) {
      throw new Error('API returned empty response');
    }

    // Clean JSON
    const cleanJson = jsonText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON in API response');
      }
    }

    // Validate and structure response
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid question structure in response');
    }

    // Ensure exactly 5 questions
    const questions = parsed.questions.slice(0, 5);

    return {
      documentTitle,
      documentLength: documentText.length,
      summary: parsed.summary || '',
      keyTopics: parsed.key_topics || [],
      mainThemes: parsed.main_themes || [],
      questions: questions,
      generateTimestamp: new Date(),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Document Analysis Failed: ${msg}`);
  }
}

/**
 * Evaluates user response to a question in a single turn
 * Uses the document context for more accurate evaluation
 */
export async function evaluateUserResponse(
  question: DocumentQuestion,
  userResponse: string,
  documentContext: string,
  feedback: UserFeedback,
  apiKey: string
): Promise<{ evaluation: string; score: number; suggestions: string[] }> {
  if (!apiKey) {
    throw new Error('API key missing');
  }

  const evaluationPrompt = `You are an expert educator evaluating a student's response to a complex question.

QUESTION: ${question.question}
DIFFICULTY: ${question.difficulty}
EXPECTED CONTEXT: ${question.context}

STUDENT'S RESPONSE: ${userResponse}

FEEDBACK FROM STUDENT:
- Clarity of question: ${feedback.clarity}/5
- Perceived difficulty: ${feedback.difficulty}/5
- Student notes: ${feedback.notes || 'None provided'}

DOCUMENT CONTEXT:
${documentContext}

Evaluate the response in a single turn and provide:
1. A brief evaluation (2-3 sentences)
2. A score from 0-100
3. Up to 3 specific suggestions for improvement

Return ONLY this JSON format:
{
  "evaluation": "your evaluation text",
  "score": 85,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        payload: {
          contents: [
            {
              parts: [{ text: evaluationPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }
      }),
    });

    // Use safe parsing for error or success
    const { json, text } = await assertOkOrThrow(response);
    let data: any = json;
    if (!data && text) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { __rawText: text };
      }
    }

    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }

    let jsonText = '';
    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content?.parts?.[0]?.text
    ) {
      jsonText = data.candidates[0].content.parts[0].text;
    }

    if (!jsonText) {
      throw new Error('API returned empty response');
    }

    const cleanJson = jsonText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON in API response');
      }
    }

    return {
      evaluation: parsed.evaluation || '',
      score: parsed.score || 0,
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Response Evaluation Failed: ${msg}`);
  }
}
