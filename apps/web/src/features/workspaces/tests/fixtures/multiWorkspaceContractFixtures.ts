import type { Cycle, Dependency, Issue, Project, Team } from '../../../../types';
import {
  INITIAL_CYCLES,
  INITIAL_DEPENDENCIES,
  INITIAL_ISSUES,
  INITIAL_MILESTONES,
  INITIAL_PROJECTS,
  INITIAL_TEAMS,
} from '../../../../data/mockData';

const acmeTeams = INITIAL_TEAMS.map(team => ({ ...team, workspaceId: 'ws_acme' }));
const acmeProjects = INITIAL_PROJECTS.map(project => ({ ...project, workspaceId: 'ws_acme' }));
const acmeIssues = INITIAL_ISSUES.map(issue => ({ ...issue, workspaceId: 'ws_acme' }));
const acmeDependencies = INITIAL_DEPENDENCIES.map(edge => ({ ...edge, workspaceId: 'ws_acme' }));
const acmeCycles = INITIAL_CYCLES.map(cycle => ({ ...cycle, workspaceId: 'ws_acme' }));
const acmeMilestones = INITIAL_MILESTONES.map(milestone => ({ ...milestone, workspaceId: 'ws_acme' }));

const apexTeams: Team[] = [
  { id: 'team_apex_auto', workspaceId: 'ws_apex', name: 'Autonomy Systems', key: 'AUTO', color: '#0ea5e9', description: 'Trajectory planning, SLAM localization, and behavior trees.' },
  { id: 'team_apex_hw', workspaceId: 'ws_apex', name: 'Sensors & Hardware', key: 'HW', color: '#f59e0b', description: 'LiDAR drivers, camera calibration, embedded RTOS, and CAN bus.' },
];

const apexProjects: Project[] = [
  { id: 'proj_apex_nav', workspaceId: 'ws_apex', teamId: 'team_apex_auto', name: 'Autonomous Navigation Stack', key: 'NAV', description: 'ROS 2 Nav2 controller plugins and hybrid A* path planning.', currentSequence: 3 },
  { id: 'proj_apex_lidar', workspaceId: 'ws_apex', teamId: 'team_apex_hw', name: 'LiDAR Perception Pipeline', key: 'LIDAR', description: 'GPU point cloud clustering, ground plane extraction, and tracking.', currentSequence: 3 },
];

const apexIssues: Issue[] = [
  { id: 'iss_apex_1', workspaceId: 'ws_apex', key: 'NAV-1', projectId: 'proj_apex_nav', teamId: 'team_apex_auto', cycleId: 'cycle_apex_14', milestoneId: 'milestone_apex_1', startDate: '2026-10-02', dueDate: '2026-10-08', title: 'Implement EKF localization node with RTK GPS correction', description: 'Fuse wheel odometry with dual-antenna GNSS heading at 50Hz.', state: 'IN_PROGRESS', priority: 'HIGH', assigneeId: 'usr_alex', creatorId: 'usr_alex', createdAt: '2026-10-02T08:00:00.000Z', updatedAt: '2026-10-05T10:00:00.000Z', version: 1 },
  { id: 'iss_apex_2', workspaceId: 'ws_apex', key: 'NAV-2', projectId: 'proj_apex_nav', teamId: 'team_apex_auto', cycleId: 'cycle_apex_14', milestoneId: 'milestone_apex_1', startDate: '2026-10-09', dueDate: '2026-10-13', title: 'Calibrate IMU extrinsics matrix on chassis frame', description: 'Measure rotational offsets using hand-eye calibration Ceres solver.', state: 'TODO', priority: 'MEDIUM', assigneeId: 'usr_alex', creatorId: 'usr_alex', createdAt: '2026-10-02T09:00:00.000Z', updatedAt: '2026-10-02T09:00:00.000Z', version: 1 },
  { id: 'iss_apex_3', workspaceId: 'ws_apex', key: 'LIDAR-1', projectId: 'proj_apex_lidar', teamId: 'team_apex_hw', cycleId: 'cycle_apex_14', milestoneId: 'milestone_apex_1', startDate: '2026-10-01', dueDate: '2026-10-04', title: 'Ouster OS1-32 UDP packet parser driver', description: 'Zero-copy ring buffer parsing raw azimuth and range packets.', state: 'DONE', priority: 'URGENT', assigneeId: 'usr_elena', creatorId: 'usr_alex', createdAt: '2026-10-01T11:00:00.000Z', updatedAt: '2026-10-04T16:00:00.000Z', version: 2 },
  { id: 'iss_apex_4', workspaceId: 'ws_apex', key: 'LIDAR-2', projectId: 'proj_apex_lidar', teamId: 'team_apex_hw', cycleId: 'cycle_apex_14', milestoneId: 'milestone_apex_1', startDate: '2026-10-05', dueDate: '2026-10-12', title: 'Dynamic obstacle clustering and bounding box filter', description: 'CUDA Euclidean cluster extraction with a minimum 10-point threshold.', state: 'IN_REVIEW', priority: 'HIGH', assigneeId: 'usr_elena', creatorId: 'usr_alex', createdAt: '2026-10-02T13:00:00.000Z', updatedAt: '2026-10-06T15:30:00.000Z', version: 2 },
];

