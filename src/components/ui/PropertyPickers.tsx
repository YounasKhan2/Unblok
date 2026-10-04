import React from 'react';
import { IssueState, IssuePriority, User } from '../../types';
import { STATE_CONFIG } from './StatePill';
import { PRIORITY_CONFIG } from './PriorityIcon';
import { Avatar } from './Avatar';
import { Check } from 'lucide-react';

interface StatusPickerProps {
  currentState: IssueState;
  onSelect: (state: IssueState) => void;
  onClose: () => void;
}

export const StatusPicker: React.FC<StatusPickerProps> = ({ currentState, onSelect, onClose }) => {
  const states: IssueState[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];

  return (
    <div className="py-1">
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-[#787671] uppercase">
        Change Status
      </div>
      <div className="space-y-0.5">
        {states.map(state => {
          const config = STATE_CONFIG[state];
          const Icon = config.icon;
          const isSelected = state === currentState;

          return (
            <button
              key={state}
              onClick={() => {
                onSelect(state);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-[#f6f5f4] cursor-pointer transition-colors ${
                isSelected ? 'bg-[#ede9e4]/70 font-medium' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-[#37352f]" />
                <span className={config.textClass}>{config.label}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-[#5645d4]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface PriorityPickerProps {
  currentPriority: IssuePriority;
  onSelect: (priority: IssuePriority) => void;
  onClose: () => void;
}

export const PriorityPicker: React.FC<PriorityPickerProps> = ({
  currentPriority,
  onSelect,
  onClose,
}) => {
  const priorities: IssuePriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className="py-1">
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-[#787671] uppercase">
        Change Priority
      </div>
      <div className="space-y-0.5">
        {priorities.map(priority => {
          const config = PRIORITY_CONFIG[priority];
          const Icon = config.icon;
          const isSelected = priority === currentPriority;

          return (
            <button
              key={priority}
              onClick={() => {
                onSelect(priority);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-[#f6f5f4] cursor-pointer transition-colors ${
                isSelected ? 'bg-[#ede9e4]/70 font-medium' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${config.colorClass}`} />
                <span className="text-[#1a1a1a]">{config.label}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-[#5645d4]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface AssigneePickerProps {
  users: User[];
  currentAssigneeId?: string;
  onSelect: (assigneeId: string | undefined) => void;
  onClose: () => void;
}

export const AssigneePicker: React.FC<AssigneePickerProps> = ({
  users,
  currentAssigneeId,
  onSelect,
  onClose,
}) => {
  return (
    <div className="py-1 max-h-64 overflow-y-auto">
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-[#787671] uppercase">
        Assign To
      </div>
      <div className="space-y-0.5">
        <button
          onClick={() => {
            onSelect(undefined);
            onClose();
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-[#f6f5f4] cursor-pointer transition-colors ${
            !currentAssigneeId ? 'bg-[#ede9e4]/70 font-medium' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-dashed border-[#a4a097] flex items-center justify-center text-[10px] text-[#787671]">
              -
            </div>
            <span className="text-[#787671]">Unassigned</span>
          </div>
          {!currentAssigneeId && <Check className="w-3.5 h-3.5 text-[#5645d4]" />}
        </button>

        {users.map(user => {
          const isSelected = user.id === currentAssigneeId;
          return (
            <button
              key={user.id}
              onClick={() => {
                onSelect(user.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-[#f6f5f4] cursor-pointer transition-colors ${
                isSelected ? 'bg-[#ede9e4]/70 font-medium' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Avatar user={user} size="sm" />
                <div className="text-left">
                  <div className="text-[#1a1a1a] font-medium leading-tight">{user.name}</div>
                  <div className="text-[10px] text-[#787671]">{user.role}</div>
                </div>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-[#5645d4]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
