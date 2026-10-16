// Focused reconciliation journey: fresh owned services, real accounts and unchanged rate limits.
const assert=require('node:assert/strict');
module.exports=async({base,mail,evidence,createPage,register,verify,api,members,mark,password,run,setWorkspace,security,errors})=>{
 const page=await createPage(),slot='unblok:pending-administration:v1',actors=[];
 const rows=()=>page.evaluate(k=>JSON.parse(sessionStorage.getItem(k)||'[]'),slot);
 const logout=async()=>{assert.equal((await api(page,'/api/v1/auth/logout','POST',{})).status,200);};
 const pending=async(email)=>{await page.getByRole('button',{name:'Invite Member',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Email Address').fill(email);await dialog.getByLabel(/Role/).selectOption('MEMBER');await dialog.getByRole('button',{name:'Send Invitation',exact:true}).click();await dialog.getByRole('button',{name:'Retry same request',exact:true}).waitFor();await page.keyboard.press('Escape');};
 const requests=[];let drop=true;
 await page.route('**/administration/invitations',async route=>{if(route.request().method()!=='POST')return route.continue();const headers=await route.request().allHeaders();requests.push({key:headers['idempotency-key'],body:route.request().postData(),match:headers['if-match']});if(drop)await route.abort('failed');else await route.continue();});
 for(let n=0;n<2;n++){
  const email=`fe01b-journal-${n}-${run}@example.test`;await register(page,email,'Journal Actor '+n);await verify(page,email);await page.getByRole('link',{name:'Create workspace',exact:true}).click();await page.getByLabel('Workspace name',{exact:true}).fill('Journal Workspace '+n+' '+run);await page.getByRole('button',{name:'Create workspace',exact:true}).click();await page.getByRole('heading',{name:'My Work',exact:true}).waitFor();
  const me=await api(page,'/api/v1/auth/me'),discovered=await api(page,'/api/v1/workspaces?limit=20&sort=workspace_asc');assert.equal(me.status,200);assert.equal(discovered.status,200);const workspace=discovered.body.items[0].id;setWorkspace(workspace);await members(page);
  if(n===1){assert.equal(await page.getByRole('button',{name:'Retry same request',exact:true}).count(),0);assert.deepEqual(await rows(),[actors[0].intent]);}
  await pending(`fe01b-pending-${n}-${run}@example.test`);const intent=(await rows()).find(r=>r.actor===me.body.user.id);assert(intent);actors.push({email,workspace,intent,request:requests.at(-1)});
  if(n===1){assert.equal((await rows()).length,2);await page.getByRole('button',{name:'Start another request',exact:true}).click();await page.getByRole('button',{name:'Use different details',exact:true}).click();assert.deepEqual(await rows(),[actors[0].intent]);mark('canceling second actor request preserves first actor exact intent');await pending(`fe01b-pending-new-${run}@example.test`);actors[1].intent=(await rows()).find(r=>r.actor===me.body.user.id);actors[1].request=requests.at(-1);assert.equal((await rows()).length,2);}
  await logout();assert.equal((await rows()).length,n+1);
 }
 mark('two real actors and Workspaces retain independent uncertain requests across logout/account switching');
 drop=false;
 for(let n=0;n<2;n++){
  const actor=actors[n];await page.goto(base+'/login');await page.getByLabel('Work email').fill(actor.email);await page.locator('input[name=password]').fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(url=>!url.pathname.includes('login'));setWorkspace(actor.workspace);await page.goto(base+'/workspaces/'+actor.workspace+'/members');await page.getByRole('button',{name:'Retry same request',exact:true}).waitFor();assert.deepEqual((await rows()).find(r=>r.actor===actor.intent.actor),actor.intent);
  const other=actors[1-n];assert.equal((await api(page,'/api/v1/workspaces/'+other.workspace+'/administration/invitations?limit=20')).status,404);
  await page.getByRole('button',{name:'Retry same request',exact:true}).click();await page.getByRole('status').filter({hasText:'Request received'}).waitFor();assert.deepEqual(requests.at(-1),actor.request);const remaining=await rows();assert.equal(remaining.length,1-n);if(n===0)assert.deepEqual(remaining,[actors[1].intent]);await logout();mark('actor '+n+' exact-key/body/precondition retry preserves unrelated requests');
 }
 evidence.mutationSecurity=await Promise.all(security);assert(evidence.mutationSecurity.every(r=>r.csrf&&r.origin));assert.deepEqual(errors,[]);await mail.assertSentinels();mark('real same-origin CSRF, cross-Workspace denial and Mailpit sentinels preserved');
};
