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
  Clock,
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
        <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">
          Integrations & Connections
        </h2>
        <p className="text-xs text-[#787671] mt-0.5">
          Configure code repository sync, webhook delivery endpoints, and workflow connections (Prototype simulation).
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
                  <GitPullRequest className="w-4 h-4 text-[#24292f]" />
                ) : (
                  <GitBranch className="w-4 h-4 text-[#e24329]" />
                )
              }
            />
          ))}
        </div>
      </SettingsSection>

      {/* 2. Webhooks */}
      <SettingsSection
        title={`Webhooks (${webhooks.length})`}
        description="Deliver real-time prototype event payloads to your external services."
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
                className="p-3.5 rounded-lg border border-[#e5e3df] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#c8c4be] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-3.5 h-3.5 text-[#5645d4] shrink-0" />
                    <h3 className="text-xs font-semibold text-[#1a1a1a] truncate">{wh.name}</h3>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                        wh.enabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#f6f5f4] text-[#787671] border border-[#e5e3df]'
                      }`}
                    >
                      {wh.enabled ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-[#52504b] mt-1 truncate">
                    {wh.url}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#787671] flex-wrap">
                    <span>Events: {wh.events.join(', ')}</span>
                    <span>•</span>
                    <span>Signing Secret: <code className="bg-[#fafaf9] px-1 py-0.2 rounded border border-[#e5e3df] text-[#a4a097]">{wh.secret}</code> (Demo)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={
                      testPingId === wh.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
                    onClick={() => deleteWebhook(wh.id)}
                    className="text-red-700 hover:bg-red-50 hover:border-red-200"
                    title="Remove webhook"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-[#787671] bg-[#fafaf9] rounded-lg border border-[#e5e3df]">
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
          <div className="p-3.5 rounded-lg border border-[#e5e3df] bg-[#fafaf9] space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a]">
                <MessageSquare className="w-4 h-4 text-[#787671]" />
                <span>Slack</span>
              </div>
              <span className="text-[10px] font-mono text-[#787671] bg-white px-1.5 py-0.5 rounded border border-[#e5e3df]">
                COMING LATER
              </span>
            </div>
            <p className="text-[11px] text-[#787671]">
              Unblock alerts and cycle summaries broadcast directly into squad channels.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-[#e5e3df] bg-[#fafaf9] space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a]">
                <MessageSquare className="w-4 h-4 text-[#787671]" />
                <span>Microsoft Teams</span>
              </div>
              <span className="text-[10px] font-mono text-[#787671] bg-white px-1.5 py-0.5 rounded border border-[#e5e3df]">
                COMING LATER
              </span>
            </div>
            <p className="text-[11px] text-[#787671]">
              Enterprise notifications and collaborative issue triaging for MS 365 orgs.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-[#e5e3df] bg-[#fafaf9] space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a]">
                <AlertOctagon className="w-4 h-4 text-[#787671]" />
                <span>Incident Tooling</span>
              </div>
              <span className="text-[10px] font-mono text-[#787671] bg-white px-1.5 py-0.5 rounded border border-[#e5e3df]">
                COMING LATER
              </span>
            </div>
            <p className="text-[11px] text-[#787671]">
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
