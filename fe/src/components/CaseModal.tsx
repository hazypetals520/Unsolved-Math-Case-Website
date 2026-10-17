import React, { useState, useEffect } from 'react';
import type { QuizQuestion, CaseAttempt } from '../types/quiz';
import { MathRenderer } from './MathRenderer';
import { MatchingBoard } from './MatchingBoard';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';

interface CaseModalProps {
  question: QuizQuestion;
  isOpen: boolean;
  onClose: () => void;
  onResolveCase: (attempt: CaseAttempt) => void;
  onNextCase?: (currentQuestionId: number) => void;
  hasNextCase?: boolean;
  previousAttempt?: CaseAttempt | null;
  isReviewMode?: boolean;
}

export const CaseModal: React.FC<CaseModalProps> = ({
  question,
  isOpen,
  onClose,
  onResolveCase,
  onNextCase,
  hasNextCase = false,
  previousAttempt,
  isReviewMode = false,
}) => {
  const isReview = isReviewMode || !!previousAttempt;

  // Local state for answers before checking
  const [mcAnswer, setMcAnswer] = useState<string>(() => {
    if (question.type === 'multiple-choice' && previousAttempt?.userAnswer) {
      return String(previousAttempt.userAnswer);
    }
    return '';
  });
  const [complexAnswer, setComplexAnswer] = useState<string[]>(() => {
    if (question.type === 'complex-mc' && previousAttempt?.userAnswer) {
      return Array.isArray(previousAttempt.userAnswer) ? (previousAttempt.userAnswer as string[]) : [];
    }
    return [];
  });
  const [matchingAnswer, setMatchingAnswer] = useState<Record<string, string>>(() => {
    if (question.type === 'matching' && previousAttempt?.userAnswer && typeof previousAttempt.userAnswer === 'object' && !Array.isArray(previousAttempt.userAnswer)) {
      return previousAttempt.userAnswer as Record<string, string>;
    }
    return {};
  });
  const [shortAnswer, setShortAnswer] = useState<string>(() => {
    if (question.type === 'short-answer' && previousAttempt?.userAnswer) {
      return String(previousAttempt.userAnswer);
    }
    return '';
  });

  // Evaluation state
  const [isChecked, setIsChecked] = useState<boolean>(isReview);
  const [isCorrect, setIsCorrect] = useState<boolean>(previousAttempt?.isCorrect ?? false);
  const [showTopToast, setShowTopToast] = useState<boolean>(false);
  const [activeTabAfterCheck, setActiveTabAfterCheck] = useState<'explanation' | 'question'>('explanation');

  // Sync state whenever the question or previousAttempt changes
  useEffect(() => {
    const isRev = isReviewMode || !!previousAttempt;
    setIsChecked(isRev);
    setIsCorrect(previousAttempt?.isCorrect ?? false);
    setShowTopToast(false);
    setActiveTabAfterCheck(isRev ? 'explanation' : 'question');

    if (question.type === 'multiple-choice') {
      setMcAnswer(previousAttempt?.userAnswer ? String(previousAttempt.userAnswer) : '');
      setComplexAnswer([]);
      setMatchingAnswer({});
      setShortAnswer('');
    } else if (question.type === 'complex-mc') {
      setComplexAnswer(
        previousAttempt?.userAnswer && Array.isArray(previousAttempt.userAnswer)
          ? (previousAttempt.userAnswer as string[])
          : []
      );
      setMcAnswer('');
      setMatchingAnswer({});
      setShortAnswer('');
    } else if (question.type === 'matching') {
      setMatchingAnswer(
        previousAttempt?.userAnswer &&
          typeof previousAttempt.userAnswer === 'object' &&
          !Array.isArray(previousAttempt.userAnswer)
          ? (previousAttempt.userAnswer as Record<string, string>)
          : {}
      );
      setMcAnswer('');
      setComplexAnswer([]);
      setShortAnswer('');
    } else if (question.type === 'short-answer') {
      setShortAnswer(previousAttempt?.userAnswer ? String(previousAttempt.userAnswer) : '');
      setMcAnswer('');
      setComplexAnswer([]);
      setMatchingAnswer({});
    }
  }, [question.id, previousAttempt, isReviewMode]);

  if (!isOpen) return null;

  // Check if answer is provided
  const isInputProvided = () => {
    switch (question.type) {
      case 'multiple-choice':
        return !!mcAnswer;
      case 'complex-mc':
        return complexAnswer.length > 0;
      case 'matching':
        return Object.keys(matchingAnswer).length === question.leftItems.length;
      case 'short-answer':
        return shortAnswer.trim().length > 0;
      default:
        return false;
    }
  };

  // Check and evaluate the answer
  const handleCheckAnswer = () => {
    if (!isInputProvided() || isChecked) return;

    let evaluatedCorrect = false;

    if (question.type === 'multiple-choice') {
      evaluatedCorrect = mcAnswer.toUpperCase() === question.correctAnswer.toUpperCase();
    } else if (question.type === 'complex-mc') {
      const sortedUser = [...complexAnswer].sort();
      const sortedCorrect = [...question.correctAnswer].sort();
      evaluatedCorrect =
        sortedUser.length === sortedCorrect.length &&
        sortedUser.every((val, index) => val === sortedCorrect[index]);
    } else if (question.type === 'matching') {
      let allMatch = true;
      for (const item of question.leftItems) {
        const userChoice = matchingAnswer[item.id];
        const correctChoice = question.correctAnswer[item.id];
        const validAlternatives = question.acceptedAlternatives?.[item.id] || [correctChoice];

        if (!userChoice || !validAlternatives.includes(userChoice)) {
          allMatch = false;
          break;
        }
      }
      evaluatedCorrect = allMatch;
    } else if (question.type === 'short-answer') {
      const cleanUser = shortAnswer.trim().toLowerCase();
      const cleanCorrect = question.correctAnswer.trim().toLowerCase();
      const acceptedList = (question.acceptedAnswers || []).map((a) => a.trim().toLowerCase());
      evaluatedCorrect = cleanUser === cleanCorrect || acceptedList.includes(cleanUser);
    }

    setIsCorrect(evaluatedCorrect);
    setIsChecked(true);
    setShowTopToast(true);
    setActiveTabAfterCheck('explanation');

    // Immediately persist resolved case attempt
    let finalAnswer: string | string[] | Record<string, string> = '';
    if (question.type === 'multiple-choice') finalAnswer = mcAnswer;
    else if (question.type === 'complex-mc') finalAnswer = complexAnswer;
    else if (question.type === 'matching') finalAnswer = matchingAnswer;
    else if (question.type === 'short-answer') finalAnswer = shortAnswer.trim();

    onResolveCase({
      questionId: question.id,
      userAnswer: finalAnswer,
      isCorrect: evaluatedCorrect,
      timestamp: new Date().toISOString(),
    });

    if (evaluatedCorrect) {
      sound.playCorrect();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#000000', '#d92222', '#16a34a', '#eab308'],
        });
      } catch {}
    } else {
      sound.playWrong();
    }

    setTimeout(() => {
      setShowTopToast(false);
    }, 4000);
  };

  const handleFinishAndClose = () => {
    onClose();
  };

  const handleFinishAndNext = () => {
    if (onNextCase) {
      sound.playClick();
      onNextCase(question.id);
    } else {
      onClose();
    }
  };

  // Complex MC checkbox toggle
  const toggleComplexOption = (key: string) => {
    if (isChecked) return;
    sound.playClick();
    setComplexAnswer((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderUserAnswerSummary = () => {
    if (question.type === 'multiple-choice') {
      const opt = question.options.find((o) => o.key.toUpperCase() === mcAnswer.toUpperCase());
      return mcAnswer ? (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-black text-white px-1.5 py-0.2 font-mono-code">[{mcAnswer}]</span>
          {opt && <MathRenderer content={opt.label} inline />}
        </span>
      ) : (
        <span className="text-neutral-400 italic">Tidak dijawab</span>
      );
    }
    if (question.type === 'complex-mc') {
      return complexAnswer.length > 0 ? (
        <span className="font-mono-code bg-black text-white px-1.5 py-0.2">
          [{complexAnswer.join(', ')}]
        </span>
      ) : (
        <span className="text-neutral-400 italic">Tidak dijawab</span>
      );
    }
    if (question.type === 'matching') {
      return (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {question.leftItems.map((item) => {
            const chosen = matchingAnswer[item.id];
            return (
              <span key={item.id} className="bg-neutral-100 border border-black/40 px-1 py-0.2 text-[10px]">
                #{item.id} → {chosen ? `[${chosen}]` : '?'}
              </span>
            );
          })}
        </div>
      );
    }
    if (question.type === 'short-answer') {
      return shortAnswer ? (
        <span>{shortAnswer} {question.unit || ''}</span>
      ) : (
        <span className="text-neutral-400 italic">Kosong</span>
      );
    }
    return null;
  };

  const renderCorrectAnswerSummary = () => {
    if (question.type === 'multiple-choice') {
      const opt = question.options.find((o) => o.key.toUpperCase() === question.correctAnswer.toUpperCase());
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-emerald-700 text-white px-1.5 py-0.2 font-mono-code">[{question.correctAnswer}]</span>
          {opt && <MathRenderer content={opt.label} inline />}
        </span>
      );
    }
    if (question.type === 'complex-mc') {
      return (
        <span className="font-mono-code bg-emerald-700 text-white px-1.5 py-0.2">
          [{question.correctAnswer.join(', ')}]
        </span>
      );
    }
    if (question.type === 'matching') {
      return (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {question.leftItems.map((item) => (
            <span key={item.id} className="bg-emerald-100 border border-emerald-600 text-emerald-900 px-1 py-0.2 text-[10px] font-bold">
              #{item.id} → [{question.correctAnswer[item.id]}]
            </span>
          ))}
        </div>
      );
    }
    if (question.type === 'short-answer') {
      return (
        <span>{question.correctAnswer} {question.unit || ''}</span>
      );
    }
    return null;
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-0 sm:p-2 md:p-3 font-mono-code select-none overflow-hidden">
      {/* Retro Window Modal Frame */}
      <div className="w-full max-w-2xl lg:max-w-3xl h-full sm:h-[94%] md:max-h-[540px] bg-[#f4f1ea] brutal-border-2 sm:brutal-border-4 brutal-shadow-lg flex flex-col rounded-none sm:rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Top Sliding Toast Notification (Persegi panjang kecil yang muncul dari atas) */}
        {showTopToast && (
          <div className="absolute top-8 sm:top-10 left-1/2 -translate-x-1/2 z-50 w-[96%] sm:w-auto min-w-[270px] max-w-md animate-in slide-in-from-top-3 fade-in duration-200">
            <div
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 brutal-border-2 brutal-shadow flex items-center justify-between gap-2 sm:gap-3 text-xs font-bold text-white ${
                isCorrect ? 'bg-emerald-600 border-black' : 'bg-red-600 border-black'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                )}
                <div className="min-w-0">
                  <div className="uppercase tracking-wider font-mono-code text-[10px] sm:text-[11px] truncate">
                    {isCorrect ? 'ANALISIS VALID // TERPECAHKAN!' : 'ANALISIS TIDAK TEPAT // TERKUNCI!'}
                  </div>
                  <div className="text-[9px] sm:text-[10px] opacity-90 font-normal truncate">
                    {isCorrect ? 'Jawaban tepat. Pembahasan terbuka.' : 'Jawaban belum tepat. Pembahasan terbuka.'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTopToast(false)}
                className="w-4 h-4 sm:w-5 sm:h-5 bg-black/40 hover:bg-black/60 rounded-xs flex items-center justify-center text-white text-xs cursor-pointer shrink-0"
                title="Tutup Notifikasi"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Retro Window Title Bar */}
        <div className="bg-black text-[#f4f1ea] px-2 sm:px-2.5 py-0.5 sm:py-1 flex items-center justify-between border-b-2 sm:border-b-4 border-black select-none shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0 inline-block ${isChecked ? (isCorrect ? 'bg-emerald-400' : 'bg-red-600') : 'bg-amber-400'}`}></span>
            <span className="font-bold text-[10.5px] sm:text-sm tracking-wider uppercase truncate">
              {isChecked ? '[HASIL] ' : ''}{question.fileName} — {question.title}
            </span>
          </div>

          {/* Window control buttons [-] [□] [×] */}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#333] border border-white/40 flex items-center justify-center text-[10px] text-white/40 cursor-not-allowed select-none">_</div>
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#333] border border-white/40 flex items-center justify-center text-[10px] text-white/40 cursor-not-allowed select-none">□</div>
            <div
              className={`w-4 h-4 sm:w-5 sm:h-5 border border-white/40 flex items-center justify-center text-[10px] sm:text-xs text-white font-bold select-none ${
                isReview || isChecked
                  ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                  : 'bg-[#555] cursor-not-allowed text-white/40'
              }`}
              onClick={() => {
                if (!isReview && !isChecked) return;
                sound.playClick();
                handleFinishAndClose();
              }}
              title={isReview || isChecked ? 'Tutup Jendela' : 'Jendela dikunci sampai jawaban disubmit'}
            >
              ×
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL MAIN CONTENT AREA (Scrollable above sticky bar)     */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-[#faf8f3] flex flex-col">
          {isChecked && activeTabAfterCheck === 'explanation' ? (
            /* ========================================================= */
            /* FULL PEMBAHASAN VIEW (Fokus Penuh ke Pembahasan)          */
            /* ========================================================= */
            <div className="p-3 sm:p-4 space-y-3 font-mono-code flex-1 flex flex-col justify-start">
              {/* Status Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/20 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 brutal-border ${
                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{isCorrect ? 'ANALISIS VALID // KASUS TERPECAHKAN' : 'ANALISIS SALAH // BERKAS TERKUNCI'}</span>
                  </span>
                  <span className="text-[10px] sm:text-xs text-neutral-500 font-bold">
                    FILE ID: #MATH-0{question.id}
                  </span>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTabAfterCheck('question');
                  }}
                  className="text-[10px] sm:text-[11px] font-bold text-neutral-800 bg-white hover:bg-neutral-100 px-2 py-1 brutal-border flex items-center gap-1 cursor-pointer"
                >
                  <span>TAMPILKAN SOAL LENGKAP</span>
                </button>
              </div>

              {/* Question Statement Box */}
              <div className="bg-white p-2.5 sm:p-3 brutal-border-2 brutal-shadow-sm">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  PERNYATAAN SOAL:
                </div>
                <div className="text-xs sm:text-[13px] text-neutral-900 leading-relaxed font-sans font-medium">
                  <MathRenderer content={question.question} />
                </div>
              </div>

              {/* Answer Comparison Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 brutal-border-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">JAWABAN ANDA:</span>
                  <div className="font-bold text-xs sm:text-sm text-neutral-900">
                    {renderUserAnswerSummary()}
                  </div>
                </div>
                <div className="bg-emerald-50 border-2 border-emerald-700 p-2.5 text-emerald-950">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">KUNCI JAWABAN RESMI:</span>
                  <div className="font-bold text-xs sm:text-sm text-emerald-900">
                    {renderCorrectAnswerSummary()}
                  </div>
                </div>
              </div>

              {/* FULL PEMBAHASAN FORENSIK */}
              <div className="bg-white p-3 sm:p-4 brutal-border-2 brutal-shadow-sm space-y-2 flex-1">
                <div className="flex items-center gap-2 border-b-2 border-black/20 pb-2 text-black font-bold">
                  <BookOpen className="w-4 h-4 text-red-600" />
                  <span className="text-xs sm:text-sm tracking-wider uppercase">
                    PEMBAHASAN LENGKAP & LANGKAH FORENSIK:
                  </span>
                </div>
                <div className="text-xs sm:text-[13px] text-neutral-900 leading-relaxed font-sans space-y-2">
                  <MathRenderer content={question.explanation} />
                </div>
              </div>
            </div>
          ) : question.type === 'matching' ? (
            /* ========================================================= */
            /* FULL WIDTH LAYOUT FOR MATCHING BOARD                      */
            /* ========================================================= */
            <div className="flex-1 flex flex-col p-1.5 sm:p-3 justify-start space-y-1 sm:space-y-2">
              {isChecked && (
                <div className="flex items-center justify-between border-b-2 border-black/20 pb-1">
                  <span className="text-[11px] sm:text-xs font-bold text-neutral-800">
                    {isCorrect ? '✓ SEMUA PASANGAN VALID' : '✕ PASANGAN BELUM TEPAT'}
                  </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTabAfterCheck('explanation');
                    }}
                    className="text-[9.5px] sm:text-[11px] font-bold text-white bg-black hover:bg-neutral-800 px-2 py-0.5 brutal-border flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    <span>BACA PEMBAHASAN</span>
                  </button>
                </div>
              )}

              {/* Question Header & Prompt Box */}
              <div className="bg-white p-1.5 sm:p-2.5 brutal-border-2 brutal-shadow-sm flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="bg-black text-white px-1.5 py-0.2 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0">
                    {question.category}
                  </span>
                  <div className="text-[11px] sm:text-sm font-bold text-neutral-900 font-sans leading-tight truncate">
                    <MathRenderer content={question.question} inline />
                  </div>
                </div>
                <span className="text-[9px] sm:text-[11px] font-bold text-neutral-500 shrink-0">
                  #MATH-0{question.id}
                </span>
              </div>

              {/* Interactive SVG Matching Board */}
              <MatchingBoard
                question={question}
                userAnswer={matchingAnswer}
                onChangeAnswer={setMatchingAnswer}
                isChecked={isChecked}
              />
            </div>
          ) : (
            /* ========================================================= */
            /* SPLIT PANEL LAYOUT FOR PG, PGK, AND ISIAN SINGKAT         */
            /* ========================================================= */
            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
              
              {/* LEFT PANEL: Math Question Dossier */}
              <div className="w-full md:w-1/2 p-2 sm:p-3.5 border-b-2 md:border-b-0 md:border-r-2 border-black md:overflow-y-auto bg-[#faf8f3] flex flex-col justify-start space-y-1.5 sm:space-y-2.5 shrink-0 md:shrink">
                {isChecked && (
                  <div className="flex items-center justify-between border-b-2 border-black/20 pb-1">
                    <span className="text-[11px] sm:text-xs font-bold text-neutral-800">
                      {isCorrect ? '✓ ANALISIS TEPAT' : '✕ ANALISIS SALAH'}
                    </span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveTabAfterCheck('explanation');
                      }}
                      className="text-[9.5px] sm:text-[11px] font-bold text-white bg-black hover:bg-neutral-800 px-2 py-0.5 brutal-border flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span>BACA PEMBAHASAN</span>
                    </button>
                  </div>
                )}

                <div className="bg-white p-2.5 sm:p-4 brutal-border-2 brutal-shadow-sm">
                  <div className="text-xs sm:text-[13.5px] text-neutral-900 leading-relaxed font-sans font-medium">
                    <MathRenderer content={question.question} />
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: Interactive Input Workplace */}
              <div className="w-full md:w-1/2 p-2 sm:p-3.5 flex flex-col justify-between md:overflow-y-auto bg-[#f4f1ea] shrink-0 md:shrink">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between border-b border-black/20 pb-0.5 sm:pb-1">
                    <span className="text-[9.5px] sm:text-[11px] font-bold text-black uppercase tracking-wider">
                      PILIHAN JAWABAN
                    </span>
                    <span className="text-[8.5px] sm:text-[10px] text-neutral-600">
                      {isChecked ? 'STATUS: TERKUNCI' : 'PILIH JAWABAN'}
                    </span>
                  </div>

                  {/* Question Type 1: Pilihan Ganda (Single) */}
                  {question.type === 'multiple-choice' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-neutral-700">
                        Pilih SATU opsi yang paling tepat:
                      </div>
                      {question.options.map((opt) => {
                        const isSelected = mcAnswer === opt.key;
                        const isCorrectAnswer = opt.key.toUpperCase() === question.correctAnswer.toUpperCase();

                        return (
                          <button
                            key={opt.key}
                            disabled={isChecked}
                            onClick={() => {
                              sound.playClick();
                              setMcAnswer(opt.key);
                            }}
                            className={`w-full text-left p-2 brutal-border-2 flex items-center justify-between gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                              isChecked
                                ? isCorrectAnswer
                                  ? 'bg-emerald-200 border-emerald-800 text-black'
                                  : isSelected
                                  ? 'bg-red-200 border-red-800 text-black'
                                  : 'bg-white opacity-60'
                                : isSelected
                                ? 'bg-black text-[#f4f1ea] shadow-[2px_2px_0px_#d92222]'
                                : 'bg-white hover:bg-neutral-100 text-black brutal-shadow-sm brutal-shadow-active'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-5 h-5 border border-black flex items-center justify-center text-xs shrink-0 font-bold ${
                                  isSelected ? 'bg-red-600 text-white' : 'bg-[#e8e4d8] text-black'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="font-sans text-xs">
                                <MathRenderer content={opt.label} inline />
                              </span>
                            </div>
                            {isChecked && isCorrectAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            )}
                            {isChecked && isSelected && !isCorrectAnswer && (
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Question Type 2: Pilihan Ganda Kompleks */}
                  {question.type === 'complex-mc' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-red-700 bg-red-100 p-1.5 brutal-border-2">
                        PETUNJUK: Pilih SEMUA pernyataan yang bernilai BENAR.
                      </div>
                      {question.options.map((opt) => {
                        const isSelected = complexAnswer.includes(opt.key);
                        const isTargetCorrect = question.correctAnswer.includes(opt.key);

                        return (
                          <div
                            key={opt.key}
                            onClick={() => toggleComplexOption(opt.key)}
                            className={`p-2 brutal-border-2 flex items-start gap-2.5 text-xs font-medium transition-all select-none cursor-pointer ${
                              isChecked
                                ? isTargetCorrect
                                  ? 'bg-emerald-100 border-emerald-800 text-black'
                                  : isSelected
                                  ? 'bg-red-100 border-red-800 text-black'
                                  : 'bg-white opacity-70'
                                : isSelected
                                ? 'bg-[#1e293b] text-white shadow-[2px_2px_0px_#000]'
                                : 'bg-white hover:bg-neutral-100 text-black brutal-shadow-sm'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 border border-black flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white text-transparent'
                              }`}
                            >
                              ✓
                            </div>
                            <div className="flex-1 font-sans text-xs">
                              <strong className="font-mono-code mr-1">[{opt.key}]</strong>
                              <MathRenderer content={opt.label} inline />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Question Type 4: Isian Singkat */}
                  {question.type === 'short-answer' && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-neutral-800">
                        Ketik angka atau nilai jawaban akhir pada kolom input di bawah:
                      </div>

                      <div className="bg-white p-3 brutal-border-2 brutal-shadow-sm space-y-2">
                        <label className="block text-[11px] font-bold text-black uppercase">
                          Nilai / Jawaban Kasus:
                        </label>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            disabled={isChecked}
                            value={shortAnswer}
                            onChange={(e) => {
                              sound.playKey();
                              setShortAnswer(e.target.value);
                            }}
                            placeholder="Ketik angka hasil..."
                            className={`w-full px-2.5 py-1.5 text-sm font-bold brutal-border-2 focus:outline-none ${
                              isChecked
                                ? isCorrect
                                  ? 'bg-emerald-100 border-emerald-800 text-emerald-900'
                                  : 'bg-red-100 border-red-800 text-red-900'
                                : 'bg-[#faf8f3] text-black focus:bg-amber-50'
                            }`}
                          />
                          {question.unit && (
                            <span className="bg-[#e8e4d8] px-2.5 py-1.5 text-xs font-bold brutal-border-2 text-black shrink-0">
                              {question.unit}
                            </span>
                          )}
                        </div>

                        {isChecked && (
                          <div className="text-[11px] font-bold mt-1.5 pt-1.5 border-t border-black/20">
                            Kunci Jawaban Resmi: <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 border border-emerald-600">{question.correctAnswer} {question.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* PERSISTENT BOTTOM ACTION BAR (ZERO SCROLL NEEDED!)        */}
        {/* ========================================================= */}
        <div className="px-1.5 pt-1.5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-2.5 bg-[#f4f1ea] border-t-2 sm:border-t-4 border-black shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 z-20">
          {!isChecked ? (
            <>
              <div className="text-[10px] sm:text-[11px] text-neutral-600 hidden sm:block">
                Pilih jawaban dengan teliti sebelum menekan tombol verifikasi
              </div>

              <button
                disabled={!isInputProvided()}
                onClick={handleCheckAnswer}
                className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 font-mono-code font-bold text-xs sm:text-sm uppercase tracking-wider brutal-border-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  isInputProvided()
                    ? 'bg-red-600 hover:bg-red-500 text-white brutal-shadow brutal-shadow-active cursor-pointer'
                    : 'bg-neutral-300 text-neutral-500 border-neutral-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>CHECK ANSWER</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
              <button
                onClick={handleFinishAndClose}
                className="w-1/2 sm:w-auto px-2 sm:px-5 py-2 sm:py-2.5 bg-white hover:bg-neutral-100 text-black font-mono-code font-bold text-[10px] sm:text-sm uppercase tracking-wider brutal-border-2 brutal-shadow-sm flex items-center justify-center gap-1 cursor-pointer truncate"
              >
                <span>KEMBALI KE DESKTOP</span>
              </button>

              <button
                onClick={handleFinishAndNext}
                className="w-1/2 sm:w-auto px-2 sm:px-6 py-2 sm:py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono-code font-bold text-[10px] sm:text-sm uppercase tracking-wider brutal-border-2 brutal-shadow brutal-shadow-active flex items-center justify-center gap-1 cursor-pointer truncate"
              >
                <span>{hasNextCase ? `SOAL BERIKUTNYA (#${question.id + 1})` : 'LIHAT LAPORAN AKHIR'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
