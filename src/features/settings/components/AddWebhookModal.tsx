import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useSettings } from '../context/SettingsContext';

interface AddWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWebhookModal: React.FC<AddWebhookModalProps> = ({ isOpen, onClose }) => {
  const { addWebhook } = useSettings();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['issues', 'blockers']);
  const [error, setError] = useState<string | null>(null);

  const availableEvents = [
    { id: 'issues', label: 'Issues (created, status changed, assigned)' },
    { id: 'blockers', label: 'Dependencies & Blockers (blocked, unblocked)' },
    { id: 'cycles', label: 'Cycles (started, completed, scope rolled)' },
    { id: 'members', label: 'Members & Roles (invited, updated)' },
  ];

  const handleToggleEvent = (eventId: string) => {
    setEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Webhook name is required');
      return;
    }
    if (!url.trim().startsWith('http://') && !url.trim().startsWith('https://')) {
      setError('Endpoint URL must start with http:// or https://');
      return;
    }
    if (events.length === 0) {
      setError('Select at least one event category');
      return;
    }

    try {
      addWebhook({
        name: name.trim(),
        url: url.trim(),
        events,
        enabled: true,
      });
      setName('');
      setUrl('');
      setEvents(['issues', 'blockers']);
      setError(null);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add webhook');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Webhook Endpoint"
      description="Register an HTTP endpoint for prototype lifecycle events."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="webhook-name" className="block text-xs font-medium text-text-primary">
            Webhook Name <span className="text-danger">*</span>
          </label>
          <input
            id="webhook-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. CI/CD Pipeline Gateway"
            className="w-full px-3 py-1.5 text-xs bg-surface-base border border-border text-text-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="webhook-url" className="block text-xs font-medium text-text-primary">
            Payload Endpoint URL <span className="text-danger">*</span>
          </label>
          <input
            id="webhook-url"
            type="url"
            required
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.acme.corp/webhooks/unblok"
            className="w-full px-3 py-1.5 text-xs font-mono bg-surface-base border border-border text-text-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-primary">
            Subscribed Event Categories <span className="text-danger">*</span>
          </label>
          <div className="space-y-1 p-2 border border-border rounded-md bg-surface-subtle">
            {availableEvents.map(ev => (
              <label
                key={ev.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-surface-base cursor-pointer text-xs select-none"
              >
                <input
                  type="checkbox"
                  checked={events.includes(ev.id)}
                  onChange={() => handleToggleEvent(ev.id)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-text-primary">{ev.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-2.5 bg-surface-muted rounded-md border border-border text-[11px] text-text-muted">
          Mock signing secret will be generated automatically. No actual network calls or dispatches are performed in prototype mode.
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Create Webhook
          </Button>
        </div>
      </form>
    </Modal>
  );
};
