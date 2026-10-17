// Owns all infrastructure. Never reads QA environment files or calls shared Mailpit.
const {execFileSync,spawn}=require('node:child_process');
const {randomUUID,randomBytes}=require('node:crypto');
const {createServer}=require('node:net');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {DisposableMailpit}=require('../test-support/mailpit.cjs');
const root=path.resolve(__dirname,'../..');
const imagePG='postgres:17.6-alpine@sha256:ef257d85f76e48da1c64832459b59fcaba1a4dac97bf5d7450c77753542eee94';
const imageKV='valkey/valkey:8.1.3-alpine@sha256:d827e7f7552cdee40cc7482dbae9da020f42bc47669af6f71182a4ef76a22773';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise((resolve,reject)=>{const s=createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
async function main(){
 const out=process.env.FE_INTEGRATION_EVIDENCE_DIR;if(!out||!path.isAbsolute(out)||path.resolve(out).startsWith(root+path.sep))throw Error('Set an absolute evidence directory outside the repository.');
 fs.mkdirSync(out,{recursive:true});
 const preload=path.join(out,'prisma-node-preload.ts');fs.writeFileSync(preload,"Object.defineProperty(process,'execPath',{value:process.env.FE_NODE_EXECUTABLE});\n");
 const run=randomUUID(),names=[],children=[],mail=new DisposableMailpit(),logs=[];let vite;
 const env={...process.env,FE_NODE_EXECUTABLE:process.execPath,NODE_ENV:'test',LOG_LEVEL:'warn',API_HOST:'127.0.0.1',SESSION_NAMESPACE:'fei-'+run.replaceAll('-',''),SESSION_TRUSTED_PROXIES:'',SESSION_CROSS_ORIGIN:'false',EMAIL_VERIFICATION_KEY_ID:'v1',PASSWORD_RECOVERY_KEY_ID:'v1',WORKSPACE_INVITATION_KEY_ID:'v1',WORKSPACE_CURSOR_KEY_ID:'v1',WORKSPACE_CURSOR_PREVIOUS_KEY:'',WORKSPACE_CURSOR_PREVIOUS_KEY_ID:'',EMAIL_MAIL_FROM:'noreply@example.test',EMAIL_MAIL_USERNAME:'',EMAIL_MAIL_PASSWORD:''};
 for(const key of ['SESSION_SECRETS','EMAIL_VERIFICATION_KEY','PASSWORD_RECOVERY_KEY','WORKSPACE_INVITATION_KEY','WORKSPACE_CURSOR_KEY','WORKSPACE_IDEMPOTENCY_KEY'])env[key]=randomBytes(32).toString('hex');
 const docker=(args,extra={})=>execFileSync('docker',args,{encoding:'utf8',timeout:30000,env:{...env,...extra},stdio:['ignore','pipe','pipe']}).trim();
 const start=(name,args)=>{const file=path.join(out,name+'.log');fs.writeFileSync(file,'');const child=spawn('bun',args[0]==='test'?['test','--no-env-file',...(name==='backend-unit'?[]:['--preload',preload]),...args.slice(1)]:['--no-env-file',...args],{cwd:root,env,stdio:['ignore','pipe','pipe'],windowsHide:true});child.stdout.on('data',chunk=>fs.appendFileSync(file,chunk));child.stderr.on('data',chunk=>fs.appendFileSync(file,chunk));children.push(child);fs.appendFileSync(path.join(out,'processes.jsonl'),JSON.stringify({name,pid:child.pid,event:'spawn'})+'\n');child.on('error',error=>fs.appendFileSync(file,'Process error: '+error.code+'\n'));child.on('exit',(code,signal)=>fs.appendFileSync(path.join(out,'processes.jsonl'),JSON.stringify({name,pid:child.pid,event:'exit',code,signal})+'\n'));return child;};
 const evidence={base:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),isolation:'Owned PostgreSQL + Valkey + disposable sentinel-protected Mailpit; ephemeral loopback ports; no shared volumes or QA environment files',commands:[],passed:[],failures:[]};
 try{
  for(const [kind,image,containerPort,extra,args] of [
   ['pg',imagePG,'5432/tcp',{POSTGRES_PASSWORD:randomBytes(24).toString('hex')},['-e','POSTGRES_PASSWORD','-e','POSTGRES_USER=unblok','-e','POSTGRES_DB=unblok','--tmpfs','/var/lib/postgresql/data']],
   ['kv',imageKV,'6379/tcp',{VALKEY_PASSWORD:randomBytes(24).toString('hex')},['-e','VALKEY_PASSWORD','--entrypoint','/bin/sh']]]){
    const name='unblok-fei-'+kind+'-'+run;const command=['run','--rm','-d','--name',name,'--label','unblok.fe-integration.run='+run,'-p','127.0.0.1::'+containerPort.split('/')[0],...args,image,...(kind==='kv'?['-ec','exec valkey-server --requirepass "$VALKEY_PASSWORD" --save "" --appendonly no']:[])];
    docker(command,extra);names.push(name);const binding=docker(['port',name,containerPort]);if(!/^127\.0\.0\.1:\d+$/.test(binding))throw Error('Invalid owned loopback binding');
    if(kind==='pg'){env.DATABASE_URL='postgresql://unblok:'+extra.POSTGRES_PASSWORD+'@'+binding+'/unblok';for(let i=0;i<60;i++){try{docker(['exec',name,'pg_isready','-U','unblok','-d','unblok']);break;}catch{await pause(150);}}}
    else env.REDIS_URL='redis://:'+extra.VALKEY_PASSWORD+'@'+binding+'/0';
  }
  await mail.start();env.EMAIL_MAIL_ENDPOINT=mail.url('/api/v1/send');
  const migration=execFileSync('node',['packages/database/node_modules/prisma/build/index.js','migrate','deploy','--schema','packages/database/prisma/schema.prisma'],{cwd:root,env,encoding:'utf8',timeout:60000,stdio:['ignore','pipe','pipe']});
  const count=docker(['exec',names[0],'psql','-U','unblok','-d','unblok','-Atc','SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;']);
  if(count!=='13')throw Error('Expected all 13 migrations in owned test database');evidence.migrations={applied:Number(count),scope:'owned disposable test database only'};
  env.API_PORT=String(await port());const webPort=await port();env.CORS_ORIGINS='http://127.0.0.1:'+webPort;
  const api=start('api',['apps/api/src/main.ts']),worker=start('worker',['apps/worker/src/main.ts']);
  const readiness={responses:{},connectionErrors:{}};evidence.readiness=readiness;let ready=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:'+env.API_PORT+'/ready');readiness.responses[r.status]=(readiness.responses[r.status]||0)+1;if(r.status===200){ready=true;break;}}catch(error){const code=error.cause?.code||error.code||error.name;readiness.connectionErrors[code]=(readiness.connectionErrors[code]||0)+1;}if(api.exitCode!==null)throw Error('Owned API stopped; inspect redacted API log');await pause(150);}if(!ready)throw Error('Owned API did not become ready');
  evidence.api={ready:200,live:(await fetch('http://127.0.0.1:'+env.API_PORT+'/live')).status};if(evidence.api.live!==200)throw Error('Owned API liveness failed');
  if(!process.argv.includes('--backend-only')){
  const viteModule=await import(pathToFileURL(require.resolve('vite',{paths:[path.join(root,'apps/web')]})).href);
  // Do not allow ignored QA env files or inherited VITE_AUTH_API_ORIGIN to
  // redirect this disposable browser suite away from its owned API proxy.
  if(process.argv.includes('--production')){
   const config={root:path.join(root,'apps/web'),configFile:path.join(root,'apps/web/vite.config.ts'),envDir:false,define:{'import.meta.env.VITE_AUTH_API_ORIGIN':JSON.stringify('')},build:{outDir:path.join(out,'web-dist'),emptyOutDir:false}};
   await viteModule.build(config);const preview=await viteModule.preview({...config,preview:{host:'127.0.0.1',port:webPort,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:'+env.API_PORT,changeOrigin:false}}}});vite={close:()=>new Promise((resolve,reject)=>preview.httpServer.close(error=>error?reject(error):resolve()))};
  }else{
  vite=await viteModule.createServer({root:path.join(root,'apps/web'),cacheDir:path.join(out,'vite-cache'),configFile:path.join(root,'apps/web/vite.config.ts'),envDir:false,define:{'import.meta.env.VITE_AUTH_API_ORIGIN':JSON.stringify('')},server:{host:'127.0.0.1',port:webPort,strictPort:true,hmr:false,watch:null,proxy:{'/api':{target:'http://127.0.0.1:'+env.API_PORT,changeOrigin:false}}}});await vite.listen();
  }
  evidence.frontendIsolation={envFiles:false,authApiOrigin:'owned same-origin proxy',hmr:false,watch:false};
  }
  if(process.argv.includes('--backend-only'))evidence.skipped=[{suite:'Chromium',reason:'Explicit --backend-only selection; browser gates are reported separately.'}];
  else await require(process.argv.includes('--01d')?'./fe-integration-01d-journeys.cjs':process.argv.includes('--01c')?'./fe-integration-01c-journeys.cjs':process.argv.includes('--01b')?'./fe-integration-01b-journeys.cjs':'./fe-integration-01a-journeys.cjs')({base:env.CORS_ORIGINS,out,mail,evidence,seedOwnedTeams:async(workspace,membership)=>{
   if(![workspace,membership].every(v=>/^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(v)))throw Error('Invalid owned Team fixture scope');
   if(docker(['inspect','--format','{{index .Config.Labels "unblok.fe-integration.run"}}',names[0]])!==run)throw Error('Owned database label mismatch');
   const eligible=docker(['exec',names[0],'psql','-U','unblok','-d','unblok','-Atc',`SELECT EXISTS(SELECT 1 FROM workspace_memberships m JOIN users u ON u.id=m.user_id WHERE m.workspace_id='${workspace}' AND m.id='${membership}' AND m.status='ACTIVE' AND m.role='ADMIN' AND u.email LIKE 'fe01c-%@example.test');`]);if(eligible!=='t')throw Error('Expected owned QA actor');
   docker(['exec',names[0],'psql','-v','ON_ERROR_STOP=1','-U','unblok','-d','unblok','-Atc',`BEGIN; CREATE TEMP TABLE fe_team_pages AS SELECT gen_random_uuid() id,g FROM generate_series(1,21) g; INSERT INTO teams(workspace_id,id,key,name,owner_membership_id) SELECT '${workspace}'::uuid,id,'PG'||lpad(g::text,3,'0'),'Owned pagination Team '||g,'${membership}'::uuid FROM fe_team_pages; INSERT INTO team_memberships(workspace_id,team_id,membership_id) SELECT '${workspace}'::uuid,id,'${membership}'::uuid FROM fe_team_pages; COMMIT;`]);evidence.fixtureSeed={teams:21,scope:'owned disposable database only; all Team reads and creation/metadata journeys still use real APIs'};
  },seedOwnedMembers:async(workspace,team,membership)=>{
   if(![workspace,team,membership].every(v=>/^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(v)))throw Error('Invalid owned member fixture scope');
   if(docker(['inspect','--format','{{index .Config.Labels "unblok.fe-integration.run"}}',names[0]])!==run)throw Error('Owned database label mismatch');
   const eligible=docker(['exec',names[0],'psql','-U','unblok','-d','unblok','-Atc',`SELECT EXISTS(SELECT 1 FROM teams t JOIN workspace_memberships m ON m.workspace_id=t.workspace_id AND m.id=t.owner_membership_id JOIN users u ON u.id=m.user_id WHERE t.workspace_id='${workspace}' AND t.id='${team}' AND m.id='${membership}' AND m.status='ACTIVE' AND m.role='ADMIN' AND u.email LIKE 'fe01c-%@example.test');`]);if(eligible!=='t')throw Error('Expected owned Team owner');
   docker(['exec',names[0],'psql','-v','ON_ERROR_STOP=1','-U','unblok','-d','unblok','-Atc',`BEGIN; CREATE TEMP TABLE fe_member_pages AS SELECT gen_random_uuid() uid,gen_random_uuid() mid,g FROM generate_series(1,21) g; INSERT INTO users(id,name,email) SELECT uid,'Owned pagination member '||lpad(g::text,2,'0'),'fe01c-member-'||uid||'@example.test' FROM fe_member_pages; INSERT INTO workspace_memberships(workspace_id,id,user_id,role,status,joined_at) SELECT '${workspace}'::uuid,mid,uid,'MEMBER','ACTIVE',now() FROM fe_member_pages; INSERT INTO team_memberships(workspace_id,team_id,membership_id) SELECT '${workspace}'::uuid,'${team}'::uuid,mid FROM fe_member_pages; COMMIT;`]);
   evidence.memberFixtureSeed={members:21,scope:'owned disposable database only; real owner plus 21 fixture members; real bounded API reads'};
  },seedExpiredTransfer:async(workspace,team,successor)=>{
   if(![workspace,team,successor].every(v=>/^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(v)))throw Error('Invalid owned consent fixture');
   if(docker(['inspect','--format','{{index .Config.Labels "unblok.fe-integration.run"}}',names[0]])!==run)throw Error('Owned database label mismatch');
   // Create a past, never-issued test intent under the real constraints. Never mutate
   // an issued immutable consent, disable triggers, or access a shared database.
   const result=docker(['exec',names[0],'psql','-v','ON_ERROR_STOP=1','-U','unblok','-d','unblok','-Atc',`INSERT INTO team_transfer_intents(workspace_id,team_id,request_id,initiator_membership_id,successor_membership_id,initiator_user_id,successor_user_id,source_family_id,initiator_epoch,successor_epoch,base_version,policy_revision,state,issued_at,expires_at) SELECT t.workspace_id,t.id,gen_random_uuid(),m.id,sm.id,u.id,su.id,f.id,u.auth_epoch,su.auth_epoch,t.version,r.revision,'PENDING',statement_timestamp()-interval '16 minutes',statement_timestamp()-interval '1 minute' FROM teams t JOIN workspace_memberships m ON m.workspace_id=t.workspace_id AND m.id=t.owner_membership_id JOIN users u ON u.id=m.user_id JOIN workspace_memberships sm ON sm.workspace_id=t.workspace_id AND sm.id='${successor}' JOIN users su ON su.id=sm.user_id JOIN team_memberships j ON j.workspace_id=t.workspace_id AND j.team_id=t.id AND j.membership_id=sm.id JOIN workspace_policy_revisions r ON r.workspace_id=t.workspace_id JOIN LATERAL (SELECT id FROM auth_session_families WHERE user_id=u.id AND auth_epoch=u.auth_epoch AND revoked_at IS NULL AND absolute_expires_at>clock_timestamp() AND idle_expires_at>clock_timestamp() LIMIT 1) f ON true WHERE t.workspace_id='${workspace}' AND t.id='${team}' AND u.email LIKE 'fe01d-%@example.test' AND su.email LIKE 'fe01d-%@example.test' AND m.role='ADMIN' AND m.status='ACTIVE' AND sm.role='ADMIN' AND sm.status='ACTIVE' AND j.team_role='MEMBER' RETURNING request_id;`]);
   if(!/^[0-9a-f-]{36}\nINSERT 0 1$/.test(result))throw Error('Expected exactly one owned expired-consent fixture');evidence.consentExpiryFixture={scope:'owned disposable database only',effect:'Inserted a past test intent using actual constraints; no issued consent mutation or trigger bypass'};return result.split('\n')[0];
  },revokeOwnedMember:async(workspaceId,email)=>{
   if(!/^[0-9a-f-]{36}$/.test(workspaceId)||!/^fei-invite-[0-9a-f]+@example\.test$/.test(email))throw Error('Invalid owned revocation fixture');
   // Fixture mutation is restricted to this runner's own disposable PostgreSQL container.
   const changed=docker(['exec',names[0],'psql','-U','unblok','-d','unblok','-Atc',`UPDATE workspace_memberships SET status='SUSPENDED' WHERE workspace_id='${workspaceId}' AND user_id=(SELECT id FROM users WHERE email='${email}') AND role='MEMBER' AND status='ACTIVE' RETURNING id;`]);
   if(!/^[0-9a-f-]{36}\s+UPDATE 1$/.test(changed))throw Error('Expected exactly one owned member revocation');
  }});
  // Browser-only processes are no longer needed. Do not contend with or write
  // alongside the independent backend regression fixtures.
  if(vite){await vite.close();vite=undefined;}
  for(const child of [api,worker]){if(child.exitCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;}}
  // Read-only source/regression checks run against owned infrastructure, never ignored QA config.
  for(const [label,args] of (process.argv.includes('--browser-only')?[]:process.argv.includes('--management-only')?[['team-management',['test','scripts/backend/team-management.test.ts']]]:process.argv.includes('--01c')?[
   ['teams',['test','scripts/backend/teams.test.ts']],
   ['team-management',['test','scripts/backend/team-management.test.ts']],
   ['tenancy',['test','scripts/backend/tenancy.test.ts']],
   ['auth-fences',['test','scripts/backend/auth-fences.test.ts']]
  ]:[
   ['backend-unit',['test','apps/api/test','apps/worker/test','packages/backend-runtime/test','scripts/backend/architecture.test.ts']],
   ['auth-session',['test','apps/api/verification/authentication-integration.test.ts','apps/api/verification/session-integration.test.ts']],
   ['tenancy-fences',['test','scripts/backend/tenancy.test.ts','scripts/backend/auth-fences.test.ts']]])){
    const child=start(label,args);const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});evidence.commands.push({label,command:'bun test --no-env-file '+(label==='backend-unit'?'':'--preload <evidence>/prisma-node-preload.ts ')+args.slice(1).join(' '),exitCode:code});if(code!==0)evidence.failures.push(label);
  }
  await mail.assertSentinels();evidence.mail={sentinelsPreserved:2,sharedMailpitAccessed:false,deletions:0};
 }catch(error){evidence.failures.push(error.message);process.exitCode=1;}
 finally{
  if(vite)await vite.close();for(const child of children)if(child.exitCode===null)child.kill();for(const file of logs)fs.closeSync(file);
  try{await mail.assertSentinels();evidence.mail={sentinelsPreserved:2,sharedMailpitAccessed:false,deletions:0};await mail.close();}catch(e){evidence.failures.push(e.message);process.exitCode=1;}
  for(const name of names.reverse()){if(docker(['inspect','--format','{{index .Config.Labels "unblok.fe-integration.run"}}',name])!==run)throw Error('Container ownership mismatch');docker(['rm','-f',name]);}
  fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({passed:evidence.passed.length,failures:evidence.failures,output:out}));if(evidence.failures.length)process.exitCode=1;
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
