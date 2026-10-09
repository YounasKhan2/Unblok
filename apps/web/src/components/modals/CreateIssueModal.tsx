import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { IssuePriority } from '../../types';

export const CreateIssueModal: React.FC = () => {
  const { projects, users, issues, createIssue } = useProject();
  const { isCreateModalOpen, setIsCreateModalOpen } = useKeyboard();
  const location = useLocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [upstreamBlockerId, setUpstreamBlockerId] = useState<string>('');

  // Automatically preselect current project if on /projects/:projectKey/* route
  useEffect(() => {
    if (isCreateModalOpen) {
      const match = location.pathname.match(/^\/projects\/([^/]+)/);
      if (match && match[1]) {
        const keyOrId = match[1].toLowerCase();
        const matchedProj = projects.find(
          p => p.key.toLowerCase() === keyOrId || p.id.toLowerCase() === keyOrId
        );
        if (matchedProj) {
          setProjectId(matchedProj.id);
          return;
        }
      }
      if (!projectId && projects.length > 0) {
        setProjectId(projects[0].id);
      }
    }
  }, [isCreateModalOpen, location.pathname, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    createIssue({
      title: title.trim(),
      description: description.trim(),
      projectId,
      priority,
      assigneeId: assigneeId || undefined,
      upstreamBlockerId: upstreamBlockerId || undefined,
    });

    setTitle('');
    setDescription('');
    setUpstreamBlockerId('');
    setIsCreateModalOpen(false);
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      title="Create New Issue"
      description="Allocates an atomic sequential issue key and enforces dependency constraints."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Implement rate limiting on public webhook endpoints"
            className="w-full px-3 py-2 text-xs bg-surface-subtle border border-border focus:border-accent rounded-[6px] focus:outline-none focus:bg-surface-base text-text-primary placeholder:text-text-muted"
          />
        </div>

        {/* Project & Priority Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Project <span className="text-danger">*</span>
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-subtle border border-border rounded-[6px] focus:outline-none focus:border-accent text-text-primary"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as IssuePriority)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-subtle border border-border rounded-[6px] focus:outline-none focus:border-accent text-text-primary"
            >
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Assignee & Initial Blocker Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-subtle border border-border rounded-[6px] focus:outline-none focus:border-accent text-text-primary"
            >
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Blocked By (Optional Prerequisite)
            </label>
            <select
              value={upstreamBlockerId}
              onChange={e => setUpstreamBlockerId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-subtle border border-border rounded-[6px] focus:outline-none focus:border-accent text-text-primary"
            >
              <option value="">No prerequisite blocker</option>
              {issues.map(i => (
                <option key={i.id} value={i.id}>
                  {i.key} — {i.title.substring(0, 32)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Acceptance criteria, architectural notes, or technical dependencies..."
            className="w-full px-3 py-2 text-xs bg-surface-subtle border border-border focus:border-accent rounded-[6px] focus:outline-none focus:bg-surface-base text-text-primary placeholder:text-text-muted"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            Create Issue
          </Button>
        </div>
      </form>
    </Modal>
  );
};
