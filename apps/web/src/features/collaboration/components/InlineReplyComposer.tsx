/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { canComment } from '../permissions';
import { Send, X, CornerDownRight } from 'lucide-react';

interface InlineReplyComposerProps {
  issueId: string;
  commentId: string;
  recipientName?: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export const InlineReplyComposer: React.FC<InlineReplyComposerProps> = ({
  issueId,
  commentId,
  recipientName,
  onSubmitted,
  onCancel,
}) => {
  const { addComment, currentUser } = useProject();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isPermitted = canComment(currentUser.role);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!isPermitted) {
      setError('Observers have read-only access and cannot author replies.');
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Reply content cannot be empty.');
      return;
    }

    const created = addComment(issueId, trimmed, commentId);
    if (!created) {
      setError('Failed to post reply.');
      return;
    }

    setContent('');
    setError(null);
    onSubmitted();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isPermitted) {
    return (
      <div className="mt-2 p-2.5 rounded-md bg-surface-subtle border border-border text-xs text-text-muted">
        Viewing in read-only mode (Observer). Replying is disabled.
      </div>
    );
  }

  return (
    <div
      className="mt-2.5 p-3 rounded-lg bg-surface-base border border-accent/30 shadow-xs focus-within:border-accent transition-colors"
      role="region"
      aria-label="Inline reply composer"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-text-muted">
        <div className="flex items-center gap-1.5 text-accent font-medium">
          <CornerDownRight className="w-3.5 h-3.5" />
          <span>
            Replying to <span className="font-semibold text-text-primary">{recipientName || 'thread'}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded transition-colors cursor-pointer"
          title="Cancel reply (Esc)"
          aria-label="Cancel reply"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <textarea
        ref={textareaRef}
        rows={2}
        value={content}
        onChange={e => {
          setContent(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder={`Reply to ${recipientName || 'thread'}... (⌘ + Enter to send)`}
        className="w-full text-xs text-text-primary bg-transparent focus:outline-none resize-none leading-relaxed placeholder:text-text-muted"
        aria-label="Write a reply"
      />

      {error && (
        <div className="mt-1 text-[11px] text-danger font-medium" role="alert">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
        <span className="text-[10px] text-text-muted">
          Press <kbd className="font-mono bg-surface-subtle px-1 py-0.5 rounded border border-border">⌘</kbd> + <kbd className="font-mono bg-surface-subtle px-1 py-0.5 rounded border border-border">Enter</kbd> to send, <kbd className="font-mono bg-surface-subtle px-1 py-0.5 rounded border border-border">Esc</kbd> to cancel
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary rounded hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer shadow-2xs"
          >
            <Send className="w-3 h-3" />
            <span>Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
