import {workspaceCreatedSchema} from '@unblok/contracts';
import {beforeAll,afterAll,test,expect} from 'bun:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {Database,AuthFences,AccountCredentials,Tenancy,denyAll} from '@unblok/database';

// Full closed Tenancy path with query-event instrumentation, using owned DB/session evidence.
// No authority checks or database triggers are disabled during seeding or measurement.
const root=resolve(import.meta.dir,'../..'),base=process.env.DATABASE_URL!;
const admin=new Database(base),name='unblok_be01b_perf_'+randomUUID().replaceAll('-',''),url=new URL(base);url.pathname='/'+name;
const unconnected=new Database(url.toString()).client;
const InstrumentedClient=unconnected.constructor as new(options:{datasources:{db:{url:string}};log:{emit:'event';level:'query'}[]})=>typeof unconnected;
const client=new InstrumentedClient({datasources:{db:{url:url.toString()}},log:[{emit:'event',level:'query'}]});
const monitored={client,transaction:<T>(run:(tx:Parameters<Parameters<Database['transaction']>[0]>[0])=>Promise<T>)=>client.$transaction(run,{isolationLevel:'Serializable',maxWait:2000,timeout:5000})} as unknown as Database;
const key=()=>randomBytes(32).toString('hex'),keys={active:'perf',cursors:{perf:key()},idempotency:key()},invKey={id:'perf',secret:key()};
type QueryEvent={query:string;params:string;duration:number};
let queries:QueryEvent[]=[],created=false;
let acknowledge:(()=>void)|undefined;
(client.$on.bind(client) as unknown as (event:'query',listener:(e:QueryEvent)=>void)=>void)('query',e=>{if(e.query.includes('be01b_measurement_barrier')){acknowledge?.();acknowledge=undefined;}else queries.push({query:e.query,params:e.params,duration:e.duration});});
// Wait for an observed event after the completed operation, not an arbitrary JS timer.
async function eventBarrier(){let timer:ReturnType<typeof setTimeout>|undefined;const observed=new Promise<void>((resolve,reject)=>{acknowledge=resolve;timer=setTimeout(()=>reject(Error('Query event barrier not observed')),1000);});try{await client.$queryRawUnsafe('SELECT 1 AS be01b_measurement_barrier');await observed;}finally{clearTimeout(timer);acknowledge=undefined;}}
beforeAll(async()=>{await admin.connect();await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`);created=true;const p=Bun.spawn([process.execPath,'packages/database/node_modules/prisma/build/index.js','migrate','deploy','--schema','packages/database/prisma/schema.prisma'],{cwd:root,env:{...process.env,DATABASE_URL:url.toString()},stdout:'pipe',stderr:'pipe'});await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text()]);if(await p.exited!==0)throw Error('Owned migration failed');await client.$connect();},30000);
afterAll(async()=>{await client.$disconnect();await unconnected.$disconnect();if(created)await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);await admin.close();},10000);
test('10k/100k administration projections: real plans, bounded response and constant SQL statement count',async()=>{
 const email='benchmark@example.test',credentials=new AccountCredentials(monitored);await credentials.create({email,name:'Benchmark administrator',passwordHash:await Bun.password.hash('Disposable benchmark password',{algorithm:'argon2id',memoryCost:19456,timeCost:2})});
 const actor=await credentials.lookup(email);await client.passwordCredential.update({where:{identityId:actor!.identityId},data:{emailVerifiedAt:new Date()}});
 const fences=new AuthFences(monitored),session=await fences.create({userId:actor!.userId,identityId:actor!.identityId,sidDigest:key(),absoluteExpiresAt:new Date(Date.now()+1800000),idleExpiresAt:new Date(Date.now()+1800000)}),tenancy=new Tenancy(monitored,{verify:async()=>null},denyAll,{verify:async()=>session},undefined,keys,invKey);
 const workspace=workspaceCreatedSchema.parse(await tenancy.authenticateSession('owned',p=>tenancy.createWorkspace(p,{name:'Measured Workspace',slug:randomUUID(),key:randomUUID()}))),ws=workspace.workspace.id,owner=(await client.workspaceMembership.findUniqueOrThrow({where:{workspaceId_userId:{workspaceId:ws,userId:actor!.userId}}})).id;
 const evidence:{population:number;operation:string;limit:number;samplesMs:number[];p50Ms:number;p95Ms:number;statementCounts:number[];wireStatementCounts:number[];driverHealthChecks:number[];responseBytes:number;plans:unknown[]}[]=[];
 let seeded=0;
 for(const population of [10000,100000]){
  console.log('Seeding owned benchmark to '+population+' members and invitations, with guards enabled.');
  while(seeded<population){const end=Math.min(population,seeded+1000);
   await client.$executeRaw`WITH u AS(INSERT INTO users(id,name,email) SELECT gen_random_uuid(),'Benchmark '||n,'bench-'||n||'@example.test' FROM generate_series(${seeded+1}::integer,${end}::integer) n RETURNING id) INSERT INTO workspace_memberships(workspace_id,id,user_id,role,status,joined_at) SELECT ${ws}::uuid,gen_random_uuid(),id,'MEMBER','ACTIVE','2026-01-01'::timestamptz FROM u`;
   await client.$executeRaw`INSERT INTO workspace_invitations(id,workspace_id,inviter_id,inviter_identity_id,inviter_membership_id,inviter_epoch,email,role,key_id,token_digest,issued_at,expires_at) SELECT gen_random_uuid(),${ws}::uuid,${actor!.userId}::uuid,${actor!.identityId}::uuid,${owner}::uuid,1,'invite-'||n||'@example.test','MEMBER',${invKey.id},${'0'.repeat(64)},date_trunc('milliseconds',clock_timestamp()),date_trunc('milliseconds',clock_timestamp())+interval '23 hours' FROM generate_series(${seeded+1}::integer,${end}::integer) n`;
   seeded=end;
  }
  await client.$executeRawUnsafe('ANALYZE workspace_memberships');await client.$executeRawUnsafe('ANALYZE workspace_invitations');await client.$executeRawUnsafe('ANALYZE users');
  for(const operation of ['members','invitations','member-search'] as const)for(const limit of [1,100]){
   const times:number[]=[],counts:number[]=[],wireCounts:number[]=[],healthChecks:number[]=[],shapes:string[][]=[];let bytes=0,sample:typeof queries=[];
   for(let n=0;n<5;n++){await eventBarrier();queries=[];const start=performance.now();const result=await tenancy.authenticateSession('owned',async p=>operation==='invitations'?await tenancy.administrationInvitations(p,ws,{limit}):await tenancy.administrationMembers(p,ws,{limit,status:'ALL',...(operation==='member-search'?{search:'Benchmark 99'}:{})}));times.push(performance.now()-start);await eventBarrier();const health=queries.filter(q=>q.query.trim()==='SELECT 1').length;wireCounts.push(queries.length);healthChecks.push(health);counts.push(queries.length-health);shapes.push(queries.map(q=>q.query));sample=[...queries];bytes=Buffer.byteLength(JSON.stringify(result));expect(result.items.length).toBeLessThanOrEqual(limit);expect(bytes).toBeLessThan(operation==='invitations'?2097152:1048576);if(operation==='members')expect('totals' in result&&result.totals.matchingMembers).toBe(population+1);if(operation==='invitations')expect('total' in result&&result.total).toBe(population);}
   const plans:unknown[]=[];for(const q of sample.filter(q=>q.query.startsWith('SELECT')&&(q.query.includes('ORDER BY COALESCE(m.joined_at')||q.query.includes('AS matching')||q.query.includes('AS status,CASE')||q.query.includes('count(*) AS n'))))plans.push({sql:q.query,plan:await client.$queryRawUnsafe('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) '+q.query,...JSON.parse(q.params))});
   const sorted=[...times].sort((a,b)=>a-b);evidence.push({population,operation,limit,samplesMs:times,p50Ms:sorted[2]!,p95Ms:sorted[4]!,statementCounts:counts,wireStatementCounts:wireCounts,driverHealthChecks:healthChecks,responseBytes:bytes,plans});if(new Set(counts).size!==1){const unique=[...new Set(shapes.flat())];console.log('Counter mismatch '+JSON.stringify(counts));console.log(JSON.stringify(unique.map(sql=>({sql,perSample:shapes.map(q=>q.filter(v=>v===sql).length)})).filter(r=>new Set(r.perSample).size>1)));}expect(new Set(counts).size).toBe(1);
   console.log(`${population} ${operation} limit=${limit}: p50=${sorted[2]!.toFixed(1)}ms p95=${sorted[4]!.toFixed(1)}ms statements=${counts[0]} bytes=${bytes}`);
  }
 }
 for(const population of [10000,100000])for(const op of ['members','invitations','member-search']){const pair=evidence.filter(r=>r.population===population&&r.operation===op);expect(pair[0]!.statementCounts[0]).toBe(pair[1]!.statementCounts[0]);}
 await Bun.write(resolve(root,'docs/backend/evidence/BE-01B-performance.json'),JSON.stringify({measuredAt:new Date().toISOString(),scope:'Disposable PostgreSQL 17; full Tenancy/session fences, no HTTP/cache latency. Five sequential samples; p95 is sample maximum, not a production SLO. Statement counts exclude exact Prisma SELECT 1 pool health checks (separately recorded with all wire counts) and the explicit measurement barrier. Synthetic invitations have no outbox delivery; no proofs are issued to real users.',evidence},null,2)+'\n');
},300000);
