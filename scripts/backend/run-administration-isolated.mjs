// Owns ephemeral containers only. Does not read local .env files or use QA ports/volumes.
import {execFileSync,spawn} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {createConnection} from 'node:net';
const run=randomUUID(),containers=[],secret=()=>randomBytes(32).toString('hex');
const docker=(args,env=process.env)=>execFileSync('docker',args,{env,encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']}).trim();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const listening=port=>new Promise(resolve=>{const socket=createConnection({host:'127.0.0.1',port:Number(port)});socket.once('connect',()=>{socket.destroy();resolve(true);});socket.once('error',()=>resolve(false));socket.setTimeout(500,()=>{socket.destroy();resolve(false);});});
async function start(service,image,port,extra,environment){
 const name='unblok-be01b-'+service+'-'+run;
 docker(['run','--rm','-d','--name',name,'--label','unblok.be01b.run='+run,'-p',`127.0.0.1::${port}`,...extra,image,...(service==='cache'?['valkey-server','--requirepass',environment.PASSWORD]:[])],{...process.env,...environment});
 containers.push(name);const binding=docker(['port',name,port+'/tcp']);if(!/^127\.0\.0\.1:\d+$/.test(binding))throw new Error('Nonisolated binding');return binding.split(':')[1];
}
async function main(){try{
 const pgSecret=secret(),cacheSecret=secret();
 const pg=await start('postgres','postgres:17-alpine@sha256:18cfe3ef5e6815560c98237d6216d1e5119702fb0f3894c8785dd58b8bbe5d73',5432,['-e','POSTGRES_PASSWORD','-e','POSTGRES_USER=unblok','-e','POSTGRES_DB=unblok_be01b'],{POSTGRES_PASSWORD:pgSecret});
 const cache=await start('cache','valkey/valkey:9-alpine@sha256:48332870af354a799964c0012ae1194a0bf2bf894eb508f945810596dc2d8d11',6379,[],{PASSWORD:cacheSecret});
 let ready=false;for(let i=0;i<100;i++){try{docker(['exec',containers[0],'pg_isready','-h','127.0.0.1','-U','unblok','-d','unblok_be01b']);if(await listening(pg)&&await listening(cache)){ready=true;break;}}catch{/* Initial PostgreSQL socket may precede its final TCP listener. */}await delay(100);}if(!ready)throw new Error('Owned PostgreSQL/Valkey not ready');
 const env={...process.env,NODE_ENV:'test',DATABASE_URL:`postgresql://unblok:${pgSecret}@127.0.0.1:${pg}/unblok_be01b`,REDIS_URL:`redis://:${cacheSecret}@127.0.0.1:${cache}/0`,CORS_ORIGINS:'http://127.0.0.1:3000',LOG_LEVEL:'silent',EMAIL_MAIL_ENDPOINT:'http://127.0.0.1:1/api/v1/send',EMAIL_MAIL_FROM:'test@example.test'};
 for(const key of ['SESSION_SECRETS','EMAIL_VERIFICATION_KEY','PASSWORD_RECOVERY_KEY','WORKSPACE_CURSOR_KEY','WORKSPACE_IDEMPOTENCY_KEY','WORKSPACE_INVITATION_KEY'])env[key]=secret();
 for(const key of ['EMAIL_VERIFICATION_KEY_ID','PASSWORD_RECOVERY_KEY_ID','WORKSPACE_CURSOR_KEY_ID','WORKSPACE_INVITATION_KEY_ID'])env[key]='be01b';
 const args=process.argv.slice(2);if(!args.length)args.push('scripts/backend/workspace-administration.test.ts');
 console.log('Disposable PostgreSQL/Valkey ready; credentials withheld. Tests: '+args.join(' '));
 const child=spawn(process.execPath,['test','--no-env-file',...args],{cwd:resolve(import.meta.dirname,'../..'),env,stdio:'inherit'});
 process.exitCode=await new Promise((r,j)=>{child.once('error',j);child.once('exit',code=>r(code??1));});
 }finally{for(const name of containers.reverse()){if(docker(['inspect','--format','{{index .Config.Labels "unblok.be01b.run"}}',name])!==run)throw new Error('Ownership mismatch; cleanup refused');docker(['stop','-t','2',name]);}console.log('Owned service containers stopped; shared QA untouched.');}}
main().catch(()=>{console.error('Isolated verification failed; infrastructure credentials withheld.');process.exitCode=1;});
