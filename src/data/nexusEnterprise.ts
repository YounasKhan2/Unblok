import type {
  ActivityEvent,
  Cycle,
  Dependency,
  Issue,
  IssueComment,
  Milestone,
  Project,
  Team,
  User,
} from '../types';

export const NEXUS_FIXTURE_VERSION = 'nexus-enterprise-v3';
export const NEXUS_WORKSPACE_ID = 'ws_nexus';
export const NEXUS_PROJECT_ID = 'proj_nexus';
export const NEXUS_OWNER_TEAM_ID = 'team_eng';
export const NEXUS_REFERENCE_DATE = '2026-10-08';

const referenceTime = Date.parse(`${NEXUS_REFERENCE_DATE}T00:00:00.000Z`);

function dateAt(offsetDays: number): string {
  return new Date(referenceTime + offsetDays * 24 * 60 * 60 * 1000).toISOString();
}

function dateOnly(offsetDays: number): string {
  return dateAt(offsetDays).slice(0, 10);
}

function offsetOf(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00.000Z`) - referenceTime) / (24 * 60 * 60 * 1000));
}

const teamDetails = [
  ['team_eng', 'CORE', 'Commerce Platform', '#6857cc'],
  ['team_web', 'WEB', 'Storefront Experience', '#0b9296'],
  ['team_services', 'SERV', 'Commerce Services', '#497ed1'],
  ['team_pay', 'PAY', 'Payments & Risk', '#d18638'],
  ['team_inf', 'INF', 'Infrastructure & Reliability', '#6b8891'],
  ['team_qa', 'QA', 'Quality Engineering', '#9b61b6'],
] as const;

export const INITIAL_TEAMS: Team[] = teamDetails.map(([id, key, name, color]) => ({
  id,
  workspaceId: NEXUS_WORKSPACE_ID,
  key,
  name,
  color,
  description: `${name} owns its functional delivery work and contributes to the NEXUS platform through shared contracts and release coordination.`,
}));

export const INITIAL_PROJECTS: Project[] = [{
  id: NEXUS_PROJECT_ID,
  workspaceId: NEXUS_WORKSPACE_ID,
  teamId: NEXUS_OWNER_TEAM_ID,
  name: 'NEXUS — Omnichannel Commerce Platform',
  key: 'NEX',
  description: 'Unify storefront, catalog, checkout, payments, orders, inventory, and fulfillment behind reliable commerce services.',
  currentSequence: 300,
}];

type StaffSeed = Pick<User, 'id' | 'name' | 'email'> & { teamIds: string[] };

const foundingStaff: StaffSeed[] = [
  { id: 'usr_sarah', name: 'Sarah Chen', email: 'sarah.chen@nexus.example', teamIds: ['team_eng', 'team_web'] },
  { id: 'usr_marcus', name: 'Marcus Vance', email: 'marcus.vance@nexus.example', teamIds: ['team_web'] },
  { id: 'usr_elena', name: 'Elena Rostova', email: 'elena.rostova@nexus.example', teamIds: ['team_inf', 'team_eng'] },
  { id: 'usr_david', name: 'David Kim', email: 'david.kim@nexus.example', teamIds: ['team_services'] },
  { id: 'usr_aisha', name: 'Aisha Patel', email: 'aisha.patel@nexus.example', teamIds: ['team_qa'] },
  { id: 'usr_alex', name: 'Alex Rivera', email: 'alex.rivera@nexus.example', teamIds: ['team_eng'] },
];

const additionalNames = [
  'Maya Brooks', 'Owen Park', 'Priya Shah', 'Noah Bennett', 'Leila Haddad',
  'Ethan Cole', 'Zoe Morgan', 'Amir Rahman', 'Isabel Torres', 'Hugo Martins',
  'Nina Kovac', 'Avery Chen', 'Hassan Malik', 'Sofia Alvarez', 'Luca Rossi',
  'Ivy Bennett', 'Ravi Nair', 'Mina Park', 'Omar Farouk', 'Eva Lind',
  'Theo Campbell', 'Amina Yusuf', 'Jonah Reed', 'Mei Tan', 'Felix Bauer',
  'Sara Ibrahim', 'Anika Rao', 'Daniel Ortiz', 'Yara Hassan',
];

const additionalStaff: StaffSeed[] = additionalNames.map((name, index) => {
  const teamId = teamDetails[index % teamDetails.length][0];
  const emailName = name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.+|\.+$/g, '');
  return {
    id: `usr_nex_${index + 1}`,
    name,
    email: `${emailName}@nexus.example`,
    teamIds: [teamId],
  };
});

export const INITIAL_USERS: User[] = [...foundingStaff, ...additionalStaff].map((user, index) => ({
  ...user,
  avatar: '',
  role: index === 0 ? 'ADMIN' : index === 4 ? 'OBSERVER' : 'MEMBER',
  teamId: user.teamIds[0],
}));

const cycleDefinitions = Array.from({ length: 12 }, (_, index) => {
  const startOffset = (index - 10) * 14 - 3;
  const status: Cycle['status'] = index < 10 ? 'COMPLETED' : index === 10 ? 'ACTIVE' : 'UPCOMING';
  const teamId = index < 10 ? teamDetails[index % teamDetails.length][0] : NEXUS_OWNER_TEAM_ID;
  const teamName = teamDetails.find(([id]) => id === teamId)?.[2] || 'Commerce Platform';
  return {
    id: `cycle_nex_${index + 1}`,
    workspaceId: NEXUS_WORKSPACE_ID,
    teamId,
    name: `NEXUS Cycle ${index + 1}`,
    startDate: dateOnly(startOffset),
    endDate: dateOnly(startOffset + 13),
    status,
    description: `${teamName} delivery cycle ${index + 1}: planned integration, reliability, and release work.`,
  };
});

export const INITIAL_CYCLES: Cycle[] = cycleDefinitions;

const milestoneDefinitions = [
  ['Architecture and domain contracts', -120],
  ['Identity and account foundations', -95],
  ['Catalog and merchandising readiness', -70],
  ['Search and discovery quality', -45],
  ['Cart and checkout integration', -20],
  ['Payment authorization and refunds', 0],
  ['Orders, inventory, and returns', 20],
  ['Merchant operations beta', 45],
  ['Operational readiness and release candidate', 70],
  ['Pilot launch and staged rollout', 95],
] as const;

export const INITIAL_MILESTONES: Milestone[] = milestoneDefinitions.map(([name, targetOffset], index) => ({
  id: `milestone_nex_${index + 1}`,
  workspaceId: NEXUS_WORKSPACE_ID,
  teamId: 'ALL',
  name: `M${index + 1}: ${name}`,
  targetDate: dateOnly(targetOffset),
  description: `Workspace delivery checkpoint for ${name.toLowerCase()}, evaluated from linked issue completion and dependency health.`,
}));

const workstreams = [
  { name: 'Identity', teamId: 'team_eng', topics: ['session revocation', 'account recovery', 'merchant permissions', 'token rotation', 'address permissions'] },
  { name: 'Catalog', teamId: 'team_services', topics: ['variant indexing', 'pricing rules', 'product import', 'media optimization', 'stock signals'] },
  { name: 'Search', teamId: 'team_web', topics: ['facet filtering', 'relevance ranking', 'autocomplete', 'synonyms', 'zero-result recovery'] },
  { name: 'Checkout', teamId: 'team_web', topics: ['cart merge', 'coupon validation', 'tax calculation', 'shipping selection', 'idempotent submission'] },
  { name: 'Payments', teamId: 'team_pay', topics: ['authorization retries', '3DS challenge', 'refund reconciliation', 'risk screening', 'ledger posting'] },
  { name: 'Orders', teamId: 'team_services', topics: ['order transitions', 'returns intake', 'split shipment', 'cancellation rules', 'history pagination'] },
  { name: 'Inventory', teamId: 'team_services', topics: ['stock reservation', 'warehouse routing', 'backorders', 'inventory delta', 'reconciliation'] },
  { name: 'Fulfillment', teamId: 'team_services', topics: ['carrier quotes', 'label purchase', 'tracking events', 'delivery exceptions', 'dispatch queues'] },
  { name: 'Merchant Admin', teamId: 'team_web', topics: ['role matrix', 'bulk editing', 'audit search', 'store configuration', 'fulfillment settings'] },
  { name: 'Notifications', teamId: 'team_services', topics: ['receipt delivery', 'SMS fallback', 'message deduplication', 'preference center', 'provider status'] },
  { name: 'Infrastructure', teamId: 'team_inf', topics: ['deploy gates', 'tracing', 'rate limiting', 'connection pooling', 'recovery rehearsal'] },
  { name: 'Security', teamId: 'team_inf', topics: ['PII boundaries', 'webhook signatures', 'retention controls', 'audit integrity', 'privilege testing'] },
  { name: 'Quality', teamId: 'team_qa', topics: ['contract tests', 'browser matrix', 'payment sandbox', 'load testing', 'release smoke'] },
] as const;

const workMethods = [
  'Define the service boundary and versioned request/response contract before wiring the owning workflow.',
  'Implement the processing path with bounded retries, idempotency, and an explicit recovery outcome.',
  'Add structured telemetry and an audit trail so operators can trace the workflow across services.',
  'Harden the edge cases around stale data, duplicate delivery, and partial downstream failure.',
  'Add contract and browser coverage for the success path, validation failures, and recovery behavior.',
] as const;

const issueStateForIndex = (index: number): Issue['state'] => {
  if (index < 105) return 'DONE';
  if (index < 120) return 'CANCELLED';
  if (index < 150) return 'IN_REVIEW';
  if (index < 200) return 'IN_PROGRESS';
  if (index < 245) return 'TODO';
  return 'BACKLOG';
};

const completedCyclesByTeam = new Map(
  INITIAL_TEAMS.map(team => [
    team.id,
    INITIAL_CYCLES.filter(cycle => cycle.status === 'COMPLETED' && cycle.teamId === team.id),
  ])
);
const completedCycle = (index: number, teamId: string): Cycle => {
  const teamCycles = completedCyclesByTeam.get(teamId) || [];
  return teamCycles[Math.floor(index / 12) % teamCycles.length];
};
const activeCycle = INITIAL_CYCLES[10];
const upcomingCycle = INITIAL_CYCLES[11];

export const INITIAL_ISSUES: Issue[] = Array.from({ length: 300 }, (_, index) => {
  const workstream = workstreams[index % workstreams.length];
  const teamId = workstream.teamId;
  const topic = workstream.topics[Math.floor(index / workstreams.length) % workstream.topics.length];
  const action = workMethods[Math.floor(index / 65) % workMethods.length];
  const state = issueStateForIndex(index);
  const cycle = index < 120
    ? completedCycle(index, teamId)
    : index < 200
      ? teamId === NEXUS_OWNER_TEAM_ID ? activeCycle : undefined
      : index < 245
        ? teamId === NEXUS_OWNER_TEAM_ID ? upcomingCycle : undefined
        : undefined;
  const scheduleCycle = cycle || (index < 200 ? activeCycle : index < 245 ? upcomingCycle : undefined);
  const cycleStartOffset = scheduleCycle ? offsetOf(scheduleCycle.startDate) : 0;
  const cycleEndOffset = scheduleCycle ? offsetOf(scheduleCycle.endDate) : 0;
  const createdOffset = index < 120
    ? Math.min(cycleStartOffset, -175 + (index % 155))
    : -Math.min(175, 40 + (index * 7) % 130);
  const updatedOffset = index < 120
    ? Math.min(cycleEndOffset, Math.max(createdOffset + 1, cycleStartOffset + 2 + (index % 10)))
    : state === 'IN_REVIEW' && index % 4 === 0
      ? Math.max(createdOffset + 1, -28 - (index % 14))
      : Math.max(createdOffset + 1, -(index % 8));
  const milestone = index % 17 === 0 ? undefined : INITIAL_MILESTONES[Math.floor(index / 30)];
  const scheduleStartOffset = index < 120
    ? cycleStartOffset
    : index < 245
      ? index < 200 && index % 9 === 0
        ? -5 + (index % 3)
        : cycleStartOffset + (index % 7)
      : 21 + (index % 35);
  const scheduleEndOffset = index < 120
    ? cycleEndOffset
    : index < 245
      ? index < 200 && index % 9 === 0
        ? -1 - (index % 3)
        : Math.min(cycleEndOffset, scheduleStartOffset + 3 + (index % 5))
      : scheduleStartOffset + 5 + (index % 6);
  const assignee = index % 12 === 0 ? undefined : INITIAL_USERS[(index * 13 + 3) % INITIAL_USERS.length];
  const creator = INITIAL_USERS[(index * 11 + 5) % INITIAL_USERS.length];

  return {
    id: `iss_nex_${index + 1}`,
    workspaceId: NEXUS_WORKSPACE_ID,
    key: `NEX-${index + 1}`,
    projectId: NEXUS_PROJECT_ID,
    teamId,
    title: `${workMethods[Math.floor(index / 65) % workMethods.length].split(' ')[0]} ${topic} — ${workstream.name}`,
    description: [
      `## Delivery context`,
      `The NEXUS ${workstream.name} workstream owns ${topic}. This change must integrate with the shared commerce project without leaking workspace data or creating duplicate downstream effects.`,
      '',
      `## Implementation`,
      action,
      `Coordinate the interface with Commerce Platform and the ${workstream.name} service owners.`,
      '',
      `## Acceptance criteria`,
      `- Preserve a stable, traceable outcome for repeated and out-of-order requests.`,
      `- Emit actionable failure context and verify the recovery path in automated tests.`,
      `- Demonstrate that the dependent customer or merchant workflow remains consistent.`,
      ...(index % 20 === 0 ? [
        '',
        '## Release and operational notes',
        'Verify the request correlation ID is preserved through the application boundary, queue handoff, and provider callback. Keep workspace and order identifiers available for diagnosis while masking payment credentials and customer contact fields.',
        'Exercise timeout, retry, duplicate delivery, partial persistence, and provider recovery scenarios against the local contract fixtures. Record the exact rollback signal and confirm that replaying the same request cannot create a second customer-visible result.',
        'The owning team must attach the trace and test output to the release checklist before handing the change to Quality Engineering.',
      ] : []),
    ].join('\n'),
    state,
    priority: index % 23 === 0 ? 'URGENT' : (['HIGH', 'MEDIUM', 'LOW'] as const)[(index + Math.floor(index / 7)) % 3],
    assigneeId: assignee?.id,
    creatorId: creator.id,
    cycleId: cycle?.id,
    milestoneId: milestone?.id,
    startDate: dateOnly(scheduleStartOffset),
    dueDate: dateOnly(scheduleEndOffset),
    createdAt: dateAt(createdOffset),
    updatedAt: dateAt(updatedOffset),
    version: 1 + (index % 6),
  };
});

