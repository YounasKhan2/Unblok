import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
describe('live authentication ownership',()=>{
  it('keeps demo identity, persistence and business fixtures out of the real account boundary',()=>{
    for(const folder of ['live','session','api'])for(const name of readdirSync(resolve(root,folder))){
      if(!/\.tsx?$/.test(name)||name.includes('.test.')||name==='DemoExperience.tsx')continue;
      const source=readFileSync(resolve(root,folder,name),'utf8');
      expect(source,`${folder}/${name}`).not.toMatch(/localStorage|sessionStorage|mockAuthAdapter|useAuth\(|WorkspaceProvider|ProjectProvider|\/data\//);
    }
  });
  it('mounts prototype providers only inside the explicitly labelled demo',()=>{
    const entry=readFileSync(resolve(root,'../../App.tsx'),'utf8');
    expect(entry).not.toContain('AppProviders');expect(entry).toContain("startsWith('/demo/')");expect(entry).toContain('<SessionProvider>');
    const demo=readFileSync(resolve(root,'live/DemoExperience.tsx'),'utf8');expect(demo).toContain('basename="/demo"');expect(demo).toContain('Curated sample data');
  });
});
