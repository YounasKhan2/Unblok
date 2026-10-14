import { writeFile, mkdir } from 'node:fs/promises';
import { afterAll as registerAfterAll, beforeAll as registerBeforeAll, expect, test as registerTest } from 'bun:test';
// Standalone mode permits Bun's CPU profiler (Bun test does not emit one).
const baseline=process.env.TEAM_DIRECTORY_BASELINE==='1';
const repetition=process.env.TEAM_DIRECTORY_REPETITION??'1';
if(!/^[1-3]$/.test(repetition))throw new Error('Invalid profile repetition');
const standalone=process.env.TEAM_DIRECTORY_PROFILE_STANDALONE==='1';
let setupRun:(()=>Promise<void>)|undefined,cleanupRun:(()=>Promise<void>)|undefined,profileRun:(()=>Promise<void>)|undefined;
function beforeAll(run:()=>Promise<void>,timeout:number){if(standalone)setupRun=run;else registerBeforeAll(run,timeout);}
function afterAll(run:()=>Promise<void>,timeout:number){if(standalone)cleanupRun=run;else registerAfterAll(run,timeout);}
function test(name:string,run:()=>Promise<void>,timeout:number){if(standalone)profileRun=run;else registerTest(name,run,timeout);}
import { randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Database, AccountCredentials, AuthFences, Tenancy, denyAll, type WorkspaceKeys } from '@unblok/database';
import { createLogger, createRedis, loadApiConfig } from '@unblok/backend-runtime';
import { createApp } from '../../apps/api/src/app';
import { RedisRateLimiter } from '../../apps/api/src/security';
import { Sessions, connectSessionStore, sessionSettings } from '../../apps/api/src/modules/sessions';
import { Authentication, AuthenticationLimits, Passwords } from '../../apps/api/src/modules/auth';

