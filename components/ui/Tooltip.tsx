/**
 * Design System — Tooltip
 *
 * Portal-based: renders directly on document.body so it is never clipped
 * by overflow:hidden parents (tables, cards, panels).
 *
 * Usage:
 *   <Tooltip content="Explanation here">
 *     <button>hover me</button>
 *   </Tooltip>
 *
 *   <InfoTooltip content="What this field means" />
 */

import React, { useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'right' | 'left';
  maxWidth?: number;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side    = 'top',
  maxWidth = 240,
  delay   = 120,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords,  setCoords]  = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = side === 'right'  ? r.right :
                side === 'left'   ? r.left  :
                r.left + r.width / 2;
      const y = side === 'bottom' ? r.bottom :
                side === 'right' || side === 'left' ? r.top + r.height / 2 :
                r.top;
      setCoords({ x, y });
      setVisible(true);
    }, delay);
  }, [side, delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const transform =
    side === 'top'    ? 'translate(-50%, calc(-100% - 8px))' :
    side === 'bottom' ? 'translate(-50%, 8px)'               :
    side === 'right'  ? 'translate(8px, -50%)'               :
                        'translate(calc(-100% - 8px), -50%)';

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="inline-flex items-center"
      >
        {children}
      </span>

      {visible && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          role="tooltip"
          style={{
            position:      'fixed',
            left:          coords.x,
            top:           coords.y,
            transform,
            zIndex:        9999,
            pointerEvents: 'none',
            maxWidth,
          }}
          className="bg-slate-900 border border-slate-700/60 text-slate-100 text-[11px] leading-relaxed font-normal rounded-lg px-3 py-2 shadow-2xl whitespace-pre-wrap"
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
};

// ── InfoTooltip (? icon) ──────────────────────────────────────────────────────
// Use this next to any label where users may not understand the meaning.

export const InfoTooltip: React.FC<{
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'right' | 'left';
  className?: string;
}> = ({ content, side = 'top', className }) => (
  <Tooltip content={content} side={side}>
    <span
      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full cursor-help shrink-0
        bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold leading-none select-none
        hover:bg-brand-100 dark:hover:bg-brand-400/20 hover:text-brand-700 dark:hover:text-brand-400
        transition-colors ${className ?? ''}`}
    >
      ?
    </span>
  </Tooltip>
);