function issueAt(index: number): Issue {
  return INITIAL_ISSUES[index];
}

const dependencyPairs: [number, number][] = [];
for (const milestone of INITIAL_MILESTONES) {
  const milestoneIssueIndices = INITIAL_ISSUES
    .filter(issue => issue.milestoneId === milestone.id)
    .slice(0, 18)
    .map(issue => Number(issue.key.slice('NEX-'.length)) - 1);
  for (let index = 0; index < 12; index += 1) {
    dependencyPairs.push([milestoneIssueIndices[index], milestoneIssueIndices[index + 1]]);
  }
  dependencyPairs.push(
    [milestoneIssueIndices[0], milestoneIssueIndices[3]],
    [milestoneIssueIndices[2], milestoneIssueIndices[5]],
    [milestoneIssueIndices[5], milestoneIssueIndices[8]],
    [milestoneIssueIndices[8], milestoneIssueIndices[11]],
    [milestoneIssueIndices[3], milestoneIssueIndices[7]],
    [milestoneIssueIndices[7], milestoneIssueIndices[11]],
  );
}

export const INITIAL_DEPENDENCIES: Dependency[] = dependencyPairs.map(([upstreamIndex, downstreamIndex], index) => ({
  id: `dep_nex_${index + 1}`,
  workspaceId: NEXUS_WORKSPACE_ID,
  upstreamIssueId: issueAt(upstreamIndex).id,
  downstreamIssueId: issueAt(downstreamIndex).id,
  createdAt: issueAt(downstreamIndex).createdAt,
  createdBy: INITIAL_USERS[(index * 7 + 2) % INITIAL_USERS.length].id,
}));