const apexDependencies: Dependency[] = [
  { id: 'dep_apex_1', workspaceId: 'ws_apex', upstreamIssueId: 'iss_apex_3', downstreamIssueId: 'iss_apex_4', createdAt: '2026-10-02T14:00:00.000Z', createdBy: 'usr_alex' },
  { id: 'dep_apex_2', workspaceId: 'ws_apex', upstreamIssueId: 'iss_apex_1', downstreamIssueId: 'iss_apex_2', createdAt: '2026-10-03T10:00:00.000Z', createdBy: 'usr_alex' },
];

const northstarTeams: Team[] = [
  { id: 'team_ns_quant', workspaceId: 'ws_northstar', name: 'Quantum Architecture', key: 'QUANT', color: '#8b5cf6', description: 'Qubit simulation, topological error correction codes, and compilers.' },
];

const northstarProjects: Project[] = [
  { id: 'proj_ns_sim', workspaceId: 'ws_northstar', teamId: 'team_ns_quant', name: 'Quantum Circuit Simulator', key: 'QSIM', description: 'Statevector emulator supporting 40 entangled qubits.', currentSequence: 2 },
];

const northstarIssues: Issue[] = [
  { id: 'iss_ns_1', workspaceId: 'ws_northstar', key: 'QSIM-1', projectId: 'proj_ns_sim', teamId: 'team_ns_quant', milestoneId: 'milestone_ns_1', startDate: '2026-10-05', dueDate: '2026-10-20', title: 'Surface code error syndrome decoding lattice benchmark', description: 'Run minimum-weight perfect matching graph decoder on noisy syndrome data.', state: 'IN_PROGRESS', priority: 'HIGH', assigneeId: 'usr_sarah', creatorId: 'usr_sarah', createdAt: '2026-10-05T09:00:00.000Z', updatedAt: '2026-10-05T09:00:00.000Z', version: 1 },
];

const apexCycles: Cycle[] = [
  { id: 'cycle_apex_14', workspaceId: 'ws_apex', name: 'Sprint 14: Hardware-in-the-Loop', startDate: '2026-10-01', endDate: '2026-10-14', status: 'ACTIVE', teamId: 'team_apex_auto', description: 'Validate RTK GPS handover under GPS-denied tunnel scenarios.' },
  { id: 'cycle_apex_15', workspaceId: 'ws_apex', name: 'Sprint 15: Night Field Trials', startDate: '2026-10-15', endDate: '2026-10-28', status: 'UPCOMING', teamId: 'team_apex_auto' },
];

export const MULTI_WORKSPACE_INITIAL_TEAMS: Team[] = [...acmeTeams, ...apexTeams, ...northstarTeams];
export const MULTI_WORKSPACE_INITIAL_PROJECTS: Project[] = [...acmeProjects, ...apexProjects, ...northstarProjects];
export const MULTI_WORKSPACE_INITIAL_ISSUES: Issue[] = [...acmeIssues, ...apexIssues, ...northstarIssues];
export const MULTI_WORKSPACE_INITIAL_DEPENDENCIES: Dependency[] = [...acmeDependencies, ...apexDependencies];
export const MULTI_WORKSPACE_INITIAL_CYCLES: Cycle[] = [...acmeCycles, ...apexCycles];
export const MULTI_WORKSPACE_INITIAL_MILESTONES = [
  ...INITIAL_MILESTONES.map(milestone => ({ ...milestone, workspaceId: 'ws_acme' })),
  { id: 'milestone_apex_1', workspaceId: 'ws_apex', name: 'Alpha Autonomous Delivery Flight', targetDate: '2026-11-01', description: 'Autonomous waypoint navigation across a 5km test facility.', teamId: 'team_apex_auto' },
  { id: 'milestone_ns_1', workspaceId: 'ws_northstar', name: '100-Qubit Circuit Emulation Benchmark', targetDate: '2026-12-15', description: 'Distributed Clifford+T matrix simulator running on a GPU cluster.', teamId: 'team_ns_quant' },
];
