// Comparison only: isolated browser contexts, /demo URLs, no backend requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const out=process.env.FE_INTEGRATION_EVIDENCE_DIR;
const root=path.resolve(__dirname,'../..');
if(!out||!path.isAbsolute(out)||path.resolve(out).startsWith(root+path.sep))throw Error('Use an evidence directory outside the repository.');
const origins=[['baseline',process.env.FE_DEMO_BASELINE_ORIGIN],['current',process.env.FE_DEMO_CURRENT_ORIGIN]];
for(const [,origin] of origins){const u=new URL(origin);assert.equal(u.hostname,'127.0.0.1');assert.equal(u.protocol,'http:');}
fs.mkdirSync(out,{recursive:true});
const result={scope:'Fresh isolated browser contexts; /demo only; API requests blocked',sides:{},comparisons:[],failures:[]};
async function main(){
 const browser=await chromium.launch({headless:true});
 try{if(process.env.FE_DEMO_TEAMS_ONLY==='true'){await require('./fe-integration-01c-demo.cjs')({browser,origins,out,result});if(result.failures.length)process.exitCode=1;return;}for(const [kind,origin] of origins){
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'});
  await context.route('**/fonts.googleapis.com/**',r=>r.abort());await context.route('**/fonts.gstatic.com/**',r=>r.abort());
  await context.route('**/api/v1/**',r=>r.abort());
  const p=await context.newPage(),side=result.sides[kind]={passed:[],captures:[],contracts:{},errors:[]};
  p.on('pageerror',e=>side.errors.push(e.message));
  const go=async(route)=>{await p.goto(origin+'/demo/'+route+'?theme=DARK');await p.locator('h1').first().waitFor();};
  const capture=async name=>{await p.screenshot({path:path.join(out,kind+'-'+name+'.png'),fullPage:true,animations:'disabled',caret:'hide'});side.captures.push(name);};
  const check=async(name,run)=>{await run();side.passed.push(name);console.log('PASS '+kind+' '+name);};
  try{
   await check('original ten destinations, SVG icons, separators and shell dimensions',async()=>{
    await go('my-work');
    side.contracts.shell=await p.getByRole('navigation',{name:'Application Navigation'}).evaluate(nav=>({
     classes:nav.className,width:nav.getBoundingClientRect().width,height:nav.getBoundingClientRect().height,
     links:[...nav.querySelectorAll('a')].map(a=>({text:a.textContent,href:new URL(a.href).pathname,classes:a.className,icons:[...a.querySelectorAll('svg')].map(s=>s.innerHTML)})),
     separators:[...nav.querySelectorAll('div')].filter(e=>e.className.includes('border-t')).map(e=>e.className)
    }));
    assert.equal(side.contracts.shell.width,220);
    assert.equal(side.contracts.shell.links.filter(x=>['My Work','Inbox','Projects','Teams','Cycles','Milestones','Roadmap','Dependencies','Insights','Settings'].some(n=>x.text.startsWith(n))).length,10);
   });
   await check('drawer and Escape interaction',async()=>{
    await p.keyboard.press('j');await p.keyboard.press('Enter');
    await p.getByRole('complementary',{name:'Issue Detail Drawer'}).waitFor();await capture('drawer');
    await p.keyboard.press('Escape');await p.getByRole('complementary',{name:'Issue Detail Drawer'}).waitFor({state:'hidden'});
    assert.equal(await p.getByRole('complementary',{name:'Issue Detail Drawer'}).count(),0);
   });
   await check('original Create Issue form and cancel',async()=>{
    await p.getByRole('button',{name:/New Issue/}).click();await p.getByRole('heading',{name:'Create New Issue',exact:true}).waitFor();
    await p.getByPlaceholder('e.g. Implement rate limiting on public webhook endpoints').fill('Browser-only unsaved draft');
    await capture('create-issue');await p.keyboard.press('Escape');await p.getByRole('heading',{name:'Create New Issue',exact:true}).waitFor({state:'hidden'});
    assert.equal(await p.getByRole('heading',{name:'Create New Issue',exact:true}).count(),0);
   });
   await check('command palette shortcut and help overlay',async()=>{
    await p.keyboard.press('Control+k');await p.getByPlaceholder('Type a command, issue key (ENG-1), or filter... (Press Esc to close)').waitFor();
    await capture('palette');await p.keyboard.press('Escape');await p.keyboard.press('?');
    await p.getByRole('heading',{name:'Keyboard-First Execution Cheatsheet',exact:true}).waitFor();await capture('help');await p.keyboard.press('Escape');
   });
   await check('rail keyboard dimensions and G P navigation',async()=>{
    await p.keyboard.press('[');await p.waitForFunction(()=>document.querySelector('nav[aria-label="Application Navigation"]').getBoundingClientRect().width===52);
    await p.keyboard.press(']');await p.waitForFunction(()=>document.querySelector('nav[aria-label="Application Navigation"]').getBoundingClientRect().width===220);
    await p.keyboard.press('g');await p.keyboard.press('p');await p.getByRole('heading',{name:'Projects Directory',exact:true}).waitFor();
    await p.getByPlaceholder('Filter projects... (/)').fill('no-project-matches-this');await p.getByText('No projects match your active filters',{exact:true}).waitFor();
    side.contracts.filteredProjects=await p.locator('main').first().innerText();await capture('project-filter');
    await p.getByPlaceholder('Filter projects... (/)').fill('');
   });
   await check('three flagged dark pages, repeated raster and point diagnostics',async()=>{
    for(const route of ['projects','teams','dependencies']){
     await go(route);await p.waitForTimeout(700);
     side.contracts[route]=await p.locator('main').first().evaluate(main=>({text:main.innerText,classes:main.className,
      controls:[...main.querySelectorAll('button,input,select')].map(e=>({tag:e.tagName,text:e.textContent,label:e.getAttribute('aria-label'),placeholder:e.getAttribute('placeholder'),disabled:e.disabled,classes:e.className})),
      points:[[257,14],[971,77],[15,968],[740,212]].map(([x,y])=>{const e=document.elementFromPoint(x,y);if(!e)return null;const s=getComputedStyle(e),r=e.getBoundingClientRect();return {point:[x,y],tag:e.tagName,classes:e.getAttribute('class'),box:[r.x,r.y,r.width,r.height],background:s.backgroundColor,color:s.color,border:s.borderColor};})}));
     for(let repeat=0;repeat<3;repeat++)await capture(route+'-'+repeat);
    }
   });
   await check('dependency graph, view shortcuts and filters',async()=>{
    await p.keyboard.press('2');await p.waitForURL(/view=matrix/);await p.getByText('Cross-Team Dependency Matrix',{exact:true}).waitFor();await capture('dependency-matrix');
    await p.keyboard.press('3');await p.waitForURL(/view=blockers/);await p.getByRole('table',{name:'Active Blocker and Dependency Registry'}).waitFor();await capture('dependency-blockers');
    await p.keyboard.press('1');await p.waitForURL(url=>!url.searchParams.has('view'));await p.waitForFunction(()=>document.querySelector('[role=tab][aria-selected=true]')?.textContent.includes('Graph Canvas'));
    await p.getByLabel('Filter dependencies by issue key or title').fill('no-issue-matches-this');
    await p.getByRole('heading',{name:'No Dependencies to Display',exact:true}).waitFor();
    side.contracts.filteredDependencies=await p.locator('main').first().innerText();
    await p.getByLabel('Filter dependencies by issue key or title').fill('');
   });
   await check('Workspace selection, keyboard dismissal and real original menu',async()=>{
    const trigger=p.getByTestId('workspace-switcher-trigger');await trigger.click();
    await p.getByRole('menuitem',{name:'Create workspace',exact:true}).click();
    await p.getByRole('heading',{name:'Create your workspace',exact:true}).waitFor();
    await p.getByLabel('Workspace name',{exact:true}).fill('Comparison workspace');
    await p.getByRole('button',{name:'Create workspace',exact:true}).click();
    await p.getByRole('heading',{name:'Create your first team',exact:true}).waitFor();
    await go('my-work');await trigger.getByText('Comparison workspace',{exact:true}).waitFor();await trigger.click();
    await p.getByRole('menu',{name:'Workspaces'}).waitFor();
    const options=p.locator('[data-testid^="workspace-option-"]');
    side.contracts.workspaces=await options.allTextContents();assert((await options.count())>1);
    await options.first().click();await trigger.getByText('NEXUS Commerce',{exact:true}).waitFor();
    await trigger.click();await p.keyboard.press('Escape');assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
    side.contracts.selectedWorkspace=await trigger.innerText();
   });
   await check('demo reset, restore and test-role controls',async()=>{
    assert.equal(await p.getByRole('button',{name:'Switch User / Test Roles',exact:true}).count(),1);
    assert.equal(await p.getByTitle('Back up current state and reset to the NEXUS fixture').count(),1);
    // Reset affects only this disposable context's demo localStorage. No shared services.
    const beforeReset=await p.getByTestId('workspace-switcher-trigger').innerText();
    p.once('dialog',d=>d.accept());await p.getByTitle('Back up current state and reset to the NEXUS fixture').click();
    await p.getByRole('heading',{name:'My Work',exact:true}).waitFor();
    await p.getByTitle('Restore the most recent pre-reset backup').waitFor();
    p.once('dialog',d=>d.accept());
    await Promise.all([p.waitForEvent('load'),p.getByTitle('Restore the most recent pre-reset backup').click()]);
    await p.getByRole('heading',{name:'My Work',exact:true}).waitFor();
    assert.equal(await p.getByTestId('workspace-switcher-trigger').innerText(),beforeReset);
    await p.getByRole('button',{name:'Switch User / Test Roles',exact:true}).click();
    await p.getByText('Switch Active Role (Test)',{exact:true}).waitFor();await capture('test-roles');
    side.contracts.roles=await p.getByText('Switch Active Role (Test)',{exact:true}).locator('..').locator('button').allTextContents();
    const selected=p.getByText('Switch Active Role (Test)',{exact:true}).locator('..').getByRole('button').last();
    const name=await selected.locator('.truncate').innerText();await selected.click();
    await p.getByRole('navigation',{name:'Application Navigation'}).getByText(name,{exact:true}).waitFor();
    side.contracts.switchedActor=await p.getByRole('navigation',{name:'Application Navigation'}).innerText();
    assert(side.contracts.switchedActor.includes(name));
   });
   await check('light/dark and mobile navigation retain original layout',async()=>{
    for(const theme of ['LIGHT','DARK']){
     await p.setViewportSize({width:390,height:844});await p.goto(origin+'/demo/my-work?theme='+theme);await p.locator('h1').first().waitFor();
     assert.equal(await p.locator('html').evaluate(e=>e.classList.contains('dark')),theme==='DARK');
     await p.getByRole('button',{name:'Open mobile navigation',exact:true}).click();await p.getByText('Unblok Navigation',{exact:true}).waitFor();
     await capture('mobile-'+theme.toLowerCase());await p.getByRole('button',{name:'Close mobile menu',exact:true}).click();
    }
   });
   assert.deepEqual(side.errors,[]);
  }catch(error){result.failures.push(kind+': '+error.message);await capture('failure').catch(()=>{});}
  finally{await context.close();}
 }
 if(process.env.FE_DEMO_TEAMS==='true')await require('./fe-integration-01c-demo.cjs')({browser,origins,out,result});
 if(process.env.FE_DEMO_MEMBERS==='true')await require('./fe-integration-01b-demo.cjs')({browser,origins,out,result});
 for(const key of Object.keys(result.sides.baseline.contracts)){
  try{assert.deepEqual(result.sides.current.contracts[key],result.sides.baseline.contracts[key]);result.comparisons.push({name:key,equal:true});}
  catch{result.comparisons.push({name:key,equal:false});result.failures.push('Contract differs: '+key);}
 }
 }finally{await browser.close();fs.writeFileSync(path.join(out,'demo-preservation.json'),JSON.stringify(result,null,2));}
 console.log(JSON.stringify({checks:Object.fromEntries(Object.entries(result.sides).map(([k,v])=>[k,v.passed.length])),failures:result.failures}));
 if(result.failures.length)process.exitCode=1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
