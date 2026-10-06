/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InboxItem } from '../types';
import { useCollaboration } from '../context/CollaborationContext';
import { useProject } from '../../../context/ProjectContext';
import { canComment } from '../permissions';
import { InlineReplyComposer } from './InlineReplyComposer';
import { Avatar } from '../../../components/ui/Avatar';
import {
  AtSign,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  CornerDownRight,
  ExternalLink,
  Archive,
  Check,
  RotateCcw,
  Circle,
  Eye,
} from 'lucide-react';

interface NotificationItemRowProps {
  item: InboxItem;
  isFocused?: boolean;
}

export const NotificationItemRow: React.FC<NotificationItemRowProps> = ({
  item,
  isFocused = false,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { markAsRead, markAsArchived, unarchive } = useCollaboration();
  const { currentUser, users } = useProject();
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);

  const actorUser = users.find(u => u.id === item.actorId) || {
    id: item.actorId || 'unknown',
    name: item.actorName || 'Teammate',
    avatar: item.actorAvatar || '',
    email: '',
    role: 'MEMBER' as const,
    teamId: 'team_eng',
  };

  const getKindBadge = () => {
    switch (item.kind) {
      case 'MENTION':
        return {
          icon: AtSign,
          label: 'Mention',
          className: 'text-accent bg-accent/10 border-accent/20',
        };
      case 'ASSIGNMENT':
        return {
          icon: UserCheck,
          label: 'Assigned',
          className: 'text-primary bg-primary/10 border-primary/20',
        };
      case 'DEPENDENCY_BLOCKED':
        return {
          icon: ShieldAlert,
          label: 'Blocked',
          className: 'text-danger bg-danger/10 border-danger/20',
        };
      case 'DEPENDENCY_UNBLOCKED':
        return {
          icon: CheckCircle2,
          label: 'Unblocked',
          className: 'text-success bg-success/10 border-success/20',
        };
      case 'CYCLE_UPDATE':
        return {
          icon: Clock,
          label: 'Cycle',
          className: 'text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20',
        };
    }
  };

  const kindBadge = getKindBadge();
  const KindIcon = kindBadge.icon;

  const handleOpenDrawer = () => {
    markAsRead(item.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('drawer', item.issueKey);

    if (item.kind === 'MENTION') {
      nextParams.set('tab', 'comments');
      if (item.commentId) {
        nextParams.set('comment', item.commentId);
      }
    } else if (item.kind === 'DEPENDENCY_BLOCKED' || item.kind === 'DEPENDENCY_UNBLOCKED') {
      nextParams.set('tab', 'dependencies');
      nextParams.delete('comment');
    } else {
      nextParams.set('tab', 'properties');
      nextParams.delete('comment');
    }

    navigate({ search: nextParams.toString() });
  };

  const handleOpenFullIssue = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(item.id);
    navigate(`/issues/${item.issueKey}`);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const canReply =
    item.kind === 'MENTION' && item.commentId && canComment(currentUser.role);

  return (
    <article
      id={`inbox-item-${item.id}`}
      aria-label={`${item.kind} notification on ${item.issueKey}: ${item.issueTitle}`}
      className={`group relative border-b border-border transition-colors ${
        item.isRead ? 'bg-surface-base' : 'bg-surface-subtle'
      } ${isFocused ? 'ring-2 ring-inset ring-accent' : 'hover:bg-surface-subtle/80'}`}
    >
      <div className="flex items-start gap-3 px-4 py-3 min-h-[56px]">
        {/* Unread indicator */}
        <div className="pt-1 shrink-0">
          {!item.isRead ? (
            <span
              className="inline-block w-2 h-2 rounded-full bg-accent ring-2 ring-accent/20"
              title="Unread notification"
              aria-label="Unread"
            />
          ) : (
            <span
              className="inline-block w-2 h-2 rounded-full bg-transparent"
              aria-label="Read"
            />
          )}
        </div>

        {/* Actor Avatar */}
        <div className="shrink-0 pt-0.5">
          <Avatar user={actorUser} size="sm" />
        </div>

        {/* Main Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-xs text-text-primary">
              {item.actorName || 'Teammate'}
            </span>

            {/* Event Kind Badge */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${kindBadge.className}`}
            >
              <KindIcon className="w-2.5 h-2.5" />
              <span>{kindBadge.label}</span>
            </span>

            {/* Issue Key link */}
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="font-mono text-xs font-bold text-accent hover:underline cursor-pointer"
              title={`Open ${item.issueKey} in drawer`}
            >
              {item.issueKey}
            </button>

            <span className="text-text-muted text-xs truncate max-w-[280px] sm:max-w-[400px]">
              {item.issueTitle}
            </span>

            <span className="text-[11px] text-text-muted ml-auto shrink-0">
              {formatTimestamp(item.createdAt)}
            </span>
          </div>

          {/* Snippet / Reason text */}
          {(item.contentSnippet || item.reason) && (
            <div className="text-xs text-text-secondary leading-relaxed line-clamp-2 pr-4 font-normal">
              {item.contentSnippet || item.reason}
            </div>
          )}

          {/* Inline Reply Composer expansion */}
          {isReplyExpanded && item.commentId && (
            <InlineReplyComposer
              issueId={item.issueId}
              commentId={item.commentId}
              recipientName={item.actorName}
              onSubmitted={() => {
                setIsReplyExpanded(false);
                markAsRead(item.id);
              }}
              onCancel={() => setIsReplyExpanded(false)}
            />
          )}
        </div>

        {/* Action Controls */}
        <div className="shrink-0 flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {/* Quick Reply Button */}
          {canReply && !isReplyExpanded && (
            <button
              type="button"
              onClick={() => setIsReplyExpanded(true)}
              className="p-1.5 text-text-muted hover:text-accent hover:bg-surface-muted rounded transition-colors cursor-pointer"
              title="Reply inline (R)"
              aria-label="Reply inline"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Open Drawer Button */}
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded transition-colors cursor-pointer"
            title="Open in drawer (Enter)"
            aria-label="Open issue drawer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Open Full Issue Page Button */}
          <button
            type="button"
            onClick={handleOpenFullIssue}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded transition-colors cursor-pointer"
            title="Open full issue page"
            aria-label="Open full issue page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Mark Read/Unread or Done/Archive Button */}
          {!item.isArchived ? (
            <button
              type="button"
              onClick={() => markAsArchived(item.id)}
              className="p-1.5 text-text-muted hover:text-success hover:bg-surface-muted rounded transition-colors cursor-pointer"
              title="Mark done / archive (E)"
              aria-label="Mark done"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => unarchive(item.id)}
              className="p-1.5 text-text-muted hover:text-accent hover:bg-surface-muted rounded transition-colors cursor-pointer"
              title="Restore / unarchive"
              aria-label="Restore"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
