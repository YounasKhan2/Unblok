/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Issue } from '../../types';
import { MyWorkRow } from './MyWorkRow';

interface MyWorkSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  count: number;
  issues: Issue[];
  emptyMessage: string;
  selectedIssueKey: string | null;
  selectedIssueIds: string[];
  onSelectRow: (issue: Issue) => void;
  onToggleMultiSelect: (issueId: string, isShift: boolean) => void;
  onOpenIssue: (key: string) => void;
  defaultCollapsed?: boolean;
}

export const MyWorkSection: React.FC<MyWorkSectionProps> = ({
  id,
  title,
  subtitle,
  count,
  issues,
  emptyMessage,
  selectedIssueKey,
  selectedIssueIds,
  onSelectRow,
  onToggleMultiSelect,
  onOpenIssue,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // If a section is empty and it's not Needs Attention or In Progress, we can show a minimal subtle state
  const isImportantSection = id === 'needsAttention' || id === 'inProgress';

  return (
    <div className="mb-4">
      {/* Section Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-3 py-1.5 bg-surface-subtle border-y border-border text-xs cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <button
            className="p-0.5 text-text-muted group-hover:text-text-primary transition-colors"
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <span className="font-bold text-text-primary tracking-tight">{title}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              id === 'needsAttention' && count > 0
                ? 'bg-danger text-white'
                : 'bg-surface-muted text-text-secondary'
            }`}
          >
            {count}
          </span>
          {subtitle && (
            <span className="text-[11px] text-text-muted hidden md:inline ml-1">
              · {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Section Body */}
      {!isCollapsed && (
        <div>
          {issues.length > 0 ? (
            issues.map(issue => (
              <MyWorkRow
                key={issue.id}
                issue={issue}
                isSelected={selectedIssueKey === issue.key || selectedIssueKey === issue.id}
                isMultiSelected={selectedIssueIds.includes(issue.id)}
                onSelect={() => onSelectRow(issue)}
                onToggleMultiSelect={isShift => onToggleMultiSelect(issue.id, isShift)}
                onOpenIssue={onOpenIssue}
              />
            ))
          ) : (
            <div className="px-6 py-2.5 text-xs text-text-muted italic bg-surface-base border-b border-border">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
