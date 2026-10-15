const {ReadOnlyMailpit}=require('../test-support/mailpit.cjs');
const mailpit=new ReadOnlyMailpit();let mailBaseline;
// Uses an operator-provided, already installed Playwright module. No installs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const output=path.resolve('docs/frontend/evidence/browser-f4');fs.mkdirSync(output,{recursive:true});
const base='http://localhost:3000',email=`fe-browser-${randomUUID()}@example.test`,password='A private browser password '+randomUUID(),nextPassword='A replacement browser password '+randomUUID();
const evidence={runner:'external bundled Playwright',transport:'real Chromium, same-origin HTTP Vite proxy, real API/worker/PostgreSQL/Valkey/Mailpit',passed:[],visuals:[],productionCertified:false};
let step='launch',activePage;const ids=new Set(),headerChecks=[];evidence.http=[];evidence.mutationHeaders=[];
async function mail(){for(let i=0;i<40;i++){const listing=await mailpit.messages();const item=listing.messages.find(m=>m.To.some(r=>r.Address===email)&&!ids.has(m.ID));if(item){ids.add(item.ID);const body=await mailpit.message(item.ID);const proof=/[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}/.exec(body.Text)?.[0];assert.ok(proof);return proof;}await new Promise(r=>setTimeout(r,250));}throw new Error('Owned message unavailable');}
async function heading(page,text){await page.getByRole('heading',{name:text,exact:true}).waitFor();}
async function login(page,pw=password){await page.goto(base+'/login');await page.getByLabel('Email',{exact:true}).fill(email);await page.locator('input[name=password]').fill(pw);await page.getByRole('button',{name:'Sign in',exact:true}).click();await heading(page,'Your account');}
(async()=>{
 mailBaseline=await mailpit.snapshot();
 const browser=await chromium.launch({headless:true});evidence.browser=browser.version();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,colorScheme:'light'});let page=await context.newPage();activePage=page;let csrfPosts=0;
  page.on('response',response=>{const pathname=new URL(response.url()).pathname;if(pathname.startsWith('/api/v1/'))evidence.http.push({path:pathname,status:response.status()});});
  page.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/api/v1/auth/')){headerChecks.push(request.allHeaders().then(headers=>evidence.mutationHeaders.push({csrfPresent:!!headers['x-csrf-token'],originMatches:headers.origin===base})));csrfPosts++;}});
  step='protected route';await page.goto(base+'/account');await heading(page,'Welcome back');evidence.passed.push(step);
  step='keyboard and invalid form';await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Unblok home');await page.keyboard.press('Tab');await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').getAttribute('name'),'email');await page.getByRole('button',{name:'Sign in',exact:true}).click();assert.equal(await page.getByLabel('Email',{exact:true}).getAttribute('aria-invalid'),'true');evidence.passed.push(step);
  step='signup';await page.goto(base+'/signup');await page.getByLabel('Full name').fill('Browser Verification');await page.getByLabel('Email',{exact:true}).fill(email);await page.locator('input[name=password]').fill(password);await page.getByRole('button',{name:'Create account',exact:true}).click();await heading(page,'Request received');evidence.passed.push(step);
  step='login cookies CSRF';await login(page);const cookies=await context.cookies();assert.ok(cookies.some(c=>c.name==='unblok.sid.dev'&&c.httpOnly&&c.sameSite==='Lax'&&c.path==='/'));assert.equal(await page.evaluate(()=>document.cookie.includes('unblok.sid.dev')),false);assert.equal(await page.evaluate(()=>localStorage.getItem('unblok_auth_status')),null);evidence.passed.push(step);
  step='restoration and workspace separation';await page.reload();await heading(page,'Your account');assert.ok(await page.getByText('Workspace access is coming next').isVisible());assert.equal(await page.getByText('NEXUS Commerce',{exact:true}).count(),0);evidence.passed.push(step);
  step='email verification';await page.getByRole('link',{name:'Verify your email',exact:true}).click();await page.getByRole('button',{name:'Send verification email'}).click();await page.getByText('Request received. Check your inbox and spam folder for the code.').waitFor();await page.getByLabel('Code from your email').fill(await mail());await page.getByRole('button',{name:'Confirm email'}).click();await heading(page,'Your account');await page.getByText('Your email is verified.').waitFor();evidence.passed.push(step);
  step='logout-all';const other=await browser.newContext(),second=await other.newPage();await login(second);await page.getByRole('button',{name:'Sign out everywhere'}).click();await heading(page,'Welcome back');await second.reload();await heading(second,'Welcome back');await other.close();evidence.passed.push(step);
  step='forgot password';await page.goto(base+'/forgot-password');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByRole('button',{name:'Send recovery email'}).click();await heading(page,'Check your email');const proof=await mail();evidence.passed.push(step);
  step='invalid reset preserves authenticated session';await login(page);await page.goto(base+'/reset-password');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Code from your email').fill(randomUUID()+'.'+'a'.repeat(43));await page.locator('input[name=password]').fill(nextPassword);await page.locator('input[name=confirmation]').fill(nextPassword);await page.getByRole('button',{name:'Submit new password'}).click();await heading(page,'Request received');await page.getByRole('link',{name:'Your account',exact:true}).click();await heading(page,'Your account');evidence.passed.push(step);
  step='valid reset and fresh login';await page.goto(base+'/reset-password');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Code from your email').fill(proof);await page.locator('input[name=password]').fill(nextPassword);await page.locator('input[name=confirmation]').fill(nextPassword);await page.getByRole('button',{name:'Submit new password'}).click();await heading(page,'Request received');await page.getByText(/Try signing in with the new password/).waitFor();
  assert.equal((await context.cookies()).some(c=>c.name==='unblok.sid.dev'),true);
  const before=(await context.cookies()).find(c=>c.name==='unblok.sid.dev').value;
  step='same-context revoked-cookie recovery';
  evidence.revokedMeStatus=await page.evaluate(async()=> (await fetch('/api/v1/auth/me',{credentials:'include',cache:'no-store'})).status);assert.equal(evidence.revokedMeStatus,401);
  evidence.recoveryBootstrap=await page.evaluate(async()=>{const r=await fetch('/api/v1/auth/csrf',{credentials:'include',cache:'no-store'});const data=await r.json();return {status:r.status,noStore:r.headers.get('cache-control')==='no-store',tokenShape:typeof data.csrf==='string'&&data.csrf.length===43};});
  assert.deepEqual(evidence.recoveryBootstrap,{status:200,noStore:true,tokenShape:true});
  assert.notEqual((await context.cookies()).find(c=>c.name==='unblok.sid.dev').value,before);
  evidence.distinctAnonymousSid=true;await login(page,nextPassword);
  assert.notEqual((await context.cookies()).find(c=>c.name==='unblok.sid.dev').value,before);
  evidence.passed.push(step);evidence.sameBrowserContextRecovery=true;evidence.manualCookieDeletion=false;evidence.unresolved=[];
  step='logout';await page.getByRole('button',{name:'Sign out',exact:true}).click();await heading(page,'Welcome back');evidence.passed.push(step);
  step='NEXUS demo separation';await page.goto(base+'/demo/my-work');await page.getByRole('note').filter({hasText:'Curated sample data'}).waitFor();await page.getByRole('link',{name:'Real account',exact:true}).click();await heading(page,'Welcome back');evidence.passed.push(step);assert.ok(csrfPosts>=9);evidence.csrfPosts=csrfPosts;await context.close();
  step='responsive light/dark';
  for(const width of [390])for(const theme of ['light','dark']){
   const c=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,colorScheme:theme}),p=await c.newPage();await p.goto(base+'/login');await heading(p,'Welcome back');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await p.locator('.auth-surface').evaluate(el=>el.classList.contains('dark')),theme==='dark');
   const bounds=await p.getByLabel('Email',{exact:true}).boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width);
   const file=`login-${width}-${theme}.png`;await p.screenshot({path:path.join(output,file),fullPage:true,animations:'disabled'});evidence.visuals.push({width,height:900,dpr:1,theme,file,noHorizontalOverflow:true});await c.close();
  }await Promise.all(headerChecks);assert.ok(evidence.mutationHeaders.every(h=>h.csrfPresent&&h.originMatches));evidence.passed.push(step);evidence.status='passed';
 }catch(error){evidence.status='failed';evidence.failedStep=step;evidence.errorType=error.name;evidence.errorSummary=error.message.split('Call log:')[0].replaceAll(email,'[owned email]').replaceAll(password,'[password]').replaceAll(nextPassword,'[password]');if(activePage&&!activePage.isClosed())evidence.formFeedback=await activePage.getByRole('alert').allTextContents();process.exitCode=1;}
 finally{await browser.close();try{evidence.mailPreservation=await mailpit.assertPreserved(mailBaseline);}catch(error){evidence.status='failed';evidence.preservationFailure=error.message;process.exitCode=1;}fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));}
})();
