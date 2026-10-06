import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { IssueComment, User } from '../../types';
import { Avatar } from '../ui/Avatar';
import {
  MessageSquare,
  Send,
  CornerDownRight,
  Trash2,
  AtSign,
  Code,
  Sparkles,
  X,
} from 'lucide-react';

interface CommentThreadProps {
  issueId: string;
  isReadOnly?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  issueId,
  isReadOnly: propReadOnly,
  textareaRef: propTextareaRef,
}) => {
  const { comments, addComment, deleteComment, users, currentUser } = useProject();

  const isReadOnly = propReadOnly ?? (currentUser.role === 'OBSERVER');

  const [searchParams] = useSearchParams();
  const targetCommentId = searchParams.get('comment');

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<IssueComment | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const localTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = propTextareaRef || localTextareaRef;

  // Filter comments for this issue
  const issueComments = useMemo(() => {
    return comments.filter(c => c.issueId === issueId);
  }, [comments, issueId]);

  useEffect(() => {
    if (targetCommentId) {
      const el = document.getElementById(`comment-${targetCommentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [targetCommentId, issueComments]);

  // Group comments into root comments and their replies
  const rootComments = useMemo(() => {
    return issueComments.filter(c => !c.parentId);
  }, [issueComments]);

  const repliesMap = useMemo(() => {
    const map = new Map<string, IssueComment[]>();
    for (const c of issueComments) {
      if (c.parentId) {
        const list = map.get(c.parentId) || [];
        list.push(c);
        map.set(c.parentId, list);
      }
    }
    return map;
  }, [issueComments]);

  // Teammates matching mention filter
  const filteredUsers = useMemo(() => {
    if (!mentionFilter) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(mentionFilter.toLowerCase())
    );
  }, [users, mentionFilter]);

  // Detect '@' trigger in textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(textBeforeCursor[lastAt - 1]))) {
      const query = textBeforeCursor.slice(lastAt + 1);
      if (!query.includes(' ')) {
        setShowMentionPicker(true);
        setMentionFilter(query);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentionPicker(false);
  };

  const handleSelectMention = (user: User) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const textAfterCursor = commentText.slice(cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    const newText =
      textBeforeCursor.slice(0, lastAt) + `@${user.name} ` + textAfterCursor;
    setCommentText(newText);
    setShowMentionPicker(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastAt + user.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(i => (i + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(i => (i - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectMention(filteredUsers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionPicker(false);
        return;
      }
    }

    // Submit with Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!commentText.trim()) return;

    addComment(issueId, commentText.trim(), replyingTo?.id);
    setCommentText('');
    setReplyingTo(null);
    setShowMentionPicker(false);
  };

  const insertCodeBlock = () => {
    setCommentText(prev => prev + '\n```\n// code snippet\n```\n');
    textareaRef.current?.focus();
  };

  // Helper to render content with highlighted @mentions and code blocks
  const renderFormattedContent = (content: string) => {
    // Check for code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeText = part.slice(3, -3).replace(/^[\r\n]+|[\r\n]+$/g, '');
        return (
          <pre
            key={pIdx}
            className="my-1.5 p-2 rounded bg-surface-base text-text-primary font-mono text-[11px] overflow-x-auto leading-relaxed border border-border"
          >
            <code>{codeText}</code>
          </pre>
        );
      }

      // Format words and @mentions
      const words = part.split(/(\s+)/);
      return (
        <span key={pIdx}>
          {words.map((word, wIdx) => {
            if (word.startsWith('@')) {
              const matchedName = users.find(
                u => word.toLowerCase() === `@${u.name.toLowerCase()}` || word.toLowerCase().startsWith(`@${u.name.toLowerCase()}`)
              );
              if (matchedName) {
                return (
                  <span
                    key={wIdx}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-accent/15 text-accent font-semibold text-[11px] border border-accent/30"
                  >
                    <AtSign className="w-2.5 h-2.5" />
                    <span>{matchedName.name}</span>
                  </span>
                );
              }
            }
            return word;
          })}
        </span>
      );
    });
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
          <MessageSquare className="w-3.5 h-3.5 text-accent" />
          <span>Discussion & Comments</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-accent/10 text-accent">
            {issueComments.length}
          </span>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {rootComments.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted bg-surface-subtle rounded-lg border border-dashed border-border">
            No discussions yet. Type <span className="font-mono text-accent">@</span> to mention a teammate or leave technical notes.
          </div>
        ) : (
          rootComments.map(comment => {
            const replies = repliesMap.get(comment.id) || [];
            const isAuthor = comment.authorId === currentUser.id;
            const authorUser = users.find(u => u.id === comment.authorId) || {
              id: comment.authorId,
              name: comment.authorName,
              avatar: comment.authorAvatar || '',
              email: '',
              role: 'MEMBER' as const,
              teamId: 'team_eng',
            };

            const isTargetComment = comment.id === targetCommentId;

            return (
              <div key={comment.id} className="space-y-2">
                {/* Root Comment Box */}
                <div
                  id={`comment-${comment.id}`}
                  className={`p-3 rounded-lg border text-xs transition-colors ${
                    isTargetComment
                      ? 'bg-accent/10 border-accent ring-2 ring-accent/30 shadow-xs'
                      : 'bg-surface-subtle border-border hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Avatar
                        user={authorUser}
                        size="xs"
                      />
                      <span className="font-bold text-text-primary text-xs">
                        {comment.authorName}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                      {!isReadOnly && (
                        <button
                          onClick={() => {
                            setReplyingTo(comment);
                            textareaRef.current?.focus();
                          }}
                          className="p-1 text-text-muted hover:text-accent hover:bg-surface-muted rounded transition-colors cursor-pointer"
                          title="Reply to thread"
                        >
                          <CornerDownRight className="w-3 h-3" />
                        </button>
                      )}
                      {!isReadOnly && isAuthor && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="p-1 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-text-secondary leading-relaxed whitespace-pre-wrap pl-6">
                    {renderFormattedContent(comment.content)}
                  </div>
                </div>

                {/* Nested Threaded Replies */}
                {replies.length > 0 && (
                  <div className="pl-6 space-y-2 relative before:absolute before:left-3 before:top-0 before:bottom-3 before:w-[2px] before:bg-accent/20">
                    {replies.map(reply => {
                      const isReplyAuthor = reply.authorId === currentUser.id;
                      const replyUser = users.find(u => u.id === reply.authorId) || {
                        id: reply.authorId,
                        name: reply.authorName,
                        avatar: reply.authorAvatar || '',
                        email: '',
                        role: 'MEMBER' as const,
                        teamId: 'team_eng',
                      };
                      const isTargetReply = reply.id === targetCommentId;
                      return (
                        <div
                          id={`comment-${reply.id}`}
                          key={reply.id}
                          className={`p-2.5 rounded-lg border text-xs shadow-2xs transition-colors ${
                            isTargetReply
                              ? 'bg-accent/10 border-accent ring-2 ring-accent/30 shadow-xs'
                              : 'bg-surface-base border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <Avatar
                                user={replyUser}
                                size="xs"
                              />
                              <span className="font-bold text-text-primary text-xs">
                                {reply.authorName}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {formatTimestamp(reply.createdAt)}
                              </span>
                            </div>

                            {!isReadOnly && isReplyAuthor && (
                              <button
                                onClick={() => deleteComment(reply.id)}
                                className="p-1 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                                title="Delete reply"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="text-text-secondary leading-relaxed whitespace-pre-wrap pl-6">
                            {renderFormattedContent(reply.content)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reply Banner if Replying to a thread */}
      {!isReadOnly && replyingTo && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs">
          <div className="flex items-center gap-1.5 text-accent">
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>
              Replying to <span className="font-bold">{replyingTo.authorName}</span>
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-0.5 text-text-muted hover:text-text-primary rounded hover:bg-accent/20"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Composer Input Box or ReadOnly Notice */}
      {isReadOnly ? (
        <div className="p-3 text-center text-xs text-text-muted bg-surface-subtle rounded-lg border border-border">
          Viewing in read-only mode (Observer). Commenting is disabled.
        </div>
      ) : (
        <div className="relative border border-border rounded-lg bg-surface-base overflow-hidden shadow-2xs focus-within:border-accent transition-colors">
          <textarea
            ref={textareaRef}
            rows={3}
            value={commentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? 'Write a reply...' : 'Add a technical comment or mention someone with @...'}
            className="w-full p-2.5 text-xs text-text-primary bg-transparent focus:outline-none resize-none leading-relaxed"
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-border bg-surface-subtle">
            <div className="flex items-center gap-1 text-text-muted">
              <button
                type="button"
                onClick={() => {
                  setCommentText(prev => prev + '@');
                  setShowMentionPicker(true);
                  setMentionFilter('');
                  textareaRef.current?.focus();
                }}
                className="p-1 hover:text-accent hover:bg-surface-muted rounded transition-colors cursor-pointer"
                title="Mention teammate (@)"
              >
                <AtSign className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={insertCodeBlock}
                className="p-1 hover:text-accent hover:bg-surface-muted rounded transition-colors cursor-pointer"
                title="Insert code block"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted hidden sm:inline">
                ⌘ + Enter
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!commentText.trim()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-accent hover:opacity-90 text-surface-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Live Teammate Mention Autocomplete Popover */}
          {showMentionPicker && (
            <div className="absolute left-2 bottom-12 z-50 w-56 bg-surface-base border border-border rounded-lg shadow-xl p-1 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 py-1">
                Mention Teammate
              </div>
              {filteredUsers.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-text-muted">No matching member</div>
              ) : (
                filteredUsers.map((user, idx) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectMention(user)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left cursor-pointer transition-colors ${
                      idx === mentionIndex ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-surface-muted'
                    }`}
                  >
                    <Avatar user={user} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold text-text-primary">{user.name}</div>
                      <div className="text-[10px] text-text-muted truncate">{user.email}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
