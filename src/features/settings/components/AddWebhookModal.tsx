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
          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="webhook-name" className="block text-xs font-medium text-[#1a1a1a]">
            Webhook Name <span className="text-red-500">*</span>
          </label>
          <input
            id="webhook-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. CI/CD Pipeline Gateway"
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="webhook-url" className="block text-xs font-medium text-[#1a1a1a]">
            Payload Endpoint URL <span className="text-red-500">*</span>
          </label>
          <input
            id="webhook-url"
            type="url"
            required
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.acme.corp/webhooks/unblok"
            className="w-full px-3 py-1.5 text-xs font-mono border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#1a1a1a]">
            Subscribed Event Categories <span className="text-red-500">*</span>
          </label>
          <div className="space-y-1 p-2 border border-[#e5e3df] rounded-md bg-[#fafaf9]">
            {availableEvents.map(ev => (
              <label
                key={ev.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer text-xs select-none"
              >
                <input
                  type="checkbox"
                  checked={events.includes(ev.id)}
                  onChange={() => handleToggleEvent(ev.id)}
                  className="rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4]"
                />
                <span className="text-[#1a1a1a]">{ev.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-2.5 bg-[#f6f5f4] rounded-md border border-[#e5e3df] text-[11px] text-[#787671]">
          Mock signing secret will be generated automatically. No actual network calls or dispatches are performed in prototype mode.
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e3df]">
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
