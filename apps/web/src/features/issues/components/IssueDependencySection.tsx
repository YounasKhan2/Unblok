/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Issue } from '../../../types';
import { DependencyManager } from '../../../components/drawer/DependencyManager';
import { IssueDependencyMiniGraph } from './IssueDependencyMiniGraph';
import { ResolvedDependencyItem } from '../selectors';

interface IssueDependencySectionProps {
  issue: Issue;
  upstreamDependencies: ResolvedDependencyItem[];
  downstreamDependencies: ResolvedDependencyItem[];
  isReadOnly?: boolean;
}

export const IssueDependencySection: React.FC<IssueDependencySectionProps> = ({
  issue,
  upstreamDependencies,
  downstreamDependencies,
  isReadOnly = false,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Mini Visual DAG representation */}
      <IssueDependencyMiniGraph
        currentIssue={issue}
        upstreamDependencies={upstreamDependencies}
        downstreamDependencies={downstreamDependencies}
      />

      {/* 2. Canonical Dependency Management list */}
      <DependencyManager issue={issue} isReadOnly={isReadOnly} />
    </div>
  );
};
