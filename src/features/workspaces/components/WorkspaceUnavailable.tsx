/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Workspace Unavailable State
 * Section 27: Clear, polite fallback UI when active workspace is revoked, suspended, or missing.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { ShieldAlert, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const WorkspaceUnavailable: React.FC = () => {
  const { memberships, workspaces, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const activeMemberships = memberships.filter((m) => m.status === 'ACTIVE');

  const handleSwitchToFirstValid = async () => {
    if (activeMemberships.length > 0) {
      await switchWorkspace(activeMemberships[0].workspaceId);
      navigate('/my-work');
    } else {
      navigate('/onboarding/workspace');
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface-base border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-text-primary">
            Workspace unavailable
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            You no longer have active access to this workspace. Your membership may have been removed, suspended, or the workspace was archived.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          {activeMemberships.length > 0 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSwitchToFirstValid}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch to available workspace</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/onboarding/workspace')}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create new workspace</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
