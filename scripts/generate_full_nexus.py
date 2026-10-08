#!/usr/bin/env python3
"""
NEXUS Enterprise Dataset Generator
Generates all 300 issues, 182 dependencies, 430 comments, and 675 activity events.
Validates all domain invariants and writes out TypeScript modules.
"""

import json
import os
import sys

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/data/nexus'))
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Import base data from previous file
from generate_nexus_dataset import TEAMS, PROJECT, USERS, CYCLES, MILESTONES

# 13 Workstream specifications: total 300 issues
WORKSTREAMS = [
    {
        "name": "Identity, accounts and permissions",
        "teamId": "team_cp",
        "milestoneId": "ms_arch",
        "range": (1, 22),
    },
    {
        "name": "Product catalog and merchandising",
        "teamId": "team_svc",
        "milestoneId": "ms_catalog",
        "range": (23, 46),
    },
    {
        "name": "Search and discovery",
        "teamId": "team_svc",
        "milestoneId": "ms_search",
        "range": (47, 68),
    },
    {
        "name": "Cart and checkout",
        "teamId": "team_svc",
        "milestoneId": "ms_checkout",
        "range": (69, 92),
    },
    {
        "name": "Payments and refunds",
        "teamId": "team_pay",
        "milestoneId": "ms_payments",
        "range": (93, 118),
    },
    {
        "name": "Orders and returns",
        "teamId": "team_svc",
        "milestoneId": "ms_fulfillment",
        "range": (119, 142),
    },
    {
        "name": "Inventory and warehouse synchronization",
        "teamId": "team_svc",
        "milestoneId": "ms_fulfillment",
        "range": (143, 166),
    },
    {
        "name": "Shipping and fulfillment",
        "teamId": "team_svc",
        "milestoneId": "ms_fulfillment",
        "range": (167, 188),
    },
    {
        "name": "Customer notifications",
        "teamId": "team_cp",
        "milestoneId": "ms_checkout",
        "range": (189, 210),
    },
    {
        "name": "Merchant administration",
        "teamId": "team_cp",
        "milestoneId": "ms_pilot",
        "range": (211, 234),
    },
    {
        "name": "Security and compliance engineering",
        "teamId": "team_pay",
        "milestoneId": "ms_payments",
        "range": (235, 256),
    },
    {
        "name": "Infrastructure, observability and disaster recovery",
        "teamId": "team_inf",
        "milestoneId": "ms_reliability",
        "range": (257, 278),
    },
    {
        "name": "Automated testing and launch readiness",
        "teamId": "team_qe",
        "milestoneId": "ms_rc",
        "range": (279, 300),
    },
]

print("Building 300 issues with authentic domain metadata...")
