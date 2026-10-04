import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useProject } from '../../context/ProjectContext';
import { AlertTriangle, Repeat, GitFork } from 'lucide-react';

export const CycleErrorDialog: React.FC = () => {
  const { cycleError, clearCycleError } = useProject();

  if (!cycleError) return null;

  return (
    <Modal
      isOpen={true}
      onClose={clearCycleError}
      title="Circular Dependency Detected"
      description="The dependency graph must remain a strict Directed Acyclic Graph (DAG)."
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-red-900">
              Invalid Graph Mutation
            </div>
            <p className="text-red-700 text-xs mt-1 leading-relaxed">
              Adding this prerequisite edge would create an infinite circular wait loop.
            </p>
          </div>
        </div>

        {cycleError.cyclePath && cycleError.cyclePath.length > 0 && (
          <div>
            <div className="font-semibold text-[#787671] uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-red-600" />
              <span>Detected Dependency Loop:</span>
            </div>
            <div className="p-3 bg-[#fafaf9] rounded-lg border border-[#e5e3df] font-mono text-xs text-[#5645d4] flex flex-wrap items-center gap-2">
              {cycleError.cyclePath.map((key, idx) => (
                <React.Fragment key={idx}>
                  <span className="font-bold px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200">
                    {key}
                  </span>
                  {idx < cycleError.cyclePath.length - 1 && (
                    <span className="text-[#a4a097]">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="text-[11px] text-[#787671] bg-gray-50 p-2.5 rounded border border-gray-200">
          Rule: Issue A cannot block Issue B if Issue B already blocks Issue A (directly or indirectly).
        </div>

        <div className="flex justify-end pt-3 border-t border-[#e5e3df]">
          <Button variant="primary" size="md" onClick={clearCycleError}>
            Dismiss
          </Button>
        </div>
      </div>
    </Modal>
  );
};
