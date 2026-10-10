import React from 'react';
import {Navigate,Outlet,useLocation} from 'react-router-dom';
import {useSession} from '../session/SessionContext';
import {Button} from '../../../components/ui/Button';
export function SessionGuard({anonymous=false,open=false}:{anonymous?:boolean;open?:boolean}) {
  const {status,error,store}=useSession();const location=useLocation();
  if(status==='loading')return <p role="status" className="text-sm text-text-secondary">Checking your session…</p>;
  if(status==='unavailable')return <div className="space-y-3"><p role="alert" className="text-sm">{error}</p><Button onClick={()=>void store.refresh()}>Check again</Button></div>;
  if(open)return <Outlet/>;
  if(anonymous)return status==='authenticated'?<Navigate to="/account" replace/>:<Outlet/>;
  return status==='authenticated'?<Outlet/>:<Navigate to={'/login?sessionExpired=true&returnTo='+encodeURIComponent(location.pathname)} replace/>;
}
