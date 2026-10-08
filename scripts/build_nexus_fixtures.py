#!/usr/bin/env python3
"""
NEXUS Omnichannel Commerce Platform — Enterprise Fixture Generator
Generates full TypeScript modules into src/data/nexus/
"""

import os
import json

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/data/nexus'))
os.makedirs(OUT_DIR, exist_ok=True)

# 1. TEAMS (6)
TEAMS = [
    {
        "id": "team_cp",
        "workspaceId": "ws_nexus",
        "name": "Commerce Platform",
        "key": "CP",
        "color": "#4f46e5",
        "description": "Core project architecture, event mesh, API gateways, and integration orchestration.",
    },
    {
        "id": "team_sfx",
        "workspaceId": "ws_nexus",
        "name": "Storefront Experience",
        "key": "SFX",
        "color": "#0284c7",
        "description": "Next-gen customer web applications, merchandising components, and edge rendering.",
    },
    {
        "id": "team_svc",
        "workspaceId": "ws_nexus",
        "name": "Commerce Services",
        "key": "SVC",
        "color": "#059669",
        "description": "Distributed catalog service, cart calculation engine, orders, and returns workflows.",
    },
    {
        "id": "team_pay",
        "workspaceId": "ws_nexus",
        "name": "Payments & Risk",
        "key": "PAY",
        "color": "#d97706",
        "description": "Payment gateway integrations, 3DS authentication, fraud scoring, and settlements.",
    },
    {
        "id": "team_inf",
        "workspaceId": "ws_nexus",
        "name": "Infrastructure & Reliability",
        "key": "INF",
        "color": "#e11d48",
        "description": "Kubernetes orchestration, multi-region replication, observability, and disaster recovery.",
    },
    {
        "id": "team_qe",
        "workspaceId": "ws_nexus",
        "name": "Quality Engineering",
        "key": "QE",
        "color": "#7c3aed",
        "description": "End-to-end automation, regression test matrices, chaos testing, and release qualification.",
    },
]

# 2. FLAGSHIP PROJECT
PROJECT = {
    "id": "proj_nexus",
    "workspaceId": "ws_nexus",
    "teamId": "team_cp",
    "name": "NEXUS — Omnichannel Commerce Platform",
    "key": "NEX",
    "description": "Enterprise omnichannel commerce platform uniting digital storefronts, distributed order orchestration, global checkout, payment processing, and inventory synchronization.",
    "currentSequence": 300,
}

