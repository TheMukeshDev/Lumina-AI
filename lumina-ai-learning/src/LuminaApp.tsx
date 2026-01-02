import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Brain, Zap, BookOpen, CheckCircle2, Loader2, Volume2, X, AlertCircle, Youtube, RefreshCw, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicLearningSummaryTool from './components/DynamicLearningSummaryTool';
import PersonaDrivenContentGenerator from './components/PersonaDrivenContentGenerator';
import { assertOkOrThrow } from './utils/responseHelpers';

const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";

type QuizItem = {
  question: string;
  options: string[];
  answer: string;
};

type AnalysisResult = {
  summary: string;
  key_concepts: string[];
  analogy: string;
  quiz: QuizItem[];
};

type Flashcard = {
  term: string;
  definition: string;
  example?: string;
};

type StudyGuide = {
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
  keyTakeaways: string[];
};

type PerformanceAnalysis = {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  strengths: string[];
  growthAreas: string[];
  recommendations: string[];
};

type DifficultyLevel = 'easier' | 'same' | 'harder';
type QuestionCount = 5 | 10 | 20 | 'custom';

const pcm16ToWav = (pcmData: ArrayBuffer, sampleRate = 24000) => {
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const buffer = new ArrayBuffer(44 + pcmData.byteLength);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.byteLength, true);

  const pcmView = new Uint8Array(pcmData);
  const wavView = new Uint8Array(buffer, 44);
  wavView.set(pcmView);

  return buffer;
};

const getYoutubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