const commentTopics = [
  'The API contract is in the integration notes; I added the retry response and idempotency example.',
  'I reproduced this with a delayed downstream response. The recovery path now keeps the order state unchanged.',
  'The staging trace confirms the event includes the workspace and order identifiers without customer PII.',
  'Please review the failure mode against the release gate before this moves to the next cycle.',
  'The contract test covers duplicate delivery and a malformed provider response; the browser path still needs a pass.',
  'I checked the data backfill against the warehouse snapshot. No unmatched records were found in the sample.',
  'This change is ready for cross-service verification once the upstream schema version is deployed.',
  'The runbook now includes the rollback trigger and the owner for the next operational handoff.',
] as const;

const rootComments: IssueComment[] = Array.from({ length: 260 }, (_, index) => {
  const issue = issueAt((index * 31) % INITIAL_ISSUES.length);
  const mentionedUser = index < 140
    ? INITIAL_USERS[index < 100 ? 0 : (index * 11 + 1) % INITIAL_USERS.length]
    : undefined;
  const preferredAuthor = INITIAL_USERS[(index * 11 + 5) % INITIAL_USERS.length];
  const author = mentionedUser?.id === preferredAuthor.id
    ? INITIAL_USERS[(INITIAL_USERS.indexOf(preferredAuthor) + 1) % INITIAL_USERS.length]
    : preferredAuthor;
  const content = `${mentionedUser ? `@${mentionedUser.name} ` : ''}${commentTopics[index % commentTopics.length]} NEX-${issue.key.split('-')[1]} is the reference case.`;
  return {
    id: `comm_nex_${index + 1}`,
    workspaceId: NEXUS_WORKSPACE_ID,
    issueId: issue.id,
    authorId: author.id,
    authorName: author.name,
    createdAt: dateAt(-150 + (index % 100)),
    content,
    mentions: mentionedUser ? [mentionedUser.id] : undefined,
  };
});

