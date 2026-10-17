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
import { UnblockedFullscreenModal } from './components/UnblockedFullscreenModal';
import { AdminDashboard } from './admin/AdminDashboard';
import { sound } from './utils/sound';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const isLocalApiUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(configuredApiUrl || '');
const API_BASE = (
  import.meta.env.PROD && isLocalApiUrl
    ? '/api'
    : configuredApiUrl ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:3001/api')
).replace(/\/+$/, '');

export function App() {
  // Integrated View: 'student' | 'admin'
  const [currentView, setCurrentView] = useState<'student' | 'admin'>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    const search = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';
    return hash === '#admin' || hash.startsWith('#/admin') || path.startsWith('/admin') || search.includes('admin')
      ? 'admin'
      : 'student';
  });

  // Listen to navigation events (hash or pathname)
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash === '#admin' || hash.startsWith('#/admin') || path.startsWith('/admin') || search.includes('admin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('student');
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleBackToStudent = () => {
    window.location.hash = '';
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
    setCurrentView('student');
  };

  // App Phase
  const [phase, setPhase] = useState<'landing' | 'desktop'>('landing');

  // Modal for re-entering fullscreen after being unblocked by admin
  const [isUnblockedModalOpen, setIsUnblockedModalOpen] = useState<boolean>(false);

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

  // Finished Quiz State
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(() => {
    try {
      return localStorage.getItem('unsolved_math_finished') === 'true';
    } catch {
      return false;
    }
  });

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
  const lastCaseAdvanceTimeRef = useRef<number>(0);
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

  useEffect(() => {
    localStorage.setItem('unsolved_math_finished', isQuizFinished.toString());
  }, [isQuizFinished]);

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
  const allAttempted = isQuizFinished || totalAttempted === QUIZ_QUESTIONS.length;

  useEffect(() => {
    if (totalAttempted === QUIZ_QUESTIONS.length && !isQuizFinished) {
      setIsQuizFinished(true);
    }
  }, [totalAttempted, isQuizFinished]);

  // Block access without changing the student's progress or completion state.
  const handleAutoBlock = useCallback(() => {
    setIsBlockedByViolation(true);
    setActiveQuestion(null);
    setIsAntiCheatOpen(false);
    setIsReportOpen(false);
  }, []);

  const resetStudentExamState = useCallback(() => {
    setCaseStatuses({});
    setAttempts({});
    setIsQuizFinished(false);
    setIsReportOpen(false);
    setActiveQuestion(null);
    setIsAntiCheatOpen(false);
    setPhase('desktop');
    localStorage.setItem('unsolved_math_statuses', '{}');
    localStorage.setItem('unsolved_math_attempts', '{}');
    localStorage.setItem('unsolved_math_finished', 'false');
  }, []);

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

      // Notify backend API
      if (profile?.presensiNumber) {
        fetch(`${API_BASE}/students/violation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            presensiNumber: profile.presensiNumber,
            reason,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              throw new Error(`Violation sync failed with HTTP ${res.status}`);
            }
            const data = await res.json();
            if (typeof data.violationsCount === 'number') {
              setViolationsCount(data.violationsCount);
            }
            if (data.isBlocked) {
              handleAutoBlock();
            }
            if (typeof BroadcastChannel !== 'undefined') {
              new BroadcastChannel('cyber_exam_channel').postMessage('violation');
            }
          })
          .catch((error) => {
            console.error('[SECURITY / ANTI-CHEAT] Failed to sync violation:', error);
          });
      }

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
    [allAttempted, isBlockedByViolation, phase, profile, handleAutoBlock]
  );

  // Function to enter fullscreen cleanly
  const enterFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          isFullscreenActiveRef.current = true;
          setIsUnblockedModalOpen(false);
        })
        .catch((err) => {
          console.warn('Fullscreen entry failed or cancelled:', err);
        });
    } else {
      setIsUnblockedModalOpen(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'admin' || !profile?.presensiNumber) return;

    const syncStudentStateFromServer = async () => {
      try {
        const res = await fetch(`${API_BASE}/students/${profile.presensiNumber}/status`);
        if (!res.ok) return;

        const data = await res.json();
        const serverAttempts = data.attempts || {};
        const serverStatuses = data.caseStatuses || {};
        const serverFinished = Boolean(data.isFinished);
        const localHasProgress = Object.keys(attempts).length > 0 || Object.keys(caseStatuses).length > 0 || isQuizFinished;
        const serverResetDetected =
          Object.keys(serverAttempts).length === 0 &&
          Object.keys(serverStatuses).length === 0 &&
          !serverFinished &&
          localHasProgress;

        if (serverResetDetected) {
          resetStudentExamState();
          return;
        }

        if (data.isBlocked === false && isBlockedByViolation) {
          setIsBlockedByViolation(false);
          localStorage.setItem('unsolved_math_blocked', 'false');
        }

        if (
          JSON.stringify(serverAttempts) !== JSON.stringify(attempts) ||
          JSON.stringify(serverStatuses) !== JSON.stringify(caseStatuses) ||
          Boolean(isQuizFinished) !== serverFinished
        ) {
          setAttempts(serverAttempts);
          setCaseStatuses(serverStatuses);
          setIsQuizFinished(serverFinished);
          localStorage.setItem('unsolved_math_attempts', JSON.stringify(serverAttempts));
          localStorage.setItem('unsolved_math_statuses', JSON.stringify(serverStatuses));
          localStorage.setItem('unsolved_math_finished', String(serverFinished));
        }
      } catch {
        // Backend offline or unreachable
      }
    };

    syncStudentStateFromServer();
    const interval = setInterval(syncStudentStateFromServer, 2000);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('cyber_exam_channel');
      channel.onmessage = (e) => {
        const msg = e.data;
        if (
          msg === 'unblock' ||
          msg === 'reset' ||
          msg?.type === 'UNBLOCKED' ||
          msg?.type === 'RESET'
        ) {
          if (msg === 'reset' || msg?.type === 'RESET') {
            resetStudentExamState();
          }
          syncStudentStateFromServer();
        }
      };
    }

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [currentView, profile, attempts, caseStatuses, isQuizFinished, isBlockedByViolation, resetStudentExamState]);

  // Poll backend if blocked to automatically unblock when admin clicks 'Lepaskan'
  useEffect(() => {
    // NEVER run unblock polling or fullscreen triggers if user is in Admin view
    if (currentView === 'admin') return;
    if (!isBlockedByViolation || !profile?.presensiNumber) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/students/${profile.presensiNumber}/status`);
        if (res.ok) {
          const data = await res.json();
          if (
            data.isBlocked === false &&
            Number(data.violationsCount) >= 2 &&
            data.unblockedAt
          ) {
            console.log('[SECURITY] Student unblocked by administrator');
            setIsBlockedByViolation(false);
            const currentViolations = typeof data.violationsCount === 'number' ? data.violationsCount : 2;
            setViolationsCount(currentViolations);
            setIsReportOpen(false);
            setIsAntiCheatOpen(false);
            setIsQuizFinished(Boolean(data.isFinished));

            localStorage.setItem('unsolved_math_violations', currentViolations.toString());
            localStorage.setItem('unsolved_math_blocked', 'false');
            localStorage.setItem('unsolved_math_finished', String(Boolean(data.isFinished)));

            if (data.caseStatuses) {
              setCaseStatuses(data.caseStatuses);
              localStorage.setItem('unsolved_math_statuses', JSON.stringify(data.caseStatuses));
            }
            if (data.attempts) {
              setAttempts(data.attempts);
              localStorage.setItem('unsolved_math_attempts', JSON.stringify(data.attempts));
            }

            const isCurrentWindowAdmin =
              typeof window !== 'undefined' &&
              (window.location.hash.toLowerCase().includes('admin') ||
                window.location.pathname.toLowerCase().includes('admin'));

            if (!isCurrentWindowAdmin && currentView === 'student') {
              if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement
                    .requestFullscreen()
                    .then(() => {
                      isFullscreenActiveRef.current = true;
                      setIsUnblockedModalOpen(false);
                    })
                    .catch(() => {
                      setIsUnblockedModalOpen(true);
                    });
                } else {
                  setIsUnblockedModalOpen(false);
                }
              } else {
                isFullscreenActiveRef.current = true;
                setIsUnblockedModalOpen(false);
              }
            }
          }
        }
      } catch {
        // Backend offline or unreachable
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('cyber_exam_channel');
      channel.onmessage = (e) => {
        const msg = e.data;
        if (
          msg === 'unblock' ||
          msg === 'reset' ||
          msg?.type === 'UNBLOCKED' ||
          msg?.type === 'RESET'
        ) {
          if (msg === 'reset' || msg?.type === 'RESET') {
            resetStudentExamState();
          }
          checkStatus();
        }
      };
    }

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [isBlockedByViolation, profile, currentView, resetStudentExamState]);

  // Security event listeners: active during desktop phase until all cases completed
  useEffect(() => {
    if (allAttempted || isBlockedByViolation || phase !== 'desktop' || isUnblockedModalOpen) {
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
      if (document.fullscreenElement) {
        isFullscreenActiveRef.current = true;
        setIsUnblockedModalOpen(false);
      } else if (isFullscreenActiveRef.current && !isBlockedByViolation && !isUnblockedModalOpen) {
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
  }, [allAttempted, isBlockedByViolation, phase, triggerViolation, isUnblockedModalOpen]);

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

    // Notify backend
    fetch(`${API_BASE}/students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: newProfile.fullName,
        presensiNumber: newProfile.presensiNumber,
      }),
    })
      .then(() => {
        if (typeof BroadcastChannel !== 'undefined') {
          new BroadcastChannel('cyber_exam_channel').postMessage('login');
        }
      })
      .catch(() => {});

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
    const nextAttempts = {
      ...attempts,
      [attempt.questionId]: attempt,
    };
    const nextStatuses: Record<number, CaseStatus> = {
      ...caseStatuses,
      [attempt.questionId]: attempt.isCorrect ? 'solved' : 'failed',
    };

    setAttempts(nextAttempts);
    setCaseStatuses(nextStatuses);

    // Sync progress to backend
    if (profile?.presensiNumber) {
      fetch(`${API_BASE}/students/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presensiNumber: profile.presensiNumber,
          caseStatuses: nextStatuses,
          attempts: nextAttempts,
          isFinished: Object.keys(nextAttempts).length >= QUIZ_QUESTIONS.length,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Progress sync failed with HTTP ${res.status}`);
          }
          if (typeof BroadcastChannel !== 'undefined') {
            new BroadcastChannel('cyber_exam_channel').postMessage('progress');
          }
        })
        .catch((error) => {
          console.error('[PROGRESS] Failed to sync student progress:', error);
        });
    }
  };

  // Next case handler to navigate directly to the next question
  const handleNextCase = (currentQuestionId: number) => {
    const now = Date.now();
    if (now - lastCaseAdvanceTimeRef.current < 800) return;
    lastCaseAdvanceTimeRef.current = now;

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

  if (currentView === 'admin') {
    return <AdminDashboard onBackToStudent={handleBackToStudent} />;
  }

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

      {/* End Game Official Report Modal — hidden while blocked so student can't see explanations */}
      {!isBlockedByViolation && (
        <FinalReportModal
          isOpen={isReportOpen}
          profile={profile}
          questions={QUIZ_QUESTIONS}
          attempts={attempts}
          violationsCount={violationsCount}
          onClose={() => setIsReportOpen(false)}
          onReviewQuestion={(q) => {
            setOpenedFromReport(true);
            setIsReportOpen(false);
            setActiveQuestion(q);
          }}
        />
      )}

      {/* Anti-Cheat Tab Violation Overlay — always renders when blocked, even if all questions are marked */}
      <AntiCheatModal
        isOpen={isAntiCheatOpen}
        violationsCount={violationsCount}
        isBlocked={isBlockedByViolation}
        score={Object.values(attempts).filter((a) => a.isCorrect).length}
        onAcknowledge={handleAcknowledgeAntiCheat}
      />

      {/* Unblocked Fullscreen Auto Re-Entry Modal */}
      <UnblockedFullscreenModal
        isOpen={isUnblockedModalOpen}
        onEnterFullscreen={enterFullscreen}
      />
    </CRTFrame>
  );
}

export default App;
