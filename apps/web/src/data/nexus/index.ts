/**
 * NEXUS Omnichannel Commerce Platform — Enterprise Dataset
 * Canonical deterministic fixture pack.
 */

export const NEXUS_FIXTURE_VERSION = 'nexus-2026.10.1';

export * from './teams';
export * from './project';
export * from './users';
export * from './cycles';
export * from './milestones';
export * from './issues';
export * from './dependencies';
export * from './comments';
export * from './activities';

export const NEXUS_WORKSPACE = {
  id: 'ws_nexus',
  name: 'NEXUS Commerce',
  slug: 'nexus-commerce',
  avatar: '🛍️',
  createdAt: '2026-04-01T08:00:00.000Z',
  status: 'ACTIVE' as const,
};
