/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, FileText } from 'lucide-react';

interface IssueDescriptionProps {
  description: string;
  isReadOnly?: boolean;
  onSave: (newDescription: string) => void;
}

/**
 * Lightweight, zero-dependency Markdown renderer for technical issue specifications.
 * Handles headings, bold, italics, inline code, code blocks, lists, blockquotes, and links.
 */
function renderMarkdown(content: string): React.ReactNode {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle (```)
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-2.5 p-3 rounded-lg bg-surface-subtle text-text-primary font-mono text-xs overflow-x-auto leading-relaxed border border-border"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-text-primary mt-3 mb-1.5">
          {formatInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-text-primary mt-4 mb-2 pb-1 border-b border-border">
          {formatInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-text-primary mt-4 mb-2 pb-1 border-b border-border">
          {formatInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Bullet lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 text-xs text-text-secondary pl-2">
          <span className="text-accent mt-1.5">•</span>
          <span className="flex-1">{formatInline(line.trim().slice(2))}</span>
        </div>
      );
      continue;
    }

    // Blockquotes
    if (line.trim().startsWith('> ')) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-3 border-accent pl-3 py-1 my-2 text-xs italic text-text-muted bg-accent/5 rounded-r"
        >
          {formatInline(line.trim().slice(2))}
        </blockquote>
      );
      continue;
    }

    // Empty line / paragraph break
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={i} className="text-xs text-text-secondary leading-relaxed my-1">
        {formatInline(line)}
      </p>
    );
  }

  // Close unclosed code block if file ends inside code fence
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="code-unclosed"
        className="my-2.5 p-3 rounded-lg bg-surface-subtle text-text-primary font-mono text-xs overflow-x-auto leading-relaxed border border-border"
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return elements;
}

/**
 * Parses inline Markdown: bold (**text**), code (`code`), and italics (*text*).
 */
function formatInline(text: string): React.ReactNode {
  // Regex splitting by code tokens first, then bold
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="font-mono text-[11px] bg-surface-muted text-danger px-1 py-0.5 rounded border border-border"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const IssueDescription: React.FC<IssueDescriptionProps> = ({
  description,
  isReadOnly = false,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftDesc, setDraftDesc] = useState(description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraftDesc(description);
  }, [description]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (isReadOnly) return;
    setDraftDesc(description);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(draftDesc.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftDesc(description);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>Description</span>
        </label>

        {!isReadOnly && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-accent hover:bg-accent/10 rounded transition-colors cursor-pointer"
            title="Edit description"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditing && !isReadOnly ? (
        <div className="space-y-2 animate-in fade-in duration-100">
          <textarea
            ref={textareaRef}
            rows={8}
            value={draftDesc}
            onChange={e => setDraftDesc(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add technical specifications, acceptance criteria, reproduction steps, or architecture logs... (Markdown supported)"
            className="w-full text-xs font-mono text-text-secondary bg-surface-base border border-accent rounded-lg p-3 leading-relaxed shadow-xs focus:outline-none resize-y"
            aria-label="Edit issue description"
          />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent hover:opacity-90 text-white text-xs font-semibold rounded-[6px] shadow-2xs transition-opacity cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Description</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-base hover:bg-surface-subtle text-text-muted text-xs font-medium rounded-[6px] border border-border transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            <div className="text-[11px] text-text-muted">
              <span className="hidden sm:inline">Supports Markdown: </span>
              <code className="text-accent"># header</code>,{' '}
              <code className="text-accent">**bold**</code>,{' '}
              <code className="text-accent">`code`</code>,{' '}
              <code className="text-accent">- list</code>
              <span className="ml-2 font-mono text-[10px]">⌘+Enter to save</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={description ? undefined : handleStartEdit}
          className={`min-h-[70px] p-3 rounded-lg border border-border bg-surface-subtle ${
            !description && !isReadOnly ? 'cursor-pointer hover:border-accent transition-colors' : ''
          }`}
        >
          {description.trim() ? (
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(description)}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-text-muted italic">
              {isReadOnly
                ? 'No technical description provided for this issue.'
                : 'No description provided. Click here to add specifications, acceptance criteria, or logs...'}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