# 3. 35 USERS
USERS = [
    {"id": "usr_alex", "name": "Alex Rivera", "email": "alex@unblok.dev", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_cp", "team_sfx"], "teamId": "team_cp"},
    {"id": "usr_sarah", "name": "Sarah Chen", "email": "sarah@unblok.dev", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80", "role": "ADMIN", "teamIds": ["team_cp", "team_svc"], "teamId": "team_cp"},
    {"id": "usr_marcus", "name": "Marcus Vance", "email": "marcus@unblok.dev", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_sfx"], "teamId": "team_sfx"},
    {"id": "usr_elena", "name": "Elena Rostova", "email": "elena@unblok.dev", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_inf", "team_cp"], "teamId": "team_inf"},
    {"id": "usr_david", "name": "David Kim", "email": "david.kim@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_svc"], "teamId": "team_svc"},
    {"id": "usr_priya", "name": "Priya Sharma", "email": "priya.sharma@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_pay"], "teamId": "team_pay"},
    {"id": "usr_liam", "name": "Liam O'Connor", "email": "liam.oconnor@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_inf"], "teamId": "team_inf"},
    {"id": "usr_aisha", "name": "Aisha Patel", "email": "aisha.patel@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_qe"], "teamId": "team_qe"},
    {"id": "usr_carlos", "name": "Carlos Mendez", "email": "carlos.mendez@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_svc"], "teamId": "team_svc"},
    {"id": "usr_chloe", "name": "Chloe Dubois", "email": "chloe.dubois@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_sfx"], "teamId": "team_sfx"},
    {"id": "usr_vikram", "name": "Vikram Malhotra", "email": "vikram.malhotra@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_pay", "team_inf"], "teamId": "team_pay"},
    {"id": "usr_hannah", "name": "Hannah Schmidt", "email": "hannah.schmidt@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_qe"], "teamId": "team_qe"},
    {"id": "usr_tariq", "name": "Tariq Al-Mansoor", "email": "tariq.mansoor@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_cp"], "teamId": "team_cp"},
    {"id": "usr_maya", "name": "Maya Lin", "email": "maya.lin@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_sfx"], "teamId": "team_sfx"},
    {"id": "usr_andre", "name": "Andre Silva", "email": "andre.silva@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_inf"], "teamId": "team_inf"},
    {"id": "usr_zoe", "name": "Zoe Washington", "email": "zoe.washington@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_svc"], "teamId": "team_svc"},
    {"id": "usr_felix", "name": "Felix Weber", "email": "felix.weber@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_pay"], "teamId": "team_pay"},
    {"id": "usr_devon", "name": "Devon Brooks", "email": "devon.brooks@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_qe"], "teamId": "team_qe"},
    {"id": "usr_amara", "name": "Amara Okafor", "email": "amara.okafor@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_inf"], "teamId": "team_inf"},
    {"id": "usr_jordan", "name": "Jordan Taylor", "email": "jordan.taylor@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_sfx"], "teamId": "team_sfx"},
    {"id": "usr_samira", "name": "Samira Khan", "email": "samira.khan@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_svc"], "teamId": "team_svc"},
    {"id": "usr_nathan", "name": "Nathan Drake", "email": "nathan.drake@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_cp"], "teamId": "team_cp"},
    {"id": "usr_kevin", "name": "Kevin Zhao", "email": "kevin.zhao@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_pay"], "teamId": "team_pay"},
    {"id": "usr_sofia", "name": "Sofia Rossi", "email": "sofia.rossi@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_sfx"], "teamId": "team_sfx"},
    {"id": "usr_rachel", "name": "Rachel Foster", "email": "rachel.foster@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80", "role": "ADMIN", "teamIds": ["team_cp", "team_pay"], "teamId": "team_cp"},
    {"id": "usr_tomas", "name": "Tomas Novak", "email": "tomas.novak@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_inf"], "teamId": "team_inf"},
    {"id": "usr_lucas", "name": "Lucas Moreau", "email": "lucas.moreau@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_qe"], "teamId": "team_qe"},
    {"id": "usr_nadia", "name": "Nadia Popova", "email": "nadia.popova@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_svc"], "teamId": "team_svc"},
    {"id": "usr_diego", "name": "Diego Morales", "email": "diego.morales@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_svc"], "teamId": "team_svc"},
    {"id": "usr_yuki", "name": "Yuki Tanaka", "email": "yuki.tanaka@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_sfx"], "teamId": "team_sfx"},
    {"id": "usr_owen", "name": "Owen Wright", "email": "owen.wright@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_pay"], "teamId": "team_pay"},
    {"id": "usr_fatima", "name": "Fatima Zahra", "email": "fatima.zahra@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_inf"], "teamId": "team_inf"},
    {"id": "usr_brendan", "name": "Brendan Clark", "email": "brendan.clark@nexus.commerce", "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80", "role": "MEMBER", "teamIds": ["team_qe"], "teamId": "team_qe"},
    {"id": "usr_miriam", "name": "Miriam Vance", "email": "miriam.vance@audit.security.io", "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80", "role": "OBSERVER", "teamIds": ["team_pay"], "teamId": "team_pay"},
    {"id": "usr_artur", "name": "Artur Hansen", "email": "artur.hansen@compliance.eu", "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80", "role": "OBSERVER", "teamIds": ["team_cp"], "teamId": "team_cp"},
]

# 4. CYCLES (12)
CYCLES = [
    {"id": "cycle_cp_21", "workspaceId": "ws_nexus", "name": "Cycle 21 — Architecture & Core RFCs", "startDate": "2026-08-03", "endDate": "2026-08-16", "status": "COMPLETED", "teamId": "team_cp", "description": "Foundational API gateway contracts, event bus design, and distributed tracing spikes."},
    {"id": "cycle_cp_22", "workspaceId": "ws_nexus", "name": "Cycle 22 — Data Contracts & Service Mesh", "startDate": "2026-08-17", "endDate": "2026-08-30", "status": "COMPLETED", "teamId": "team_cp", "description": "gRPC schema validation, Envoy proxy rollout, and multi-tenant schema isolation."},
    {"id": "cycle_cp_23", "workspaceId": "ws_nexus", "name": "Cycle 23 — Event Mesh & Catalog Sync", "startDate": "2026-08-31", "endDate": "2026-09-13", "status": "COMPLETED", "teamId": "team_cp", "description": "Kafka event streaming, Change Data Capture (CDC) pipelines, and catalog indexing."},
    {"id": "cycle_cp_24", "workspaceId": "ws_nexus", "name": "Cycle 24 — Unified Checkout & Core Services", "startDate": "2026-09-14", "endDate": "2026-09-27", "status": "COMPLETED", "teamId": "team_cp", "description": "Cart calculation idempotency, reservation expiration timers, and inventory locking."},
    {"id": "cycle_cp_25", "workspaceId": "ws_nexus", "name": "Cycle 25 — Payments Integration & Hardening", "startDate": "2026-09-28", "endDate": "2026-10-11", "status": "ACTIVE", "teamId": "team_cp", "description": "Multi-gateway fallback, 3DS authentication challenge modal, and production readiness triage."},
    {"id": "cycle_cp_26", "workspaceId": "ws_nexus", "name": "Cycle 26 — Release Candidate Qualification", "startDate": "2026-10-12", "endDate": "2026-10-25", "status": "UPCOMING", "teamId": "team_cp", "description": "Final regression sign-offs, disaster recovery drills, and performance benchmark suites."},
    {"id": "cycle_cp_27", "workspaceId": "ws_nexus", "name": "Cycle 27 — Pilot Launch & Observability", "startDate": "2026-10-26", "endDate": "2026-11-08", "status": "UPCOMING", "teamId": "team_cp", "description": "Merchant canary deployments, synthetic traffic ramps, and real-time ledger audits."},
    {"id": "cycle_sfx_14", "workspaceId": "ws_nexus", "name": "Storefront Sprint 14", "startDate": "2026-10-01", "endDate": "2026-10-14", "status": "ACTIVE", "teamId": "team_sfx", "description": "Customer checkout UI polish, cart drawer animations, and mobile web audit."},
    {"id": "cycle_svc_18", "workspaceId": "ws_nexus", "name": "Services Sprint 18", "startDate": "2026-10-01", "endDate": "2026-10-14", "status": "ACTIVE", "teamId": "team_svc", "description": "Pricing engine caching, promotional rule evaluation, and stock reservation."},
    {"id": "cycle_pay_12", "workspaceId": "ws_nexus", "name": "Payments Sprint 12", "startDate": "2026-10-01", "endDate": "2026-10-14", "status": "ACTIVE", "teamId": "team_pay", "description": "Stripe webhook replay protection, Apple Pay tokens, and chargeback webhooks."},
    {"id": "cycle_inf_09", "workspaceId": "ws_nexus", "name": "Infra Sprint 09", "startDate": "2026-10-01", "endDate": "2026-10-14", "status": "ACTIVE", "teamId": "team_inf", "description": "PostgreSQL read pool tuning, Redis cluster failover, and OTel span sampling."},
    {"id": "cycle_qe_08", "workspaceId": "ws_nexus", "name": "QE Sprint 08", "startDate": "2026-10-01", "endDate": "2026-10-14", "status": "ACTIVE", "teamId": "team_qe", "description": "Playwright synthetic checkout smoke runs, high-concurrency k6 load tests."},
]