const replies: IssueComment[] = Array.from({ length: 160 }, (_, index) => {
  const parent = rootComments[index % 80];
  const author = INITIAL_USERS[(index * 17 + 9) % INITIAL_USERS.length];
  const issue = INITIAL_ISSUES.find(candidate => candidate.id === parent.issueId)!;
  return {
    id: `comm_nex_${rootComments.length + index + 1}`,
    workspaceId: NEXUS_WORKSPACE_ID,
    issueId: issue.id,
    authorId: author.id,
    authorName: author.name,
    parentId: parent.id,
    createdAt: dateAt(-70 + (index % 60)),
    content: [
      'Confirmed; I have added that case to the service contract suite.',
      'The owner handoff is documented and the updated trace is attached to the release checklist.',
      'That behavior is covered now. I will keep the item in review until the downstream check passes.',
      'Agreed. The fallback stays disabled until the provider response is verified in staging.',
    ][index % 4],
  };
});

export const INITIAL_COMMENTS: IssueComment[] = [...rootComments, ...replies];

function makeActivity(
  id: string,
  issue: Issue,
  eventType: ActivityEvent['eventType'],
  actor: User,
  timestamp: string,
  details: ActivityEvent['details'] = {},
): ActivityEvent {
  return {
    id,
    workspaceId: NEXUS_WORKSPACE_ID,
    issueId: issue.id,
    eventType,
    userId: actor.id,
    userName: actor.name,
    timestamp,
    details,
  };
}

