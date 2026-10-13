import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
it('keeps real workspaces free of demo authority, persistence and fixture imports',()=>{
  for(const name of readdirSync(new URL('.',import.meta.url))){if(!/\.tsx?$/.test(name)||name.includes('.test.'))continue;
    const source=readFileSync(new URL(name,import.meta.url),'utf8');expect(source).not.toMatch(/localStorage|\/data\/|mockAuth|useWorkspace\(|ProjectContext|\bWorkspaceProvider\b/);
  }
});
