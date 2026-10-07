import React, { useState } from 'react';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { SettingsSection } from '../../features/settings/components/SettingsSection';
import { IntegrationCard } from '../../features/settings/components/IntegrationCard';
import { AddWebhookModal } from '../../features/settings/components/AddWebhookModal';
import { Button } from '../../components/ui/Button';
import {
  GitPullRequest,
  GitBranch,
  Webhook,
  Plus,
  Trash2,
  Check,
  MessageSquare,
  AlertOctagon,
} from 'lucide-react';

export const IntegrationsSettingsPage: React.FC = () => {
  const {
    repoIntegrations,
    webhooks,
    toggleWebhook,
    deleteWebhook,
  } = useSettings();

  const [isAddWebhookOpen, setIsAddWebhookOpen] = useState(false);
  const [testPingId, setTestPingId] = useState<string | null>(null);

  const handleTestPing = (webhookId: string) => {
    setTestPingId(webhookId);
    setTimeout(() => setTestPingId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <h2 className="text-base font-bold text-text-primary tracking-tight">
          Integrations & Connections
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Configure code repository sync, webhook delivery endpoints, and workflow connections.
        </p>
      </div>

      {/* 1. Code Repositories */}
      <SettingsSection
        title="Code Repositories"
        description="Link source control providers to recognize issue keys in branches and commit messages."
      >
        <div className="space-y-3">
          {repoIntegrations.map(config => (
            <IntegrationCard
              key={config.id}
              config={config}
              icon={
                config.provider === 'GITHUB' ? (
                  <GitPullRequest className="w-4 h-4 text-text-primary" />
                ) : (
                  <GitBranch className="w-4 h-4 text-warning" />
                )
              }
            />
          ))}
        </div>
      </SettingsSection>

      {/* 2. Webhooks */}
      <SettingsSection
        title={`Webhooks (${webhooks.length})`}
        description="Deliver real-time event payloads to your external services."
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddWebhookOpen(true)}
          >
            Add Webhook
          </Button>
        }
      >
        <div className="space-y-3">
          {webhooks.length > 0 ? (
            webhooks.map(wh => (
              <div
                key={wh.id}
                className="p-3.5 rounded-lg border border-border bg-surface-base flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-strong transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-3.5 h-3.5 text-accent shrink-0" />
                    <h3 className="text-xs font-semibold text-text-primary truncate">{wh.name}</h3>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium border ${
                        wh.enabled
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-surface-muted text-text-muted border-border'
                      }`}
                    >
                      {wh.enabled ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-text-secondary mt-1 truncate">
                    {wh.url}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-muted flex-wrap">
                    <span>Events: {wh.events.join(', ')}</span>
                    <span>•</span>
                    <span>Signing Secret: <code className="bg-surface-subtle px-1 py-0.5 rounded border border-border text-text-muted font-mono">{wh.secret}</code> (Demo)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={
                      testPingId === wh.id ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : undefined
                    }
                    onClick={() => handleTestPing(wh.id)}
                    title="Simulate mock webhook ping"
                  >
                    {testPingId === wh.id ? '200 OK' : 'Test Ping'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleWebhook(wh.id)}
                  >
                    {wh.enabled ? 'Pause' : 'Enable'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                    onClick={() => deleteWebhook(wh.id)}
                    className="text-danger hover:bg-danger/10 hover:border-danger/30"
                    title="Remove webhook"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-text-muted bg-surface-subtle rounded-lg border border-border">
              No webhooks configured.
            </div>
          )}
        </div>
      </SettingsSection>

      {/* 3. Future Connections (Coming Later) */}
      <SettingsSection
        title="Future Connections"
        description="Planned engineering tooling connectors under roadmapped development."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <MessageSquare className="w-4 h-4 text-text-muted" />
                <span>Slack</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted bg-surface-base px-1.5 py-0.5 rounded border border-border">
                COMING LATER
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Unblock alerts and cycle summaries broadcast directly into squad channels.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <MessageSquare className="w-4 h-4 text-text-muted" />
                <span>Microsoft Teams</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted bg-surface-base px-1.5 py-0.5 rounded border border-border">
                COMING LATER
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Enterprise notifications and collaborative issue triaging for MS 365 orgs.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <AlertOctagon className="w-4 h-4 text-text-muted" />
                <span>Incident Tooling</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted bg-surface-base px-1.5 py-0.5 rounded border border-border">
                COMING LATER
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Automatic blocker escalation and post-mortem linking for PagerDuty and incident channels.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Add Webhook Modal */}
      <AddWebhookModal
        isOpen={isAddWebhookOpen}
        onClose={() => setIsAddWebhookOpen(false)}
      />
    </div>
  );
};
