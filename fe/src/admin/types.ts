export interface CaseAttempt {
  questionId: number;
  userAnswer: string | string[] | Record<string, string>;
  isCorrect: boolean;
  timestamp: string;
}

export interface StudentRecord {
  presensiNumber: string;
  fullName: string;
  loggedInAt: string;
  lastActiveAt: string;
  violationsCount: number;
  violationHistory?: Array<{ reason: string; timestamp: string }>;
  isBlocked: boolean;
  unblockedAt?: string | null;
  caseStatuses: Record<number, 'unopened' | 'solved' | 'failed'>;
  attempts: Record<number, CaseAttempt>;
  score: number;
  accuracy: number;
  totalAttempted: number;
  isFinished: boolean;
}
