import React, { useState } from 'react';
import { RepoIntegrationConfig } from '../types';
import { Button } from '../../../components/ui/Button';
import { Check, AlertCircle, RefreshCw, GitBranch, Settings2 } from 'lucide-react';
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
    <div className="p-4 rounded-lg border border-[#e5e3df] bg-white hover:border-[#c8c4be] transition-colors space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#fafaf9] border border-[#e5e3df] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-[#1a1a1a]">{config.name}</h3>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-[#f6f5f4] text-[#787671] border border-[#e5e3df]'
                }`}
              >
                {config.status}
              </span>
            </div>
            <p className="text-[11px] text-[#787671] mt-0.5">
              {isConnected && config.repository
                ? `Connected to ${config.repository} • Synced ${config.lastSync || 'recently'}`
                : 'Connect repositories to enable prototype branch and commit linking.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Settings2 className="w-3.5 h-3.5 text-[#787671]" />}
              onClick={() => setIsConfiguring(!isConfiguring)}
            >
              Configure
            </Button>
          )}
          <Button
            variant={isConnected ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggleConnect}
            className={isConnected ? 'text-red-700 hover:bg-red-50 hover:border-red-200' : ''}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
      </div>

      {/* Configuration Drawer/Accordion */}
      {isConfiguring && isConnected && (
        <div className="pt-3 border-t border-[#e5e3df] space-y-3 text-xs bg-[#fafaf9] p-3 rounded-md animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#1a1a1a]">
                Repository Path
              </label>
              <input
                type="text"
                value={repoInput}
                onChange={e => setRepoInput(e.target.value)}
                placeholder="org/repo-name"
                className="w-full px-2.5 py-1 text-xs border border-[#e5e3df] rounded bg-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#1a1a1a]">
                Branch Pattern
              </label>
              <input
                type="text"
                value={patternInput}
                onChange={e => setPatternInput(e.target.value)}
                placeholder="feature/*, bugfix/*"
                className="w-full px-2.5 py-1 text-xs border border-[#e5e3df] rounded bg-white font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recognizeKeys}
              onChange={e => setRecognizeKeys(e.target.checked)}
              className="rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4]"
            />
            <span className="text-[11px] text-[#1a1a1a]">
              Recognize issue keys in commit messages (e.g., <code className="bg-white px-1 py-0.5 rounded border border-[#e5e3df]">ENG-142</code> or <code className="bg-white px-1 py-0.5 rounded border border-[#e5e3df]">fixes CORE-10</code>)
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
