/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Distinct Multi-Workspace Prototype Data
 * Section 39: Three distinct workspaces with meaningfully different data.
 * - Workspace A (ws_acme): Established, multi-team, platform eng & web
 * - Workspace B (ws_apex): Robotics autonomy, LiDAR hardware, distinct cycles & issues
 * - Workspace C (ws_northstar): Quantum research, sparse observer dataset
 */

import {
  Team,
  Project,
  Issue,
  Dependency,
  Cycle,
  Milestone,
  ActivityEvent,
  IssueComment,
} from '../../../types';
import {
  INITIAL_TEAMS,
  INITIAL_PROJECTS,
  INITIAL_ISSUES,
  INITIAL_DEPENDENCIES,
  INITIAL_CYCLES,
  INITIAL_MILESTONES,
  INITIAL_ACTIVITIES,
  INITIAL_COMMENTS,
} from '../../../data/mockData';

// 1. Tag all existing Acme data with ws_acme
export const ACME_TEAMS: Team[] = INITIAL_TEAMS.map((t) => ({
  ...t,
  workspaceId: 'ws_acme',
}));

export const ACME_PROJECTS: Project[] = INITIAL_PROJECTS.map((p) => ({
  ...p,
  workspaceId: 'ws_acme',
}));

export const ACME_ISSUES: Issue[] = INITIAL_ISSUES.map((i) => ({
  ...i,
  workspaceId: 'ws_acme',
}));

export const ACME_DEPENDENCIES: Dependency[] = INITIAL_DEPENDENCIES.map((d) => ({
  ...d,
  workspaceId: 'ws_acme',
}));

export const ACME_CYCLES: Cycle[] = INITIAL_CYCLES.map((c) => ({
  ...c,
  workspaceId: 'ws_acme',
}));

export const ACME_MILESTONES: Milestone[] = INITIAL_MILESTONES.map((m) => ({
  ...m,
  workspaceId: 'ws_acme',
}));

export const ACME_ACTIVITIES: ActivityEvent[] = INITIAL_ACTIVITIES.map((a) => ({
  ...a,
  workspaceId: 'ws_acme',
}));

export const ACME_COMMENTS: IssueComment[] = INITIAL_COMMENTS.map((c) => ({
  ...c,
  workspaceId: 'ws_acme',
}));

// 2. Workspace B (ws_apex) — Apex Robotics
export const APEX_TEAMS: Team[] = [
  {
    id: 'team_apex_auto',
    workspaceId: 'ws_apex',
    name: 'Autonomy Systems',
    key: 'AUTO',
    color: '#0ea5e9',
    description: 'Trajectory planning, SLAM localization, and behavior trees.',
  },
  {
    id: 'team_apex_hw',
    workspaceId: 'ws_apex',
    name: 'Sensors & Hardware',
    key: 'HW',
    color: '#f59e0b',
    description: 'LiDAR drivers, camera calibration, embedded RTOS, and CAN bus.',
  },
];

export const APEX_PROJECTS: Project[] = [
  {
    id: 'proj_apex_nav',
    workspaceId: 'ws_apex',
    teamId: 'team_apex_auto',
    name: 'Autonomous Navigation Stack',
    key: 'NAV',
    description: 'ROS 2 Nav2 controller plugins and hybrid A* path planning.',
    currentSequence: 3,
  },
  {
    id: 'proj_apex_lidar',
    workspaceId: 'ws_apex',
    teamId: 'team_apex_hw',
    name: 'LiDAR Perception Pipeline',
    key: 'LIDAR',
    description: 'GPU point cloud clustering, ground plane extraction, and tracking.',
    currentSequence: 3,
  },
];

export const APEX_CYCLES: Cycle[] = [
  {
    id: 'cycle_apex_14',
    workspaceId: 'ws_apex',
    name: 'Sprint 14: Hardware-in-the-Loop',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    status: 'ACTIVE',
    teamId: 'team_apex_auto',
    description: 'Validate RTK GPS handover under GPS-denied tunnel scenarios.',
  },
  {
    id: 'cycle_apex_15',
    workspaceId: 'ws_apex',
    name: 'Sprint 15: Night Field Trials',
    startDate: '2026-10-15',
    endDate: '2026-10-28',
    status: 'UPCOMING',
    teamId: 'team_apex_auto',
    description: 'Low-light camera fusion and thermal obstacle benchmarks.',
  },
];

export const APEX_MILESTONES: Milestone[] = [
  {
    id: 'milestone_apex_1',
    workspaceId: 'ws_apex',
    name: 'Alpha Autonomous Delivery Flight',
    targetDate: '2026-11-01',
    description: 'Autonomous waypoint navigation across 5km desert testing facility.',
    teamId: 'team_apex_auto',
  },
];

