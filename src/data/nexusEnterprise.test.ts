import {describe,it,expect} from 'vitest';
import {INITIAL_ISSUES,INITIAL_TEAMS,INITIAL_PROJECTS,INITIAL_USERS,INITIAL_CYCLES,INITIAL_DEPENDENCIES,INITIAL_MILESTONES,validateNexusFixture} from './nexusEnterprise';
describe('NEXUS enterprise reference data',()=>{
 it('has the intended high density volume',()=>{
  expect(INITIAL_ISSUES).toHaveLength(300);
  expect(INITIAL_TEAMS).toHaveLength(6);
  expect(INITIAL_USERS).toHaveLength(35);
  expect(INITIAL_PROJECTS).toHaveLength(1);
  expect(INITIAL_CYCLES).toHaveLength(12);
  expect(INITIAL_MILESTONES).toHaveLength(10);
  expect(INITIAL_DEPENDENCIES).toHaveLength(180);
 });
 it('has valid directed fixture relations',()=>expect(validateNexusFixture()).toEqual([]));
 it('has a single owning team and no foreign cycles',()=>{
  expect(INITIAL_ISSUES.every(issue=>issue.projectId==='proj_nexus'&&issue.teamId==='team_eng')).toBe(true);
  expect(INITIAL_CYCLES.every(cycle=>cycle.teamId==='team_eng')).toBe(true);
 });
});
