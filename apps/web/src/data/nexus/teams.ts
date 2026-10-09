/**
 * NEXUS Enterprise Fixtures: NEXUS_TEAMS
 */
import { Team } from '../../types';

export const NEXUS_TEAMS: Team[] = [
  {
    "id": "team_cp",
    "workspaceId": "ws_nexus",
    "name": "Commerce Platform",
    "key": "CP",
    "color": "#4f46e5",
    "description": "Core project architecture, event mesh, API gateways, and integration orchestration."
  },
  {
    "id": "team_sfx",
    "workspaceId": "ws_nexus",
    "name": "Storefront Experience",
    "key": "SFX",
    "color": "#0284c7",
    "description": "Next-gen customer web applications, merchandising components, and edge rendering."
  },
  {
    "id": "team_svc",
    "workspaceId": "ws_nexus",
    "name": "Commerce Services",
    "key": "SVC",
    "color": "#059669",
    "description": "Distributed catalog service, cart calculation engine, orders, and returns workflows."
  },
  {
    "id": "team_pay",
    "workspaceId": "ws_nexus",
    "name": "Payments & Risk",
    "key": "PAY",
    "color": "#d97706",
    "description": "Payment gateway integrations, 3DS authentication, fraud scoring, and settlements."
  },
  {
    "id": "team_inf",
    "workspaceId": "ws_nexus",
    "name": "Infrastructure & Reliability",
    "key": "INF",
    "color": "#e11d48",
    "description": "Kubernetes orchestration, multi-region replication, observability, and disaster recovery."
  },
  {
    "id": "team_qe",
    "workspaceId": "ws_nexus",
    "name": "Quality Engineering",
    "key": "QE",
    "color": "#7c3aed",
    "description": "End-to-end automation, regression test matrices, chaos testing, and release qualification."
  }
];
