/**
 * NEXUS Commerce demo dependencies — marketing-friendly sparse graph.
 * Intentionally preserves the five active blocker examples and a smaller selection
 * of historical/resolved chains. Full synthetic graph must not seed runtime UI.
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
    "id": "dep_nex_3",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_1",
    "downstreamIssueId": "iss_nex_6",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_4",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_2",
    "downstreamIssueId": "iss_nex_7",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_5",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_5",
    "downstreamIssueId": "iss_nex_7",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_6",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_1",
    "downstreamIssueId": "iss_nex_10",
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
    "id": "dep_nex_8",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_7",
    "downstreamIssueId": "iss_nex_13",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_9",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_7",
    "downstreamIssueId": "iss_nex_14",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_10",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_2",
    "downstreamIssueId": "iss_nex_15",
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
    "id": "dep_nex_12",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_2",
    "downstreamIssueId": "iss_nex_21",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_15",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_1",
    "downstreamIssueId": "iss_nex_93",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_20",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_24",
    "downstreamIssueId": "iss_nex_27",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_25",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_23",
    "downstreamIssueId": "iss_nex_33",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_30",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_24",
    "downstreamIssueId": "iss_nex_43",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_35",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_47",
    "downstreamIssueId": "iss_nex_51",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_40",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_48",
    "downstreamIssueId": "iss_nex_59",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_45",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_70",
    "downstreamIssueId": "iss_nex_71",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_50",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_74",
    "downstreamIssueId": "iss_nex_75",
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
    "id": "dep_nex_60",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_70",
    "downstreamIssueId": "iss_nex_86",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_65",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_69",
    "downstreamIssueId": "iss_nex_93",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_70",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_93",
    "downstreamIssueId": "iss_nex_96",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_75",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_93",
    "downstreamIssueId": "iss_nex_101",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_80",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_93",
    "downstreamIssueId": "iss_nex_105",
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
    "id": "dep_nex_85",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_94",
    "downstreamIssueId": "iss_nex_110",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_90",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_98",
    "downstreamIssueId": "iss_nex_116",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_95",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_93",
    "downstreamIssueId": "iss_nex_279",
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
    "id": "dep_nex_110",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_119",
    "downstreamIssueId": "iss_nex_134",
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
  },
  {
    "id": "dep_nex_135",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_143",
    "downstreamIssueId": "iss_nex_160",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  },
  {
    "id": "dep_nex_140",
    "workspaceId": "ws_nexus",
    "upstreamIssueId": "iss_nex_167",
    "downstreamIssueId": "iss_nex_169",
    "createdAt": "2026-09-15T10:00:00.000Z",
    "createdBy": "usr_alex"
  }
];