# 5. 10 MILESTONES
MILESTONES = [
    {"id": "ms_arch", "workspaceId": "ws_nexus", "name": "M1: Omnichannel Architecture & Identity Specs", "targetDate": "2026-08-25", "description": "Stateless session tokens, distributed claims validation, and service-to-service mTLS.", "teamId": "team_cp"},
    {"id": "ms_catalog", "workspaceId": "ws_nexus", "name": "M2: Product Catalog & Distributed Merchandising", "targetDate": "2026-09-10", "description": "Hierarchical product taxonomies, dynamic variant matrices, and localized asset delivery.", "teamId": "team_svc"},
    {"id": "ms_search", "workspaceId": "ws_nexus", "name": "M3: Search Indexing & Inventory Synchronization", "targetDate": "2026-09-24", "description": "Elasticsearch product indices, faceted query pipeline, and real-time stock sync.", "teamId": "team_svc"},
    {"id": "ms_checkout", "workspaceId": "ws_nexus", "name": "M4: Unified Cart & Multi-Step Checkout Flow", "targetDate": "2026-10-05", "description": "Optimistic cart mutations, address verification service, and coupon engine.", "teamId": "team_svc"},
    {"id": "ms_payments", "workspaceId": "ws_nexus", "name": "M5: Global Payment Gateway & Fraud Orchestration", "targetDate": "2026-10-15", "description": "Tokenized credit card vault, risk scoring rules, 3DS challenges, and settlement pipelines.", "teamId": "team_pay"},
    {"id": "ms_fulfillment", "workspaceId": "ws_nexus", "name": "M6: Distributed Order Routing & Warehouse Sync", "targetDate": "2026-10-22", "description": "Multi-node warehouse allocation, split-shipment calculation, and carrier tracking webhooks.", "teamId": "team_svc"},
    {"id": "ms_reliability", "workspaceId": "ws_nexus", "name": "M7: Zero-Downtime DR & Multi-Region Failover", "targetDate": "2026-10-31", "description": "Cross-region PostgreSQL standby replication, warm Redis caches, and Cloudflare failover.", "teamId": "team_inf"},
    {"id": "ms_rc", "workspaceId": "ws_nexus", "name": "M8: Release Candidate 1.0 Qualification", "targetDate": "2026-11-10", "description": "End-to-end regression sign-off across web, mobile, and merchant backoffice channels.", "teamId": "team_qe"},
    {"id": "ms_pilot", "workspaceId": "ws_nexus", "name": "M9: Staged Merchant Pilot Deployment", "targetDate": "2026-11-25", "description": "Canary launch for top 25 flagship merchants with strict latency SLA thresholds.", "teamId": "team_cp"},
    {"id": "ms_ga", "workspaceId": "ws_nexus", "name": "M10: Omnichannel General Availability (GA)", "targetDate": "2026-12-15", "description": "Full public rollout, global CDN edge routing, and round-the-clock enterprise support.", "teamId": "team_cp"},
]

print("Base entities ready. Building issue definitions...")
