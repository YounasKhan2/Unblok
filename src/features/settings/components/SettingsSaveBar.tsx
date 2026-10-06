import React from 'react';
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
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
      <div className="flex items-center gap-2 text-xs">
        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-success font-medium animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-success" />
            Changes saved successfully
          </span>
        )}
        {errorMessage && (
          <span className="flex items-center gap-1.5 text-danger font-medium animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-danger" />
            {errorMessage}
          </span>
        )}
        {!saveSuccess && !errorMessage && isDirty && (
          <span className="text-warning font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            Unsaved changes
          </span>
        )}
        {!saveSuccess && !errorMessage && !isDirty && (
          <span className="text-text-muted">All changes saved</span>
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
        >
          {isSaving ? 'Saving...' : saveLabel}
        </Button>
      </div>
    </div>
  );
};
