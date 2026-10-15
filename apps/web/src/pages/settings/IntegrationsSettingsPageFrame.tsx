import React from 'react';
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
export function IntegrationsSettingsPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){return (<div className="space-y-6">{header??(<div className="pb-2">
        <h2 className="text-base font-bold text-text-primary tracking-tight">
          Integrations & Connections
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Configure code repository sync, webhook delivery endpoints, and workflow connections.
        </p>
      </div>)}{unavailable?<p role="status" className="text-xs text-text-muted">This settings capability is not connected to a live API. Business actions are unavailable; no demo records are shown.</p>:children}</div>);}
