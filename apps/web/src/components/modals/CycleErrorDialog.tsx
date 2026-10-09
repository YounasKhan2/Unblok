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
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-danger">
              Invalid Graph Mutation
            </div>
            <p className="text-danger/90 text-xs mt-1 leading-relaxed">
              Adding this prerequisite edge would create an infinite circular wait loop.
            </p>
          </div>
        </div>

        {cycleError.cyclePath && cycleError.cyclePath.length > 0 && (
          <div>
            <div className="font-semibold text-text-muted uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-danger" />
              <span>Detected Dependency Loop:</span>
            </div>
            <div className="p-3 bg-surface-subtle rounded-lg border border-border font-mono text-xs text-accent flex flex-wrap items-center gap-2">
              {cycleError.cyclePath.map((key, idx) => (
                <React.Fragment key={idx}>
                  <span className="font-bold px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                    {key}
                  </span>
                  {idx < cycleError.cyclePath.length - 1 && (
                    <span className="text-text-muted">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="text-[11px] text-text-muted bg-surface-muted p-2.5 rounded border border-border">
          Rule: Issue A cannot block Issue B if Issue B already blocks Issue A (directly or indirectly).
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <Button variant="primary" size="md" onClick={clearCycleError}>
            Dismiss
          </Button>
        </div>
      </div>
    </Modal>
  );
};
