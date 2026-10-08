/**
 * NEXUS Enterprise Fixtures: NEXUS_CYCLES
 */
import { Cycle } from '../../types';

export const NEXUS_CYCLES: Cycle[] = [
  {
    "id": "cycle_cp_21",
    "workspaceId": "ws_nexus",
    "name": "Cycle 21 \u2014 Architecture & Core RFCs",
    "startDate": "2026-08-03",
    "endDate": "2026-08-16",
    "status": "COMPLETED",
    "teamId": "team_cp",
    "description": "Foundational API gateway contracts, event bus design, and distributed tracing spikes."
  },
  {
    "id": "cycle_cp_22",
    "workspaceId": "ws_nexus",
    "name": "Cycle 22 \u2014 Data Contracts & Service Mesh",
    "startDate": "2026-08-17",
    "endDate": "2026-08-30",
    "status": "COMPLETED",
    "teamId": "team_cp",
    "description": "gRPC schema validation, Envoy proxy rollout, and multi-tenant schema isolation."
  },
  {
    "id": "cycle_cp_23",
    "workspaceId": "ws_nexus",
    "name": "Cycle 23 \u2014 Event Mesh & Catalog Sync",
    "startDate": "2026-08-31",
    "endDate": "2026-09-13",
    "status": "COMPLETED",
    "teamId": "team_cp",
    "description": "Kafka event streaming, Change Data Capture (CDC) pipelines, and catalog indexing."
  },
  {
    "id": "cycle_cp_24",
    "workspaceId": "ws_nexus",
    "name": "Cycle 24 \u2014 Unified Checkout & Core Services",
    "startDate": "2026-09-14",
    "endDate": "2026-09-27",
    "status": "COMPLETED",
    "teamId": "team_cp",
    "description": "Cart calculation idempotency, reservation expiration timers, and inventory locking."
  },
  {
    "id": "cycle_cp_25",
    "workspaceId": "ws_nexus",
    "name": "Cycle 25 \u2014 Payments Integration & Hardening",
    "startDate": "2026-09-28",
    "endDate": "2026-10-11",
    "status": "ACTIVE",
    "teamId": "team_cp",
    "description": "Multi-gateway fallback, 3DS authentication challenge modal, and production readiness triage."
  },
  {
    "id": "cycle_cp_26",
    "workspaceId": "ws_nexus",
    "name": "Cycle 26 \u2014 Release Candidate Qualification",
    "startDate": "2026-10-12",
    "endDate": "2026-10-25",
    "status": "UPCOMING",
    "teamId": "team_cp",
    "description": "Final regression sign-offs, disaster recovery drills, and performance benchmark suites."
  },
  {
    "id": "cycle_cp_27",
    "workspaceId": "ws_nexus",
    "name": "Cycle 27 \u2014 Pilot Launch & Observability",
    "startDate": "2026-10-26",
    "endDate": "2026-11-08",
    "status": "UPCOMING",
    "teamId": "team_cp",
    "description": "Merchant canary deployments, synthetic traffic ramps, and real-time ledger audits."
  },
  {
    "id": "cycle_sfx_14",
    "workspaceId": "ws_nexus",
    "name": "Storefront Sprint 14",
    "startDate": "2026-10-01",
    "endDate": "2026-10-14",
    "status": "ACTIVE",
    "teamId": "team_sfx",
    "description": "Customer checkout UI polish, cart drawer animations, and mobile web audit."
  },
  {
    "id": "cycle_svc_18",
    "workspaceId": "ws_nexus",
    "name": "Services Sprint 18",
    "startDate": "2026-10-01",
    "endDate": "2026-10-14",
    "status": "ACTIVE",
    "teamId": "team_svc",
    "description": "Pricing engine caching, promotional rule evaluation, and stock reservation."
  },
  {
    "id": "cycle_pay_12",
    "workspaceId": "ws_nexus",
    "name": "Payments Sprint 12",
    "startDate": "2026-10-01",
    "endDate": "2026-10-14",
    "status": "ACTIVE",
    "teamId": "team_pay",
    "description": "Stripe webhook replay protection, Apple Pay tokens, and chargeback webhooks."
  },
  {
    "id": "cycle_inf_09",
    "workspaceId": "ws_nexus",
    "name": "Infra Sprint 09",
    "startDate": "2026-10-01",
    "endDate": "2026-10-14",
    "status": "ACTIVE",
    "teamId": "team_inf",
    "description": "PostgreSQL read pool tuning, Redis cluster failover, and OTel span sampling."
  },
  {
    "id": "cycle_qe_08",
    "workspaceId": "ws_nexus",
    "name": "QE Sprint 08",
    "startDate": "2026-10-01",
    "endDate": "2026-10-14",
    "status": "ACTIVE",
    "teamId": "team_qe",
    "description": "Playwright synthetic checkout smoke runs, high-concurrency k6 load tests."
  }
];
