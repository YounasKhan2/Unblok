import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeamSchema, patchTeamSchema } from '@unblok/contracts';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useTeams } from './TeamsContext';
const colors = ['#5645d4', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'] as const;
export function TeamDialog({ mode, close }: {
    mode: 'create' | 'edit';
    close: () => void;
}) {
    const t = useTeams(), navigate = useNavigate(), draft = t.attempt?.body ?? (mode === 'edit' ? t.team : null);
    const [name, setName] = useState(draft?.name ?? ''), [key, setKey] = useState(draft && 'key' in draft && typeof draft.key === 'string' ? draft.key : t.team?.key ?? ''), [description, setDescription] = useState(draft?.description ?? ''), [color, setColor] = useState(draft?.color ?? colors[0]), [invalid, setInvalid] = useState('');
    const [now, setNow] = useState(Date.now());
    useEffect(() => { if (t.retryAfter <= Date.now())
        return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [t.retryAfter]);
    const locked = !!t.attempt && !t.conflict, display = t.attempt?.body;
    const submit = async (e: React.FormEvent) => { e.preventDefault(); const input = mode === 'create' ? createTeamSchema.safeParse(locked ? display : { name: name.trim(), key: key.trim().toUpperCase(), description, color }) : patchTeamSchema.safeParse(locked ? display : { name: name.trim(), description, color }); if (!input.success) {
        setInvalid('Check the name, immutable key, description and approved color.');
        return;
    } setInvalid(''); const result = mode === 'create' ? await t.store.create(input.data as ReturnType<typeof createTeamSchema.parse>) : await t.store.update(input.data); if (result) {
        close();
        if (mode === 'create')
            navigate('/workspaces/' + result.workspaceId + '/teams/' + result.id);
    } };
    return <Modal isOpen onClose={close} title={mode === 'create' ? 'Create team' : 'Edit Team metadata'} description={mode === 'create' ? 'Create a private Team with your own membership.' : 'Change name, description and color. Team keys cannot change.'} maxWidth="md"><form className="space-y-4" onSubmit={e => void submit(e)}>
 <div className="grid grid-cols-2 gap-3"><label className="text-xs space-y-1">Team name<input aria-label="Team name" autoComplete="off" className="block w-full rounded-md border border-border bg-surface-base px-3 py-1.5" value={locked ? display?.name ?? name : name} disabled={t.sending || locked} onChange={e => setName(e.target.value)}/></label>
 <label className="text-xs space-y-1">Team key<input aria-label="Team key" className="block w-full rounded-md border border-border bg-surface-base px-3 py-1.5 font-mono" maxLength={6} value={mode === 'edit' ? t.team?.key ?? key : locked && display && 'key' in display && typeof display.key === 'string' ? display.key : key} readOnly={mode === 'edit'} disabled={t.sending || locked} onChange={e => setKey(e.target.value.toUpperCase())}/></label></div>
 <fieldset><legend className="text-xs mb-2">Team color badge</legend><div className="flex flex-wrap gap-2">{colors.map(c => <button key={c} type="button" aria-label={'Select color ' + c} aria-pressed={(locked ? display?.color ?? color : color) === c} disabled={t.sending || locked} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={'w-7 h-7 rounded-md border-2 ' + ((locked ? display?.color ?? color : color) === c ? 'border-text-primary' : 'border-transparent')}/>)}</div></fieldset>
 <label className="block text-xs space-y-1">Description<textarea aria-label="Team description" className="block w-full rounded-md border border-border bg-surface-base px-3 py-2" rows={3} value={locked ? display?.description ?? description : description} disabled={t.sending || locked} onChange={e => setDescription(e.target.value)}/></label>
 <p className="text-xs text-text-muted">Up to 120 characters for name and 2,000 for description. Members and project settings are not available here.</p>
 {(invalid || t.mutationError) && <p role="alert" className="text-xs text-danger">{invalid || t.mutationError}</p>}
 {t.attempt && !t.conflict && <p role="status" className="text-xs text-text-secondary">This request is pending confirmation. Retry uses the original details and request key. Closing this dialog does not cancel the request.</p>}
 {t.retryAfter > now && <p role="status" className="text-xs">Wait {Math.ceil((t.retryAfter - now) / 1000)} seconds before retrying the same request.</p>}
 {t.conflict && <section className="rounded-md border border-warning p-3 text-xs space-y-2"><h3 className="font-semibold">Review conflicting metadata</h3><p>Your draft is retained. Current name: {t.team?.name ?? 'Loading current Team…'}</p><p className="whitespace-pre-wrap break-words">Current description: {t.team?.description ?? 'Unavailable'}</p><p>Current color: {t.team?.color ?? 'Unavailable'}</p><Button type="button" size="sm" disabled={!t.team?.capabilities.updateMetadata || t.opening || t.blocked} onClick={() => t.store.resolveConflict()}>Use refreshed version for my draft</Button></section>}
 <div className="flex justify-end gap-2"><Button type="button" size="sm" onClick={close}>{t.attempt ? 'Close' : 'Cancel'}</Button><Button type="submit" size="sm" variant="primary" disabled={t.sending || t.blocked || t.conflict || t.retryAfter > now || (mode === 'edit' && !t.team?.capabilities.updateMetadata)}>{t.sending ? 'Confirming…' : t.attempt ? 'Retry same request' : mode === 'create' ? 'Create team' : 'Save metadata'}</Button></div>
 </form></Modal>;
}
