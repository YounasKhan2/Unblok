import React from 'react';
import {AppProviders} from '../../../app/providers/AppProviders';
import {AppRouter} from '../../../app/router/AppRouter';
import {SEED_PROTOTYPE_USERS} from '../domain/mockAuthAdapter';

/** Curated prototype identity is confined to the explicit demo route family. */
export function DemoExperience(){
  const seed=SEED_PROTOTYPE_USERS['alex.rivera@nexus.example'];
  return <AppProviders initialAuthStatus="authenticated" initialUser={seed.user}>
    <div className="fixed bottom-3 right-3 z-[100] rounded-md border border-border bg-surface-base px-3 py-2 text-xs text-text-primary shadow-sm" role="note">NEXUS demo · Curated sample data · <a href="/login" className="text-accent underline">Real account</a></div>
    <AppRouter basename="/demo" enableDevHarness={false}/>
  </AppProviders>;
}
