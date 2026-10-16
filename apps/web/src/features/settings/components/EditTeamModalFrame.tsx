import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Team, User } from '../../../types';


export interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  users: User[];
}

import {PRESET_COLORS} from '../../teams/components/CreateTeamModalFrame';
interface LiveEdit {busy:boolean;locked:boolean;blocked:boolean;error:string;feedback:React.ReactNode;draft?:{name?:string;description?:string;color?:string};color:string}
export const EditTeamModalFrame: React.FC<EditTeamModalProps&{updateTeam:(id:string,input:{name:string;key:string;description?:string;leadId?:string;memberIds:string[];color?:string})=>unknown;live?:LiveEdit}> = ({isOpen,onClose,team,users,updateTeam,live}) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [color,setColor]=useState(live?.draft?.color??live?.color??PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const initialized=useRef<string|undefined>(undefined);
  useEffect(() => {
    if(live&&initialized.current===team?.id)return;
    initialized.current=team?.id;
    if (team) {
      setName(live?.draft?.name??team.name);
      setKey(team.key);
      setDescription(live?.draft?.description??team.description??'');
      setLeadId((team as any).leadId || '');
      setSelectedMemberIds(
        users
          .filter(u => (u.teamIds || (u.teamId ? [u.teamId] : [])).includes(team.id))
          .map(u => u.id)
      );
      setError(null);
    }
  }, [team, users]);

  if (!team) return null;

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if(live&&(live.busy||live.blocked))return;
      const result=updateTeam(team.id, {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        leadId: leadId || undefined,
        memberIds: selectedMemberIds,
        ...(live?{color}:{}),
      });
      if(result instanceof Promise)void result.then(value=>{if(value)onClose();}).catch(err=>setError(err instanceof Error?err.message:'Failed to update team'));else onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit team: ${team.name}`}
      description="Update team attributes and member assignments."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-team-name" className="block text-xs font-medium text-text-primary">
              Team Name <span className="text-danger">*</span>
            </label>
            <input
              id="edit-team-name"
              disabled={!!live&&(live.locked||live.busy||live.blocked)}
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-base border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-team-key" className="block text-xs font-medium text-text-primary">
              Team Key <span className="text-danger">*</span>
            </label>
            <input
              id="edit-team-key"
              readOnly={!!live}
              disabled={!!live?.busy}
              type="text"
              required
              maxLength={6}
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase())}
              className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-surface-base border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-team-desc" className="block text-xs font-medium text-text-primary">
            Description
          </label>
          <textarea
            id="edit-team-desc"
            disabled={!!live&&(live.locked||live.busy||live.blocked)}
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-surface-base border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-team-lead" className="block text-xs font-medium text-text-primary">
            Team Lead (Attribution only)
          </label>
          <select
            id="edit-team-lead"
            disabled={!!live}
            value={leadId}
            onChange={e => setLeadId(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-border rounded-md bg-surface-base text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">{live?'Unavailable':'No Team Lead'}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-primary">
            Team Members
          </label>
          <div className="grid grid-cols-2 gap-2 p-2 border border-border rounded-md max-h-40 overflow-y-auto bg-surface-subtle">
            {users.map(u => (
              <label
                key={u.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-surface-muted cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  disabled={!!live}
                  checked={selectedMemberIds.includes(u.id)}
                  onChange={() => handleToggleMember(u.id)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="font-medium text-text-primary truncate">{u.name}</span>
              </label>
            ))}
          </div>
        </div>

        {live&&<><p className="text-xs text-text-muted">Team key is read-only. Lead attribution and member assignments are unavailable here.</p><fieldset><legend className="text-xs mb-2">Team color badge</legend><div className="flex items-center gap-2 flex-wrap">{PRESET_COLORS.map(c=><button key={c} type="button" aria-label={'Select color '+c} aria-pressed={color===c} disabled={live.busy||live.locked||live.blocked} onClick={()=>setColor(c)} style={{backgroundColor:c}} className={'w-6 h-6 rounded-full border-2 transition-all cursor-pointer '+(color===c?'border-text-primary scale-110 shadow-sm':'border-transparent hover:scale-105')}/>)}</div></fieldset>{live.error&&<p role="alert" className="text-xs text-danger">{live.error}</p>}{live.feedback}</>}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!!live&&(live.busy||live.blocked)}>
            {live?.busy?'Confirming…':live?.locked?'Retry same request':'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
