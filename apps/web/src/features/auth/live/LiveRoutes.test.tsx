import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToString} from 'react-dom/server';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {AuthApi} from '../api/authApi';
import {SessionStore} from '../session/SessionStore';
import {SessionProvider} from '../session/SessionContext';
import {LiveRoutes} from './LiveRouter';
import {SessionGuard} from './SessionGuard';
const user={id:'12345678-1234-4234-8234-123456789012',name:'Server Account',email:'server@example.com',emailVerified:false};
async function session(status=200){const s=new SessionStore(new AuthApi('',(async()=>new Response(JSON.stringify({user}),{status})) as typeof fetch));await s.refresh();return s;}
function page(store:SessionStore,path:string){return renderToString(<SessionProvider store={store}><MemoryRouter initialEntries={[path]}><LiveRoutes/></MemoryRouter></SessionProvider>);}
describe('real account surfaces and guards',()=>{
  it('renders server identity and honest pending workspace instead of NEXUS',async()=>{
    const html=page(await session(),'/account');expect(html).toContain('Server Account');expect(html).toContain('server@example.com');expect(html).toContain('Workspace access');expect(html).not.toContain('NEXUS Commerce');expect(html).not.toContain('nav-rail');
  });
  it.each(['/login','/signup','/forgot-password','/reset-password'])('renders accessible anonymous form at %s',async path=>{
    const html=page(await session(401),path);expect(html).toContain('<form');expect(html).toContain('for="real-email"');expect(html).toContain('autoComplete="email"');expect(html).not.toContain('nav-rail');
  });
  it('does not render private account content for anonymous visitors',async()=>{expect(page(await session(401),'/account')).not.toContain('server@example.com');});
  it('does not render sign-in form for an authenticated visitor',async()=>{expect(page(await session(),'/login')).not.toContain('<form');});
  it('keeps recovery accessible for an authenticated user',async()=>{expect(page(await session(),'/reset-password')).toContain('Choose a new password');});
  it('shows verification without fabricating workspace authorization',async()=>{const html=page(await session(),'/verify-email');expect(html).toContain('Code from your email');expect(html).not.toContain('NEXUS Commerce');});
  it('blocks private routes during restoration and outage',async()=>{
    const loading=new SessionStore(new AuthApi());expect(page(loading,'/account')).toContain('Checking your session');
    expect(page(await session(503),'/account')).toContain('Check again');
  });
  it('guard permits only a confirmed server session',async()=>{
    const html=renderToString(<SessionProvider store={await session()}><MemoryRouter initialEntries={['/protected']}><Routes><Route element={<SessionGuard/>}><Route path="/protected" element={<p>Authorized child</p>}/></Route></Routes></MemoryRouter></SessionProvider>);
    expect(html).toContain('Authorized child');
  });
});
