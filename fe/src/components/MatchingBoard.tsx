import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { MatchingQuestion } from '../types/quiz';
import { MathRenderer } from './MathRenderer';
import { sound } from '../utils/sound';
import { RotateCcw } from 'lucide-react';

interface MatchingBoardProps {
  question: MatchingQuestion;
  userAnswer: Record<string, string>;
  onChangeAnswer: (answer: Record<string, string>) => void;
  isChecked: boolean;
}

// Distinct vibrant colors for up to 5 pairs
const PAIR_COLORS = [
  '#e63946', // Red / Crimson
  '#059669', // Emerald / Teal
  '#2563eb', // Royal Blue
  '#d97706', // Amber / Orange
  '#9333ea', // Violet / Purple
];

type DragSource = { side: 'left'; id: string } | { side: 'right'; key: string };
type ActiveSelection = { side: 'left'; id: string } | { side: 'right'; key: string };

export const MatchingBoard: React.FC<MatchingBoardProps> = ({
  question,
  userAnswer,
  onChangeAnswer,
  isChecked,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Active drag state
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const dragSourceRef = useRef<DragSource | null>(null);
  dragSourceRef.current = dragSource;

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Click-to-connect state (for tapping / accessibility)
  const [selectedItem, setSelectedItem] = useState<ActiveSelection | null>(null);

  // Measured dot coordinates relative to containerRef
  const [dotCoords, setDotCoords] = useState<{
    left: Record<string, { x: number; y: number }>;
    right: Record<string, { x: number; y: number }>;
  }>({ left: {}, right: {} });

  // Update dot coordinates whenever layout mounts or resizes
  const updateCoords = useCallback(() => {
    if (!containerRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();

    const newLeft: Record<string, { x: number; y: number }> = {};
    question.leftItems.forEach((item) => {
      const el = leftItemRefs.current[item.id];
      if (el) {
        const r = el.getBoundingClientRect();
        // Dot is at the right edge, vertically centered
        newLeft[item.id] = {
          x: r.right - cRect.left,
          y: r.top + r.height / 2 - cRect.top,
        };
      }
    });

    const newRight: Record<string, { x: number; y: number }> = {};
    question.rightOptions.forEach((opt) => {
      const el = rightItemRefs.current[opt.key];
      if (el) {
        const r = el.getBoundingClientRect();
        // Dot is at the left edge, vertically centered
        newRight[opt.key] = {
          x: r.left - cRect.left,
          y: r.top + r.height / 2 - cRect.top,
        };
      }
    });

    setDotCoords({ left: newLeft, right: newRight });
  }, [question]);

  useEffect(() => {
    updateCoords();
    const handleResize = () => updateCoords();
    window.addEventListener('resize', handleResize);
    // Also re-measure after fonts/KaTeX load
    const timer = setTimeout(updateCoords, 200);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [updateCoords]);

  // Connect helper
  const connect = (leftId: string, rightKey: string) => {
    if (isChecked) return;
    sound.playClick();
    const next = { ...userAnswer };
    // Clear any existing connection for this right option from other left items
    Object.keys(next).forEach((k) => {
      if (next[k] === rightKey) delete next[k];
    });
    next[leftId] = rightKey;
    onChangeAnswer(next);
    setSelectedItem(null);
  };

  // Disconnect helper
  const disconnect = (leftId: string) => {
    if (isChecked) return;
    sound.playClick();
    const next = { ...userAnswer };
    delete next[leftId];
    onChangeAnswer(next);
  };

  // Reset all connections helper
  const handleResetAll = () => {
    if (isChecked) return;
    sound.playClick();
    onChangeAnswer({});
    setSelectedItem(null);
  };

  // Pointer event listeners on window during drag
  useEffect(() => {
    if (!dragSource) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - cRect.left,
        y: e.clientY - cRect.top,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      const currentSource = dragSourceRef.current;
      setDragSource(null);
      setMousePos(null);

      if (!currentSource) return;

      // Find drop target under cursor
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const matchElem = elem?.closest('[data-matching-item]');
      if (!matchElem) return;

      const targetSide = matchElem.getAttribute('data-side');
      const targetId = matchElem.getAttribute('data-id');
      if (!targetSide || !targetId) return;

      if (currentSource.side === 'left' && targetSide === 'right') {
        connect(currentSource.id, targetId);
      } else if (currentSource.side === 'right' && targetSide === 'left') {
        connect(targetId, currentSource.key);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragSource, userAnswer, isChecked]);

  // Handle pointer down on left item (tap-to-match for touch, drag for mouse)
  const handleLeftPointerDown = (leftId: string, e: React.PointerEvent) => {
    if (isChecked) return;
    updateCoords();

    // If an item on right was already selected by clicking, connect them!
    if (selectedItem?.side === 'right') {
      connect(leftId, selectedItem.key);
      return;
    }

    // If already selected, tap again to deselect
    if (selectedItem?.side === 'left' && selectedItem.id === leftId) {
      setSelectedItem(null);
      setDragSource(null);
      return;
    }

    setSelectedItem({ side: 'left', id: leftId });

    // Only start mouse drag, keeping touch completely free for fluid scrolling
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      setDragSource({ side: 'left', id: leftId });
      if (containerRef.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - cRect.left, y: e.clientY - cRect.top });
      }
    }
  };

  // Handle pointer down on right item (tap-to-match for touch, drag for mouse)
  const handleRightPointerDown = (rightKey: string, e: React.PointerEvent) => {
    if (isChecked) return;
    updateCoords();

    // If an item on left was already selected by clicking, connect them!
    if (selectedItem?.side === 'left') {
      connect(selectedItem.id, rightKey);
      return;
    }

    // If already selected, tap again to deselect
    if (selectedItem?.side === 'right' && selectedItem.key === rightKey) {
      setSelectedItem(null);
      setDragSource(null);
      return;
    }

    setSelectedItem({ side: 'right', key: rightKey });

    // Only start mouse drag, keeping touch completely free for fluid scrolling
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      setDragSource({ side: 'right', key: rightKey });
      if (containerRef.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - cRect.left, y: e.clientY - cRect.top });
      }
    }
  };

  // Get color for left item index
  const getColorForIndex = (index: number) => PAIR_COLORS[index % PAIR_COLORS.length];

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-1.5 select-none w-full">
      {/* Instructions banner placed outside canvas to avoid overlapping headers */}
      <div className="bg-[#e8e4d8] text-neutral-800 text-[9px] sm:text-[11px] px-1.5 sm:px-2.5 py-0.5 sm:py-1 brutal-border font-bold tracking-wide flex items-center justify-between shrink-0">
        <span className="truncate">
          {!isChecked
            ? selectedItem
              ? `👉 Ketuk ${selectedItem.side === 'left' ? 'Kolom B' : 'Kolom A'} untuk memasangkan`
              : '👉 Ketuk butir Kolom A lalu ketuk pasangannya di Kolom B'
            : '🔒 Hasil evaluasi pasangan telah dikunci'}
        </span>
        {!isChecked && Object.keys(userAnswer).length > 0 && (
          <button
            onClick={handleResetAll}
            className="text-[8.5px] sm:text-[10px] font-bold text-red-600 hover:text-red-700 underline cursor-pointer ml-1.5 shrink-0"
          >
            RESET
          </button>
        )}
      </div>

      {/* Interactive Canvas Container (pan-y enabled for natural touch scrolling) */}
      <div
        ref={containerRef}
        style={{ touchAction: 'pan-y' }}
        className="relative flex-1 min-h-[200px] sm:min-h-[240px] bg-[#faf8f3] brutal-border-2 p-1 sm:p-2.5 flex flex-col justify-start overflow-hidden"
      >
        {/* Dual Columns */}
        <div className="flex justify-between items-start gap-1 sm:gap-6 relative z-20 w-full">
          {/* ==================================================== */}
          {/* KOLOM A (Left Items) */}
          {/* ==================================================== */}
          <div className="flex flex-col gap-1 sm:gap-2 w-[49%] max-w-[400px]">
            <div className="bg-black text-white text-[8.5px] sm:text-[11px] font-bold uppercase tracking-wider px-1 sm:px-2 py-0.5 sm:py-1 brutal-border text-center shrink-0 mb-0.5">
              <span className="sm:hidden">KOLOM A</span>
              <span className="hidden sm:inline">KOLOM A (PERNYATAAN)</span>
            </div>

            {question.leftItems.map((leftItem, idx) => {
              const pairColor = getColorForIndex(idx);
              const connectedRightKey = userAnswer[leftItem.id];
              const isConnected = !!connectedRightKey;
              const isSelected = selectedItem?.side === 'left' && selectedItem.id === leftItem.id;
              const isBeingDragged = dragSource?.side === 'left' && dragSource.id === leftItem.id;

              // Correctness evaluation when checked
              const correctKey = question.correctAnswer[leftItem.id];
              const validKeys = question.acceptedAlternatives?.[leftItem.id] || [correctKey];
              const isCorrect = isChecked && validKeys.includes(connectedRightKey || '');
              const isWrong = isChecked && isConnected && !isCorrect;

              return (
                <div
                  key={leftItem.id}
                  ref={(el) => { leftItemRefs.current[leftItem.id] = el; }}
                  data-matching-item="true"
                  data-side="left"
                  data-id={leftItem.id}
                  onPointerDown={(e) => handleLeftPointerDown(leftItem.id, e)}
                  className={`group relative flex items-center justify-between p-1 sm:p-2.5 brutal-border-2 transition-all cursor-pointer ${
                    isChecked
                      ? isCorrect
                        ? 'bg-emerald-100 border-emerald-700 text-emerald-950'
                        : isWrong
                        ? 'bg-red-100 border-red-700 text-red-950'
                        : 'bg-white opacity-60'
                      : isSelected || isBeingDragged
                      ? 'bg-amber-100 ring-2 ring-amber-500 brutal-shadow'
                      : isConnected
                      ? 'bg-white brutal-shadow-sm'
                      : 'bg-white hover:bg-neutral-50 brutal-shadow-sm'
                  }`}
                  style={{
                    borderLeftColor: isConnected ? pairColor : undefined,
                    borderLeftWidth: isConnected ? '4px' : undefined,
                  }}
                >
                  <div className="flex-1 min-w-0 text-[9.5px] sm:text-xs font-bold leading-tight font-sans text-neutral-900 pr-0.5 break-words">
                    <MathRenderer content={leftItem.leftText} inline />
                  </div>

                  {/* Connected Right Option Label Badge if connected */}
                  {isConnected && !isChecked && (
                    <span
                      className="text-[8px] sm:text-[10px] font-bold text-white px-1 py-0.2 brutal-border shrink-0 ml-0.5 font-mono-code"
                      style={{ backgroundColor: pairColor }}
                    >
                      [{connectedRightKey}]
                    </span>
                  )}

                  {/* Connector Dot at right edge */}
                  <div
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-black flex items-center justify-center shrink-0 ml-0.5 transition-transform group-hover:scale-125 ${
                      isSelected ? 'scale-125 ring-2 ring-black' : ''
                    }`}
                    style={{
                      backgroundColor: isConnected ? pairColor : '#fff',
                    }}
                  >
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-black/60" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ==================================================== */}
          {/* KOLOM B (Right Options) */}
          {/* ==================================================== */}
          <div className="flex flex-col gap-1 sm:gap-2 w-[49%] max-w-[400px]">
            <div className="bg-black text-white text-[8.5px] sm:text-[11px] font-bold uppercase tracking-wider px-1 sm:px-2 py-0.5 sm:py-1 brutal-border text-center shrink-0 mb-0.5">
              <span className="sm:hidden">KOLOM B</span>
              <span className="hidden sm:inline">KOLOM B (PILIHAN)</span>
            </div>

            {question.rightOptions.map((rightOpt) => {
              // Check if any left item connects to this right option
              const matchedLeftId = Object.entries(userAnswer).find(([, v]) => v === rightOpt.key)?.[0];
              const leftIdx = matchedLeftId
                ? question.leftItems.findIndex((l) => l.id === matchedLeftId)
                : -1;
              const isConnected = leftIdx >= 0;
              const pairColor = isConnected ? getColorForIndex(leftIdx) : '#000';
              const isSelected = selectedItem?.side === 'right' && selectedItem.key === rightOpt.key;
              const isBeingDragged = dragSource?.side === 'right' && dragSource.key === rightOpt.key;

              // Correctness evaluation when checked
              let isCorrect = false;
              let isWrong = false;
              if (isChecked && matchedLeftId) {
                const correctKey = question.correctAnswer[matchedLeftId];
                const validKeys = question.acceptedAlternatives?.[matchedLeftId] || [correctKey];
                isCorrect = validKeys.includes(rightOpt.key);
                isWrong = !isCorrect;
              }

              // Determine if rightText has LaTeX or is plain text with spaces
              const isMath = rightOpt.rightText.includes('$') || rightOpt.rightText.includes('\\');

              return (
                <div
                  key={rightOpt.key}
                  ref={(el) => { rightItemRefs.current[rightOpt.key] = el; }}
                  data-matching-item="true"
                  data-side="right"
                  data-id={rightOpt.key}
                  onPointerDown={(e) => handleRightPointerDown(rightOpt.key, e)}
                  className={`group relative flex items-center justify-between p-1 sm:p-2.5 brutal-border-2 transition-all cursor-pointer ${
                    isChecked
                      ? isCorrect
                        ? 'bg-emerald-100 border-emerald-700 text-emerald-950'
                        : isWrong
                        ? 'bg-red-100 border-red-700 text-red-950'
                        : 'bg-white opacity-60'
                      : isSelected || isBeingDragged
                      ? 'bg-amber-100 ring-2 ring-amber-500 brutal-shadow'
                      : isConnected
                      ? 'bg-white brutal-shadow-sm'
                      : 'bg-white hover:bg-neutral-50 brutal-shadow-sm'
                  }`}
                  style={{
                    borderRightColor: isConnected ? pairColor : undefined,
                    borderRightWidth: isConnected ? '4px' : undefined,
                  }}
                >
                  {/* Connector Dot at left edge */}
                  <div
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-black flex items-center justify-center shrink-0 mr-1 transition-transform group-hover:scale-125 ${
                      isSelected ? 'scale-125 ring-2 ring-black' : ''
                    }`}
                    style={{
                      backgroundColor: isConnected ? pairColor : '#fff',
                    }}
                  >
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-black/60" />
                  </div>

                  {/* Option Label and Text Content */}
                  <div className="flex-1 min-w-0 pr-0.5 text-[9.5px] sm:text-xs font-bold leading-tight font-sans text-neutral-900 break-words">
                    <span className="font-mono-code bg-black text-white px-1 sm:px-1.5 py-0.2 text-[8.5px] sm:text-[10px] brutal-border mr-1 inline-block align-middle">
                      {rightOpt.key}
                    </span>
                    <span className="align-middle inline">
                      {isMath ? (
                        <MathRenderer
                          content={rightOpt.rightText.includes('$') ? rightOpt.rightText : `$${rightOpt.rightText}$`}
                          inline
                        />
                      ) : (
                        <span>{rightOpt.rightText}</span>
                      )}
                    </span>
                  </div>

                  {/* Connected Left ID indicator */}
                  {isConnected && !isChecked && (
                    <span
                      className="text-[8px] sm:text-[10px] font-bold text-white px-1 py-0.2 brutal-border shrink-0 ml-0.5 font-mono-code"
                      style={{ backgroundColor: pairColor }}
                    >
                      #{matchedLeftId}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================================================== */}
        {/* SVG Drawing Layer for Connection Lines (Behind Cards) */}
        {/* ==================================================== */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: 'visible' }}
        >
          {/* Arrow markers for each color */}
          <defs>
            {PAIR_COLORS.map((col, i) => (
              <marker
                key={i}
                id={`marker-${i}`}
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={col} />
              </marker>
            ))}
            <marker
              id="marker-correct"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
            </marker>
            <marker
              id="marker-wrong"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
            </marker>
          </defs>

          {/* Render established connection lines */}
          {question.leftItems.map((leftItem, idx) => {
            const rightKey = userAnswer[leftItem.id];
            if (!rightKey) return null;

            const from = dotCoords.left[leftItem.id];
            const to = dotCoords.right[rightKey];
            if (!from || !to) return null;

            const defaultColor = getColorForIndex(idx);
            let lineColor = defaultColor;
            let markerId = `marker-${idx % PAIR_COLORS.length}`;

            // Correctness check when checked
            const correctKey = question.correctAnswer[leftItem.id];
            const validKeys = question.acceptedAlternatives?.[leftItem.id] || [correctKey];
            const isPairCorrect = validKeys.includes(rightKey);

            if (isChecked) {
              lineColor = isPairCorrect ? '#16a34a' : '#dc2626';
              markerId = isPairCorrect ? 'marker-correct' : 'marker-wrong';
            }

            // Bezier curve control points for an elegant retro cyber-circuit wire
            const dx = Math.abs(to.x - from.x) * 0.45;
            const pathData = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            return (
              <g key={leftItem.id}>
                {/* Wide invisible hitbox for easy click to disconnect */}
                {!isChecked && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={24}
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={() => disconnect(leftItem.id)}
                  >
                    <title>Klik untuk memutuskan koneksi ini</title>
                  </path>
                )}

                {/* Visible curved line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={3}
                  strokeDasharray={isChecked ? undefined : '6,3'}
                  markerEnd={`url(#${markerId})`}
                  style={{ pointerEvents: 'none' }}
                />

                {/* Center Badge showing connection indicator */}
                <g
                  transform={`translate(${midX}, ${midY})`}
                  style={{ pointerEvents: isChecked ? 'none' : 'all', cursor: isChecked ? 'default' : 'pointer' }}
                  onClick={() => !isChecked && disconnect(leftItem.id)}
                >
                  <circle
                    r={9}
                    fill={lineColor}
                    stroke="#000"
                    strokeWidth={1.5}
                  />
                  <text
                    textAnchor="middle"
                    dy=".35em"
                    fill="#fff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isChecked ? (isPairCorrect ? '✓' : '✕') : '✕'}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Active Drag Preview Line (drawn while dragging) */}
          {dragSource && mousePos && (() => {
            let startCoord: { x: number; y: number } | undefined;
            let dragColor = '#d92222';

            if (dragSource.side === 'left') {
              startCoord = dotCoords.left[dragSource.id];
              const idx = question.leftItems.findIndex((l) => l.id === dragSource.id);
              if (idx >= 0) dragColor = getColorForIndex(idx);
            } else {
              startCoord = dotCoords.right[dragSource.key];
            }

            if (!startCoord) return null;

            return (
              <line
                x1={startCoord.x}
                y1={startCoord.y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke={dragColor}
                strokeWidth={3}
                strokeDasharray="4,4"
                strokeLinecap="round"
                className="animate-pulse"
                style={{ pointerEvents: 'none' }}
              />
            );
          })()}
        </svg>
      </div>

      {/* Footer Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono-code">
        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-700">
            {isChecked ? 'KUNCI RESMI:' : 'PASANGAN TERBENTUK:'}
          </span>
          {isChecked ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {question.leftItems.map((item) => (
                <span
                  key={item.id}
                  className="bg-emerald-100 text-emerald-900 border border-emerald-600 px-1.5 py-0.5 text-[10px] font-bold"
                >
                  #{item.id} → [{question.correctAnswer[item.id]}]
                </span>
              ))}
            </div>
          ) : (
            <span className="bg-black text-white px-2 py-0.5 font-bold text-[11px] brutal-border">
              {Object.keys(userAnswer).length} / {question.leftItems.length}
            </span>
          )}
        </div>

        {!isChecked && Object.keys(userAnswer).length > 0 && (
          <button
            onClick={() => {
              sound.playClick();
              onChangeAnswer({});
            }}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold text-[11px] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET SEMUA GARIS</span>
          </button>
        )}
      </div>
    </div>
  );
};
