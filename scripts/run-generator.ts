import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = path.resolve(process.cwd(), 'apps/web/src/data/nexus');

// We will construct the entire dataset programmatically and write it out.
import { TEAMS, PROJECT, USERS, CYCLES, MILESTONES } from './build-nexus-dataset';

// Issue data definitions for all 300 issues across the 13 workstreams
interface RawIssueDef {
  num: number;
  workstream: string;
  title: string;
  description: string;
  state: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  assigneeId?: string;
  creatorId: string;
  cycleId?: string;
  milestoneId?: string;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Write the script to generate all 300 issues with pristine referential integrity
console.log('Building 300 issues with full domain vocabulary...');
