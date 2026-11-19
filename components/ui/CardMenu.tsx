"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
};

type Props = {
  items: MenuItem[];
  className?: string;
};

const MENU_WIDTH = 200;
const GAP = 4;
const EDGE = 8;

/**
 * Three-dot menu for cards.
 *
 * The dropdown is rendered into document.body with fixed positioning, so it
 * is never clipped by the card (cards use overflow-hidden for their rounded
 * image area). It opens below the button, or above it when there isn't room,
 * and is kept inside the viewport horizontally.
 */
export function CardMenu({ items, className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Align the menu's left edge with the button, but keep it on screen.
    let left = rect.left;
    if (left + MENU_WIDTH > vw - EDGE) left = rect.right - MENU_WIDTH;
    left = Math.max(EDGE, Math.min(left, vw - MENU_WIDTH - EDGE));

    // Open downward unless that would run off the bottom and there's more room above.
    let top = rect.bottom + GAP;
    if (menuHeight && top + menuHeight > vh - EDGE && rect.top - GAP - menuHeight >= EDGE) {
      top = rect.top - GAP - menuHeight;
    }

    setPos({ top, left });
  }, []);

  // Position before paint, then again once the menu has a measured height.
  useLayoutEffect(() => {
    if (!isOpen) return;
    place();
    const id = requestAnimationFrame(place);
    return () => cancelAnimationFrame(id);
  }, [isOpen, place]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    function handleScroll(event: Event) {
      // Scrolling inside the menu itself is fine; scrolling the page closes it.
      if (menuRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen, place]);

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      // Clicks inside the portal still bubble through React to the card; stop them here.
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: MENU_WIDTH,
        visibility: pos ? "visible" : "hidden",
      }}
      className="z-[1000] max-h-[calc(100vh-16px)] overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2"
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider && <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />}
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              item.onClick();
            }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
              item.danger
                ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {item.icon && <div className="w-4 h-4 flex-shrink-0">{item.icon}</div>}
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setPos(null);
          setIsOpen((open) => !open);
        }}
        className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 shadow-md transition-all hover:shadow-lg"
        title="More options"
      >
        <svg
          className="w-5 h-5 text-slate-700 dark:text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {isOpen && mounted && createPortal(menu, document.body)}
    </div>
  );
}
