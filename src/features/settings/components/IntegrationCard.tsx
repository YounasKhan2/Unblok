import React, { useState } from 'react';
import { RepoIntegrationConfig } from '../types';
import { Button } from '../../../components/ui/Button';
import { Settings2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface IntegrationCardProps {
  config: RepoIntegrationConfig;
  icon: React.ReactNode;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ config, icon }) => {
  const { updateRepoIntegration } = useSettings();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [repoInput, setRepoInput] = useState(config.repository || '');
  const [patternInput, setPatternInput] = useState(config.branchPattern || '');
  const [recognizeKeys, setRecognizeKeys] = useState(config.recognizeKeysInCommits);

  const isConnected = config.status === 'CONNECTED';
  const isError = config.status === 'ERROR';

  const handleToggleConnect = () => {
    if (isConnected) {
      updateRepoIntegration(config.provider, {
        status: 'NOT_CONNECTED',
        repository: undefined,
        lastSync: undefined,
      });
      setIsConfiguring(false);
    } else {
      updateRepoIntegration(config.provider, {
        status: 'CONNECTED',
        repository: repoInput || (config.provider === 'GITHUB' ? 'acme-corp/unblok-core' : 'acme-group/infra-ops'),
        lastSync: 'Just now',
        recognizeKeysInCommits: true,
      });
    }
  };

  const handleSaveConfig = () => {
    updateRepoIntegration(config.provider, {
      repository: repoInput,
      branchPattern: patternInput,
      recognizeKeysInCommits: recognizeKeys,
      lastSync: 'Just now',
    });
    setIsConfiguring(false);
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-surface-base hover:border-border-strong transition-colors space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-subtle border border-border flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-text-primary">{config.name}</h3>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium border ${
                  isConnected
                    ? 'bg-success/10 text-success border-success/30'
                    : isError
                    ? 'bg-danger/10 text-danger border-danger/30'
                    : 'bg-surface-subtle text-text-muted border-border'
                }`}
              >
                {config.status}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {isConnected && config.repository
                ? `Connected to ${config.repository} • Synced ${config.lastSync || 'recently'}`
                : 'Connect repositories to enable branch and commit linking.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Settings2 className="w-3.5 h-3.5 text-text-muted" />}
              onClick={() => setIsConfiguring(!isConfiguring)}
            >
              Configure
            </Button>
          )}
          <Button
            variant={isConnected ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggleConnect}
            className={isConnected ? 'text-danger hover:bg-danger/10 hover:border-danger/30' : ''}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
      </div>

      {/* Configuration Drawer/Accordion */}
      {isConfiguring && isConnected && (
        <div className="pt-3 border-t border-border space-y-3 text-xs bg-surface-subtle p-3 rounded-md animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-primary">
                Repository Path
              </label>
              <input
                type="text"
                value={repoInput}
                onChange={e => setRepoInput(e.target.value)}
                placeholder="org/repo-name"
                className="w-full px-2.5 py-1 text-xs border border-border rounded bg-surface-base text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-primary">
                Branch Pattern
              </label>
              <input
                type="text"
                value={patternInput}
                onChange={e => setPatternInput(e.target.value)}
                placeholder="feature/*, bugfix/*"
                className="w-full px-2.5 py-1 text-xs border border-border rounded bg-surface-base text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recognizeKeys}
              onChange={e => setRecognizeKeys(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-[11px] text-text-primary">
              Recognize issue keys in commit messages (e.g., <code className="bg-surface-base px-1 py-0.5 rounded border border-border font-mono">ENG-142</code> or <code className="bg-surface-base px-1 py-0.5 rounded border border-border font-mono">fixes CORE-10</code>)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsConfiguring(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveConfig}
            >
              Apply Config
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
