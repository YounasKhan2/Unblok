/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NEXUS Enterprise Dataset — Density & Performance Benchmark Script
 * Measures genuine local computation timings for Section 10.
 */

import { performance } from 'perf_hooks';
import {
  NEXUS_ISSUES,
  NEXUS_DEPENDENCIES,
  NEXUS_MILESTONES,
  NEXUS_CYCLES,
  NEXUS_USERS,
  NEXUS_TEAMS,
  NEXUS_ACTIVITIES,
  NEXUS_COMMENTS,
} from '../src/data/nexus';
import { deriveInboxItems } from '../src/features/collaboration/domain/inboxProjection';
import { deriveMilestoneHealth } from '../src/features/planning/domain/milestoneInvariants';
import { getBlockerStatus, validateHardCompletionGuard } from '../src/domain/dependency';
import { filterEntitiesByWorkspace } from '../src/features/workspaces/domain/workspaceIsolation';

console.log('================================================================');
console.log('  NEXUS ENTERPRISE DATASET — LOCAL BENCHMARK & DENSITY REPORT   ');
console.log('================================================================\n');

// 1. Initial State / Dataset Sizing
console.log('--- DATASET VOLUMETRICS ---');
console.log(`Issues:             ${NEXUS_ISSUES.length}`);
console.log(`Dependencies:       ${NEXUS_DEPENDENCIES.length}`);
console.log(`Milestones:         ${NEXUS_MILESTONES.length}`);
console.log(`Cycles:             ${NEXUS_CYCLES.length}`);
console.log(`Teams:              ${NEXUS_TEAMS.length}`);
console.log(`Users:              ${NEXUS_USERS.length}`);
console.log(`Comments:           ${NEXUS_COMMENTS.length}`);
console.log(`Activity Events:    ${NEXUS_ACTIVITIES.length}\n`);

// 2. 300-issue filtering and sorting benchmark
const filterIterations = 500;
const tFilterStart = performance.now();
for (let i = 0; i < filterIterations; i++) {
  // Complex filter: IN_PROGRESS or IN_REVIEW, priority HIGH or URGENT, assigned to team_cp
  const filtered = NEXUS_ISSUES.filter(
    (issue) =>
      (issue.state === 'IN_PROGRESS' || issue.state === 'IN_REVIEW') &&
      (issue.priority === 'HIGH' || issue.priority === 'URGENT')
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
const tFilterEnd = performance.now();
const avgFilterTime = (tFilterEnd - tFilterStart) / filterIterations;
console.log(`[Benchmark 1] 300-Issue Multi-Criteria Filter + Sort:`);
console.log(`  Total: ${(tFilterEnd - tFilterStart).toFixed(2)} ms over ${filterIterations} runs`);
console.log(`  Avg per operation: ${avgFilterTime.toFixed(3)} ms`);

// 3. Board Column Partitioning
const boardIterations = 500;
const tBoardStart = performance.now();
for (let i = 0; i < boardIterations; i++) {
  const columns: Record<string, typeof NEXUS_ISSUES> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
    CANCELLED: [],
  };
  for (const issue of NEXUS_ISSUES) {
    if (columns[issue.state]) {
      columns[issue.state].push(issue);
    }
  }
}
const tBoardEnd = performance.now();
const avgBoardTime = (tBoardEnd - tBoardStart) / boardIterations;
console.log(`\n[Benchmark 2] Kanban Board 6-Column Partitioning (300 items):`);
console.log(`  Avg per board partition: ${avgBoardTime.toFixed(3)} ms`);

// 4. Dependency Graph Traversal & Blocker Status Resolution
const depIterations = 300;
const tDepStart = performance.now();
for (const issue of NEXUS_ISSUES) {
  getBlockerStatus(issue.id, NEXUS_ISSUES, NEXUS_DEPENDENCIES);
}
const tDepEnd = performance.now();
const avgDepTime = (tDepEnd - tDepStart) / NEXUS_ISSUES.length;
console.log(`\n[Benchmark 3] Dependency Graph Full Evaluation across all 300 issues:`);
console.log(`  Total time: ${(tDepEnd - tDepStart).toFixed(2)} ms`);
console.log(`  Avg per issue blocker calculation: ${avgDepTime.toFixed(3)} ms`);

// 5. Milestone Progress and Health Derivation (10 Milestones)
const tMsStart = performance.now();
const refDate = new Date('2026-10-07T12:00:00.000Z');
for (const ms of NEXUS_MILESTONES) {
  deriveMilestoneHealth(ms, NEXUS_ISSUES, NEXUS_DEPENDENCIES, refDate);
}
const tMsEnd = performance.now();
console.log(`\n[Benchmark 4] 10-Milestone Progress & Canonical Health Derivation:`);
console.log(`  Total time: ${(tMsEnd - tMsStart).toFixed(3)} ms`);

// 6. Inbox Notification Projection
const tInboxStart = performance.now();
const alex = NEXUS_USERS[0];
const alexInbox = deriveInboxItems({
  activities: NEXUS_ACTIVITIES,
  issues: NEXUS_ISSUES,
  comments: NEXUS_COMMENTS,
  users: NEXUS_USERS,
  currentUser: alex,
  receipts: {},
});
const tInboxEnd = performance.now();
console.log(`\n[Benchmark 5] Inbox Projection (962 activities -> notifications for Alex Rivera):`);
console.log(`  Items generated: ${alexInbox.length}`);
console.log(`  Projection latency: ${(tInboxEnd - tInboxStart).toFixed(2)} ms`);

// 7. Full-text search simulation over 300 issues
const searchTerms = ['checkout', 'kafka', 'redis', 'postgres', 'token', 'payment', 'latency'];
const tSearchStart = performance.now();
let totalMatches = 0;
for (const term of searchTerms) {
  const q = term.toLowerCase();
  const matches = NEXUS_ISSUES.filter(
    (i) =>
      i.key.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
  );
  totalMatches += matches.length;
}
const tSearchEnd = performance.now();
console.log(`\n[Benchmark 6] Client Search Filter over 300 Issues (${searchTerms.length} keyword queries):`);
console.log(`  Total matches found: ${totalMatches}`);
console.log(`  Avg search query time: ${((tSearchEnd - tSearchStart) / searchTerms.length).toFixed(3)} ms`);

console.log('\n================================================================');
console.log('  BENCHMARK COMPLETED SUCCESSFULLY                               ');
console.log('================================================================');
