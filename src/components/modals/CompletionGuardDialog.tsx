import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useProject } from '../../context/ProjectContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { ShieldAlert, ExternalLink, ArrowRight } from 'lucide-react';
import { StatePill } from '../ui/StatePill';

export const CompletionGuardDialog: React.FC = () => {
  const {
    completionGuardError,
    clearCompletionGuardError,
    setSelectedIssueId,
    setIsDrawerOpen,
  } = useProject();
  const { openDrawer } = useDrawerRoute();

  if (!completionGuardError) return null;

  const { issue, blockers } = completionGuardError;

  const handleInspectBlocker = (blockerId: string, blockerKey?: string) => {
    clearCompletionGuardError();
    setSelectedIssueId(blockerId);
    if (blockerKey) {
      openDrawer(blockerKey);
    } else {
      setIsDrawerOpen(true);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={clearCompletionGuardError}
      title="Hard Completion Guard Triggered"
      description="The execution engine prevents moving an issue to DONE while active prerequisite blockers exist."
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Guard Warning Box */}
        <div className="p-3 bg-[#ffe8d4]/70 border border-[#ffd3ad] rounded-lg flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#dd5b00] shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-[#793400]">
              Cannot complete {issue.key}
            </div>
            <p className="text-[#793400] text-xs mt-1 leading-relaxed">
              This issue has <span className="font-bold">{blockers.length} active prerequisite task(s)</span> that
              must reach <span className="font-semibold">DONE</span> or <span className="font-semibold">CANCELLED</span> first.
            </p>
          </div>
        </div>

        {/* Blocking Issues List */}
        <div>
          <div className="font-semibold text-[#787671] uppercase tracking-wider text-[11px] mb-2">
            Active Blockers Requiring Resolution:
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {blockers.map(blocker => (
              <div
                key={blocker.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#e5e3df] bg-[#fafaf9] hover:bg-white hover:border-[#5645d4] transition-colors"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <span className="font-mono font-bold text-[#5645d4]">{blocker.key}</span>
                  <span className="truncate text-[#1a1a1a]">{blocker.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatePill state={blocker.state} size="sm" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInspectBlocker(blocker.id, blocker.key)}
                    className="text-[#5645d4] hover:bg-purple-50"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#e5e3df]">
          <span className="text-[11px] text-[#787671]">
            PRD Invariant: Section 14 Hard Completion Guard
          </span>
          <Button variant="primary" size="md" onClick={clearCompletionGuardError}>
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
