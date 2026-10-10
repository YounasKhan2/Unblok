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
  it('requires a fresh login after generic recovery acceptance',async()=>{
    const s=store([json({user}),json({csrf}),json({status:'accepted'})]);await s.refresh();
    await s.reset({email:user.email,token,password:'new-password-for-testing'});expect(s.snapshot()).toMatchObject({status:'anonymous',user:null});
  });
  it('does not let an old restoration response overwrite completed login',async()=>{
    let finish!:(r:Response)=>void;let calls=0;
    const api=new AuthApi('',(async()=>{calls++;if(calls===1)return new Promise<Response>(r=>{finish=r;});if(calls<4)return json({csrf});return json({user});}) as typeof fetch);
    const s=new SessionStore(api),restore=s.refresh();await s.login({email:user.email,password:'long-password-for-testing'});
    finish(json({},401));await restore;expect(s.snapshot()).toMatchObject({status:'authenticated',user});
  });
});
