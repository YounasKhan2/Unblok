/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface IssueTitleEditorProps {
  title: string;
  isReadOnly?: boolean;
  onSave: (newTitle: string) => void;
}

export const IssueTitleEditor: React.FC<IssueTitleEditorProps> = ({
  title,
  isReadOnly = false,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (isReadOnly) return;
    setDraftTitle(title);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== title) {
      onSave(trimmed);
    } else {
      setDraftTitle(title);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing && !isReadOnly) {
    return (
      <div className="space-y-2">
        <textarea
          ref={inputRef}
          value={draftTitle}
          onChange={e => setDraftTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="w-full text-xl sm:text-2xl font-bold tracking-tight text-[#1a1a1a] bg-white border border-[#5645d4] rounded-lg p-2.5 shadow-xs focus:outline-none resize-none leading-snug"
          placeholder="Issue title..."
          aria-label="Edit issue title"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!draftTitle.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5645d4] hover:bg-[#4838bd] text-white text-xs font-semibold rounded-[6px] shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Title</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-100 text-[#787671] text-xs font-medium rounded-[6px] border border-[#e5e3df] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <span className="text-[11px] text-[#787671] ml-1">
            Press <kbd className="font-mono px-1 py-0.2 rounded border bg-[#fafaf9]">Enter</kbd> to save,{' '}
            <kbd className="font-mono px-1 py-0.2 rounded border bg-[#fafaf9]">Esc</kbd> to cancel
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && !isReadOnly) {
          e.preventDefault();
          handleStartEdit();
        }
      }}
      tabIndex={isReadOnly ? undefined : 0}
      role={isReadOnly ? undefined : 'button'}
      aria-label={isReadOnly ? undefined : 'Click or press Enter to edit issue title'}
      className={`group relative rounded-lg -ml-2 p-2 transition-colors ${
        isReadOnly
          ? ''
          : 'cursor-pointer hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#5645d4]/20'
      }`}
    >
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1a1a] leading-snug flex items-start justify-between gap-3">
        <span className="break-words">{title}</span>
        {!isReadOnly && (
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#787671] hover:text-[#5645d4] rounded shrink-0 mt-0.5"
            title="Edit title"
          >
            <Edit2 className="w-4 h-4" />
          </span>
        )}
      </h1>
    </div>
  );
};
