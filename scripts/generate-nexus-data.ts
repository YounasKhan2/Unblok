import * as fs from 'fs';
import * as path from 'path';

const outDir = path.resolve(__dirname, '../apps/web/src/data/nexus');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Teams
const teamsContent = `/**
 * NEXUS Functional Teams
 */
import { Team } from '../../types';

export const NEXUS_TEAMS: Team[] = [
  {
    id: 'team_cp',
    workspaceId: 'ws_nexus',
    name: 'Commerce Platform',
    key: 'CP',
    color: '#4f46e5',
    description: 'Core project architecture, event mesh, API gateways, and integration orchestration.',
  },
  {
    id: 'team_sfx',
    workspaceId: 'ws_nexus',
    name: 'Storefront Experience',
    key: 'SFX',
    color: '#0284c7',
    description: 'Customer-facing web applications, merchandising components, and edge rendering.',
  },
  {
    id: 'team_svc',
    workspaceId: 'ws_nexus',
    name: 'Commerce Services',
    key: 'SVC',
    color: '#059669',
    description: 'Distributed catalog service, cart calculation engine, orders, and returns workflows.',
  },
  {
    id: 'team_pay',
    workspaceId: 'ws_nexus',
    name: 'Payments & Risk',
    key: 'PAY',
    color: '#d97706',
    description: 'Payment gateway integrations, 3DS authentication, fraud scoring, and settlements.',
  },
  {
    id: 'team_inf',
    workspaceId: 'ws_nexus',
    name: 'Infrastructure & Reliability',
    key: 'INF',
    color: '#e11d48',
    description: 'Kubernetes orchestration, multi-region replication, observability, and disaster recovery.',
  },
  {
    id: 'team_qe',
    workspaceId: 'ws_nexus',
    name: 'Quality Engineering',
    key: 'QE',
    color: '#7c3aed',
    description: 'End-to-end automation, regression test matrices, chaos testing, and release qualification.',
  },
];
`;
fs.writeFileSync(path.join(outDir, 'teams.ts'), teamsContent, 'utf-8');

// 2. Project
const projectContent = `/**
 * Flagship NEXUS Project
 */
import { Project } from '../../types';

export const NEXUS_PROJECT: Project = {
  id: 'proj_nexus',
  workspaceId: 'ws_nexus',
  teamId: 'team_cp',
  name: 'NEXUS — Omnichannel Commerce Platform',
  key: 'NEX',
  description: 'Enterprise omnichannel commerce platform uniting digital storefronts, distributed order orchestration, global checkout, payment processing, and inventory synchronization.',
  currentSequence: 300,
};
`;
fs.writeFileSync(path.join(outDir, 'project.ts'), projectContent, 'utf-8');

// 3. Cycles
const cyclesContent = `/**
 * NEXUS Team Delivery Cycles
 * Respects canonical one-active-cycle-per-team constraint.
 */
import { Cycle } from '../../types';

export const NEXUS_CYCLES: Cycle[] = [
  // Commerce Platform (owning team) 6-month progression
  {
    id: 'cycle_cp_21',
    workspaceId: 'ws_nexus',
    name: 'Cycle 21 — Architecture & Core RFCs',
    startDate: '2026-08-03',
    endDate: '2026-08-16',
    status: 'COMPLETED',
    teamId: 'team_cp',
    description: 'Foundational API gateway contracts, event bus design, and distributed tracing spikes.',
  },
  {
    id: 'cycle_cp_22',
    workspaceId: 'ws_nexus',
    name: 'Cycle 22 — Data Contracts & Service Mesh',
    startDate: '2026-08-17',
    endDate: '2026-08-30',
    status: 'COMPLETED',
    teamId: 'team_cp',
    description: 'gRPC schema validation, Envoy proxy rollout, and multi-tenant schema isolation.',
  },
  {
    id: 'cycle_cp_23',
    workspaceId: 'ws_nexus',
    name: 'Cycle 23 — Event Mesh & Catalog Sync',
    startDate: '2026-08-31',
    endDate: '2026-09-13',
    status: 'COMPLETED',
    teamId: 'team_cp',
    description: 'Kafka event streaming, Change Data Capture (CDC) pipelines, and catalog indexing.',
  },
  {
    id: 'cycle_cp_24',
    workspaceId: 'ws_nexus',
    name: 'Cycle 24 — Unified Checkout & Core Services',
    startDate: '2026-09-14',
    endDate: '2026-09-27',
    status: 'COMPLETED',
    teamId: 'team_cp',
    description: 'Cart calculation idempotency, reservation expiration timers, and inventory locking.',
  },
  {
    id: 'cycle_cp_25',
    workspaceId: 'ws_nexus',
    name: 'Cycle 25 — Payments Integration & Hardening',
    startDate: '2026-09-28',
    endDate: '2026-10-11',
    status: 'ACTIVE',
    teamId: 'team_cp',
    description: 'Multi-gateway fallback, 3DS authentication challenge modal, and production readiness triage.',
  },
  {
    id: 'cycle_cp_26',
    workspaceId: 'ws_nexus',
    name: 'Cycle 26 — Release Candidate Qualification',
    startDate: '2026-10-12',
    endDate: '2026-10-25',
    status: 'UPCOMING',
    teamId: 'team_cp',
    description: 'Final regression sign-offs, disaster recovery drills, and performance benchmark suites.',
  },
  {
    id: 'cycle_cp_27',
    workspaceId: 'ws_nexus',
    name: 'Cycle 27 — Pilot Launch & Observability',
    startDate: '2026-10-26',
    endDate: '2026-11-08',
    status: 'UPCOMING',
    teamId: 'team_cp',
    description: 'Merchant canary deployments, synthetic traffic ramps, and real-time ledger audits.',
  },

  // 1 active cycle per other functional team
  {
    id: 'cycle_sfx_14',
    workspaceId: 'ws_nexus',
    name: 'Storefront Sprint 14',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    status: 'ACTIVE',
    teamId: 'team_sfx',
    description: 'Customer checkout UI polish, cart drawer animations, and mobile web audit.',
  },
  {
    id: 'cycle_svc_18',
    workspaceId: 'ws_nexus',
    name: 'Services Sprint 18',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    status: 'ACTIVE',
    teamId: 'team_svc',
    description: 'Pricing engine caching, promotional rule evaluation, and stock reservation.',
  },
  {
    id: 'cycle_pay_12',
    workspaceId: 'ws_nexus',
    name: 'Payments Sprint 12',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    status: 'ACTIVE',
    teamId: 'team_pay',
    description: 'Stripe webhook replay protection, Apple Pay tokens, and chargeback webhooks.',
  },
  {
    id: 'cycle_inf_09',
    workspaceId: 'ws_nexus',
    name: 'Infra Sprint 09',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    status: 'ACTIVE',
    teamId: 'team_inf',
    description: 'PostgreSQL read pool tuning, Redis cluster failover, and OTel span sampling.',
  },
  {
    id: 'cycle_qe_08',
    workspaceId: 'ws_nexus',
    name: 'QE Sprint 08',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    status: 'ACTIVE',
    teamId: 'team_qe',
    description: 'Playwright synthetic checkout smoke runs, high-concurrency k6 load tests.',
  },
];
`;
fs.writeFileSync(path.join(outDir, 'cycles.ts'), cyclesContent, 'utf-8');

