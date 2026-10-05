/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GraphLayoutData } from '../../../dependencies/types';
import { DependencyGraphCanvas } from '../../../dependencies/components/DependencyGraphCanvas';
import { useDrawerRoute } from '../../../../app/router/useDrawerRoute';
import { useProject } from '../../../../context/ProjectContext';
import { Network, Info } from 'lucide-react';

interface MilestoneDependencyViewProps {
  layout: GraphLayoutData;
}

export const MilestoneDependencyView: React.FC<MilestoneDependencyViewProps> = ({ layout }) => {
  const { openDrawer } = useDrawerRoute();
  const { currentUser } = useProject();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const isObserver = currentUser.role === 'OBSERVER';

  if (layout.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-surface-base border border-border rounded-lg">
        <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mb-3 text-text-muted">
          <Network className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-text-primary mb-1">
          No Dependency Relationships
        </h3>
        <p className="text-xs text-text-muted max-w-sm">
          None of the tasks currently linked to this milestone have upstream or downstream dependencies with each other.
        </p>
      </div>
    );
  }

  // Section 35: Reuses UX-04 DependencyGraphCanvas component directly
  return (
    <div className="flex-1 flex flex-col h-[560px] bg-surface-base border border-border rounded-lg overflow-hidden relative">
      <div className="px-4 py-2 bg-surface-subtle border-b border-border flex items-center justify-between text-xs text-text-muted shrink-0">
        <span className="font-semibold text-text-primary flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-accent" />
          <span>Milestone Dependency Graph ({layout.nodes.length} nodes, {layout.edges.length} edges)</span>
        </span>
        <span className="text-[11px]">Direction: Upstream BLOCKS Downstream</span>
      </div>

      <div className="flex-1 relative">
        <DependencyGraphCanvas
          layout={layout}
          criticalChain={{ activeEdgeIds: [], orderedIssueIds: [], orderedIssueKeys: [], chainLength: 0 }}
          selectedIssueId={selectedIssueId}
          onSelectIssue={setSelectedIssueId}
          onOpenDrawer={openDrawer}
          isObserver={isObserver}
        />
      </div>
    </div>
  );
};