export default function LuminaApp() {
  const [image, setImage] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [inputMode, setInputMode] = useState<'image' | 'youtube'>('image');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingText, setLoadingText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conceptExplanation, setConceptExplanation] = useState<{term: string, text: string} | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [quizSelections, setQuizSelections] = useState<Record<number, string>>({});
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('same');
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(10);
  
  // New feature states
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [showStudyGuide, setShowStudyGuide] = useState(false);
  
  const [performance, setPerformance] = useState<PerformanceAnalysis | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);
  
  const [spaceRepetitionData, setSpaceRepetitionData] = useState<Record<number, {nextReview: Date, interval: number, difficulty: number}>>({});
  
  // Tool selection state
  const [activeToolMode, setActiveToolMode] = useState<'original' | 'dlt' | 'persona'>('original');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const analyzeImageWithGemini = async (base64Image: string, questionNum: number = 10, difficulty: DifficultyLevel = 'same', retryCount: number = 0) => {
    try {
      if (!apiKey) throw new Error('API key missing');

      let cleanBase64 = base64Image;
      if (base64Image.includes(',')) {
        cleanBase64 = base64Image.split(',')[1];
      }

      const difficultyPrompt = difficulty === 'easier' ? 'easier' : difficulty === 'harder' ? 'harder' : 'medium';
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview-09-2025',
          payload: {
            contents: [{
              parts: [
                { text: `Create exactly ${questionNum} ${difficultyPrompt} difficulty multiple choice questions from this image. Return ONLY this JSON format, no other text:\n{"summary": "2-3 sentences", "key_concepts": ["c1", "c2", "c3", "c4", "c5"], "analogy": "one sentence", "quiz": [{"question": "q1", "options": ["a", "b", "c", "d"], "answer": "correct option"}]}` },
                { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
              ]
            }],
            generationConfig: { 
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 4096
            }
          }
        })
      });

      // Handle 503 (overloaded) with retry
      if (response.status === 503 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // exponential backoff: 1s, 2s, 4s
        console.log(`API overloaded. Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(r => setTimeout(r, delay));
        return analyzeImageWithGemini(base64Image, questionNum, difficulty, retryCount + 1);
      }

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

      // Extract text from response
      let jsonText = '';
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          jsonText = candidate.content.parts[0].text || '';
        }
      }

      if (!jsonText) {
        console.error('No text in response:', JSON.stringify(data, null, 2));
        throw new Error('API returned empty response');
      }

      // Clean JSON - remove markdown code blocks
      const cleanJson = jsonText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        // Try to extract JSON if it's embedded in text
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          console.error('Failed to parse JSON. Raw response:', cleanJson.substring(0, 500));
          throw new Error('Invalid JSON in API response');
        }
      }

      // Validate structure
      if (!parsed.quiz || !Array.isArray(parsed.quiz) || parsed.quiz.length === 0) {
        throw new Error('Invalid quiz structure in response');
      }

      // Ensure all questions have 4 options
      parsed.quiz = parsed.quiz.map((q: any) => ({
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
        answer: q.answer || q.options?.[0] || ''
      }));

      return parsed;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('❌ Image Analysis Error:', msg);
      throw new Error(msg);
    }
  };

  const analyzeYoutubeTranscript = async (videoId: string, questionNum: number = 10, difficulty: DifficultyLevel = 'same', retryCount: number = 0) => {
    try {
      if (!apiKey) throw new Error('API key missing');

      const difficultyPrompt = difficulty === 'easier' ? 'easier' : difficulty === 'harder' ? 'harder' : 'medium';
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview-09-2025',
          payload: {
            contents: [{
              parts: [{
                text: `Analyze YouTube video ID: ${videoId}. Create exactly ${questionNum} ${difficultyPrompt} difficulty questions. Return ONLY this JSON format, no other text:\n{"summary": "2-3 sentences", "key_concepts": ["c1", "c2", "c3", "c4", "c5"], "analogy": "one sentence", "quiz": [{"question": "q1", "options": ["a", "b", "c", "d"], "answer": "correct option"}]}`
              }]
            }],
            generationConfig: { 
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 4096
            }
          }
        })
      });

      // Handle 503 (overloaded) with retry
      if (response.status === 503 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // exponential backoff: 1s, 2s, 4s
        console.log(`API overloaded. Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(r => setTimeout(r, delay));
        return analyzeYoutubeTranscript(videoId, questionNum, difficulty, retryCount + 1);
      }

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }
      
      if (data.error) {
        throw new Error(data.error.message || 'API error');
      }

      // Extract text from response
      let jsonText = '';
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          jsonText = candidate.content.parts[0].text || '';
        }
      }

      if (!jsonText) {
        console.error('No text in response:', JSON.stringify(data, null, 2));
        throw new Error('API returned empty response');
      }

      // Clean JSON - remove markdown code blocks
      const cleanJson = jsonText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        // Try to extract JSON if it's embedded in text
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          console.error('Failed to parse JSON. Raw response:', cleanJson.substring(0, 500));
          throw new Error('Invalid JSON in API response');
        }
      }

      // Validate structure
      if (!parsed.quiz || !Array.isArray(parsed.quiz) || parsed.quiz.length === 0) {
        throw new Error('Invalid quiz structure in response');
      }

      // Ensure all questions have 4 options
      parsed.quiz = parsed.quiz.map((q: any) => ({
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
        answer: q.answer || q.options?.[0] || ''
      }));

      return parsed;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('❌ YouTube Analysis Error:', msg);
      throw new Error(msg);
    }
  };

  const generateSpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview-tts',
          payload: {
            contents: [{ parts: [{ text: text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" }
                }
              }
            }
          }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const base64Audio = data.candidates[0].content.parts[0].inlineData.data;
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const wavBuffer = pcm16ToWav(bytes.buffer);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        audioRef.current.onended = () => setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const getExplanation = async (term: string, contextOverride?: string) => {
    if (!result) return;
    setIsExplaining(true);
    setConceptExplanation({ term: term, text: "Consulting Gemini..." });
    
    const prompt = contextOverride 
      ? `Explain why "${term}" is the correct answer in the context of: ${result.summary}. Keep it brief (2-3 sentences).`
      : `Explain the concept "${term}" simply and briefly (max 2 sentences) in the context of: ${result.summary}`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash-preview-09-2025', payload: { contents: [{ parts: [{ text: prompt }] }] } })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate explanation.";
      setConceptExplanation({ term: term, text });
    } catch (e) {
      setConceptExplanation({ term: term, text: "Failed to load explanation." });
    } finally {
      setIsExplaining(false);
    }
  };

  const generateFlashcards = async () => {
    if (!result) return;
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview-09-2025',
          payload: {
            contents: [{
              parts: [{
                text: `Based on this learning material:
Summary: ${result.summary}
Key Concepts: ${result.key_concepts.join(', ')}

Generate flashcards for studying. Return ONLY valid JSON (no markdown):
{
  "flashcards": [
    {"term": "term1", "definition": "def1", "example": "ex1"},
    {"term": "term2", "definition": "def2", "example": "ex2"}
  ]
}

Create 8-12 flashcards covering the key concepts. Each must have term, definition, and example.`
              }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          }
        })
      });

      const data = await response.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Invalid response');
      
      const text = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setFlashcards(parsed.flashcards || []);
      setCurrentFlashcardIndex(0);
      setIsFlipped(false);
      setShowFlashcards(true);
    } catch (error) {
      console.error('Flashcard generation error:', error);
      alert('Failed to generate flashcards');
    }
  };

  const generateStudyGuide = async () => {
    if (!result) return;
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview-09-2025',
          payload: {
            contents: [{
              parts: [{
                text: `Create a comprehensive study guide based on:
Summary: ${result.summary}
Key Concepts: ${result.key_concepts.join(', ')}
Quiz Questions: ${result.quiz.slice(0, 3).map(q => q.question).join(' | ')}

Return ONLY valid JSON (no markdown):
{
  "title": "Study Guide Title",
  "sections": [
    {"heading": "Section 1", "content": "detailed content..."},
    {"heading": "Section 2", "content": "detailed content..."}
  ],
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"]
}

Create 4-5 sections with practical, detailed content suitable for deep learning.`
              }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          }
        })
      });

      const data = await response.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Invalid response');
      
      const text = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setStudyGuide(parsed);
      setShowStudyGuide(true);
    } catch (error) {
      console.error('Study guide generation error:', error);
      alert('Failed to generate study guide');
    }
  };

  const calculatePerformance = () => {
    if (!result) return;
    
    const answers = Object.entries(quizSelections);
    const correct = answers.filter(([idx, selected]) => {
      return selected === result.quiz[parseInt(idx)].answer;
    }).length;
    
    const total = result.quiz.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-preview-09-2025',
        payload: {
          contents: [{
            parts: [{
              text: `Analyze student performance:
- Score: ${correct}/${total} (${accuracy}%)
- Topic: ${result.summary.substring(0, 100)}
- Concepts covered: ${result.key_concepts.join(', ')}

Return ONLY valid JSON (no markdown):
{
  "strengths": ["strength1", "strength2"],
  "growthAreas": ["area1", "area2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Provide personalized feedback based on their performance.`
            }]
          }],
          generationConfig: { responseMimeType: "application/json" }
        }
      })
    }).then(r => r.json()).then(data => {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      
      const perfAnalysis: PerformanceAnalysis = {
        totalQuestions: total,
        correctAnswers: correct,
        accuracy,
        strengths: parsed.strengths || [],
        growthAreas: parsed.growthAreas || [],
        recommendations: parsed.recommendations || []
      };
      
      setPerformance(perfAnalysis);
      setShowPerformance(true);
    }).catch(e => console.error('Performance analysis error:', e));
  };

  const initializeSpacedRepetition = () => {
    const now = new Date();
    const newData: Record<number, {nextReview: Date, interval: number, difficulty: number}> = {};
    
    result?.quiz.forEach((_, idx) => {
      newData[idx] = {
        nextReview: now,
        interval: 1,
        difficulty: 0.5
      };
    });
    
    setSpaceRepetitionData(newData);
  };

  const updateSpacedRepetitionForQuestion = (questionIdx: number, isCorrect: boolean) => {
    setSpaceRepetitionData((prev: Record<number, {nextReview: Date, interval: number, difficulty: number}>) => {
      const data = prev[questionIdx] || { nextReview: new Date(), interval: 1, difficulty: 0.5 };
      const quality = isCorrect ? 4 : 1;
      const newDifficulty = data.difficulty + (quality - 3) * 0.1;
      const newInterval = isCorrect ? Math.max(1, data.interval * (1.3 + newDifficulty)) : 1;
      
      return {
        ...prev,
        [questionIdx]: {
          nextReview: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000),
          interval: newInterval,
          difficulty: Math.max(0.1, Math.min(2.5, newDifficulty))
        }
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        startAnalysis(reader.result as string, 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleYoutubeSubmit = () => {
    if (!youtubeUrl.trim()) {
      alert("Please enter a YouTube URL");
      return;
    }
    startAnalysis(youtubeUrl, 'youtube');
  };

  const startAnalysis = async (input: string, mode: 'image' | 'youtube') => {
    setStatus('analyzing');
    setResult(null);
    setConceptExplanation(null);
    setQuizSelections({});

    const steps = ["Scanning content...", "Analyzing material...", "Synthesizing knowledge..."];
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
        setLoadingText(steps[stepIdx % steps.length]);
        stepIdx++;
    }, 1500);

    try {
      let data;
      const finalQuestionCount = questionCount === 'custom' ? customQuestionCount : questionCount;
      
      if (mode === 'image') {
        data = await analyzeImageWithGemini(input, finalQuestionCount, difficultyLevel);
      } else {
        const videoId = getYoutubeVideoId(input);
        if (!videoId) throw new Error("Invalid YouTube URL");
        data = await analyzeYoutubeTranscript(videoId, finalQuestionCount, difficultyLevel);
      }
      
      clearInterval(stepInterval);
      setResult(data);
      setStatus('success');
      initializeSpacedRepetition();
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (error) {
      clearInterval(stepInterval);
      console.error("Analysis error:", error);
      setStatus('error');
    }
  };

  const handleRegenerateQuiz = () => {
    setShowQuizModal(false);
    if (inputMode === 'image' && image) {
      startAnalysis(image, 'image');
    } else if (inputMode === 'youtube' && youtubeUrl) {
      startAnalysis(youtubeUrl, 'youtube');
    } else {
      setStatus('error');
      alert("Please ensure you have uploaded content before regenerating quiz");
    }
  };

  const handleReset = () => {
    setImage(null);
    setYoutubeUrl("");
    setInputMode('image');
    setStatus('idle');
    setResult(null);
    setConceptExplanation(null);
    setQuizSelections({});
    setShowQuizModal(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  const handleQuizOptionClick = (questionIdx: number, option: string) => {
    if (quizSelections[questionIdx]) return;
    setQuizSelections(prev => ({
      ...prev,
      [questionIdx]: option
    }));
    
    if (result) {
      const isCorrect = option === result.quiz[questionIdx].answer;
      updateSpacedRepetitionForQuestion(questionIdx, isCorrect);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col">
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveToolMode('original')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Lumina</h1>
                <p className="text-xs text-purple-400 font-mono">AI Learning & Content Studio</p>
              </div>
            </div>
          </div>

          {/* Tool Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveToolMode('original')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm ${
                activeToolMode === 'original'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Learning Analysis
            </button>
            <button
              onClick={() => setActiveToolMode('dlt')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm ${
                activeToolMode === 'dlt'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Document QA
            </button>
            <button
              onClick={() => setActiveToolMode('persona')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm ${
                activeToolMode === 'persona'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Content Creator
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Conditional Rendering */}
      {activeToolMode === 'original' && (
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Input */}
        <div className="w-full md:w-96 border-r border-white/10 bg-black/30 backdrop-blur-sm flex flex-col overflow-hidden">
          {/* Input Mode Tabs */}
          <div className="p-4 space-y-4 border-b border-white/10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Source</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setInputMode('image'); setStatus('idle'); setResult(null); }}
                className={`flex-1 py-2.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                  inputMode === 'image'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Upload className="w-4 h-4" />
                Image
              </button>
              <button
                onClick={() => { setInputMode('youtube'); setStatus('idle'); setResult(null); }}
                className={`flex-1 py-2.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                  inputMode === 'youtube'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Youtube className="w-4 h-4" />
                Video
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inputMode === 'image' ? (
              <motion.div 
                layout
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden group flex items-center justify-center min-h-[300px] cursor-pointer
                  ${image ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/20 hover:border-blue-500/50 bg-white/5 hover:bg-white/10'}
                `}
                onClick={() => !image && fileInputRef.current?.click()}
              >
                {image ? (
                  <div className="relative w-full h-full flex items-center justify-center p-3">
                    <img src={image} alt="Content" className="w-full h-full object-contain rounded-xl" />
                    {status === 'analyzing' && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent z-20 animate-pulse" />
                    )}
                    {status === 'success' && (
                      <button 
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleReset(); }}
                        className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white/70 hover:text-white hover:bg-black/80 transition z-30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-200">Upload Image</p>
                    <p className="text-xs text-gray-500 mt-1">Notes, diagrams, or screenshots</p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Paste YouTube URL..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/20 transition text-sm"
                  />
                  <button
                    onClick={handleYoutubeSubmit}
                    disabled={status === 'analyzing' || !youtubeUrl.trim()}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Youtube className="w-4 h-4" />
                    Analyze Video
                  </button>
                  <p className="text-xs text-gray-500 text-center">youtube.com/watch?v=...</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="p-4 border-t border-white/10">
            {status === 'analyzing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg"
              >
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-xs font-medium text-blue-300">{loadingText}</span>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-300">Analysis failed</p>
                    <p className="text-xs text-red-200 mt-0.5">
                      {loadingText.includes('overload') ? '🔄 Retrying automatically...' : 'Please try again'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold text-white transition flex-shrink-0"
                >
                  Retry
                </button>
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-300">Analysis complete</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Results */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 to-black">
          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={resultsRef}>
            <AnimatePresence mode="wait">
              {status === 'success' && result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Summary Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-blue-400">
                        <BookOpen className="w-5 h-5" />
                        <h3 className="font-semibold text-sm">Summary</h3>
                      </div>
                      <button 
                        onClick={() => generateSpeech(result.summary)}
                        disabled={isSpeaking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {isSpeaking ? "Speaking" : "Listen"}
                      </button>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{result.summary}</p>
                  </motion.div>

                  {/* Concepts */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3 text-purple-400">
                      <Brain className="w-5 h-5" />
                      <h3 className="font-semibold text-sm">Key Concepts</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.key_concepts.map((concept, i) => (
                        <button 
                          key={i} 
                          onClick={() => getExplanation(concept)}
                          className="px-3 py-1.5 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-lg border border-purple-500/30 hover:bg-purple-500/40 transition cursor-pointer"
                        >
                          {concept}
                        </button>
                      ))}
                    </div>
                    
                    <AnimatePresence>
                      {conceptExplanation && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-purple-400 font-semibold text-sm">{conceptExplanation.term}</h4>
                            <button onClick={() => setConceptExplanation(null)} className="text-gray-500 hover:text-white">
                              <X className="w-4 h-4"/>
                            </button>
                          </div>
                          <p className="text-sm text-gray-300">
                            {isExplaining ? <span className="animate-pulse">Loading...</span> : conceptExplanation.text}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Analogy */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-md border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3 text-amber-400">
                      <Zap className="w-5 h-5" />
                      <h3 className="font-semibold text-sm">Analogy</h3>
                    </div>
                    <p className="text-sm text-gray-200 italic">"{result.analogy}"</p>
                  </motion.div>

                  {/* Quiz Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <h3 className="font-semibold text-sm">Quiz ({Object.keys(quizSelections).length}/{result.quiz.length})</h3>
                      </div>
                      <button
                        onClick={() => setShowQuizModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-lg text-xs font-medium transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        More
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {result.quiz.map((q, idx) => {
                          const selected = quizSelections[idx];
                          const isCorrect = selected === q.answer;
                          const isWrong = selected && !isCorrect;

                          return (
                            <motion.div 
                              key={idx} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`p-4 rounded-xl border transition-all ${isWrong ? 'border-red-500/30 bg-red-500/10' : isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
                            >
                              <p className="text-sm font-medium text-gray-200 mb-2">{idx + 1}. {q.question}</p>
                              
                              <div className="space-y-2">
                                {q.options.map((opt, oIdx) => {
                                  const isSelected = selected === opt;
                                  const isAnswer = opt === q.answer;
                                  let btnClass = "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10";
                                  
                                  if (selected) {
                                    if (isAnswer) btnClass = "bg-green-500/20 text-green-300 border-green-500/50";
                                    else if (isSelected && !isCorrect) btnClass = "bg-red-500/20 text-red-300 border-red-500/50";
                                    else btnClass = "opacity-40 bg-white/5 text-gray-500 border-white/10";
                                  }

                                  return (
                                    <button 
                                      key={oIdx} 
                                      onClick={() => handleQuizOptionClick(idx, opt)}
                                      disabled={!!selected}
                                      className={`w-full text-xs py-2.5 px-3 text-left rounded-lg border transition-all ${btnClass}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {isWrong && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="mt-3 pt-3 border-t border-red-500/20 flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 text-red-400 text-xs">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Correct: <strong>{q.answer}</strong></span>
                                  </div>
                                  <button 
                                    onClick={() => getExplanation(q.answer, "quiz_context")}
                                    className="text-xs text-blue-300 hover:text-blue-200 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/30 transition-colors whitespace-nowrap"
                                  >
                                    Why?
                                  </button>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                      })}
                    </div>
                  </motion.div>

                  {/* Keep Learning Section - Feature Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-md border border-white/10 rounded-2xl p-5"
                  >
                    <h3 className="font-semibold text-sm text-cyan-400 mb-4">Keep Learning</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={generateFlashcards}
                        className="p-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl transition flex flex-col items-center gap-2 text-center"
                      >
                        <BookOpen className="w-5 h-5 text-cyan-400" />
                        <span className="text-xs font-medium text-cyan-300">Flashcards</span>
                      </button>
                      <button
                        onClick={generateStudyGuide}
                        className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition flex flex-col items-center gap-2 text-center"
                      >
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        <span className="text-xs font-medium text-blue-300">Study Guide</span>
                      </button>
                      <button
                        onClick={calculatePerformance}
                        className="p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition flex flex-col items-center gap-2 text-center"
                      >
                        <Zap className="w-5 h-5 text-purple-400" />
                        <span className="text-xs font-medium text-purple-300">Performance</span>
                      </button>
                      <button
                        onClick={initializeSpacedRepetition}
                        className="p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-xl transition flex flex-col items-center gap-2 text-center"
                      >
                        <RefreshCw className="w-5 h-5 text-orange-400" />
                        <span className="text-xs font-medium text-orange-300">Spaced Rep.</span>
                      </button>
                    </div>
                  </motion.div>

                </motion.div>
              ) : status === 'idle' ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Brain className="w-10 h-10 text-purple-400/50" />
                  </div>
                  <p className="text-sm text-gray-400">Upload an image or paste a YouTube URL to get started</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
      )}

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuizModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowQuizModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 w-full md:max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Generate More Questions</h2>

              <div className="space-y-6">
                {/* Difficulty */}
                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-3 block">Difficulty Level</label>
                  <div className="flex gap-2">
                    {(['easier', 'same', 'harder'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficultyLevel(level)}
                        className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition ${
                          difficultyLevel === level
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {level === 'easier' ? '⭐ Easier' : level === 'harder' ? '⚡ Harder' : '✓ Same'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-3 block">Number of Questions</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {([5, 10, 20] as const).map((num) => (
                      <button
                        key={num}
                        onClick={() => setQuestionCount(num)}
                        className={`py-2.5 rounded-lg font-medium text-sm transition ${
                          questionCount === num
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setQuestionCount('custom')}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition ${
                      questionCount === 'custom'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Custom
                  </button>
                  {questionCount === 'custom' && (
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={customQuestionCount}
                      onChange={(e) => setCustomQuestionCount(Math.max(1, parseInt(e.target.value) || 10))}
                      className="w-full mt-3 px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/20 text-sm"
                      placeholder="Enter 1-50"
                    />
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowQuizModal(false)}
                    className="flex-1 py-2.5 px-4 bg-white/10 text-gray-300 hover:bg-white/20 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerateQuiz}
                    disabled={status === 'analyzing'}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcards Modal */}
      <AnimatePresence>
        {showFlashcards && flashcards.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFlashcards(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Flashcards</h2>
                <button onClick={() => setShowFlashcards(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <motion.div 
                key={currentFlashcardIndex}
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -180, opacity: 0 }}
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-64 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-3xl p-8 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xl"
                style={{ perspective: '1000px' }}
              >
                <p className="text-sm text-cyan-200 mb-2 uppercase tracking-wider">
                  {isFlipped ? 'Definition' : 'Term'}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isFlipped ? flashcards[currentFlashcardIndex].definition : flashcards[currentFlashcardIndex].term}
                </p>
                <p className="text-xs text-cyan-100 mt-6">Click to flip</p>
              </motion.div>

              {isFlipped && flashcards[currentFlashcardIndex].example && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 text-center"
                >
                  <span className="text-cyan-300 font-semibold">Example: </span>
                  {flashcards[currentFlashcardIndex].example}
                </motion.p>
              )}

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentFlashcardIndex(Math.max(0, currentFlashcardIndex - 1))}
                  disabled={currentFlashcardIndex === 0}
                  className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-white/20 transition"
                >
                  ← Previous
                </button>
                <span className="text-gray-400 text-sm">
                  {currentFlashcardIndex + 1} / {flashcards.length}
                </span>
                <button
                  onClick={() => setCurrentFlashcardIndex(Math.min(flashcards.length - 1, currentFlashcardIndex + 1))}
                  disabled={currentFlashcardIndex === flashcards.length - 1}
                  className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-white/20 transition"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Study Guide Modal */}
      <AnimatePresence>
        {showStudyGuide && studyGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStudyGuide(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{studyGuide.title}</h2>
                <button onClick={() => setShowStudyGuide(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {studyGuide.sections.map((section, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">{section.heading}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{section.content}</p>
                  </motion.div>
                ))}

                {studyGuide.keyTakeaways.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 pt-6 border-t border-white/10"
                  >
                    <h3 className="text-lg font-semibold text-amber-400 mb-3">Key Takeaways</h3>
                    <ul className="space-y-2">
                      {studyGuide.keyTakeaways.map((point, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Analysis Modal */}
      <AnimatePresence>
        {showPerformance && performance && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPerformance(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Performance Analysis</h2>
                <button onClick={() => setShowPerformance(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Score Card */}
                <div className="grid grid-cols-3 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center"
                  >
                    <p className="text-3xl font-bold text-green-400">{performance.correctAnswers}/{performance.totalQuestions}</p>
                    <p className="text-xs text-green-300 mt-2">Score</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center"
                  >
                    <p className="text-3xl font-bold text-blue-400">{performance.accuracy}%</p>
                    <p className="text-xs text-blue-300 mt-2">Accuracy</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 text-center"
                  >
                    <p className="text-3xl font-bold text-purple-400">{performance.totalQuestions}</p>
                    <p className="text-xs text-purple-300 mt-2">Questions</p>
                  </motion.div>
                </div>

                {/* Strengths */}
                {performance.strengths.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-green-400 mb-3">Your Strengths</h3>
                    <ul className="space-y-2">
                      {performance.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex gap-2">
                          <span className="text-green-400">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Growth Areas */}
                {performance.growthAreas.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-lg font-semibold text-amber-400 mb-3">Growth Areas</h3>
                    <ul className="space-y-2">
                      {performance.growthAreas.map((area, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex gap-2">
                          <span className="text-amber-400">→</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Recommendations */}
                {performance.recommendations.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="text-lg font-semibold text-blue-400 mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {performance.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex gap-2">
                          <span className="text-blue-400">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Learning Summary Tool */}
      {activeToolMode === 'dlt' && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-black">
          <DynamicLearningSummaryTool apiKey={apiKey} />
        </div>
      )}

      {/* Persona-Driven Content Generator */}
      {activeToolMode === 'persona' && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-black">
          <PersonaDrivenContentGenerator apiKey={apiKey} />
        </div>
      )}
    </div>
  );
}
