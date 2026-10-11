const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.resolve('docs/frontend/evidence/browser-correction');
(async()=>{const browser=await chromium.launch({headless:true}),rows=[];try{
 for(const theme of ['light','dark'])for(const route of ['signup','forgot-password','reset-password']){
  const context=await browser.newContext({viewport:{width:320,height:900},deviceScaleFactor:1,colorScheme:theme}),page=await context.newPage();
  await page.goto('http://localhost:3000/'+route);await page.locator('form').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  for(const input of await page.locator('form input').all()){const bounds=await input.boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.x+bounds.width<=320);}
  const file=`${route}-320-${theme}.png`;await page.screenshot({path:path.join(output,file),fullPage:true,animations:'disabled'});rows.push({route,width:320,height:900,dpr:1,theme,file,noHorizontalOverflow:true});await context.close();
 }fs.writeFileSync(path.join(output,'form-visuals.json'),JSON.stringify(rows,null,2));console.log('Six additional mobile form captures passed');
}finally{await browser.close();}})().catch(error=>{console.error(error.name);process.exitCode=1;});