const issueCreatedEvents = INITIAL_ISSUES.map((issue, index) =>
  makeActivity(`act_nex_${index + 1}`, issue, 'ISSUE_CREATED', INITIAL_USERS[(index * 7) % INITIAL_USERS.length], issue.createdAt, {
    to: 'BACKLOG',
    reason: 'NEXUS fixture issue created',
  })
);

const stateEvents = INITIAL_ISSUES.slice(0, 180).map((issue, index) =>
  makeActivity(`act_nex_${issueCreatedEvents.length + index + 1}`, issue, 'STATE_CHANGED', INITIAL_USERS[(index * 5 + 3) % INITIAL_USERS.length], issue.updatedAt, {
    from: issue.state === 'DONE' ? 'IN_PROGRESS' : issue.state === 'CANCELLED' ? 'TODO' : 'TODO',
    to: issue.state,
  })
);

const mentionEvents = rootComments.slice(0, 140).map((comment, index) => {
  const targetUserId = comment.mentions?.[0];
  const targetUser = INITIAL_USERS.find(user => user.id === targetUserId)!;
  const issue = INITIAL_ISSUES.find(candidate => candidate.id === comment.issueId)!;
  const actor = INITIAL_USERS.find(user => user.id === comment.authorId)!;
  return makeActivity(
    `act_nex_${issueCreatedEvents.length + stateEvents.length + index + 1}`,
    issue,
    'USER_MENTIONED',
    actor.id === targetUser.id ? INITIAL_USERS[(INITIAL_USERS.indexOf(actor) + 1) % INITIAL_USERS.length] : actor,
    comment.createdAt,
    { targetUserId: targetUser.id, targetUserName: targetUser.name, commentId: comment.id }
  );
});

const assignedIssues = INITIAL_ISSUES.filter(issue => issue.assigneeId && issue.state !== 'DONE' && issue.state !== 'CANCELLED');
const assignmentEvents = Array.from({ length: 120 }, (_, index) => {
  const issue = assignedIssues[index % assignedIssues.length];
  const actor = INITIAL_USERS[(INITIAL_USERS.findIndex(user => user.id === issue.assigneeId) + 1) % INITIAL_USERS.length];
  return makeActivity(
    `act_nex_${issueCreatedEvents.length + stateEvents.length + mentionEvents.length + index + 1}`,
    issue,
    'ASSIGNEE_CHANGED',
    actor,
    dateAt(-45 + (index % 45)),
    { toAssigneeId: issue.assigneeId, to: INITIAL_USERS.find(user => user.id === issue.assigneeId)?.name, reason: `Assigned ${issue.key} for cross-team delivery` }
  );
});

