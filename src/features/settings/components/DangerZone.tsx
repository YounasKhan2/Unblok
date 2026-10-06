import React, { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Archive, Trash2, AlertTriangle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface DangerZoneProps {
  workspaceName: string;
  workspaceKey: string;
}

export const DangerZone: React.FC<DangerZoneProps> = ({ workspaceName, workspaceKey }) => {
  const { archiveWorkspace } = useSettings();
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleArchiveConfirm = () => {
    archiveWorkspace();
    setIsArchiveModalOpen(false);
    setFeedbackMessage('Workspace has been archived (mock state recorded).');
  };

  const handleDeleteConfirm = () => {
    if (
      deleteConfirmationInput.trim() !== workspaceName &&
      deleteConfirmationInput.trim() !== workspaceKey
    ) {
      return;
    }
    // Safe mock simulation of delete
    setIsDeleteModalOpen(false);
    setDeleteConfirmationInput('');
    setFeedbackMessage(
      `Workspace "${workspaceName}" deletion request confirmed. (Safe prototype: demo state preserved).`
    );
  };

  const isDeleteMatching =
    deleteConfirmationInput.trim() === workspaceName ||
    deleteConfirmationInput.trim() === workspaceKey;

  return (
    <>
      <SettingsSection
        title="Danger Zone"
        description="Destructive actions for this workspace. These operations require deliberate confirmation."
        variant="danger"
      >
        {feedbackMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center justify-between">
            <span>{feedbackMessage}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-red-100">
            <div>
              <div className="text-xs font-semibold text-[#1a1a1a]">Archive Workspace</div>
              <div className="text-[11px] text-[#787671]">
                Mark all active projects and issues as read-only. Can be unarchived later.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Archive className="w-3.5 h-3.5 text-[#787671]" />}
              onClick={() => setIsArchiveModalOpen(true)}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              Archive Workspace
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div>
              <div className="text-xs font-semibold text-red-600">Delete Workspace</div>
              <div className="text-[11px] text-[#787671]">
                Permanently delete this workspace and all associated teams, projects, and cycles.
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
              onClick={() => {
                setDeleteConfirmationInput('');
                setIsDeleteModalOpen(true);
              }}
            >
              Delete Workspace
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* Archive Modal */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        title="Archive Workspace"
        description={`Are you sure you want to archive "${workspaceName}"?`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Archiving disables new issue creation and pauses running cycles. Existing project
              data will remain preserved for review.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsArchiveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleArchiveConfirm}
            >
              Confirm Archive
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Workspace"
        description="This action is irreversible and requires exact confirmation."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>
              Please enter the workspace name <strong className="font-semibold">{workspaceName}</strong> or key <strong className="font-semibold">{workspaceKey}</strong> to confirm.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="delete-confirm-input"
              className="text-xs font-medium text-[#1a1a1a]"
            >
              Confirmation Input
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={deleteConfirmationInput}
              onChange={e => setDeleteConfirmationInput(e.target.value)}
              placeholder={workspaceName}
              className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!isDeleteMatching}
              onClick={handleDeleteConfirm}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
