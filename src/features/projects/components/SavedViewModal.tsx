/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Bookmark, Sparkles } from 'lucide-react';

interface SavedViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentFilterDescription?: string;
}

export const SavedViewModal: React.FC<SavedViewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentFilterDescription,
}) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Current View"
      description="Save your active search, filters, sorting, and grouping configuration as a project view preset."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">
            View Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Blocked Triage, Critical Path, Frontend Queue"
            className="w-full px-3 py-2 text-xs bg-[#fafaf9] border border-[#e5e3df] focus:border-[#5645d4] rounded-[6px] focus:outline-none focus:bg-white"
          />
        </div>

        {currentFilterDescription && (
          <div className="p-2.5 bg-[#f6f5f4] rounded-[6px] border border-[#e5e3df] text-[11px] text-[#5d5b54]">
            <span className="font-semibold text-[#1a1a1a]">Saved parameters: </span>
            <span>{currentFilterDescription}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e3df]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!name.trim()}>
            Save View
          </Button>
        </div>
      </form>
    </Modal>
  );
};
