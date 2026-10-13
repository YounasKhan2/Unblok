import 'reflect-metadata';
import {test,expect} from 'bun:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Database,AccountCredentials,AuthFences,Tenancy,denyAll} from '@unblok/database';
import {createLogger,createRedis,loadApiConfig} from '@unblok/backend-runtime';
import {createApp} from '../src/app';
import {RedisRateLimiter} from '../src/security';
import {Sessions,connectSessionStore,sessionSettings} from '../src/modules/sessions';
import {Authentication,AuthenticationLimits,Passwords} from '../src/modules/auth';
import {Workspaces,WorkspaceLimits} from '../src/modules/workspaces';

// Narrow type surface for the externally supplied runner; no dependency edge.
interface Locator {waitFor(options?:{state:string}):Promise<void>;fill(value:string):Promise<void>;click():Promise<void>;count():Promise<number>;isDisabled():Promise<boolean>;getAttribute(name:string):Promise<string|null>;first():Locator;filter(options:{hasText:string}):Locator;evaluate<T>(run:(element:HTMLElement)=>T):Promise<T>}
interface BrowserRoute {request():{method():string;allHeaders():Promise<Record<string,string>>};continue():Promise<void>;fetch():Promise<{status():number}>;abort(reason?:string):Promise<void>}
interface Page {goto(url:string):Promise<unknown>;url():string;reload():Promise<unknown>;getByRole(role:string,options?:{name?:string;exact?:boolean}):Locator;getByLabel(label:string,options?:{exact?:boolean}):Locator;getByText(text:string,options?:{exact?:boolean}):Locator;locator(selector:string):Locator;route(pattern:string|RegExp,handler:(route:BrowserRoute)=>Promise<void>):Promise<void>;unroute(pattern:string):Promise<void>;setViewportSize(size:{width:number;height:number}):Promise<void>;emulateMedia(options:{colorScheme:string}):Promise<void>;evaluate<T>(run:()=>T):Promise<T>;screenshot(options:{path:string;fullPage:boolean;animations:string}):Promise<unknown>;keyboard:{press(key:string):Promise<void>}}
interface BrowserContext {newPage():Promise<Page>;route(pattern:RegExp,handler:(route:BrowserRoute)=>Promise<void>):Promise<void>;close():Promise<void>}
interface Browser {version():string;newContext(options:{viewport:{width:number;height:number};deviceScaleFactor:number;colorScheme:string}):Promise<BrowserContext>;close():Promise<void>}