import { Teams, TeamLimits } from '../../apps/api/src/modules/teams';
import { TeamRateError } from '../../apps/api/src/modules/teams/application/teams';
import { Workspaces, WorkspaceLimits } from '../../apps/api/src/modules/workspaces';
import type { Server, ServerResponse } from 'node:http';
import { AsyncLocalStorage } from 'node:async_hooks';
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';
import { teamMemberPageSchema } from '@unblok/contracts';
// All instrumentation is in this disposable harness. No production file or
// generated schema changes. Private configOverride enables pinned6.19.3 native
// pool metrics only in this fixture; it does not change pool size/timeouts.
type Histogram={sum:number;count:number;buckets:[number,number][]};
type NativeMetrics={gauges:{key:string;value:number}[];counters:{key:string;value:number}[];histograms:{key:string;value:Histogram}[]};
type InstrumentedClient={ $metrics:{json():Promise<NativeMetrics>};$on(event:'info',callback:(event:{message:string})=>void):void;$on(event:'query',callback:(event:{query:string;duration:number})=>void):void };
type ProfileConfig={generator:Record<string,unknown>;inlineSchema:string};
type RuntimeFunction=(...args:unknown[])=>unknown;
type Span={name:string;ms:number};
type Trace={detailed:boolean;start:number;serverMs?:number;status?:number;spans:Span[];transactions:{stage:string;admissionMs:number;callbackMs:number;commitMs:number;totalMs:number}[]};
const context=new AsyncLocalStorage<{trace:Trace;stage:string}>();
const traces=new Map<string,Trace>();
let queryEvents:{kind:string;ms:number}[]|null=null;
let configuredPool=0;
function profiledDatabase(target:string){
 const db=new Database(target);
 const client=Reflect.construct(db.client.constructor,[{datasources:{db:{url:target}},log:[{emit:'event',level:'query'},{emit:'event',level:'info'}],__internal:{configOverride:(c:ProfileConfig)=>({...c,generator:{...c.generator,previewFeatures:['metrics']},inlineSchema:c.inlineSchema.replace(/generator client \{/,'generator client {\npreviewFeatures = ["metrics"]')})}}]) as InstrumentedClient;
 client.$on('info',(event:{message:string})=>{const m=event.message.match(/pool with (\d+) connections/);if(m)configuredPool=Number(m[1]);});
 client.$on('query',(event:{query:string;duration:number})=>{if(queryEvents)queryEvents.push({kind:event.query.includes('FROM team_memberships tm JOIN')?'directory':/^(BEGIN|COMMIT|SET TRANSACTION)/.test(event.query)?'transaction-control':'authorization-and-other',ms:event.duration});});
 Object.defineProperty(db,'client',{value:client});
 const original=db.transaction.bind(db);
 db.transaction=async function(run){const c=context.getStore();if(!c?.trace.detailed)return original(run);const start=performance.now();let entered=start,finished=start;
 try{return await original(async tx=>{entered=performance.now();try{return await run(tx);}finally{finished=performance.now();}});}finally{const end=performance.now();c.trace.transactions.push({stage:c.stage,admissionMs:entered-start,callbackMs:finished-entered,commitMs:end-finished,totalMs:end-start});}
 };
 return db;
}
function wrapAsync(object:object,key:string,name:string){const original=Reflect.get(object,key) as RuntimeFunction;Reflect.set(object,key,async function(this:object,...args:unknown[]){const c=context.getStore();if(!c?.trace.detailed)return Reflect.apply(original,this,args);const start=performance.now();try{return await context.run({...c,stage:name},()=>Reflect.apply(original,this,args));}finally{c.trace.spans.push({name,ms:performance.now()-start});}});}
function wrapStore(store:object){const original=Reflect.get(store,'get') as RuntimeFunction;Reflect.set(store,'get',function(this:object,sid:unknown,callback:(...args:unknown[])=>void){const c=context.getStore(),start=performance.now();return Reflect.apply(original,this,[sid,(...args:unknown[])=>{if(c?.trace.detailed)c.trace.spans.push({name:'session-store-get',ms:performance.now()-start});callback(...args);}]);});}
function installInboundProfile(server:Server){server.prependListener('request',(req,res)=>{const id=req.headers['x-profile-id'];if(typeof id!=='string')return;const trace:Trace={detailed:req.headers['x-profile-detail']==='1',start:performance.now(),spans:[],transactions:[]};traces.set(id,trace);context.enterWith({trace,stage:'inbound'});
 const response=res as ServerResponse & {json:RuntimeFunction};response.json=function(this:ServerResponse,...args:unknown[]){const start=performance.now();try{return Reflect.apply(Reflect.get(Object.getPrototypeOf(this),'json'),this,args);}finally{if(trace.detailed)trace.spans.push({name:'response-json-and-send',ms:performance.now()-start});}};
 res.once('finish',()=>{trace.serverMs=performance.now()-trace.start;trace.status=res.statusCode;});
 });}
wrapAsync(Sessions.prototype,'verify','session-verify');
wrapAsync(AuthFences.prototype,'validate','session-primary-fence');
wrapAsync(Tenancy.prototype,'currentUser','self-profile-authorization');
wrapAsync(Tenancy.prototype,'workspaceContext','workspace-authorization');
wrapAsync(Tenancy.prototype,'teamDirectoryAdmission','workspace-admission');
wrapAsync(Tenancy.prototype,'teamMembers','private-team-directory');
const parse=teamMemberPageSchema.safeParse;
teamMemberPageSchema.safeParse=function(...args:Parameters<typeof parse>){const c=context.getStore(),start=performance.now();try{return Reflect.apply(parse,this,args);}finally{if(c?.trace.detailed)c.trace.spans.push({name:'response-schema-validation',ms:performance.now()-start});}};
function summary(values:number[]){const v=[...values].sort((a,b)=>a-b);return {samples:v.length,sumMs:v.reduce((a,b)=>a+b,0),p50:v[Math.ceil(v.length*.5)-1]??null,p95:v[Math.ceil(v.length*.95)-1]??null,p99:v[Math.ceil(v.length*.99)-1]??null,max:v.at(-1)??null};}
async function metrics(){return (database.client as unknown as InstrumentedClient).$metrics.json();}
function metric(m:NativeMetrics,key:'prisma_client_queries_wait_histogram_ms'):Histogram;
function metric(m:NativeMetrics,key:string):number;
function metric(m:NativeMetrics,key:string):number|Histogram{const row=[...m.gauges,...m.counters,...m.histograms].find(v=>v.key===key);if(!row)throw new Error('Missing native metric');return row.value;}

const workspaceKeys = { active: 'v1', cursors: { v1: randomBytes(32).toString('hex') }, idempotency: randomBytes(32).toString('hex') };
const root = resolve(import.meta.dir, '../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_team_profile_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = profiledDatabase(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `team02:test:${randomUUID()}:`;
cache.on('error', () => {}); // Expected outage diagnostics must not print SDK details.
const stops: (() => Promise<void>)[] = [];
let created = false;
async function prisma(args: string[], target=url.toString()) {
  const child = Bun.spawn([process.execPath, 'packages/database/node_modules/prisma/build/index.js', ...args],
    { cwd: root, env: { ...process.env, DATABASE_URL: target }, stdout: 'pipe', stderr: 'pipe' });
  let timedOut = false; const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 6000);
  try {
    const [exit, out] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (timedOut || exit !== 0) throw new Error('Owned migration verification failed; configuration withheld');
    return out;
  } finally { clearTimeout(timer); }
}
beforeAll(async () => {
  await admin.connect(); await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
  await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma']);
  await database.connect(); await cache.connect();
}, 30000);
afterAll(async () => {
  try { for (const stop of stops.reverse()) await stop(); }
  finally {
    try { const keys = await cache.keys(`${ownedPrefix}*`); if (keys.length) await cache.del(...keys); }
    finally { cache.disconnect(); await database.close();
      try { if (created) await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`); }
      finally { await admin.close(); }
    }
  }
}, 10000);
const password = 'A long private test password 2026';
type Client = { cookie: string; csrf: string };
async function fixture(options: { afterConfirmation?: () => Promise<void>; redisUrl?: string; keys?: WorkspaceKeys; settings?:Parameters<typeof connectSessionStore>[1]; database?:Database; admissionSample?:(action:string,ms:number,allowed:boolean)=>void } = {}) {
  const settings = options.settings ?? { ...sessionSettings(config, { SESSION_SECRETS: randomBytes(32).toString('hex'), SESSION_NAMESPACE: 'test' }), prefix: ownedPrefix + randomUUID() + ':' };
  const rateCache = options.redisUrl ? createRedis(options.redisUrl) : cache;
  if (options.redisUrl) { rateCache.on('error', () => {}); await rateCache.connect(); }
  const connection = await connectSessionStore(options.redisUrl ?? config.REDIS_URL, settings);
  const credentials = new AccountCredentials(database), limits = new AuthenticationLimits(rateCache, settings.secrets[0]!, settings.prefix);
  const authentication = new Authentication({ create: i => credentials.create(i), lookup: e => credentials.lookup(e), confirm: async snapshot => {
    const valid = await credentials.confirm(snapshot); if (valid) await options.afterConfirmation?.(); return valid;
  } }, await Passwords.create(), limits);
  const sessions = new Sessions(connection.store, settings, { create: i => fences.create(i), rotate: (e, d, idle) => fences.rotate(e, d, idle), revoke: e => fences.revoke(e), retireSid: d => fences.retireSid(d), revokeAll: id => fences.revokeAll(id) }, a => authentication.resolveIdentity(a));
  const tenancy = new Tenancy(options.database ?? database, { verify: async () => null }, denyAll, sessions, undefined, options.keys ?? workspaceKeys);
  sessions.bind(tenancy); authentication.bind(sessions, tenancy);
  const coarse = new RedisRateLimiter(rateCache, 120, 60000, settings.prefix + 'coarse:');
  const teamLimits=new TeamLimits(rateCache,settings.secrets[0]!,settings.prefix), measuredLimits={consume:async(...args:Parameters<TeamLimits['consume']>)=>{const start=performance.now();const result=await teamLimits.consume(...args);options.admissionSample?.(args[0],performance.now()-start,result.allowed);return result;}};
  wrapAsync(coarse,'consume','coarse-admission');
  wrapStore(connection.store);
  wrapAsync(teamLimits,'consume','team-admission');
  const teams=new Teams(sessions,tenancy,measuredLimits);
  // Exact merged-before correction directory flow, inside this fixture only.
  // Uses real fences/admission/final Team authorization, never a production fallback.
  if(baseline)teams.members=(req,workspace,team,query)=>sessions.withRequest(req,async p=>{
    const actor=await tenancy.currentUser(p);await tenancy.workspaceContext(p,workspace);
    const budget=await measuredLimits.consume('read',actor.id,workspace);if(!budget.allowed)throw new TeamRateError(budget.retryAfter);
    return tenancy.teamMembers(p,workspace,team,query);
  });
  const server = await createApp(config, { databaseReady: () => database.ready(), queueReady: async () => await rateCache.ping() === 'PONG', close: async () => { await connection.close(); if (options.redisUrl) rateCache.disconnect(); } }, coarse, createLogger('silent'), sessions, authentication, new Workspaces(sessions, tenancy, new WorkspaceLimits(rateCache, settings.secrets[0]!, settings.prefix)),teams);
  installInboundProfile(server.app.getHttpServer());
  await server.app.listen(0, '127.0.0.1'); stops.push(server.close);
  const address = server.app.getHttpServer().address(); if (!address || typeof address === 'string') throw new Error('Missing test listener');
  const http = (path: string, method = 'GET', client?: Client, body?: unknown, extra: Record<string, string | undefined> = {}) => {
    const headers: Record<string, string> = { origin: config.CORS_ORIGINS[0]!, ...(client ? { cookie: client.cookie, 'x-csrf-token': client.csrf } : {}), ...(['POST','PATCH','DELETE'].includes(method) ? { 'content-type': 'application/json' } : {}) };
    for (const [key, value] of Object.entries(extra)) { if (value === undefined) delete headers[key]; else headers[key] = value; }
    return fetch(`http://127.0.0.1:${address.port}${path}`, { method, headers, ...(['POST','PATCH'].includes(method) ? { body: JSON.stringify(body ?? {}) } : {}) });
  };
  const bootstrap = async () => {
    const response = await http('/api/v1/auth/csrf'); expect(response.status).toBe(200);
    const client = { cookie: response.headers.get('set-cookie')!.split(';')[0]!, csrf: (await response.json()).csrf as string };
    expect(response.headers.get('cache-control')).toBe('no-store'); return client;
  };
  const signup = async (email = `${randomUUID()}@example.test`, name = 'Account') => {
    const client = await bootstrap(), response = await http('/api/v1/auth/signup', 'POST', client, { email, name, password });
    expect(response.status).toBe(202); expect(await response.json()).toEqual({ status: 'accepted' });
    expect(response.headers.has('set-cookie')).toBe(false); return { email, client };
  };
  const login = async (email: string, client?: Client) => {
    const before = client ?? await bootstrap(), response = await http('/api/v1/auth/login', 'POST', before, { email, password });
    expect(response.status).toBe(200); const auth = { cookie: response.headers.get('set-cookie')!.split(';')[0]!, csrf: (await response.json()).csrf as string };
    expect(auth.cookie).not.toBe(before.cookie); expect(auth.csrf).not.toBe(before.csrf); return auth;
  };
  const sid = (client: Client) => decodeURIComponent(client.cookie.split('=')[1]!).slice(2).split('.')[0]!;
  const key = (client: Client) => settings.prefix + sid(client);
  return { http, url:`http://127.0.0.1:${address.port}`, bootstrap, signup, login, key, sid, sessions, tenancy, authentication, credentials, connection, limits, settings, close: server.close };
}

const input = () => ({ name: 'Workspace', slug: 'ws-' + randomUUID() });
const create = (f: Awaited<ReturnType<typeof fixture>>, client: Client, body = input(), key = randomUUID()) => f.http('/api/v1/workspaces', 'POST', client, body, { 'idempotency-key': key });


async function owned(options:Parameters<typeof fixture>[0]={}) {
 const f=await fixture(options),{email}=await f.signup(),client=await f.login(email);
 const user=await database.client.passwordCredential.findUniqueOrThrow({where:{email},include:{identity:true}});
 const response=await create(f,client);expect(response.status).toBe(201);const ws=(await response.json()).workspace.id as string;
 const membership=await database.client.workspaceMembership.findUniqueOrThrow({where:{workspaceId_userId:{workspaceId:ws,userId:user.identity.userId}}});
 return {f,client,ws,userId:user.identity.userId,member:membership.id};
}
const teamInput=(suffix='')=>({name:'Team '+randomUUID()+suffix,key:'ENG',description:'Private description',color:'#5645d4'});
const path=(ws:string,id?:string)=>'/api/v1/workspaces/'+ws+'/teams'+(id?'/'+id:'');
async function make(o:Awaited<ReturnType<typeof owned>>,body=teamInput(),key=randomUUID()){
 const response=await o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key});expect(response.status).toBe(201);return {row:await response.json(),key,body};
}


test('native pool calibration and complete isolated Team directory request profiles',async()=>{
 expect(configuredPool).toBe(5); // Reviewed local environment; no resizing.
 const before=await metrics();let release!:()=>void,ready!:()=>void,count=0;
 const held=new Promise<void>(r=>release=r),allEntered=new Promise<void>(r=>ready=r);
 const holders=Array.from({length:configuredPool},()=>database.transaction(async tx=>{await tx.$queryRaw`SELECT 1`;if(++count===configuredPool)ready();await held;}));
 await allEntered;let admission=0;const begin=performance.now(),contender=database.transaction(async tx=>{admission=performance.now()-begin;await tx.$queryRaw`SELECT 1`;});
 await Bun.sleep(80);release();await Promise.all([...holders,contender]);const after=await metrics();
 const calibration={configuredConnections:configuredPool,heldMs:80,contenderCallToCallbackMs:admission,nativePoolWaitSumMs:metric(after,'prisma_client_queries_wait_histogram_ms').sum-metric(before,'prisma_client_queries_wait_histogram_ms').sum};
 expect(admission).toBeGreaterThan(60);expect(calibration.nativePoolWaitSumMs).toBeGreaterThan(60);
 const loads:unknown[]=[];
 for(const detailed of [true])for(const concurrency of [1,10,50]){
  const o=await owned(),t=await make(o),team=t.row.id as string;
  await database.transaction(async tx=>{await tx.$executeRaw`WITH u AS (INSERT INTO users(id,name) SELECT gen_random_uuid(),rpad('Profile member',120,'x') FROM generate_series(1,1000) RETURNING id), m AS (INSERT INTO workspace_memberships(id,workspace_id,user_id,role,status) SELECT gen_random_uuid(),${o.ws}::uuid,id,'MEMBER','ACTIVE' FROM u RETURNING id) INSERT INTO team_memberships(workspace_id,team_id,membership_id) SELECT ${o.ws}::uuid,${team}::uuid,id FROM m`;});
  traces.clear();queryEvents=[];
  const metricBefore=await metrics(),cpuBefore=process.cpuUsage(),wallStart=performance.now(),windowStartUnixUs=Date.now()*1000,eluBefore=performance.eventLoopUtilization();
  const delays:number[]=[];let tick=performance.now();const timer=setInterval(()=>{const now=performance.now();delays.push(Math.max(0,now-tick-10));tick=now;},10);
  const loop=monitorEventLoopDelay({resolution:10});loop.enable();
  let maxBusy=0,maxQueued=0,lockSamples=0,pgSamples=0,maxPgWaitMs=0,maxPgTransactions=0,maxPgIdleTransactions=0;const pgTransactionAges:number[]=[];let done=false;
  const poll=(async()=>{while(!done){const m=await metrics();maxBusy=Math.max(maxBusy,metric(m,'prisma_pool_connections_busy'));maxQueued=Math.max(maxQueued,metric(m,'prisma_client_queries_wait'));const waits=await admin.client.$queryRaw<{n:bigint;ms:number|null;transactions:bigint;idle:bigint;age:number|null}[]>`SELECT count(DISTINCT a.pid) FILTER(WHERE a.wait_event_type='Lock') AS n,max(extract(epoch FROM (clock_timestamp()-l.waitstart))*1000)::float8 AS ms,count(DISTINCT a.pid) FILTER(WHERE a.xact_start IS NOT NULL) AS transactions,count(DISTINCT a.pid) FILTER(WHERE a.state='idle in transaction') AS idle,max(extract(epoch FROM (clock_timestamp()-a.xact_start))*1000)::float8 AS age FROM pg_stat_activity a LEFT JOIN pg_locks l ON l.pid=a.pid AND NOT l.granted WHERE a.datname=${name}`;maxPgTransactions=Math.max(maxPgTransactions,Number(waits[0]!.transactions));maxPgIdleTransactions=Math.max(maxPgIdleTransactions,Number(waits[0]!.idle));if(waits[0]!.age!==null)pgTransactionAges.push(waits[0]!.age);pgSamples++;if(waits[0]!.n>0n)lockSamples++;maxPgWaitMs=Math.max(maxPgWaitMs,waits[0]!.ms??0);await Bun.sleep(10);}})();
  const child=Bun.spawn([process.execPath,'scripts/backend/team-directory-profile-client.ts'],{cwd:root,stdin:'pipe',stdout:'pipe',stderr:'pipe'});
  child.stdin.write(JSON.stringify({url:o.f.url+path(o.ws,team)+'/memberships?limit=20',origin:config.CORS_ORIGINS[0]!,cookie:o.client.cookie,concurrency,samples:50,detailed}));child.stdin.end();
  let results:{status:number;ms:number;bytes:number;items:number}[];
  try{const [exit,text]=await Promise.all([child.exited,new Response(child.stdout).text()]);expect(exit).toBe(0);results=JSON.parse(text);}finally{done=true;clearInterval(timer);loop.disable();await poll;}
  const wallMs=performance.now()-wallStart,cpu=process.cpuUsage(cpuBefore),elu=performance.eventLoopUtilization(eluBefore),metricAfter=await metrics();
  expect(results.every(r=>r.status===200&&r.items===20)).toBe(true);expect(traces.size).toBe(50);expect([...traces.values()].every(t=>t.status===200&&t.serverMs!==undefined)).toBe(true);
  const phaseNames=[...new Set([...traces.values()].flatMap(t=>t.spans.map(s=>s.name)))];const phases=Object.fromEntries(phaseNames.map(phase=>[phase,summary([...traces.values()].flatMap(t=>t.spans.filter(s=>s.name===phase).map(s=>s.ms)))]));
  const transactions=[...traces.values()].flatMap(t=>t.transactions);if(detailed)expect(transactions).toHaveLength(baseline?200:150);
  const stages=[...new Set(transactions.map(t=>t.stage))];const transactionStages=Object.fromEntries(stages.map(stage=>{const rows=transactions.filter(t=>t.stage===stage);return [stage,{admissionCallToCallback:summary(rows.map(t=>t.admissionMs)),callbackLifetime:summary(rows.map(t=>t.callbackMs)),commit:summary(rows.map(t=>t.commitMs)),totalLifetime:summary(rows.map(t=>t.totalMs))}];}));
  const waitBefore=metric(metricBefore,'prisma_client_queries_wait_histogram_ms'),waitAfter=metric(metricAfter,'prisma_client_queries_wait_histogram_ms'),sql=queryEvents!;queryEvents=null;expect(waitAfter.count-waitBefore.count).toBe(baseline?200:150);expect(sql.filter(s=>s.kind==='directory')).toHaveLength(50);
  loads.push({detailed,concurrency,success:summary(results.map(r=>r.ms)),server:summary([...traces.values()].map(t=>t.serverMs!)),statuses:{200:results.length},bytes:results[0]!.bytes,phases,transactionStages,nativePool:{connections:configuredPool,waitAcquisitions:waitAfter.count-waitBefore.count,totalWaitMs:waitAfter.sum-waitBefore.sum,maxBusy,maxQueued,meanWaitMsPerSuccessfulRequest:(waitAfter.sum-waitBefore.sum)/50},sql:{count:sql.length,directory:summary(sql.filter(s=>s.kind==='directory').map(s=>s.ms)),transactionControl:summary(sql.filter(s=>s.kind==='transaction-control').map(s=>s.ms)),authorizationAndOther:summary(sql.filter(s=>s.kind==='authorization-and-other').map(s=>s.ms))},serverProcess:{windowStartUnixUs,windowEndUnixUs:Date.now()*1000,wallMs,userCpuMs:cpu.user/1000,systemCpuMs:cpu.system/1000,cpuCoreEquivalent:(cpu.user+cpu.system)/1000/wallMs,eventLoopUtilizationReported:elu.utilization,eventLoopUtilizationUsable:elu.active>0||elu.idle>0,timerLagMs:summary(delays),eventLoopDelayP95Ms:loop.percentile(95)/1e6,eventLoopDelayMaxMs:loop.max/1e6},postgresLockSampling:{intervalMs:10,pgSamples,lockSamples,maxPgWaitMs,serverTransactionObservations:{maxPgTransactions,maxPgIdleTransactions,oldestTransactionAgeMs:summary(pgTransactionAges),note:'Sampled server xact_start ages, not a distribution of completed transaction lifetimes; callback/commit lifetimes reported independently.'}}});
 }
 await mkdir(resolve(root,'docs/backend/evidence/team-directory-admission'),{recursive:true});
 await writeFile(resolve(root,'docs/backend/evidence/team-directory-admission',`profile-${baseline?'before':'after'}-${repetition}${standalone?'-cpu':''}.json`),JSON.stringify({base:'1bfb1c3d2aca1cf9e741e41e59e30603589e7624',baseline,repetition,calibration,workload:'Separate Bun HTTP client process;50 requests per fresh legitimate account/Workspace at concurrency1/10/50,1,001 explicit joins,120-character names,limit20. No pool/rate/timeout changes or cache. Baseline reconstructs exactly the merged four-acquisition directory preflight; candidate uses the new three-acquisition port. Both use the same detailed observational spans.',loads,limitations:['Pinned Prisma6.19.3 private configOverride enables native metrics only in disposable fixture; production generated schema unchanged.','Pool wait is native aggregate; per-request call-to-callback includes pool, engine dispatch, BEGIN/isolation overhead.','Spans are nested and percentile sums are not additive.','10ms polling can miss short waits and adds measurement overhead.','CPU includes Rust engine and polling, excludes separate HTTP client. Finite local bursts, not production certification.']},null,2)+'\n');
},60000);

if(standalone){if(!setupRun||!cleanupRun||!profileRun)throw new Error('Missing profiling hooks');try{await setupRun();await profileRun();}finally{await cleanupRun();}}
