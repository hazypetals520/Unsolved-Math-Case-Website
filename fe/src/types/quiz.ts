export type QuestionType = 'multiple-choice' | 'complex-mc' | 'matching' | 'short-answer';

export interface MultipleChoiceQuestion {
  id: number;
  fileName: string;
  category: 'PILIHAN GANDA' | 'PILIHAN GANDA KOMPLEKS' | 'MENJODOHKAN' | 'ISIAN SINGKAT';
  title: string;
  type: 'multiple-choice';
  question: string;
  options: { key: string; label: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface ComplexMultipleChoiceQuestion {
  id: number;
  fileName: string;
  category: 'PILIHAN GANDA' | 'PILIHAN GANDA KOMPLEKS' | 'MENJODOHKAN' | 'ISIAN SINGKAT';
  title: string;
  type: 'complex-mc';
  question: string;
  options: { key: string; label: string }[];
  correctAnswer: string[];
  explanation: string;
}

export interface MatchingPair {
  id: string; // e.g. "1", "2"
  leftText: string;
}

export interface MatchingOption {
  key: string; // e.g. "A", "B"
  rightText: string;
}

export interface MatchingQuestion {
  id: number;
  fileName: string;
  category: 'PILIHAN GANDA' | 'PILIHAN GANDA KOMPLEKS' | 'MENJODOHKAN' | 'ISIAN SINGKAT';
  title: string;
  type: 'matching';
  question: string;
  leftItems: MatchingPair[];
  rightOptions: MatchingOption[];
  correctAnswer: Record<string, string>; // e.g. { "1": "E", "2": "D", ... }
  // Alternative equivalent keys if duplicate values exist (like in Question 8 where 1/4 appears twice)
  acceptedAlternatives?: Record<string, string[]>;
  explanation: string;
}

export interface ShortAnswerQuestion {
  id: number;
  fileName: string;
  category: 'PILIHAN GANDA' | 'PILIHAN GANDA KOMPLEKS' | 'MENJODOHKAN' | 'ISIAN SINGKAT';
  title: string;
  type: 'short-answer';
  question: string;
  unit?: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | ComplexMultipleChoiceQuestion
  | MatchingQuestion
  | ShortAnswerQuestion;

export type CaseStatus = 'unopened' | 'solved' | 'failed';

export interface CaseAttempt {
  questionId: number;
  userAnswer: string | string[] | Record<string, string>;
  isCorrect: boolean;
  timestamp: string;
}

export interface InvestigatorProfile {
  fullName: string;
  presensiNumber: string;
  loggedInAt: string;
  sessionToken?: string;
}
