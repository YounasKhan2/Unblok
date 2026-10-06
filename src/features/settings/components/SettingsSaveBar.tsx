import React, { useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Check, AlertCircle } from 'lucide-react';

interface SettingsSaveBarProps {
  isDirty: boolean;
  isSaving?: boolean;
  saveSuccess?: boolean;
  errorMessage?: string;
  onSave: () => void;
  onReset: () => void;
  saveLabel?: string;
}

export const SettingsSaveBar: React.FC<SettingsSaveBarProps> = ({
  isDirty,
  isSaving = false,
  saveSuccess = false,
  errorMessage,
  onSave,
  onReset,
  saveLabel = 'Save Changes',
}) => {
  // Listen for Cmd/Ctrl + S to trigger save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isDirty && !isSaving) {
          onSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, onSave]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#e5e3df]">
      <div className="flex items-center gap-2 text-xs">
        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Changes saved successfully
          </span>
        )}
        {errorMessage && (
          <span className="flex items-center gap-1.5 text-red-600 font-medium animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            {errorMessage}
          </span>
        )}
        {!saveSuccess && !errorMessage && isDirty && (
          <span className="text-[#d9730d] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d9730d]" />
            Unsaved changes
          </span>
        )}
        {!saveSuccess && !errorMessage && !isDirty && (
          <span className="text-[#a4a097]">All changes saved</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
          disabled={!isDirty || isSaving}
        >
          Discard
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className="relative"
        >
          {isSaving ? 'Saving...' : saveLabel}
          <kbd className="hidden sm:inline-block ml-1.5 font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded text-white">
            ⌘S
          </kbd>
        </Button>
      </div>
    </div>
  );
};
