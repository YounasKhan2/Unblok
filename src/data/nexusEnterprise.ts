import type {Team,Project,User,Issue,Dependency,Cycle,Milestone,IssueComment,ActivityEvent} from '../types';
/** Deterministic NEXUS data for large-scale local UX validation. */
const ws='ws_acme', project='proj_nexus', owner='team_eng';
export const NEXUS_FIXTURE_VERSION='nexus-enterprise-v1';
export const INITIAL_TEAMS:Team[]=[
 ['team_eng','CORE','Commerce Platform'],['team_web','WEB','Storefront Experience'],
 ['team_services','SERV','Commerce Services'],['team_pay','PAY','Payments & Risk'],
 ['team_inf','INF','Infrastructure & Reliability'],['team_qa','QA','Quality Engineering']
].map(([id,key,name],i)=>({id,workspaceId:ws,key,name,color:['#6857cc','#0b9296','#497ed1','#d18638','#6b8891','#9b61b6'][i],description:name+' delivery and engineering responsibilities.'}));
export const INITIAL_PROJECTS:Project[]=[{id:project,workspaceId:ws,teamId:owner,name:'NEXUS — Omnichannel Commerce Platform',key:'NEX',description:'Enterprise storefront, catalog, checkout, payments, orders, inventory and fulfillment.',currentSequence:300}];
const original:[string,string,string,string][]=[
 ['usr_sarah','Sarah Chen','sarah@acme.com','team_eng'],
 ['usr_marcus','Marcus Vance','marcus@acme.com','team_web'],
 ['usr_elena','Elena Rostova','elena@acme.com','team_inf'],
 ['usr_david','David Kim','david@acme.com','team_eng'],
 ['usr_aisha','Aisha Patel','aisha@acme.com','team_qa'],
 ['usr_alex','Alex Rivera','alex@acme.com','team_eng']
];
const names=['Maya Brooks','Owen Park','Priya Shah','Noah Bennett','Leila Haddad','Ethan Cole','Zoe Morgan','Amir Rahman','Isabel Torres','Hugo Martins','Nina Kovac','Avery Chen','Hassan Malik','Sofia Alvarez','Luca Rossi','Ivy Bennett','Ravi Nair','Mina Park','Omar Farouk','Eva Lind','Theo Campbell','Amina Yusuf','Jonah Reed','Mei Tan','Felix Bauer','Sara Ibrahim','Anika Rao','Daniel Ortiz','Yara Hassan'];
const extra:[string,string,string,string][]=names.map((name,i)=>['usr_nex_'+(i+1),name,'user'+(i+1)+'@nexus.example',INITIAL_TEAMS[i%6].id]);
export const INITIAL_USERS:User[]=[...original,...extra].map(([id,name,email,teamId],i)=>({id,name,email,teamId,teamIds:[teamId],role:i===0?'ADMIN':i===4?'OBSERVER':'MEMBER',avatar:''}));
const date=(day:number)=>new Date(Date.UTC(2026,4,21+day)).toISOString();
export const INITIAL_CYCLES:Cycle[]=Array.from({length:12},(_,i)=>({id:'cycle_nex_'+(i+1),workspaceId:ws,teamId:owner,name:'NEXUS Cycle '+(i+1),startDate:date(i*14).slice(0,10),endDate:date(i*14+13).slice(0,10),status:i<10?'COMPLETED':i===10?'ACTIVE':'UPCOMING',description:'Integrated commerce delivery cycle.'}));
const milestoneNames=['Architecture and domain contracts','Identity foundations','Catalog readiness','Checkout integration','Payment readiness','Order and inventory integration','Merchant operations beta','Fulfillment integration','Pilot release candidate','General availability'];
export const INITIAL_MILESTONES:Milestone[]=milestoneNames.map((name,i)=>({id:'milestone_nex_'+(i+1),workspaceId:ws,teamId:'ALL',name:'M'+(i+1)+': '+name,targetDate:date(25+i*15).slice(0,10),description:'Delivery checkpoint for '+name.toLowerCase()+'.'}));
const areas=[
 ['Identity','session revocation','account recovery','merchant permissions','token rotation','address permissions'],
 ['Catalog','variant indexing','pricing rules','product import','media optimization','stock signals'],
 ['Search','facet filtering','relevance ranking','autocomplete','synonyms','zero-result recovery'],
 ['Checkout','cart merge','coupon validation','tax calculation','shipping selection','idempotent submission'],
 ['Payments','authorization retries','3DS challenge','refund reconciliation','risk screening','ledger posting'],
 ['Orders','order transitions','returns intake','split shipment','cancellation rules','history pagination'],
 ['Inventory','stock reservation','warehouse routing','backorders','inventory delta','reconciliation'],
 ['Fulfillment','carrier quotes','label purchase','tracking events','delivery exceptions','dispatch queues'],
 ['Merchant Admin','role matrix','bulk editing','audit search','store configuration','fulfillment settings'],
 ['Notifications','receipt delivery','SMS fallback','message deduplication','preference center','provider status'],
 ['Infrastructure','deploy gates','tracing','rate limiting','connection pooling','recovery rehearsal'],
 ['Security','PII boundaries','webhook signatures','retention controls','audit integrity','privilege testing'],
 ['Quality','contract tests','browser matrix','payment sandbox','load testing','release smoke']
];
const verbs=['Design','Implement','Verify','Harden','Document'];
const states:Issue['state'][]=['DONE','DONE','IN_PROGRESS','IN_REVIEW','TODO','BACKLOG','DONE','IN_PROGRESS','TODO','CANCELLED'];
const priorities:Issue['priority'][]=['HIGH','MEDIUM','LOW','URGENT'];
export const INITIAL_ISSUES:Issue[]=Array.from({length:300},(_,i)=>{
 const area=areas[i%areas.length],subject=area[1+Math.floor(i/areas.length)%5],action=verbs[Math.floor(i/65)%5],state=states[(i*7+Math.floor(i/19))%10];
 return {id:'iss_nex_'+(i+1),workspaceId:ws,key:'NEX-'+(i+1),projectId:project,teamId:owner,
  title:action+' '+subject+' — '+area[0],
  description:'## Delivery context\nNEXUS '+area[0]+' requires '+subject+' to be implemented with clear service boundaries.\n\n## Acceptance criteria\n- Validate normal and exceptional inputs.\n- Preserve error recovery and idempotency.\n- Demonstrate test coverage and release readiness.\n\n## Handoff\nDocument integration contracts and any unresolved blockers.',
  state,priority:priorities[(i+Math.floor(i/7))%4],assigneeId:i%17===0?undefined:INITIAL_USERS[(i*13+3)%35].id,
  creatorId:'usr_sarah',cycleId:i%9===0?undefined:INITIAL_CYCLES[Math.min(11,Math.floor(i/25))].id,
  milestoneId:i%11===0?undefined:INITIAL_MILESTONES[Math.min(9,Math.floor(i/30))].id,
  startDate:date(i%135).slice(0,10),dueDate:date(7+i%150).slice(0,10),
  createdAt:date(i%135),updatedAt:date(Math.min(160,i%135+2)),version:1+i%6};
});
export const INITIAL_DEPENDENCIES:Dependency[]=Array.from({length:180},(_,i)=>({id:'dep_nex_'+(i+1),workspaceId:ws,upstreamIssueId:'iss_nex_'+(i+1),downstreamIssueId:'iss_nex_'+(i+2+(i%5===0?8:0)),createdAt:date(i%120),createdBy:'usr_sarah'}));
export const INITIAL_COMMENTS:IssueComment[]=Array.from({length:420},(_,i)=>{
 const author=INITIAL_USERS[(i*11+5)%35];
 return {id:'comm_nex_'+(i+1),workspaceId:ws,issueId:INITIAL_ISSUES[(i*31)%300].id,authorId:author.id,authorName:author.name,createdAt:date(i%155),content:['Please confirm the upstream contract before merging.','Verified the staging scenario; recovery behavior needs review.','Reproduced the edge case and documented acceptance evidence.','Next step: validate the release gate and owner handoff.'][i%4]};
});
const kinds:ActivityEvent['eventType'][]=['ISSUE_CREATED','STATE_CHANGED','ASSIGNEE_CHANGED','PRIORITY_CHANGED','CYCLE_ASSIGNED','MILESTONE_LINKED'];
export const INITIAL_ACTIVITIES:ActivityEvent[]=Array.from({length:630},(_,i)=>{
 const issue=INITIAL_ISSUES[(i*17)%300],actor=INITIAL_USERS[(i*7)%35];
 return {id:'act_nex_'+(i+1),workspaceId:ws,issueId:issue.id,eventType:kinds[i%6],userId:actor.id,userName:actor.name,timestamp:date(i%160),details:i%6===1?{from:'TODO',to:issue.state}:{to:issue.key}};
});
export function validateNexusFixture():string[]{
 const errors:string[]=[], issueIds=new Set(INITIAL_ISSUES.map(i=>i.id));
 if(INITIAL_USERS.length!==35||INITIAL_ISSUES.length!==300)errors.push('Wrong fixture counts');
 if(new Set(INITIAL_ISSUES.map(i=>i.key)).size!==300)errors.push('Duplicate issue keys');
 for(const issue of INITIAL_ISSUES){
  if(issue.workspaceId!==ws||issue.projectId!==project||issue.teamId!==owner)errors.push('Foreign issue '+issue.key);
  if(issue.assigneeId&&!INITIAL_USERS.some(u=>u.id===issue.assigneeId))errors.push('Unknown assignee '+issue.key);
 }
 for(const edge of INITIAL_DEPENDENCIES){
  if(!issueIds.has(edge.upstreamIssueId)||!issueIds.has(edge.downstreamIssueId)||Number(edge.upstreamIssueId.split('_').pop())>=Number(edge.downstreamIssueId.split('_').pop()))errors.push('Invalid dependency '+edge.id);
 }
 return errors;
}