// Operator-provided bundled browser runner: no installed/changed dependencies.
// Requires Vite on localhost:3000; owns API port4000 and an isolated database.
test('FE-WS-01 real Chromium / PostgreSQL / Valkey workspace flows',async()=>{
  const config=loadApiConfig(process.env),name='unblok_fews_'+randomUUID().replaceAll('-','');
  const url=new URL(config.DATABASE_URL);url.pathname='/'+name;
  const admin=new Database(config.DATABASE_URL),database=new Database(url.toString()),cache=createRedis(config.REDIS_URL);
  const correction=process.env.FE_WS_CORRECTION_ONLY==='1';
  const prefix='fews:test:'+randomUUID()+':',output=resolve(correction?'docs/frontend/evidence/fe-ws-01-correction':'docs/frontend/evidence/fe-ws-01');await mkdir(output,{recursive:true});
  const evidence:{[key:string]:unknown}={base:'73abe14d7101cba58636a2b7acd9b1b9339a5004',transport:'real Chromium / same-origin Vite proxy / isolated PostgreSQL / Valkey',productionCertified:false,passed:[],visuals:[]};
  const passed=evidence.passed as string[],visuals=evidence.visuals as unknown[];
  let owned=false,browser:Browser|undefined,server:Awaited<ReturnType<typeof createApp>>|undefined,connection:Awaited<ReturnType<typeof connectSessionStore>>|undefined,step='setup';cache.on('error',()=>{});
  try{
    await admin.connect();await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`);owned=true;
    const migration=Bun.spawn([process.execPath,'packages/database/node_modules/prisma/build/index.js','migrate','deploy','--schema','packages/database/prisma/schema.prisma'],{cwd:resolve(import.meta.dir,'../../..'),env:{...process.env,DATABASE_URL:url.toString()},stdout:'pipe',stderr:'pipe'});
    const timer=setTimeout(()=>migration.kill('SIGKILL'),6000);try{const [exit,out,err]=await Promise.all([migration.exited,new Response(migration.stdout).text(),new Response(migration.stderr).text()]);evidence.migration={exitCode:exit,appliedCount:(out.match(/Applying migration/g)??[]).length,errorCodes:err.match(/P\d{4}/g)??[]};expect(exit).toBe(0);}finally{clearTimeout(timer);}
    await database.connect();await cache.connect();
    const settings={...sessionSettings(config,{SESSION_SECRETS:randomBytes(32).toString('hex'),SESSION_NAMESPACE:'test'}),prefix};
    connection=await connectSessionStore(config.REDIS_URL,settings);const fences=new AuthFences(database),credentials=new AccountCredentials(database);
    const authentication=new Authentication(credentials,await Passwords.create(),new AuthenticationLimits(cache,settings.secrets[0]!,prefix));
    const sessions=new Sessions(connection.store,settings,{create:i=>fences.create(i),rotate:(e,d,idle)=>fences.rotate(e,d,idle),revoke:e=>fences.revoke(e),retireSid:d=>fences.retireSid(d),revokeAll:id=>fences.revokeAll(id)},a=>authentication.resolveIdentity(a));
    const keys={active:'test-v1',cursors:{'test-v1':randomBytes(32).toString('hex')},idempotency:randomBytes(32).toString('hex')};
    const tenancy=new Tenancy(database,{verify:async()=>null},denyAll,sessions,undefined,keys);sessions.bind(tenancy);authentication.bind(sessions,tenancy);
    server=await createApp(config,{databaseReady:()=>database.ready(),queueReady:async()=>await cache.ping()==='PONG',close:()=>connection!.close()},new RedisRateLimiter(cache,120,60000,prefix+'coarse:'),createLogger('silent'),sessions,authentication,new Workspaces(sessions,tenancy,new WorkspaceLimits(cache,settings.secrets[0]!,prefix)));
    await server.app.listen(4000,'127.0.0.1');const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE!) as {chromium:{launch(options:{headless:boolean}):Promise<Browser>}};browser=await chromium.launch({headless:true});evidence.browser=browser.version();
    const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,colorScheme:'light'});
    // Remote Google Fonts did not settle in this host. Exercise documented CSS
    // fallback deterministically; this does not certify the deployed Inter font.
    await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,route=>route.abort());evidence.fontMode='remote fonts blocked; existing system fallback';
    const page=await context.newPage();
    const email='fews-'+randomUUID()+'@example.test',password='A private browser password '+randomUUID(),base='http://localhost:3000';
    const heading=async(text:string)=>page.getByRole('heading',{name:text,exact:true}).waitFor();
    const signup=async(address:string)=>{await page.goto(base+'/signup');await page.getByLabel('Full name').fill('Workspace Browser');await page.getByLabel('Email',{exact:true}).fill(address);await page.locator('input[name=password]').fill(password);await page.getByRole('button',{name:'Create account',exact:true}).click();await heading('Request received');};
    const login=async(address:string)=>{await page.goto(base+'/login');await page.getByLabel('Email',{exact:true}).fill(address);await page.locator('input[name=password]').fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await heading('Your account');};
    step='login discovery and empty state';await signup(email);await login(email);await page.getByText('You don’t have a workspace yet.',{exact:false}).waitFor();expect(await page.getByText('NEXUS Commerce',{exact:true}).count()).toBe(0);passed.push(step);
    const user=await database.client.passwordCredential.findUniqueOrThrow({where:{email},include:{identity:true}}),actor=user.identity.userId;
    step='create with lost acknowledgement and same-key retry';await page.getByRole('link',{name:'Create workspace',exact:true}).click();await heading('Create workspace');
    await page.getByLabel('Workspace name').fill('Real Browser Workspace');const slug='browser-'+randomUUID();await page.getByLabel('Workspace address').fill(slug);
    let lost=true;const keysSeen:string[]=[],headersSeen:{csrfPresent:boolean;originMatches:boolean}[]=[];
    await page.route('**/api/v1/workspaces',async route=>{if(route.request().method()!=='POST')return route.continue();const headers=await route.request().allHeaders();keysSeen.push(headers['idempotency-key']!);headersSeen.push({csrfPresent:!!headers['x-csrf-token'],originMatches:headers.origin===base});if(lost){lost=false;const committed=await route.fetch();expect(committed.status()).toBe(201);await route.abort('failed');}else await route.continue();});
    await page.getByRole('button',{name:'Create workspace',exact:true}).click();await page.getByRole('button',{name:'Retry creation',exact:true}).waitFor();expect(await page.getByRole('heading',{name:'Real Browser Workspace',exact:true}).count()).toBe(0);
    expect(await page.getByLabel('Workspace name').isDisabled()).toBe(true);
    if(correction){
      step='committed response loss, session interruption, fresh same-actor reconciliation';
      await fences.revokeAll(actor);await page.reload();await heading('Welcome back');
      expect(await page.getByRole('button',{name:'Retry creation',exact:true}).count()).toBe(0);
      await login(email);await page.getByRole('link',{name:'Create workspace',exact:true}).click();await heading('Create workspace');
    }
    await page.reload();await page.getByRole('button',{name:'Retry creation',exact:true}).waitFor();await page.getByRole('button',{name:'Retry creation',exact:true}).click();await heading('Real Browser Workspace');await page.getByRole('heading',{name:'Your workspace is ready'}).waitFor();
    expect(keysSeen.length).toBe(2);expect(keysSeen[0]).toBe(keysSeen[1]);expect(headersSeen.every(h=>h.csrfPresent&&h.originMatches)).toBe(true);expect(await database.client.workspace.count({where:{slug}})).toBe(1);
    evidence.uncertainOutcome={sessionRevokedBeforeRetry:correction,freshMatchingServerIdentity:correction,committedBeforeLostResponse:true,manualSameKeyRetry:true,requests:2,effects:1,csrfAndOrigin:true};passed.push(step);
    if(correction){
      expect(await page.evaluate(()=>sessionStorage.getItem('unblok.workspace.creation.v1'))).toBeNull();
      await page.screenshot({path:resolve(output,'reconciled-workspace.png'),fullPage:true,animations:'disabled'});
      evidence.status='passed';evidence.isolatedFixtures=true;evidence.sameBrowserContext=true;await context.close();return;
    }
    const preflight=await fetch('http://127.0.0.1:4000/api/v1/workspaces',{method:'OPTIONS',headers:{Origin:config.CORS_ORIGINS[0]!,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-csrf-token,idempotency-key'}});
    expect(preflight.status).toBe(403);evidence.crossOriginCreation={idempotencyPreflight:403,supported:false,requiresReviewedBackendCorsChange:true};
    const workspace=await database.client.workspace.findUniqueOrThrow({where:{slug}}),liveUrl=page.url();await page.unroute('**/api/v1/workspaces');
    step='restoration and current membership';await page.reload();await heading('Real Browser Workspace');await page.getByText('Administrator',{exact:true}).first().waitFor();passed.push(step);
    step='pagination and stale cursor';const ids=Array.from({length:21},()=>randomUUID());await database.client.workspace.createMany({data:ids.map(id=>({id,name:'Pagination workspace',slug:'page-'+id}))});await database.client.workspaceMembership.createMany({data:ids.map(workspaceId=>({workspaceId,userId:actor,role:'ADMIN',status:'ACTIVE'}))});
    await page.goto(base+'/account');await page.getByRole('button',{name:'Next page'}).waitFor();expect(await page.locator('section[aria-label="Your workspaces"] li').count()).toBe(20);
    const extra=await database.client.workspace.create({data:{name:'Late workspace',slug:'late-'+randomUUID()}});await database.client.workspaceMembership.create({data:{workspaceId:extra.id,userId:actor,role:'ADMIN',status:'ACTIVE'}});
    await page.getByRole('button',{name:'Next page'}).click();await page.getByText('Your workspace list changed. Refresh it to continue.').waitFor();await page.getByRole('button',{name:'Refresh workspaces'}).click();await page.getByRole('button',{name:'Next page'}).waitFor();await page.getByRole('button',{name:'Next page'}).click();await page.getByRole('button',{name:'Next page'}).waitFor({state:'hidden'});expect(await page.locator('section[aria-label="Your workspaces"] li').count()).toBe(3);passed.push(step);
    step='responsive light dark and keyboard';
    for(const width of [320,390,768,1024,1440])for(const theme of ['light','dark']){
      await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});await page.goto(liveUrl);await heading('Real Browser Workspace');await page.getByRole('button',{name:'Next page'}).waitFor();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);expect(await page.locator('.auth-surface').evaluate(el=>el.classList.contains('dark'))).toBe(theme==='dark');
      const file=`workspace-${width}-${theme}.png`;await page.screenshot({path:resolve(output,file),fullPage:true,animations:'disabled'});visuals.push({width,height:900,dpr:1,theme,file,noHorizontalOverflow:true});
    }
    await page.goto(base+'/onboarding/workspace');await heading('Create workspace');await page.keyboard.press('Tab');expect(await page.locator(':focus').getAttribute('aria-label')).toBe('Unblok home');
    await page.getByRole('button',{name:'Create workspace',exact:true}).click();expect(await page.getByLabel('Workspace name').getAttribute('aria-invalid')).toBe('true');
    for(const width of [320,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);const file=`create-${width}-${theme}.png`;await page.screenshot({path:resolve(output,file),fullPage:true,animations:'disabled'});visuals.push({scene:'creation validation',width,height:900,dpr:1,theme,file,noHorizontalOverflow:true});}passed.push(step);
    step='membership revocation';const keeper=await database.client.user.create({data:{name:'Owned alternate admin'}});await database.client.workspaceMembership.create({data:{workspaceId:workspace.id,userId:keeper.id,role:'ADMIN',status:'ACTIVE'}});await page.goto(liveUrl);await heading('Real Browser Workspace');
    await database.client.workspaceMembership.update({where:{workspaceId_userId:{workspaceId:workspace.id,userId:actor}},data:{status:'SUSPENDED'}});await page.getByRole('button',{name:'Check workspace access'}).click();await page.getByText('This workspace is no longer available.').waitFor();expect(await page.getByRole('heading',{name:'Real Browser Workspace',exact:true}).count()).toBe(0);passed.push(step);
    step='session revocation and same-context recovery';await fences.revokeAll(actor);await page.goto(base+'/account');await heading('Welcome back');await login(email);await page.getByRole('heading',{name:'Your workspaces'}).waitFor();passed.push(step);
    step='account switch isolation';await page.getByRole('button',{name:'Sign out',exact:true}).click();await heading('Welcome back');const second='fews-other-'+randomUUID()+'@example.test';await signup(second);await login(second);await page.getByText('You don’t have a workspace yet.',{exact:false}).waitFor();expect(await page.getByText('Pagination workspace',{exact:true}).count()).toBe(0);passed.push(step);
    step='labelled NEXUS separation';await page.goto(base+'/demo/my-work');await page.getByRole('note').filter({hasText:'Curated sample data'}).waitFor();passed.push(step);
    evidence.status='passed';evidence.isolatedFixtures=true;await context.close();
  }catch(error){evidence.status='failed';evidence.failedStep=step;evidence.errorType=error instanceof Error?error.name:'Unknown';throw error;}
  finally{
    await browser?.close();await server?.close();await connection?.close();
    if(cache.status==='ready'){const keys=await cache.keys(prefix+'*');if(keys.length)await cache.del(...keys);}cache.disconnect();await database.close();
    if(owned)await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);await admin.close();
    const historyFile=resolve(output,'runs.json');let history:unknown[]=[];try{history=await Bun.file(historyFile).json();}catch{}
    history.push(evidence);await Bun.write(historyFile,JSON.stringify(history,null,2));await Bun.write(resolve(output,'results.json'),JSON.stringify(evidence,null,2));
  }
},120000);
