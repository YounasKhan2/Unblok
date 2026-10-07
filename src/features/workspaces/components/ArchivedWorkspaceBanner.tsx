/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Archived Workspace Banner
 * Section 26: Visible indicator that current workspace is archived and read-only.
 */

import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Archive, AlertCircle } from 'lucide-react';

export const ArchivedWorkspaceBanner: React.FC<{
  forceShow?: boolean;
  workspaceName?: string;
}> = ({ forceShow, workspaceName }) => {
  const { activeWorkspace } = useWorkspace();

  if (!forceShow && activeWorkspace?.status !== 'ARCHIVED') {
    return null;
  }

  const name = workspaceName || activeWorkspace?.name || 'This workspace';

  return (
    <div
      role="alert"
      className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <Archive className="w-4 h-4 shrink-0 text-amber-500" />
        <span>
          <strong>{name} is archived.</strong> All issues, planning items, and dependencies are read-only.
        </span>
      </div>
      <span className="text-[11px] font-mono opacity-80 uppercase tracking-wider">
        Read-Only Mode
      </span>
    </div>
  );
};
