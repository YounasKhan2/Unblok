/**
 * NEXUS Enterprise Fixtures: NEXUS_MILESTONES
 */
import { Milestone } from '../../types';

export const NEXUS_MILESTONES: Milestone[] = [
  {
    "id": "ms_arch",
    "workspaceId": "ws_nexus",
    "name": "M1: Omnichannel Architecture & Identity Specs",
    "targetDate": "2026-08-25",
    "description": "Stateless session tokens, distributed claims validation, and service-to-service mTLS.",
    "teamId": "team_cp"
  },
  {
    "id": "ms_catalog",
    "workspaceId": "ws_nexus",
    "name": "M2: Product Catalog & Distributed Merchandising",
    "targetDate": "2026-09-10",
    "description": "Hierarchical product taxonomies, dynamic variant matrices, and localized asset delivery.",
    "teamId": "team_svc"
  },
  {
    "id": "ms_search",
    "workspaceId": "ws_nexus",
    "name": "M3: Search Indexing & Inventory Synchronization",
    "targetDate": "2026-09-24",
    "description": "Elasticsearch product indices, faceted query pipeline, and real-time stock sync.",
    "teamId": "team_svc"
  },
  {
    "id": "ms_checkout",
    "workspaceId": "ws_nexus",
    "name": "M4: Unified Cart & Multi-Step Checkout Flow",
    "targetDate": "2026-10-05",
    "description": "Optimistic cart mutations, address verification service, and coupon engine.",
    "teamId": "team_svc"
  },
  {
    "id": "ms_payments",
    "workspaceId": "ws_nexus",
    "name": "M5: Global Payment Gateway & Fraud Orchestration",
    "targetDate": "2026-10-15",
    "description": "Tokenized credit card vault, risk scoring rules, 3DS challenges, and settlement pipelines.",
    "teamId": "team_pay"
  },
  {
    "id": "ms_fulfillment",
    "workspaceId": "ws_nexus",
    "name": "M6: Distributed Order Routing & Warehouse Sync",
    "targetDate": "2026-10-22",
    "description": "Multi-node warehouse allocation, split-shipment calculation, and carrier tracking webhooks.",
    "teamId": "team_svc"
  },
  {
    "id": "ms_reliability",
    "workspaceId": "ws_nexus",
    "name": "M7: Zero-Downtime DR & Multi-Region Failover",
    "targetDate": "2026-10-31",
    "description": "Cross-region PostgreSQL standby replication, warm Redis caches, and Cloudflare failover.",
    "teamId": "team_inf"
  },
  {
    "id": "ms_rc",
    "workspaceId": "ws_nexus",
    "name": "M8: Release Candidate 1.0 Qualification",
    "targetDate": "2026-11-10",
    "description": "End-to-end regression sign-off across web, mobile, and merchant backoffice channels.",
    "teamId": "team_qe"
  },
  {
    "id": "ms_pilot",
    "workspaceId": "ws_nexus",
    "name": "M9: Staged Merchant Pilot Deployment",
    "targetDate": "2026-11-25",
    "description": "Canary launch for top 25 flagship merchants with strict latency SLA thresholds.",
    "teamId": "team_cp"
  },
  {
    "id": "ms_ga",
    "workspaceId": "ws_nexus",
    "name": "M10: Omnichannel General Availability (GA)",
    "targetDate": "2026-12-15",
    "description": "Full public rollout, global CDN edge routing, and round-the-clock enterprise support.",
    "teamId": "team_cp"
  }
];