export const APEX_ISSUES: Issue[] = [
  {
    id: 'iss_apex_1',
    workspaceId: 'ws_apex',
    key: 'NAV-1',
    projectId: 'proj_apex_nav',
    teamId: 'team_apex_auto',
    cycleId: 'cycle_apex_14',
    milestoneId: 'milestone_apex_1',
    startDate: '2026-10-02',
    dueDate: '2026-10-08',
    title: 'Implement EKF localization node with RTK GPS correction',
    description: 'Fuse wheel odometry with dual-antenna GNSS heading at 50Hz.',
    state: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'usr_alex',
    creatorId: 'usr_alex',
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
    version: 1,
  },
  {
    id: 'iss_apex_2',
    workspaceId: 'ws_apex',
    key: 'NAV-2',
    projectId: 'proj_apex_nav',
    teamId: 'team_apex_auto',
    cycleId: 'cycle_apex_14',
    milestoneId: 'milestone_apex_1',
    startDate: '2026-10-09',
    dueDate: '2026-10-13',
    title: 'Calibrate IMU extrinsics matrix on chassis frame',
    description: 'Measure rotational offsets using hand-eye calibration Ceres solver.',
    state: 'TODO',
    priority: 'MEDIUM',
    assigneeId: 'usr_alex',
    creatorId: 'usr_alex',
    createdAt: '2026-10-02T09:00:00.000Z',
    updatedAt: '2026-10-02T09:00:00.000Z',
    version: 1,
  },
  {
    id: 'iss_apex_3',
    workspaceId: 'ws_apex',
    key: 'LIDAR-1',
    projectId: 'proj_apex_lidar',
    teamId: 'team_apex_hw',
    cycleId: 'cycle_apex_14',
    milestoneId: 'milestone_apex_1',
    startDate: '2026-10-01',
    dueDate: '2026-10-04',
    title: 'Ouster OS1-32 UDP packet parser driver',
    description: 'Zero-copy ring buffer parsing raw azimuth & range packets.',
    state: 'DONE',
    priority: 'URGENT',
    assigneeId: 'usr_elena',
    creatorId: 'usr_alex',
    createdAt: '2026-10-01T11:00:00.000Z',
    updatedAt: '2026-10-04T16:00:00.000Z',
    version: 2,
  },
  {
    id: 'iss_apex_4',
    workspaceId: 'ws_apex',
    key: 'LIDAR-2',
    projectId: 'proj_apex_lidar',
    teamId: 'team_apex_hw',
    cycleId: 'cycle_apex_14',
    milestoneId: 'milestone_apex_1',
    startDate: '2026-10-05',
    dueDate: '2026-10-12',
    title: 'Dynamic obstacle clustering and bounding box filter',
    description: 'CUDA Euclidean cluster extraction with min 10 points threshold.',
    state: 'IN_REVIEW',
    priority: 'HIGH',
    assigneeId: 'usr_elena',
    creatorId: 'usr_alex',
    createdAt: '2026-10-02T13:00:00.000Z',
    updatedAt: '2026-10-06T15:30:00.000Z',
    version: 2,
  },
];

export const APEX_DEPENDENCIES: Dependency[] = [
  // LIDAR-1 (Driver DONE) BLOCKS LIDAR-2 (Clustering)
  {
    id: 'dep_apex_1',
    workspaceId: 'ws_apex',
    upstreamIssueId: 'iss_apex_3',
    downstreamIssueId: 'iss_apex_4',
    createdAt: '2026-10-02T14:00:00.000Z',
    createdBy: 'usr_alex',
  },
  // NAV-1 (Localization) BLOCKS NAV-2 (IMU Extrinsics Calibration)
  {
    id: 'dep_apex_2',
    workspaceId: 'ws_apex',
    upstreamIssueId: 'iss_apex_1',
    downstreamIssueId: 'iss_apex_2',
    createdAt: '2026-10-03T10:00:00.000Z',
    createdBy: 'usr_alex',
  },
];

export const APEX_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act_apex_1',
    workspaceId: 'ws_apex',
    issueId: 'iss_apex_3',
    eventType: 'STATE_CHANGED',
    userId: 'usr_elena',
    userName: 'Elena Rostova',
    timestamp: '2026-10-04T16:00:00.000Z',
    details: { from: 'IN_PROGRESS', to: 'DONE' },
  },
  {
    id: 'act_apex_2',
    workspaceId: 'ws_apex',
    issueId: 'iss_apex_1',
    eventType: 'ISSUE_CREATED',
    userId: 'usr_alex',
    userName: 'Alex Rivera',
    timestamp: '2026-10-02T08:00:00.000Z',
    details: { to: 'IN_PROGRESS' },
  },
];

