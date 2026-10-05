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
          className="w-full text-xl sm:text-2xl font-bold tracking-tight text-text-primary bg-surface-base border border-accent rounded-lg p-2.5 shadow-xs focus:outline-none resize-none leading-snug"
          placeholder="Issue title..."
          aria-label="Edit issue title"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!draftTitle.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent hover:opacity-90 text-surface-base text-xs font-semibold rounded-[6px] shadow-2xs transition-opacity cursor-pointer disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Title</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-base hover:bg-surface-subtle text-text-muted text-xs font-medium rounded-[6px] border border-border transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <span className="text-[11px] text-text-muted ml-1">
            Press <kbd className="font-mono px-1 py-0.2 rounded border border-border bg-surface-subtle">Enter</kbd> to save,{' '}
            <kbd className="font-mono px-1 py-0.2 rounded border border-border bg-surface-subtle">Esc</kbd> to cancel
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
          : 'cursor-pointer hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent/20'
      }`}
    >
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary leading-snug flex items-start justify-between gap-3">
        <span className="break-words">{title}</span>
        {!isReadOnly && (
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-accent rounded shrink-0 mt-0.5"
            title="Edit title"
          >
            <Edit2 className="w-4 h-4" />
          </span>
        )}
      </h1>
    </div>
  );
};
