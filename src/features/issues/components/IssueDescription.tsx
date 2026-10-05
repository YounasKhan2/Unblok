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
            className="my-2.5 p-3 rounded-lg bg-[#1e1e1e] text-[#f8f8f2] font-mono text-xs overflow-x-auto leading-relaxed border border-[#333]"
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
        <h3 key={i} className="text-sm font-bold text-[#1a1a1a] mt-3 mb-1.5">
          {formatInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-[#1a1a1a] mt-4 mb-2 pb-1 border-b border-[#e5e3df]">
          {formatInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-[#1a1a1a] mt-4 mb-2 pb-1 border-b border-[#e5e3df]">
          {formatInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Bullet lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 text-xs text-[#37352f] pl-2">
          <span className="text-[#5645d4] mt-1.5">•</span>
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
          className="border-l-3 border-[#5645d4] pl-3 py-1 my-2 text-xs italic text-[#787671] bg-purple-50/40 rounded-r"
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
      <p key={i} className="text-xs text-[#37352f] leading-relaxed my-1">
        {formatInline(line)}
      </p>
    );
  }

  // Close unclosed code block if file ends inside code fence
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="code-unclosed"
        className="my-2.5 p-3 rounded-lg bg-[#1e1e1e] text-[#f8f8f2] font-mono text-xs overflow-x-auto leading-relaxed border border-[#333]"
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
          className="font-mono text-[11px] bg-[#f0eeec] text-[#d83a52] px-1 py-0.5 rounded border border-[#e5e3df]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-[#1a1a1a]">
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
        <label className="text-xs font-semibold uppercase tracking-wider text-[#787671] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>Description</span>
        </label>

        {!isReadOnly && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-[#5645d4] hover:bg-purple-50 rounded transition-colors cursor-pointer"
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
            className="w-full text-xs font-mono text-[#37352f] bg-white border border-[#5645d4] rounded-lg p-3 leading-relaxed shadow-xs focus:outline-none resize-y"
            aria-label="Edit issue description"
          />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5645d4] hover:bg-[#4838bd] text-white text-xs font-semibold rounded-[6px] shadow-2xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Description</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-100 text-[#787671] text-xs font-medium rounded-[6px] border border-[#e5e3df] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            <div className="text-[11px] text-[#787671]">
              <span className="hidden sm:inline">Supports Markdown: </span>
              <code className="text-[#5645d4]"># header</code>,{' '}
              <code className="text-[#5645d4]">**bold**</code>,{' '}
              <code className="text-[#5645d4]">`code`</code>,{' '}
              <code className="text-[#5645d4]">- list</code>
              <span className="ml-2 font-mono text-[10px]">⌘+Enter to save</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={description ? undefined : handleStartEdit}
          className={`min-h-[70px] p-3 rounded-lg border border-[#e5e3df] bg-[#fafaf9] ${
            !description && !isReadOnly ? 'cursor-pointer hover:border-[#5645d4] transition-colors' : ''
          }`}
        >
          {description.trim() ? (
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(description)}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-[#787671] italic">
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
