import { useState, useEffect, useCallback, useRef } from 'react';
import type { QuizQuestion, CaseStatus, CaseAttempt, InvestigatorProfile } from './types/quiz';
import { QUIZ_QUESTIONS } from './data/quizData';
import { CRTFrame } from './components/CRTFrame';
import { TopMenuBar } from './components/TopMenuBar';
import { LandingScreen } from './components/LandingScreen';
import { CredentialsModal } from './components/CredentialsModal';
import { DesktopScreen } from './components/DesktopScreen';
import { CaseModal } from './components/CaseModal';
import { ManualModal } from './components/ManualModal';
import { FinalReportModal } from './components/FinalReportModal';
import { AntiCheatModal } from './components/AntiCheatModal';
import { sound } from './utils/sound';

export function App() {
  // App Phase
  const [phase, setPhase] = useState<'landing' | 'desktop'>('landing');

  // Investigator Profile
  const [profile, setProfile] = useState<InvestigatorProfile | null>(() => {
    try {
      const saved = localStorage.getItem('unsolved_math_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Case Statuses: { [id]: 'unopened' | 'solved' | 'failed' }
  const [caseStatuses, setCaseStatuses] = useState<Record<number, CaseStatus>>(() => {
    try {
      const saved = localStorage.getItem('unsolved_math_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Recorded attempts: { [id]: CaseAttempt }
  const [attempts, setAttempts] = useState<Record<number, CaseAttempt>>(() => {
    try {
      const saved = localStorage.getItem('unsolved_math_attempts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modals
  const [isCredentialsOpen, setIsCredentialsOpen] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAntiCheatOpen, setIsAntiCheatOpen] = useState<boolean>(false);

  // Security & Violations
  const [violationsCount, setViolationsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('unsolved_math_violations');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Blocked by max violations
  const [isBlockedByViolation, setIsBlockedByViolation] = useState<boolean>(() => {
    try {
      return localStorage.getItem('unsolved_math_blocked') === 'true';
    } catch {
      return false;
    }
  });

  // Anti-cheat tracking refs
  const lastViolationTimeRef = useRef<number>(0);
  const initialHeightRef = useRef<number>(window.innerHeight);
  const isFullscreenActiveRef = useRef<boolean>(false);

  // Audio mute
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  // Sync state to localStorage
  useEffect(() => {
    if (profile) {
      localStorage.setItem('unsolved_math_profile', JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('unsolved_math_statuses', JSON.stringify(caseStatuses));
  }, [caseStatuses]);

  useEffect(() => {
    localStorage.setItem('unsolved_math_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('unsolved_math_violations', violationsCount.toString());
  }, [violationsCount]);

  useEffect(() => {
    localStorage.setItem('unsolved_math_blocked', isBlockedByViolation.toString());
  }, [isBlockedByViolation]);

  // If already logged in previously, stay on desktop or start on landing
  useEffect(() => {
    if (profile && phase === 'landing') {
      // User can resume directly if they logged in
      setPhase('desktop');
    }
  }, [profile, phase]);

  // Derived metrics
  const solvedCount = Object.values(caseStatuses).filter((s) => s === 'solved').length;
  const failedCount = Object.values(caseStatuses).filter((s) => s === 'failed').length;
  const totalAttempted = solvedCount + failedCount;
  const allAttempted = totalAttempted === QUIZ_QUESTIONS.length;

  // Auto-fail all remaining unopened questions when blocked
  const handleAutoBlock = useCallback(() => {
    const failAll: Record<number, CaseStatus> = {};
    QUIZ_QUESTIONS.forEach((q) => {
      if (!caseStatuses[q.id] || caseStatuses[q.id] === 'unopened') {
        failAll[q.id] = 'failed';
      }
    });
    setCaseStatuses((prev) => ({ ...prev, ...failAll }));
    setIsBlockedByViolation(true);
    setActiveQuestion(null);
    setIsAntiCheatOpen(false);
    // Show final report after short delay
    setTimeout(() => {
      setIsReportOpen(true);
    }, 800);
  }, [caseStatuses]);

  // Unified violation trigger with 1500ms cooldown to prevent multi-event duplicate triggers
  const triggerViolation = useCallback(
    (reason: string) => {
      if (allAttempted || isBlockedByViolation || phase !== 'desktop') return;

      const now = Date.now();
      if (now - lastViolationTimeRef.current < 1500) {
        return;
      }
      lastViolationTimeRef.current = now;

      console.warn(`[SECURITY / ANTI-CHEAT] Violation: ${reason}`);
      sound.playWarningAlarm();

      setViolationsCount((prev) => {
        const next = prev + 1;
        if (next >= 2) {
          // Schedule auto-block after state update settles
          setTimeout(() => handleAutoBlock(), 100);
        } else {
          setIsAntiCheatOpen(true);
        }
        return next;
      });
    },
    [allAttempted, isBlockedByViolation, phase, handleAutoBlock]
  );

  // Security event listeners: active during desktop phase until all cases completed
  useEffect(() => {
    if (allAttempted || isBlockedByViolation || phase !== 'desktop') {
      setIsAntiCheatOpen(false);
      return;
    }

    // 1. Tab / Device visibility change (screen off, app switch, backgrounding)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation('Perangkat dinonaktifkan / Pindah aplikasi / Minimize browser');
      }
    };

    // 2. Page hide (screen off / app switch / navigation)
    const handlePageHide = () => {
      triggerViolation('Aplikasi diminimalkan atau perangkat tidur');
    };

    // 3. Window blur (Alt+Tab, floating app, clicking outside)
    const handleWindowBlur = () => {
      setTimeout(() => {
        if (!document.hasFocus()) {
          triggerViolation('Kehilangan fokus layar / Membuka aplikasi mengambang');
        }
      }, 200);
    };

    // 4. Split-screen / Multi-window detection via window resize
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';

      // If height dropped by more than 35% and NO text input is active, split-screen or multi-window was likely engaged
      if (!isInputFocused && initialHeightRef.current > 0) {
        const dropRatio = (initialHeightRef.current - currentHeight) / initialHeightRef.current;
        if (dropRatio > 0.35) {
          triggerViolation('Mode layar belah (Split Screen) terdeteksi');
        }
      }
    };

    // 5. Fullscreen exit detection
    const handleFullscreenChange = () => {
      if (isFullscreenActiveRef.current && !document.fullscreenElement) {
        triggerViolation('Keluar dari mode layar penuh (Fullscreen)');
      }
    };

    // 6. Block context menu (right click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 7. Block inspect developer keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        triggerViolation('Pintasan Developer Tools / Inspect terdeteksi');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [allAttempted, isBlockedByViolation, phase, triggerViolation]);

  // Toggle sound
  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Login Handler
  const handleLogin = (newProfile: InvestigatorProfile) => {
    setProfile(newProfile);
    setIsCredentialsOpen(false);
    setPhase('desktop');

    // Request fullscreen on user gesture for secure test environment
    if (document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          isFullscreenActiveRef.current = true;
        })
        .catch(() => {
          // Fullscreen policy prevented or not supported
        });
    }
  };

  // Case resolution handler (evaluation complete)
  const handleResolveCase = (attempt: CaseAttempt) => {
    setAttempts((prev) => ({
      ...prev,
      [attempt.questionId]: attempt,
    }));

    setCaseStatuses((prev) => ({
      ...prev,
      [attempt.questionId]: attempt.isCorrect ? 'solved' : 'failed',
    }));
  };

  // Next case handler to navigate directly to the next question
  const handleNextCase = (currentQuestionId: number) => {
    const currentIndex = QUIZ_QUESTIONS.findIndex((q) => q.id === currentQuestionId);
    if (currentIndex >= 0 && currentIndex < QUIZ_QUESTIONS.length - 1) {
      const nextQ = QUIZ_QUESTIONS[currentIndex + 1];
      setActiveQuestion(nextQ);
    } else {
      setActiveQuestion(null);
      setOpenedFromReport(false);
      sound.playGodmode();
      setIsReportOpen(true);
    }
  };

  // Reset all state
  const handleResetInvestigation = () => {
    localStorage.removeItem('unsolved_math_profile');
    localStorage.removeItem('unsolved_math_statuses');
    localStorage.removeItem('unsolved_math_attempts');
    localStorage.removeItem('unsolved_math_violations');
    localStorage.removeItem('unsolved_math_blocked');
    setProfile(null);
    setCaseStatuses({});
    setAttempts({});
    setViolationsCount(0);
    setIsBlockedByViolation(false);
    setActiveQuestion(null);
    setIsReportOpen(false);
    setIsManualOpen(false);
    setPhase('landing');
  };

  // Track if question modal was opened from final report for review
  const [openedFromReport, setOpenedFromReport] = useState<boolean>(false);

  const handleCloseCaseModal = () => {
    setActiveQuestion(null);
    if (openedFromReport) {
      setOpenedFromReport(false);
      setIsReportOpen(true);
    }
  };

  const handleAcknowledgeAntiCheat = () => {
    setIsAntiCheatOpen(false);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          isFullscreenActiveRef.current = true;
        })
        .catch(() => {});
    }
  };

  return (
    <CRTFrame
      isMuted={isMuted}
      onToggleMute={handleToggleMute}
      agentName={profile?.fullName}
      violationsCount={violationsCount}
    >
      {/* Top Menu Bar shown when in Desktop phase */}
      {phase === 'desktop' && (
        <TopMenuBar
          profile={profile}
          solvedCount={solvedCount}
          failedCount={failedCount}
          totalQuestions={QUIZ_QUESTIONS.length}
          onOpenReport={() => setIsReportOpen(true)}
          onOpenManual={() => setIsManualOpen(true)}
        />
      )}

      {/* Screen Routing */}
      {phase === 'landing' ? (
        <LandingScreen onStart={() => setIsCredentialsOpen(true)} />
      ) : (
        <DesktopScreen
          questions={QUIZ_QUESTIONS}
          caseStatuses={caseStatuses}
          onOpenFile={(q) => setActiveQuestion(q)}
          onOpenManual={() => setIsManualOpen(true)}
          onOpenReport={() => setIsReportOpen(true)}
          allAttempted={allAttempted}
        />
      )}

      {/* Agent Login Credentials Modal */}
      <CredentialsModal
        isOpen={isCredentialsOpen}
        onLogin={handleLogin}
        onCancel={() => setIsCredentialsOpen(false)}
      />

      {/* Case Question File Modal */}
      {activeQuestion && (
        <CaseModal
          key={activeQuestion.id}
          question={activeQuestion}
          isOpen={!!activeQuestion}
          onClose={handleCloseCaseModal}
          onResolveCase={handleResolveCase}
          onNextCase={handleNextCase}
          hasNextCase={activeQuestion.id < QUIZ_QUESTIONS.length}
          previousAttempt={attempts[activeQuestion.id]}
          isReviewMode={openedFromReport || caseStatuses[activeQuestion.id] === 'solved' || caseStatuses[activeQuestion.id] === 'failed'}
        />
      )}

      {/* Manual & Formula Cheatsheet Modal */}
      <ManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      {/* End Game Official Report Modal */}
      <FinalReportModal
        isOpen={isReportOpen}
        profile={profile}
        questions={QUIZ_QUESTIONS}
        attempts={attempts}
        violationsCount={violationsCount}
        onClose={() => setIsReportOpen(false)}
        onReset={handleResetInvestigation}
        onReviewQuestion={(q) => {
          setOpenedFromReport(true);
          setIsReportOpen(false);
          setActiveQuestion(q);
        }}
      />

      {/* Anti-Cheat Tab Violation Overlay (Disabled when all questions completed) */}
      {!allAttempted && (
        <AntiCheatModal
          isOpen={isAntiCheatOpen}
          violationsCount={violationsCount}
          isBlocked={isBlockedByViolation}
          onAcknowledge={handleAcknowledgeAntiCheat}
        />
      )}
    </CRTFrame>
  );
}

export default App;
