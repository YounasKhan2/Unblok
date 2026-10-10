import {describe,it,expect} from 'vitest';
import {AuthApi,AuthApiError,authOrigin} from './authApi';
const csrf='a'.repeat(43);
const accepted={status:'accepted'};
function transport(responses:Array<Response|(()=>Promise<Response>)>){
  const calls:Array<{url:string;options:RequestInit}>=[];
  const fetcher=(async(url,options)=>{calls.push({url:String(url),options:options!});const response=responses.shift();if(!response)throw new Error('Unexpected request');return typeof response==='function'?response():response;}) as typeof fetch;
  return {calls,fetcher};
}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
describe('live authentication boundary',()=>{
  it('uses cookie credentials, bounded CSRF bootstrap and strict request contracts',async()=>{
    const t=transport([json({csrf}),json(accepted,202),json(accepted,202)]);const api=new AuthApi('',t.fetcher);
    await api.requestRecovery('user@example.com');await api.requestRecovery('user@example.com');
    expect(t.calls.map(c=>c.options.method)).toEqual(['GET','POST','POST']);
    for(const c of t.calls){expect(c.options.credentials).toBe('include');expect(c.options.cache).toBe('no-store');expect(c.options.redirect).toBe('error');}
    expect(t.calls[1].options.headers).toEqual({'Content-Type':'application/json','X-CSRF-Token':csrf});
  });
  it.each([401,403,429,503])('does not retry mutation after %s',async status=>{
    const t=transport([json({csrf}),json({secret:'must not be displayed'},status)]);const api=new AuthApi('',t.fetcher);
    await expect(api.requestRecovery('user@example.com')).rejects.toMatchObject({status});expect(t.calls).toHaveLength(2);
  });
  it('rejects malformed identity and extra authority fields',async()=>{
    const t=transport([json({user:{id:'client-id',name:'Fake',email:null,emailVerified:true,role:'ADMIN'}})]);
    await expect(new AuthApi('',t.fetcher).me()).rejects.toBeInstanceOf(AuthApiError);
  });
  it('keeps overlapping submissions out until the first operation settles',async()=>{
    let finish!:(r:Response)=>void;const t=transport([json({csrf}),()=>new Promise(resolve=>{finish=resolve;})]);const api=new AuthApi('',t.fetcher);
    const first=api.requestRecovery('user@example.com');while(t.calls.length<2)await Promise.resolve();
    await expect(api.requestRecovery('user@example.com')).rejects.toMatchObject({status:409});
    finish(json(accepted,202));await first;expect(t.calls).toHaveLength(2);
  });
  it('reports an unknown outcome without retrying a lost response',async()=>{
    const t=transport([json({csrf}),()=>Promise.reject(new Error('transport failed'))]);
    await expect(new AuthApi('',t.fetcher).requestRecovery('user@example.com')).rejects.toMatchObject({status:0});expect(t.calls).toHaveLength(2);
  });
  it('restricts explicit production origins to exact HTTPS origins',()=>{
    expect(authOrigin('',true)).toBe('');expect(authOrigin('http://localhost:4000',false)).toBe('http://localhost:4000');
    for(const origin of ['http://localhost:4000','https://api.example/path','https://user:pass@api.example','https://api.example/'])expect(()=>authOrigin(origin,true)).toThrow();
    expect(authOrigin('https://api.example',true)).toBe('https://api.example');
  });
  it('requires an explicit new submission and new bootstrap after CSRF rejection',async()=>{
    const t=transport([json({csrf}),json({},403),json({csrf}),json(accepted,202)]),api=new AuthApi('',t.fetcher);
    await expect(api.requestRecovery('user@example.com')).rejects.toMatchObject({status:403});expect(t.calls).toHaveLength(2);
    await api.requestRecovery('user@example.com');expect(t.calls.map(c=>c.options.method)).toEqual(['GET','POST','GET','POST']);
  });
  it('uses the rotated login token on subsequent mutations',async()=>{
    const rotated='b'.repeat(43),t=transport([json({csrf}),json({csrf:rotated}),json({revocation:'confirmed',cleanup:'confirmed'})]),api=new AuthApi('',t.fetcher);
    await api.login({email:'user@example.com',password:'long-password-for-testing'});await api.logout();
    expect(t.calls[2].options.headers).toMatchObject({'X-CSRF-Token':rotated});expect(t.calls).toHaveLength(3);
  });
});
