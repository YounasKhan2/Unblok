/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { Issue, Project, Team, BlockerStatusInfo } from '../../../types';
import { StatePill } from '../../../components/ui/StatePill';
import { BlockerBadge } from '../../../components/ui/BlockerBadge';

interface IssueBreadcrumbHeaderProps {
  issue: Issue;
  project?: Project;
  team?: Team;
  blockerStatus: BlockerStatusInfo;
}

export const IssueBreadcrumbHeader: React.FC<IssueBreadcrumbHeaderProps> = ({
  issue,
  project,
  team,
  blockerStatus,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Return context passed via navigation state (e.g., from drawer)
  const returnUrl = (location.state as { from?: string } | null)?.from;

  // Format a friendly label for the return button
  const getReturnLabel = () => {
    if (!returnUrl) return null;
    if (returnUrl.includes('/projects/') && returnUrl.includes('/issues')) {
      return 'Back to project issues';
    }
    if (returnUrl.includes('/projects/') && returnUrl.includes('/board')) {
      return 'Back to project board';
    }
    if (returnUrl.includes('/projects/')) {
      return 'Back to project';
    }
    if (returnUrl.includes('/my-work')) {
      return 'Back to My Work';
    }
    return 'Back to previous view';
  };

  const returnLabel = getReturnLabel();

  const handleCopyLink = async () => {
    const canonicalUrl = `${window.location.origin}/issues/${issue.key}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(canonicalUrl);
      } else {
        // Fallback for environments where clipboard API is restricted
        const textarea = document.createElement('textarea');
        textarea.value = canonicalUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Graceful error handling
      setCopied(false);
    }
  };

  const handleShare = () => {
    handleCopyLink();
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };

  return (
    <header className="border-b border-border bg-surface-subtle px-4 sm:px-6 py-2.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left: Breadcrumbs & Origin Return */}
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {returnUrl && returnLabel && (
          <button
            onClick={() => navigate(returnUrl)}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10 rounded border border-accent/30 transition-colors mr-1 cursor-pointer shrink-0"
            title={`Return to ${returnUrl}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{returnLabel}</span>
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-text-muted min-w-0">
          <Link
            to="/my-work"
            className="hover:text-text-primary transition-colors truncate"
          >
            Workspace
          </Link>
          <ChevronRight className="w-3 h-3 text-border-strong shrink-0" />

          {team ? (
            <span className="flex items-center gap-1 truncate max-w-[140px]" title={team.name}>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: team.color }}
              />
              <span className="truncate">{team.name}</span>
            </span>
          ) : (
            <span className="truncate">Engineering</span>
          )}
          <ChevronRight className="w-3 h-3 text-border-strong shrink-0" />

          {project ? (
            <Link
              to={`/projects/${project.key}/issues`}
              className="hover:text-text-primary transition-colors font-medium truncate max-w-[140px]"
              title={project.name}
            >
              {project.key}
            </Link>
          ) : (
            <span>Project</span>
          )}
          <ChevronRight className="w-3 h-3 text-border-strong shrink-0" />

          <span className="font-mono font-semibold text-text-primary bg-surface-base px-1.5 py-0.5 rounded border border-border shrink-0">
            {issue.key}
          </span>
        </nav>
      </div>

      {/* Right: State, Blocker Badge, Copy Link & Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <StatePill state={issue.state} size="sm" />
        <BlockerBadge status={blockerStatus} compact />

        <div className="w-[1px] h-4 bg-border mx-1" />

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-base bg-surface-base/50 border border-border rounded-[6px] shadow-2xs transition-colors cursor-pointer"
          title="Copy direct canonical issue URL"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success font-semibold">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-text-muted" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-base bg-surface-base/50 border border-border rounded-[6px] shadow-2xs transition-colors cursor-pointer"
          title="Share canonical issue URL"
        >
          <Share2 className="w-3.5 h-3.5 text-text-muted" />
          <span>{shareFeedback ? 'Shared!' : 'Share'}</span>
        </button>
      </div>
    </header>
  );
};
