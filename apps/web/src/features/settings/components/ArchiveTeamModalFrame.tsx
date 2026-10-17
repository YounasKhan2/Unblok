import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Team, Project, Cycle } from '../../../types';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

export interface ArchiveTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  projects: Project[];
  cycles: Cycle[];
}

export const ArchiveTeamModalFrame: React.FC<ArchiveTeamModalProps & {archiveTeam:(id:string)=>unknown;canArchiveTeam:(id:string)=>{allowed:boolean;reason?:string;details?:{projectKeys:string[];cycleNames:string[]}};live?:{busy:boolean;error:string}}> = ({
  isOpen,
  onClose,
  team,archiveTeam,canArchiveTeam,live,
}) => {

  if (!team) return null;

  const archiveCheck = canArchiveTeam(team.id);

  const handleConfirm = () => {
    if (!archiveCheck.allowed) return;
    try {
      const result=archiveTeam(team.id);
      if(result instanceof Promise)void result.then(ok=>{if(ok)onClose();});else onClose();
    } catch {
      // Error handled by domain guard
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Archive Team: ${team.name}`}
      description="Inspect canonical ownership before archiving this team."
      maxWidth="md"
    >
      <div className="space-y-4">
        {!archiveCheck.allowed ? (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-md space-y-2 text-xs text-danger">
            <div className="flex items-center gap-2 font-semibold text-danger">
              <AlertOctagon className="w-4 h-4 text-danger shrink-0" />
              <span>Cannot Archive Team (Domain Ownership Guard)</span>
            </div>
            <p>{archiveCheck.reason}</p>
            {archiveCheck.details && (
              <div className="pt-1 text-[11px] text-danger bg-danger/10 p-2 rounded border border-danger/20">
                {archiveCheck.details.projectKeys.length > 0 && (
                  <div>
                    Active projects:{' '}
                    <strong>{archiveCheck.details.projectKeys.join(', ')}</strong>
                  </div>
                )}
                {archiveCheck.details.cycleNames.length > 0 && (
                  <div>
                    Active cycles:{' '}
                    <strong>{archiveCheck.details.cycleNames.join(', ')}</strong>
                  </div>
                )}
              </div>
            )}
            <p className="text-[11px] text-danger/80 italic">
              Reassign active projects or conclude running cycles before archiving this team.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-md flex items-start gap-2.5 text-xs text-warning">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p>
              Are you sure you want to archive <strong>{team.name}</strong> ({team.key})?
              {' '}{live?'The server will check whether archiving is allowed. Active projects may prevent archiving. This does not archive projects or other records.':'The team has 0 active project ownerships or running cycles and can be safely moved to Archived Teams.'}
            </p>
          </div>
        )}

        {live?.error&&<p role="alert" className="text-xs text-danger">{live.error}</p>}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {archiveCheck.allowed ? 'Cancel' : 'Close'}
          </Button>
          {archiveCheck.allowed && (
            <Button
              variant="danger"
              size="sm"
              disabled={live?.busy}
              onClick={handleConfirm}
            >
              Confirm Archive
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