const activeDependencies = INITIAL_DEPENDENCIES.filter(edge => {
  const upstream = INITIAL_ISSUES.find(issue => issue.id === edge.upstreamIssueId)!;
  return upstream.state !== 'DONE' && upstream.state !== 'CANCELLED';
});

const blockedEvents = activeDependencies.slice(0, 40).map((edge, index) => {
  const issue = INITIAL_ISSUES.find(candidate => candidate.id === edge.downstreamIssueId)!;
  const upstream = INITIAL_ISSUES.find(candidate => candidate.id === edge.upstreamIssueId)!;
  const actor = INITIAL_USERS.find(user => user.id === upstream.assigneeId) || INITIAL_USERS[(index + 2) % INITIAL_USERS.length];
  return makeActivity(
    `act_nex_${issueCreatedEvents.length + stateEvents.length + mentionEvents.length + assignmentEvents.length + index + 1}`,
    issue,
    'ISSUE_BLOCKED',
    actor.id === issue.assigneeId ? INITIAL_USERS[(INITIAL_USERS.indexOf(actor) + 1) % INITIAL_USERS.length] : actor,
    edge.createdAt,
    { upstreamKey: upstream.key, reason: `${upstream.key} must clear its service contract before ${issue.key} can proceed` }
  );
});

const resolvedDependencies = INITIAL_DEPENDENCIES.filter(edge => {
  const upstream = INITIAL_ISSUES.find(issue => issue.id === edge.upstreamIssueId)!;
  const downstream = INITIAL_ISSUES.find(issue => issue.id === edge.downstreamIssueId)!;
  return (upstream.state === 'DONE' || upstream.state === 'CANCELLED') &&
    downstream.state !== 'DONE' &&
    downstream.state !== 'CANCELLED';
});

const unblockedEvents = resolvedDependencies.slice(0, 40).map((edge, index) => {
  const issue = INITIAL_ISSUES.find(candidate => candidate.id === edge.downstreamIssueId)!;
  const upstream = INITIAL_ISSUES.find(candidate => candidate.id === edge.upstreamIssueId)!;
  return makeActivity(
    `act_nex_${issueCreatedEvents.length + stateEvents.length + mentionEvents.length + assignmentEvents.length + blockedEvents.length + index + 1}`,
    issue,
    'ISSUE_UNBLOCKED',
    INITIAL_USERS[(index * 9 + 4) % INITIAL_USERS.length],
    dateAt(-25 + (index % 25)),
    { upstreamKey: upstream.key, reason: `${upstream.key} completed and cleared this prerequisite` }
  );
});

const cycleEvents = INITIAL_ISSUES.filter(issue => issue.cycleId && issue.assigneeId && issue.state !== 'DONE' && issue.state !== 'CANCELLED')
  .slice(0, 40)
  .map((issue, index) => {
    const cycle = INITIAL_CYCLES.find(candidate => candidate.id === issue.cycleId)!;
    const actor = INITIAL_USERS[(index * 3 + 2) % INITIAL_USERS.length];
    return makeActivity(
      `act_nex_${issueCreatedEvents.length + stateEvents.length + mentionEvents.length + assignmentEvents.length + blockedEvents.length + unblockedEvents.length + index + 1}`,
      issue,
      'CYCLE_ASSIGNED',
      actor.id === issue.assigneeId ? INITIAL_USERS[(INITIAL_USERS.indexOf(actor) + 1) % INITIAL_USERS.length] : actor,
      issue.updatedAt,
      { cycleId: cycle.id, cycleName: cycle.name }
    );
  });

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  ...issueCreatedEvents,
  ...stateEvents,
  ...mentionEvents,
  ...assignmentEvents,
  ...blockedEvents,
  ...unblockedEvents,
  ...cycleEvents,
].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp) || a.id.localeCompare(b.id));

const issueIds = new Set(INITIAL_ISSUES.map(issue => issue.id));
const userIds = new Set(INITIAL_USERS.map(user => user.id));
const cycleIds = new Set(INITIAL_CYCLES.map(cycle => cycle.id));
const milestoneIds = new Set(INITIAL_MILESTONES.map(milestone => milestone.id));
const commentIds = new Set(INITIAL_COMMENTS.map(comment => comment.id));

