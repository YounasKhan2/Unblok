import React,{useEffect,useState} from 'react';
import {Link,Outlet,useLocation} from 'react-router-dom';
import {Layers} from 'lucide-react';
import {Button} from '../../../components/ui/Button';
import './account.css';
export function AccountLayout() {
  const members=/^\/workspaces\/[^/]+\/(members|teams(?:\/[^/]+)?)$/.test(useLocation().pathname);
  const [dark,setDark]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-color-scheme: dark)');const update=()=>setDark(media.matches);
    media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
  },[]);
  return <div className={`auth-surface ${dark?'dark':''} min-h-screen bg-surface-subtle text-text-primary flex flex-col`}>
    <header className="flex items-center justify-between gap-4 p-4 sm:px-8">
      <Link to="/" className="flex items-center gap-2 font-semibold" aria-label="Unblok home"><Layers size={22} className="text-accent"/>Unblok</Link>
      <Button size="sm" variant="ghost" onClick={()=>setDark(!dark)} aria-label={`Use ${dark?'light':'dark'} theme`}>{dark?'Light':'Dark'}</Button>
    </header>
    <main className="flex-1 flex items-center justify-center px-4 py-8"><div className={members?"w-full max-w-3xl":"w-full max-w-md"}><Outlet/></div></main>
    <footer className="flex justify-center gap-4 p-4 text-xs text-text-secondary"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="/demo/my-work">Explore NEXUS demo</a></footer>
  </div>;
}
