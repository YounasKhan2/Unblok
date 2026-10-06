import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Team, Project, Cycle } from '../../../types';
import { useSettings } from '../context/SettingsContext';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

interface ArchiveTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  projects: Project[];
  cycles: Cycle[];
}

export const ArchiveTeamModal: React.FC<ArchiveTeamModalProps> = ({
  isOpen,
  onClose,
  team,
}) => {
  const { archiveTeam, canArchiveTeam } = useSettings();

  if (!team) return null;

  const archiveCheck = canArchiveTeam(team.id);

  const handleConfirm = () => {
    if (!archiveCheck.allowed) return;
    try {
      archiveTeam(team.id);
      onClose();
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2 text-xs text-red-800">
            <div className="flex items-center gap-2 font-semibold text-red-900">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
              <span>Cannot Archive Team (Domain Ownership Guard)</span>
            </div>
            <p>{archiveCheck.reason}</p>
            {archiveCheck.details && (
              <div className="pt-1 text-[11px] text-red-700 bg-red-100/50 p-2 rounded">
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
            <p className="text-[11px] text-red-600 italic">
              Reassign active projects or conclude running cycles before archiving this team.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Are you sure you want to archive <strong>{team.name}</strong> ({team.key})?
              The team has 0 active project ownerships or running cycles and can be safely moved to Archived Teams.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e3df]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {archiveCheck.allowed ? 'Cancel' : 'Close'}
          </Button>
          {archiveCheck.allowed && (
            <Button
              variant="danger"
              size="sm"
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