export const APEX_COMMENTS: IssueComment[] = [
  {
    id: 'comm_apex_1',
    workspaceId: 'ws_apex',
    issueId: 'iss_apex_1',
    authorId: 'usr_alex',
    authorName: 'Alex Rivera',
    content: 'RTK NTRIP caster mount point credentials verified with base station.',
    createdAt: '2026-10-03T11:00:00.000Z',
  },
];

// 3. Workspace C (ws_northstar) — Northstar Labs (Quantum Computing)
export const NORTHSTAR_TEAMS: Team[] = [
  {
    id: 'team_ns_quant',
    workspaceId: 'ws_northstar',
    name: 'Quantum Architecture',
    key: 'QUANT',
    color: '#8b5cf6',
    description: 'Qubit simulation, topological error correction codes, and compilers.',
  },
];

export const NORTHSTAR_PROJECTS: Project[] = [
  {
    id: 'proj_ns_sim',
    workspaceId: 'ws_northstar',
    teamId: 'team_ns_quant',
    name: 'Quantum Circuit Simulator',
    key: 'QSIM',
    description: 'Statevector emulator supporting 40 entangled qubits.',
    currentSequence: 2,
  },
];

export const NORTHSTAR_CYCLES: Cycle[] = [];

export const NORTHSTAR_MILESTONES: Milestone[] = [
  {
    id: 'milestone_ns_1',
    workspaceId: 'ws_northstar',
    name: '100-Qubit Circuit Emulation Benchmark',
    targetDate: '2026-12-15',
    description: 'Distributed Clifford+T matrix simulator running on GPU cluster.',
    teamId: 'team_ns_quant',
  },
];

export const NORTHSTAR_ISSUES: Issue[] = [
  {
    id: 'iss_ns_1',
    workspaceId: 'ws_northstar',
    key: 'QSIM-1',
    projectId: 'proj_ns_sim',
    teamId: 'team_ns_quant',
    milestoneId: 'milestone_ns_1',
    startDate: '2026-10-05',
    dueDate: '2026-10-20',
    title: 'Surface code error syndrome decoding lattice benchmark',
    description: 'Run minimum-weight perfect matching (MWPM) graph decoder on noisy syndrom data.',
    state: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'usr_sarah',
    creatorId: 'usr_sarah',
    createdAt: '2026-10-05T09:00:00.000Z',
    updatedAt: '2026-10-05T09:00:00.000Z',
    version: 1,
  },
];

export const NORTHSTAR_DEPENDENCIES: Dependency[] = [];
export const NORTHSTAR_ACTIVITIES: ActivityEvent[] = [];
export const NORTHSTAR_COMMENTS: IssueComment[] = [];

// Combined Initial Master Entities
export const MULTI_WORKSPACE_INITIAL_TEAMS: Team[] = [
  ...ACME_TEAMS,
  ...APEX_TEAMS,
  ...NORTHSTAR_TEAMS,
];

export const MULTI_WORKSPACE_INITIAL_PROJECTS: Project[] = [
  ...ACME_PROJECTS,
  ...APEX_PROJECTS,
  ...NORTHSTAR_PROJECTS,
];

export const MULTI_WORKSPACE_INITIAL_ISSUES: Issue[] = [
  ...ACME_ISSUES,
  ...APEX_ISSUES,
  ...NORTHSTAR_ISSUES,
];

export const MULTI_WORKSPACE_INITIAL_DEPENDENCIES: Dependency[] = [
  ...ACME_DEPENDENCIES,
  ...APEX_DEPENDENCIES,
  ...NORTHSTAR_DEPENDENCIES,
];

export const MULTI_WORKSPACE_INITIAL_CYCLES: Cycle[] = [
  ...ACME_CYCLES,
  ...APEX_CYCLES,
  ...NORTHSTAR_CYCLES,
];

export const MULTI_WORKSPACE_INITIAL_MILESTONES: Milestone[] = [
  ...ACME_MILESTONES,
  ...APEX_MILESTONES,
  ...NORTHSTAR_MILESTONES,
];

export const MULTI_WORKSPACE_INITIAL_ACTIVITIES: ActivityEvent[] = [
  ...ACME_ACTIVITIES,
  ...APEX_ACTIVITIES,
  ...NORTHSTAR_ACTIVITIES,
];

export const MULTI_WORKSPACE_INITIAL_COMMENTS: IssueComment[] = [
  ...ACME_COMMENTS,
  ...APEX_COMMENTS,
  ...NORTHSTAR_COMMENTS,
];