// 4. Milestones
const milestonesContent = `/**
 * NEXUS Strategic Workspace Milestones
 */
import { Milestone } from '../../types';

export const NEXUS_MILESTONES: Milestone[] = [
  {
    id: 'ms_arch',
    workspaceId: 'ws_nexus',
    name: 'M1: Omnichannel Architecture & Identity Specs',
    targetDate: '2026-08-25',
    description: 'Stateless session tokens, distributed claims validation, and service-to-service mTLS.',
    teamId: 'team_cp',
  },
  {
    id: 'ms_catalog',
    workspaceId: 'ws_nexus',
    name: 'M2: Product Catalog & Distributed Merchandising',
    targetDate: '2026-09-10',
    description: 'Hierarchical product taxonomies, dynamic variant matrices, and localized asset delivery.',
    teamId: 'team_svc',
  },
  {
    id: 'ms_search',
    workspaceId: 'ws_nexus',
    name: 'M3: Search Indexing & Inventory Synchronization',
    targetDate: '2026-09-24',
    description: 'Elasticsearch product indices, faceted query pipeline, and real-time stock sync.',
    teamId: 'team_svc',
  },
  {
    id: 'ms_checkout',
    workspaceId: 'ws_nexus',
    name: 'M4: Unified Cart & Multi-Step Checkout Flow',
    targetDate: '2026-10-05',
    description: 'Optimistic cart mutations, address verification service, and coupon engine.',
    teamId: 'team_svc',
  },
  {
    id: 'ms_payments',
    workspaceId: 'ws_nexus',
    name: 'M5: Global Payment Gateway & Fraud Orchestration',
    targetDate: '2026-10-15',
    description: 'Tokenized credit card vault, risk scoring rules, 3DS challenges, and settlement pipelines.',
    teamId: 'team_pay',
  },
  {
    id: 'ms_fulfillment',
    workspaceId: 'ws_nexus',
    name: 'M6: Distributed Order Routing & Warehouse Sync',
    targetDate: '2026-10-22',
    description: 'Multi-node warehouse allocation, split-shipment calculation, and carrier tracking webhooks.',
    teamId: 'team_svc',
  },
  {
    id: 'ms_reliability',
    workspaceId: 'ws_nexus',
    name: 'M7: Zero-Downtime DR & Multi-Region Failover',
    targetDate: '2026-10-31',
    description: 'Cross-region PostgreSQL standby replication, warm Redis caches, and Cloudflare failover.',
    teamId: 'team_inf',
  },
  {
    id: 'ms_rc',
    workspaceId: 'ws_nexus',
    name: 'M8: Release Candidate 1.0 Qualification',
    targetDate: '2026-11-10',
    description: 'End-to-end regression sign-off across web, mobile, and merchant backoffice channels.',
    teamId: 'team_qe',
  },
  {
    id: 'ms_pilot',
    workspaceId: 'ws_nexus',
    name: 'M9: Staged Merchant Pilot Deployment',
    targetDate: '2026-11-25',
    description: 'Canary launch for top 25 flagship merchants with strict latency SLA thresholds.',
    teamId: 'team_cp',
  },
  {
    id: 'ms_ga',
    workspaceId: 'ws_nexus',
    name: 'M10: Omnichannel General Availability (GA)',
    targetDate: '2026-12-15',
    description: 'Full public rollout, global CDN edge routing, and round-the-clock enterprise support.',
    teamId: 'team_cp',
  },
];
`;
fs.writeFileSync(path.join(outDir, 'milestones.ts'), milestonesContent, 'utf-8');

console.log('Core entities written successfully.');
