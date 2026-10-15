import {describe,it,expect} from 'vitest';
import {AuthApi} from '../api/authApi';
import {SessionStore} from './SessionStore';
const user={id:'12345678-1234-4234-8234-123456789012',name:'Real User',email:'real@example.com',emailVerified:false};
const csrf='a'.repeat(43),token='12345678-1234-4234-8234-123456789012.'+'a'.repeat(43);
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status});
function store(responses:Response[]){return new SessionStore(new AuthApi('',(async()=>{const response=responses.shift();if(!response)throw new Error('Unexpected request');return response;}) as typeof fetch));}
describe('server-authoritative session lifecycle',()=>{
  it('restores identity only from me and clears it on revocation',async()=>{
    const s=store([json({user}),json({},401)]);await s.refresh();expect(s.snapshot().user).toEqual(user);
    await s.refresh();expect(s.snapshot()).toMatchObject({status:'anonymous',user:null});
  });
  it('fails closed on restoration outage',async()=>{const s=store([json({},503)]);await s.refresh();expect(s.snapshot()).toMatchObject({status:'unavailable',user:null});});
  it('does not authenticate after accepted signup',async()=>{
    const s=store([json({},401),json({csrf}),json({status:'accepted'},202)]);await s.refresh();
    await s.submit(()=>s.api.signup({name:'Real User',email:user.email,password:'long-password-for-testing'}));expect(s.snapshot().status).toBe('anonymous');
  });
  it('logs in using fresh server identity and clears confirmed logout despite unknown cache cleanup',async()=>{
    const s=store([json({csrf}),json({csrf}),json({user}),json({revocation:'confirmed',cleanup:'unconfirmed'})]);
    await s.login({email:user.email,password:'long-password-for-testing'});expect(s.snapshot().user).toEqual(user);
    await s.logout(true);expect(s.snapshot()).toMatchObject({status:'anonymous',user:null,pending:false});
  });
  it('does not treat generic verification acceptance as proof',async()=>{
    const s=store([json({csrf}),json({status:'accepted'}),json({emailVerified:false})]);
    await expect(s.verify(token)).rejects.toMatchObject({status:400});expect(s.snapshot().user).toBeNull();
  });
  it('clears a valid reset only after me confirms that the session ended',async()=>{
    const s=store([json({user}),json({csrf}),json({status:'accepted'}),json({},401)]);await s.refresh();
    await s.reset({email:user.email,token,password:'new-password-for-testing'});expect(s.snapshot()).toMatchObject({status:'anonymous',user:null});
  });
  it('preserves an authenticated session when invalid proof is generically accepted',async()=>{
    const s=store([json({user}),json({csrf}),json({status:'accepted'}),json({user})]);await s.refresh();
    await s.reset({email:user.email,token,password:'new-password-for-testing'});expect(s.snapshot()).toMatchObject({status:'authenticated',user});
  });
  it('retains identity but blocks routes on an unknown post-reset check outcome',async()=>{
    const s=store([json({user}),json({csrf}),json({status:'accepted'}),json({},503)]);await s.refresh();
    await s.reset({email:user.email,token,password:'new-password-for-testing'});expect(s.snapshot()).toMatchObject({status:'unavailable',user});
  });
  it('does not infer revocation from an unknown mutation outcome',async()=>{
    let calls=0;const s=new SessionStore(new AuthApi('',(async()=>{calls++;if(calls===1)return json({user});if(calls===2)return json({csrf});throw new Error('Lost acknowledgement');}) as typeof fetch));await s.refresh();
    await expect(s.reset({email:user.email,token,password:'new-password-for-testing'})).rejects.toMatchObject({status:0});expect(s.snapshot()).toMatchObject({status:'authenticated',user});
  });
  it.each(['login','logout'] as const)('detaches pending restoration across %s and deduplicates fresh focus/visibility checks',async action=>{
    let oldFinish!:(r:Response)=>void,newFinish!:(r:Response)=>void;let meCalls=0;
    const api=new AuthApi('',(async(url)=>{
      const path=String(url);if(path.endsWith('/me')){meCalls++;if(meCalls===1)return new Promise<Response>(r=>{oldFinish=r;});if(action==='login'&&meCalls===2)return json({user});return new Promise<Response>(r=>{newFinish=r;});}
      if(path.endsWith('/logout'))return json({revocation:'confirmed',cleanup:'confirmed'});return json({csrf});
    }) as typeof fetch);
    const s=new SessionStore(api),old=s.refresh();
    if(action==='login')await s.login({email:user.email,password:'long-password-for-testing'});else await s.logout();
    const fresh=s.refresh();expect(fresh).not.toBe(old);expect(s.refresh()).toBe(fresh);
    oldFinish(json({},401));await old;expect(s.refresh()).toBe(fresh);
    if(action==='login')expect(s.snapshot().status).toBe('authenticated');else expect(s.snapshot().status).toBe('anonymous');
    newFinish(action==='login'?json({user}):json({},401));await fresh;
    expect(meCalls).toBe(action==='login'?3:2);
  });
  it('coalesces focus/visibility checks and suppresses polling during mutations',async()=>{
    let finish!:(r:Response)=>void,release!:()=>void,calls=0;
    const s=new SessionStore(new AuthApi('',(async()=>{calls++;return new Promise<Response>(r=>{finish=r;});}) as typeof fetch));
    const first=s.refresh();expect(s.refresh()).toBe(first);expect(calls).toBe(1);
    const mutation=s.submit(()=>new Promise<void>(r=>{release=r;}));await s.refresh();expect(calls).toBe(1);
    finish(json({user}));await first;release();await mutation;
    const next=s.refresh();expect(calls).toBe(2);finish(json({},401));await next;
  });
  it('does not let an old restoration response overwrite completed login',async()=>{
    let finish!:(r:Response)=>void;let calls=0;
    const api=new AuthApi('',(async()=>{calls++;if(calls===1)return new Promise<Response>(r=>{finish=r;});if(calls<4)return json({csrf});return json({user});}) as typeof fetch);
    const s=new SessionStore(api),restore=s.refresh();await s.login({email:user.email,password:'long-password-for-testing'});
    finish(json({},401));await restore;expect(s.snapshot()).toMatchObject({status:'authenticated',user});
  });
  it('marks expiry only after confirmed authentication, never on first anonymous restoration',async()=>{
    const initial=store([json({},401)]);await initial.refresh();expect(initial.snapshot().sessionExpired).toBe(false);
    const active=store([json({user}),json({},401)]);await active.refresh();await active.refresh();expect(active.snapshot()).toMatchObject({status:'anonymous',sessionExpired:true});
  });
  it('does not call an explicit sign-out an expired session',async()=>{
    const s=store([json({user}),json({csrf}),json({revocation:'confirmed',cleanup:'confirmed'})]);await s.refresh();await s.logout();expect(s.snapshot().sessionExpired).toBe(false);
  });
  it('does not infer expiration from a dependency outage after authentication',async()=>{
    const s=store([json({user}),json({},503)]);await s.refresh();await s.refresh();expect(s.snapshot().status).toBe('unavailable');expect(s.snapshot().sessionExpired).not.toBe(true);
  });

});
