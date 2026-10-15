import {expect,test} from 'bun:test';
import {readFile} from 'node:fs/promises';
import {DisposableMailpit,ReadOnlyMailpit} from '../test-support/mailpit.cjs';

async function owned(capture:DisposableMailpit){
  const response=await fetch(capture.url('/api/v1/send'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({From:{Email:'owned@example.test'},To:[{Email:'owned@example.test'}],Subject:'owned cleanup fixture',Text:'Synthetic content; no proofs.'})});
  expect(response.ok).toBe(true);
  return (await capture.messages()).messages.find(m=>m.Subject==='owned cleanup fixture')!.ID;
}

test('scoped and duplicate-ID cleanup removes owned mail and preserves both sentinels; empty cleanup sends no destructive request',async()=>{
  const capture=new DisposableMailpit();await capture.start();
  try{
    const id=await owned(capture);const reader=new ReadOnlyMailpit(new URL(capture.url('/api/v1/messages')).origin),before=await reader.snapshot();
    await capture.deleteOwned([]);expect(await reader.assertPreserved(before)).toEqual({checked:3,missing:0});
    await capture.deleteOwned([id,id]);expect((await capture.messages()).messages).toHaveLength(2);await capture.assertSentinels();
  }finally{await capture.close();}
},30000);

test('malformed, unknown and sentinel IDs are rejected before deletion',async()=>{
  const capture=new DisposableMailpit();await capture.start();
  try{
    const id=await owned(capture),baseline=(await capture.messages()).messages.map(m=>m.ID);
    for(const ids of [undefined,null,{},[''],[null],['bad/id'],['missing-id']])await expect(capture.deleteOwned(ids as string[])).rejects.toThrow();
    const sentinel=baseline.find(value=>value!==id)!;await expect(capture.deleteOwned([sentinel])).rejects.toThrow('Refusing sentinel');
    expect((await capture.messages()).messages.map(m=>m.ID).sort()).toEqual(baseline.sort());await capture.assertSentinels();
  }finally{await capture.close();}
},30000);

// Deliberately unsafe requests ONLY to this newly created capture. Every fixture
// has both an owned message and two sentinels, never a shared/QA address.
for(const [label,body] of [['missing body',undefined],['empty object','{}'],['empty IDs','{"IDs":[]}'],['null IDs','{"IDs":null}'],['malformed JSON','{'],['wrong ID type','{"IDs":"not-an-array"}']] as const){
  test('pinned Mailpit unsafe deletion reproduction: '+label,async()=>{
    const capture=new DisposableMailpit();await capture.start();
    try{
      await owned(capture);expect((await capture.messages()).messages).toHaveLength(3);
      const reader=new ReadOnlyMailpit(new URL(capture.url('/api/v1/messages')).origin),baseline=await reader.snapshot();
      const response=await fetch(capture.url('/api/v1/messages'),{method:'DELETE',headers:{'content-type':'application/json'},...(body===undefined?{}:{body})});
      expect(response.status).toBe(200);expect((await capture.messages()).messages).toHaveLength(0);
      await expect(capture.assertSentinels()).rejects.toThrow('sentinel missing');
      await expect(capture.deleteOwned([])).rejects.toThrow('sentinel missing');
      await expect(reader.assertPreserved(baseline)).rejects.toThrow('preservation failed');
    }finally{
      // close always destroys only its own labeled fixture, but missing sentinels
      // still reject. This expected rejection demonstrates the hard failure.
      await expect(capture.close()).rejects.toThrow('sentinel missing');
    }
  },30000);
}

test('legacy invitation failure-finally recomputation can produce empty IDs and delete unrelated sentinels',async()=>{
  const capture=new DisposableMailpit();await capture.start();
  try{
    await owned(capture);
    try{throw new Error('Simulated send failed before recipient mail exists');}
    catch(error){expect((error as Error).message).toContain('Simulated send failed');}
    finally{
      // Matches the legacy F2 finally path: failure before send leaves no match.
      const matching=(await capture.messages()).messages.filter(m=>m.To.some(r=>r.Address==='absent-recipient@example.test'));
      expect(matching).toHaveLength(0);
      const response=await fetch(capture.url('/api/v1/messages'),{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({IDs:matching.map(m=>m.ID)})});
      expect(response.status).toBe(200);
    }
    expect((await capture.messages()).messages).toHaveLength(0);
    await expect(capture.assertSentinels()).rejects.toThrow('sentinel missing');
  }finally{await expect(capture.close()).rejects.toThrow('sentinel missing');}
},30000);

test('backend mail suites use disposable capture and live browser runners have no deletion capability',async()=>{
  for(const file of ['email-verification.test.ts','password-recovery.test.ts','frontend-auth.test.ts','workspace-memberships-invitations.test.ts','frontend-members-browser.test.ts']){
    const source=await readFile(new URL(file,import.meta.url),'utf8');
    expect(source).toContain('new DisposableMailpit()');expect(source).toContain('mailpit.close()');
    expect(source).not.toMatch(/https?:\/\/(?:localhost|127\.0\.0\.1):8025/);
    expect(source).not.toMatch(/method:\s*['"]DELETE['"]/);
  }
  for(const file of ['auth-browser.cjs','auth-ux-02-browser.cjs']){
    const source=await readFile(new URL('../frontend/'+file,import.meta.url),'utf8');
    expect(source).toContain('ReadOnlyMailpit');expect(source).toContain('assertPreserved(mailBaseline)');
    expect(source).not.toMatch(/method:\s*['"]DELETE['"]|deleteOwned\(/);
  }
});
