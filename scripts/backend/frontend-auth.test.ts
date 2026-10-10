import {afterAll,beforeAll,expect,test} from 'bun:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {Database,AccountCredentials,AuthFences,Tenancy,denyAll,PasswordRecovery,VerificationDelivery,RecoveryDelivery} from '@unblok/database';
import {createLogger,createRedis,loadApiConfig,loadVerificationMail} from '@unblok/backend-runtime';
import {createApp} from '../../apps/api/src/app';
import {RedisRateLimiter} from '../../apps/api/src/security';
import {Sessions,connectSessionStore,sessionSettings} from '../../apps/api/src/modules/sessions';
import {Authentication,AuthenticationLimits,Passwords} from '../../apps/api/src/modules/auth';
import {startVerificationDispatcher} from '../../apps/worker/src/jobs/email-verification';
import {AuthApi} from '../../apps/web/src/features/auth/api/authApi';
import {SessionStore} from '../../apps/web/src/features/auth/session/SessionStore';

// Real HTTP integration of the shipped frontend client. This explicit cookie jar
// is test-only and does not certify browser cookie/CORS/Fetch Metadata behavior.
const config=loadApiConfig(process.env),root=resolve(import.meta.dir,'../..');
const name=`unblok_feauth_${randomUUID().replaceAll('-','')}`,admin=new Database(config.DATABASE_URL);
const url=new URL(config.DATABASE_URL);url.pathname=`/${name}`;
const database=new Database(url.toString()),cache=createRedis(config.REDIS_URL);
cache.on('error',()=>{});
const prefix=`feauth:test:${randomUUID()}:`,verificationKey={id:'test-v1',secret:randomBytes(32).toString('hex')},recoveryKey={id:'reset-v1',secret:randomBytes(32).toString('hex')};
const stops:Array<()=>Promise<void>>=[],messages=new Set<string>();let created=false;
beforeAll(async()=>{
  await admin.connect();await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`);created=true;
  const child=Bun.spawn([process.execPath,'packages/database/node_modules/prisma/build/index.js','migrate','deploy','--schema','packages/database/prisma/schema.prisma'],{cwd:root,env:{...process.env,DATABASE_URL:url.toString()},stdout:'ignore',stderr:'ignore'});
  const timer=setTimeout(()=>child.kill('SIGKILL'),6000);try{expect(await child.exited).toBe(0);}finally{clearTimeout(timer);}
  await database.connect();await cache.connect();
},30000);
afterAll(async()=>{
  try{for(const stop of stops.reverse())await stop();if(messages.size)expect((await fetch('http://127.0.0.1:8025/api/v1/messages',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({IDs:[...messages]})})).ok).toBe(true);}
  finally{try{if(cache.status==='ready'){const keys=await cache.keys(prefix+'*');if(keys.length)await cache.del(...keys);}}finally{cache.disconnect();await database.close();try{if(created)await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);}finally{await admin.close();}}}
},10000);
async function fixture(){
  const settings={...sessionSettings(config,{SESSION_SECRETS:randomBytes(32).toString('hex'),SESSION_NAMESPACE:'test'}),prefix};
  const connection=await connectSessionStore(config.REDIS_URL,settings),credentials=new AccountCredentials(database),fences=new AuthFences(database);
  const auth=new Authentication({create:i=>credentials.create(i),lookup:e=>credentials.lookup(e),confirm:s=>credentials.confirm(s)},await Passwords.create(),new AuthenticationLimits(cache,settings.secrets[0]!,prefix),new PasswordRecovery(database,recoveryKey));
  const sessions=new Sessions(connection.store,settings,{create:i=>fences.create(i),rotate:(e,d,idle)=>fences.rotate(e,d,idle),revoke:e=>fences.revoke(e),revokeAll:id=>fences.revokeAll(id)},a=>auth.resolveIdentity(a));
  const tenancy=new Tenancy(database,{verify:async()=>null},denyAll,sessions,verificationKey);sessions.bind(tenancy);auth.bind(sessions,tenancy);
  const server=await createApp(config,{databaseReady:()=>database.ready(),queueReady:async()=>await cache.ping()==='PONG',close:()=>connection.close()},new RedisRateLimiter(cache,120,60000,prefix+'coarse:'),createLogger('silent'),sessions,auth);
  await server.app.listen(0,'127.0.0.1');stops.push(server.close);
  const address=server.app.getHttpServer().address();if(!address||typeof address==='string')throw new Error('Test listener missing');
  const origin=`http://127.0.0.1:${address.port}`;
  const client=()=>{
    let cookie='';
    const transport=(async(input,options)=>{
      expect(options?.credentials).toBe('include');expect(options?.cache).toBe('no-store');
      const headers=new Headers(options?.headers);headers.set('Origin',config.CORS_ORIGINS[0]!);if(cookie)headers.set('Cookie',cookie);
      const response=await fetch(input,{...options,headers});
      const set=response.headers.get('set-cookie');if(set){expect(set.toLowerCase()).toContain('httponly');expect(set.toLowerCase()).toContain('samesite=lax');cookie=set.includes('Expires=Thu, 01 Jan 1970')?'':set.split(';')[0]!;}
      expect(response.headers.get('cache-control')).toBe('no-store');return response;
    }) as typeof fetch;
    return new SessionStore(new AuthApi(origin,transport));
  };
  return {client};
}
async function deliver(email:string,recovery=false){
  const mail=loadVerificationMail({NODE_ENV:'test',EMAIL_MAIL_ENDPOINT:'http://127.0.0.1:8025/api/v1/send',EMAIL_MAIL_FROM:'verify@unblok.local'});
  const sender=startVerificationDispatcher({once:async()=>false},mail,createLogger('silent'),recovery?'recovery':'verification');
  try{const delivery=recovery?new RecoveryDelivery(database,recoveryKey):new VerificationDelivery(database,verificationKey);expect(await delivery.once(sender.send)).toBe(true);}finally{await sender.close();}
  const listing=await (await fetch('http://127.0.0.1:8025/api/v1/messages?limit=500')).json() as {messages:Array<{ID:string;To:Array<{Address:string}>}>};
  const found=listing.messages.find(m=>m.To.some(r=>r.Address===email));expect(found).toBeDefined();messages.add(found!.ID);
  const body=await (await fetch(`http://127.0.0.1:8025/api/v1/message/${found!.ID}`)).json() as {Text:string};
  const proof=/[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}/.exec(body.Text)?.[0];if(!proof)throw new Error('Owned mail proof missing');return proof;
}
test('shipped frontend client: signup, login, restoration, mail verification/recovery and all-session revocation',async()=>{
  const f=await fixture(),s=f.client(),email=`${randomUUID()}@example.test`,password='A long private frontend test password';
  await s.refresh();expect(s.snapshot().status).toBe('anonymous');
  await s.submit(()=>s.api.signup({name:'Frontend Account',email,password}));expect(s.snapshot().status).toBe('anonymous');
  console.info('FE HTTP: initial login');await s.login({email,password});expect(s.snapshot().user).toMatchObject({name:'Frontend Account',email,emailVerified:false});
  await s.refresh();expect(s.snapshot().status).toBe('authenticated');
  await s.submit(()=>s.api.requestVerification());await s.verify(await deliver(email));expect(s.snapshot().user?.emailVerified).toBe(true);
  const other=f.client();console.info('FE HTTP: second session');await other.login({email,password});
  await s.logout(true);await other.refresh();expect(other.snapshot().status).toBe('anonymous');
  console.info('FE HTTP: login after logout-all');await s.login({email,password});await s.submit(()=>s.api.requestRecovery(email));
  const proof=await deliver(email,true),newPassword='A new long private frontend test password';
  const anonymous=f.client();await anonymous.refresh();await anonymous.reset({email,token:proof,password:newPassword});expect(anonymous.snapshot().status).toBe('anonymous');
  await s.refresh();expect(s.snapshot().status).toBe('anonymous');
  await expect(anonymous.login({email,password})).rejects.toMatchObject({status:401});
  console.info('FE HTTP: login after reset');await anonymous.login({email,password:newPassword});expect(anonymous.snapshot().user?.emailVerified).toBe(true);
  await anonymous.logout();await anonymous.refresh();expect(anonymous.snapshot().status).toBe('anonymous');
},30000);
