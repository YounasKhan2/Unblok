/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-11A Authenticated/Private 404 Page (Resource Not Found)
 * In-shell state rendered inside AppShellLayout preserving workspace context.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const PrivateNotFoundPage: React.FC = () => {
  const location = useLocation();

  const handleOpenSearch = () => {
    // Trigger global search palette keyboard shortcut event
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-canvas">
      <div className="max-w-md w-full p-8 rounded-xl border border-border bg-surface-base shadow-sm">
        <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-6 h-6 stroke-[2]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-subtle text-text-muted border border-border text-[11px] font-semibold mb-3">
          <span>404 · Authenticated Route</span>
        </div>

        <h1 className="text-lg font-bold text-text-primary mb-1">
          Resource Not Found
        </h1>

        <p className="text-xs text-text-muted mb-3 font-mono break-all px-2 py-1 bg-surface-subtle rounded border border-border/50">
          {location.pathname}
        </p>

        <p className="text-xs text-text-secondary mb-6 leading-relaxed">
          This route, project, issue, or view does not exist within the active workspace.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/my-work">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Go to My Work
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            icon={<Search className="w-3.5 h-3.5" />}
            onClick={handleOpenSearch}
          >
            Open Search (⌘K)
          </Button>
        </div>
      </div>
    </div>
  );
};