export function validateNexusFixture(): string[] {
  const errors: string[] = [];
  const addIf = (condition: boolean, message: string) => {
    if (condition) errors.push(message);
  };

  addIf(INITIAL_ISSUES.length !== 300, 'Expected 300 issues');
  addIf(INITIAL_TEAMS.length !== 6, 'Expected 6 teams');
  addIf(INITIAL_USERS.length !== 35, 'Expected 35 users');
  addIf(INITIAL_PROJECTS.length !== 1, 'Expected one flagship project');
  addIf(INITIAL_CYCLES.length !== 12, 'Expected 12 cycles');
  addIf(INITIAL_MILESTONES.length !== 10, 'Expected 10 milestones');
  addIf(INITIAL_DEPENDENCIES.length !== 180, 'Expected 180 dependencies');
  addIf(INITIAL_COMMENTS.length < 400, 'Expected at least 400 comments');
  addIf(INITIAL_ACTIVITIES.length < 600, 'Expected at least 600 activity events');

  const ensureUniqueIds = (label: string, ids: string[]) => {
    addIf(new Set(ids).size !== ids.length, `Duplicate ${label} ID`);
  };
  ensureUniqueIds('team', INITIAL_TEAMS.map(team => team.id));
  ensureUniqueIds('user', INITIAL_USERS.map(user => user.id));
  ensureUniqueIds('project', INITIAL_PROJECTS.map(project => project.id));
  ensureUniqueIds('issue', INITIAL_ISSUES.map(issue => issue.id));
  ensureUniqueIds('issue key', INITIAL_ISSUES.map(issue => issue.key));
  ensureUniqueIds('cycle', INITIAL_CYCLES.map(cycle => cycle.id));
  ensureUniqueIds('milestone', INITIAL_MILESTONES.map(milestone => milestone.id));
  ensureUniqueIds('dependency', INITIAL_DEPENDENCIES.map(edge => edge.id));
  ensureUniqueIds('comment', INITIAL_COMMENTS.map(comment => comment.id));
  ensureUniqueIds('activity', INITIAL_ACTIVITIES.map(activity => activity.id));

  const project = INITIAL_PROJECTS[0];
  addIf(project.workspaceId !== NEXUS_WORKSPACE_ID || project.teamId !== NEXUS_OWNER_TEAM_ID || project.key !== 'NEX', 'Flagship project ownership is not canonical');
  addIf(INITIAL_TEAMS.some(team => team.workspaceId !== NEXUS_WORKSPACE_ID), 'Team has a foreign workspace');
  addIf(INITIAL_USERS.some(user => !user.teamIds?.length || user.teamIds.some(id => !INITIAL_TEAMS.some(team => team.id === id))), 'User has an invalid team membership');
  addIf(INITIAL_CYCLES.some(cycle => cycle.workspaceId !== NEXUS_WORKSPACE_ID), 'Cycle has a foreign workspace');
  addIf(INITIAL_MILESTONES.some(milestone => milestone.workspaceId !== NEXUS_WORKSPACE_ID), 'Milestone has a foreign workspace');

  const issuesById = new Map(INITIAL_ISSUES.map(issue => [issue.id, issue]));
  const cycleById = new Map(INITIAL_CYCLES.map(cycle => [cycle.id, cycle]));
  const issueKeys = new Set<string>();
  for (const issue of INITIAL_ISSUES) {
    addIf(issue.workspaceId !== NEXUS_WORKSPACE_ID || issue.projectId !== NEXUS_PROJECT_ID || !INITIAL_TEAMS.some(team => team.id === issue.teamId), `Issue ${issue.key} has noncanonical ownership`);
    addIf(issue.key !== `NEX-${issue.id.slice('iss_nex_'.length)}`, `Issue ${issue.id} has an invalid key`);
    addIf(!userIds.has(issue.creatorId), `Issue ${issue.key} has an unknown creator`);
    addIf(Boolean(issue.assigneeId && !userIds.has(issue.assigneeId)), `Issue ${issue.key} has an unknown assignee`);
    addIf(Boolean(issue.cycleId && !cycleIds.has(issue.cycleId)), `Issue ${issue.key} has an unknown cycle`);
    addIf(Boolean(issue.milestoneId && !milestoneIds.has(issue.milestoneId)), `Issue ${issue.key} has an unknown milestone`);
    addIf(Boolean(issue.cycleId && cycleById.get(issue.cycleId)?.teamId !== issue.teamId), `Issue ${issue.key} is assigned to a foreign-team cycle`);
    const assignedCycle = issue.cycleId ? cycleById.get(issue.cycleId) : undefined;
    if (assignedCycle?.status === 'COMPLETED') {
      addIf(issue.state !== 'DONE' && issue.state !== 'CANCELLED', `Open issue ${issue.key} remains in a completed cycle`);
    } else if (assignedCycle?.status === 'UPCOMING') {
      addIf(issue.state !== 'TODO', `Issue ${issue.key} has an invalid state in an upcoming cycle`);
    } else if (assignedCycle?.status === 'ACTIVE') {
      addIf(issue.state !== 'IN_REVIEW' && issue.state !== 'IN_PROGRESS', `Issue ${issue.key} has an invalid state in the active cycle`);
    }
    addIf(Date.parse(issue.createdAt) > Date.parse(issue.updatedAt), `Issue ${issue.key} has update time before creation`);
    addIf(Date.parse(issue.updatedAt) > referenceTime, `Issue ${issue.key} is updated after the fixture reference date`);
    issueKeys.add(issue.key);
  }
  addIf(issueKeys.size !== INITIAL_ISSUES.length, 'Issue keys are not unique');

  const dependencyPairsSeen = new Set<string>();
  for (const edge of INITIAL_DEPENDENCIES) {
    const upstream = issuesById.get(edge.upstreamIssueId);
    const downstream = issuesById.get(edge.downstreamIssueId);
    const pair = `${edge.upstreamIssueId}->${edge.downstreamIssueId}`;
    addIf(!upstream || !downstream, `Dependency ${edge.id} references a missing issue`);
    addIf(edge.upstreamIssueId === edge.downstreamIssueId, `Dependency ${edge.id} is a self-dependency`);
    addIf(edge.workspaceId !== NEXUS_WORKSPACE_ID, `Dependency ${edge.id} has a foreign workspace`);
    addIf(!userIds.has(edge.createdBy), `Dependency ${edge.id} has an unknown creator`);
    addIf(dependencyPairsSeen.has(pair), `Duplicate dependency ${pair}`);
    dependencyPairsSeen.add(pair);
    if (upstream && downstream) {
      const upstreamNumber = Number(upstream.key.slice(4));
      const downstreamNumber = Number(downstream.key.slice(4));
      addIf(upstreamNumber >= downstreamNumber, `Dependency ${edge.id} violates the topological issue order`);
      const upstreamCompleted = upstream.state === 'DONE' || upstream.state === 'CANCELLED';
      const downstreamCompleted = downstream.state === 'DONE' || downstream.state === 'CANCELLED';
      addIf(downstreamCompleted && !upstreamCompleted, `Completed issue ${downstream.key} has an unresolved blocker`);
    }
  }

  for (const comment of INITIAL_COMMENTS) {
    addIf(comment.workspaceId !== NEXUS_WORKSPACE_ID, `Comment ${comment.id} has a foreign workspace`);
    addIf(!issueIds.has(comment.issueId), `Comment ${comment.id} references a missing issue`);
    addIf(!userIds.has(comment.authorId), `Comment ${comment.id} has an unknown author`);
    addIf(Boolean(comment.parentId && !commentIds.has(comment.parentId)), `Comment ${comment.id} has a missing parent`);
    addIf(Boolean(comment.mentions?.some(id => !userIds.has(id))), `Comment ${comment.id} has an unknown mention`);
  }

  for (const activity of INITIAL_ACTIVITIES) {
    addIf(activity.workspaceId !== NEXUS_WORKSPACE_ID, `Activity ${activity.id} has a foreign workspace`);
    addIf(!issueIds.has(activity.issueId), `Activity ${activity.id} references a missing issue`);
    addIf(!userIds.has(activity.userId), `Activity ${activity.id} has an unknown actor`);
    addIf(Boolean(activity.details.commentId && !commentIds.has(activity.details.commentId)), `Activity ${activity.id} references a missing comment`);
    addIf(Boolean(activity.details.targetUserId && !userIds.has(activity.details.targetUserId)), `Activity ${activity.id} targets an unknown user`);
  }

  addIf(INITIAL_CYCLES.filter(cycle => cycle.status === 'ACTIVE').length !== 1, 'Expected exactly one active owner-team cycle');
  addIf(INITIAL_CYCLES.some((cycle, index) => index < 10 && cycle.status !== 'COMPLETED'), 'Historical cycles must be completed');
  addIf(INITIAL_CYCLES[10].status !== 'ACTIVE' || INITIAL_CYCLES[11].status !== 'UPCOMING', 'Current and upcoming cycle statuses are invalid');
  return errors;
}
