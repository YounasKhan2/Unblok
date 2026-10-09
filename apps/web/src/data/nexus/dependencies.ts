/**
 * NEXUS Commerce — sparse, narrative-led dependency demo for marketing.
 * 15 directed edges: identity/security, checkout, payments, returns, orders,
 * inventory. Keep the canvas readable; performance optimizations are separate.
 */
import { Dependency } from '../../types';

export const NEXUS_DEPENDENCIES: Dependency[] = [
  {
    "id": "dep_nex_1",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_1",
    "downstreamIssueId": "iss_nex_2",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_2",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_2",
    "downstreamIssueId": "iss_nex_3",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_7",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_2",
    "downstreamIssueId": "iss_nex_12",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_11",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_12",
    "downstreamIssueId": "iss_nex_18",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_55",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_74",
    "downstreamIssueId": "iss_nex_79",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_57",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_82",
    "downstreamIssueId": "iss_nex_83",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_84",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_102",
    "downstreamIssueId": "iss_nex_109",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_100",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_119",
    "downstreamIssueId": "iss_nex_124",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_103",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_126",
    "downstreamIssueId": "iss_nex_127",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_105",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_119",
    "downstreamIssueId": "iss_nex_129",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_112",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_125",
    "downstreamIssueId": "iss_nex_136",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_115",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_119",
    "downstreamIssueId": "iss_nex_143",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_120",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_143",
    "downstreamIssueId": "iss_nex_145",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_125",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_144",
    "downstreamIssueId": "iss_nex_150",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_130",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_144",
    "downstreamIssueId": "iss_nex_155",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  }
];
