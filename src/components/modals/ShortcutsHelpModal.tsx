import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useKeyboard } from '../../context/KeyboardContext';
import { Keyboard } from 'lucide-react';

export const ShortcutsHelpModal: React.FC = () => {
  const { isHelpModalOpen, setIsHelpModalOpen } = useKeyboard();

  const shortcutGroups = [
    {
      group: 'Navigation & Triage',
      shortcuts: [
        { key: 'Cmd / Ctrl + K', action: 'Universal Command Palette' },
        { key: 'J / ↓', action: 'Next issue in list/board' },
        { key: 'K / ↑', action: 'Previous issue in list/board' },
        { key: 'X', action: 'Toggle multi-select for current issue' },
        { key: 'Cmd / Ctrl + A', action: 'Select all filtered issues' },
        { key: 'Enter / Space', action: 'Toggle issue detail drawer' },
        { key: 'V', action: 'Switch view (List ↔ Board ↔ DAG Matrix)' },
        { key: '[ / \\', action: 'Toggle navigation sidebar' },
        { key: '/', action: 'Focus search input (Supports syntax: is:blocked, team:eng, etc.)' },
      ],
    },
    {
      group: 'Instant Issue Property Triage',
      shortcuts: [
        { key: 'S', action: 'Open Status selector for selected issue' },
        { key: 'P', action: 'Open Priority selector for selected issue' },
        { key: 'A', action: 'Open Assignee selector for selected issue' },
        { key: 'B', action: 'Open Add Blocker dialog for selected issue' },
        { key: 'C', action: 'Create a new issue' },
      ],
    },
    {
      group: 'Scope & Esc Hierarchy',
      shortcuts: [
        { key: 'Esc', action: 'Close active popover → Drawer → Clear selection' },
        { key: '?', action: 'Open this keyboard shortcuts cheatsheet' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isHelpModalOpen}
      onClose={() => setIsHelpModalOpen(false)}
      title="Keyboard-First Execution Cheatsheet"
      description="Operate Kite at high velocity without needing pointer interaction."
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {shortcutGroups.map(group => (
          <div key={group.group} className="border border-[#e5e3df] rounded-lg overflow-hidden">
            <div className="bg-[#fafaf9] px-3 py-1.5 font-semibold text-[11px] text-[#787671] uppercase tracking-wider border-b border-[#e5e3df]">
              {group.group}
            </div>
            <div className="divide-y divide-[#e5e3df]">
              {group.shortcuts.map(sc => (
                <div key={sc.key} className="flex items-center justify-between px-3 py-2 bg-white">
                  <span className="text-[#37352f]">{sc.action}</span>
                  <kbd className="font-mono text-xs px-2 py-0.5 rounded bg-[#f0eeec] text-[#1a1a1a] border border-[#d4d0c9] shadow-2xs font-semibold">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" onClick={() => setIsHelpModalOpen(false)}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
};
