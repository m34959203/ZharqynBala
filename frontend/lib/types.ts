// Test types
export interface Test {
  id: string;
  titleRu: string;
  titleKz: string;
  descriptionRu: string;
  descriptionKz: string;
  category: TestCategory;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  price: number;
  isPremium: boolean;
  isActive: boolean;
  questionsCount?: number;
}

export interface TestDetail extends Test {
  questions: Question[];
}

export interface Question {
  id: string;
  questionTextRu: string;
  questionTextKz: string;
  questionType: QuestionType;
  order: number;
  isRequired: boolean;
  options: AnswerOption[];
}

export interface AnswerOption {
  id: string;
  optionTextRu: string;
  optionTextKz: string;
  order: number;
}

export interface TestSession {
  sessionId: string;
  testId: string;
  childId: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  progress: number;
  currentQuestion?: Question;
}

export interface AnswerResponse {
  success: boolean;
  isComplete: boolean;
  progress: number;
  nextQuestion?: Question;
  resultId?: string;
}

// Result types
export interface Result {
  id: string;
  sessionId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  interpretation: string;
  recommendations: string;
  pdfUrl?: string;
  createdAt: string;
  testTitle?: string;
  testCategory?: string;
  childName?: string;
}

export interface ResultDetail extends Result {
  aiInterpretation?: AIInterpretation;
  answers?: {
    questionText: string;
    answerText: string;
    score: number;
  }[];
}

export interface AIInterpretation {
  summary: string;
  strengths: string[];
  areasForDevelopment: string[];
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  needSpecialist: boolean;
  specialistReason?: string;
}

// Child types
export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  schoolName?: string;
  grade?: string;
}

// Enums
export type TestCategory =
  | 'ANXIETY'
  | 'MOTIVATION'
  | 'ATTENTION'
  | 'EMOTIONS'
  | 'CAREER'
  | 'SELF_ESTEEM';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SCALE'
  | 'YES_NO'
  | 'TEXT';

// Category labels
export const categoryLabels: Record<TestCategory, { ru: string; kz: string }> = {
  ANXIETY: { ru: 'Тревожность', kz: 'Үрейлілік' },
  MOTIVATION: { ru: 'Мотивация', kz: 'Мотивация' },
  ATTENTION: { ru: 'Внимание', kz: 'Зейін' },
  EMOTIONS: { ru: 'Эмоции', kz: 'Эмоциялар' },
  CAREER: { ru: 'Профориентация', kz: 'Мамандық таңдау' },
  SELF_ESTEEM: { ru: 'Самооценка', kz: 'Өзін-өзі бағалау' },
};

// Category colors
export const categoryColors: Record<TestCategory, string> = {
  ANXIETY: 'bg-red-100 text-red-700',
  MOTIVATION: 'bg-green-100 text-green-700',
  ATTENTION: 'bg-yellow-100 text-yellow-700',
  EMOTIONS: 'bg-purple-100 text-purple-700',
  CAREER: 'bg-blue-100 text-blue-700',
  SELF_ESTEEM: 'bg-indigo-100 text-indigo-700',
};
