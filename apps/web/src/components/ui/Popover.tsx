import React, { useEffect, useRef } from 'react';

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  children: React.ReactNode;
  width?: string;
  align?: 'left' | 'right';
  placement?: 'bottom' | 'top';
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  children,
  width = 'w-48',
  align = 'left',
  placement = 'bottom',
  className = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleGlobalClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const placementClasses =
    placement === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-1';

  return (
    <div
      ref={popoverRef}
      className={`absolute z-50 ${width} ${placementClasses} ${
        align === 'right' ? 'right-0' : 'left-0'
      } bg-surface-base rounded-lg shadow-xl border border-border p-1 text-xs text-text-primary animate-in fade-in zoom-in-95 duration-100 ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
};
