import React from 'react';
import {BrowserRouter,Routes,Route,Navigate,Link} from 'react-router-dom';
import {PublicLayout} from '../../../app/layouts/PublicLayout';
import {HomePage} from '../../../pages/public/HomePage';
import {ProductPage} from '../../../pages/public/ProductPage';
import {FeaturesPage} from '../../../pages/public/FeaturesPage';
import {SolutionsPage} from '../../../pages/public/SolutionsPage';
import {PricingPage} from '../../../pages/public/PricingPage';
import {SecurityPage} from '../../../pages/public/SecurityPage';
import {ContactPage} from '../../../pages/public/ContactPage';
import {PrivacyPage} from '../../../pages/public/PrivacyPage';
import {TermsPage} from '../../../pages/public/TermsPage';
import {PublicNotFoundPage} from '../../public/components/PublicNotFoundPage';
import {AccountLayout} from './AccountLayout';
import {SessionGuard} from './SessionGuard';
import {CredentialsPage} from './CredentialsPage';
import {AccountPage} from './AccountPage';
import {VerificationPage} from './VerificationPage';
import {AuthCard} from '../components/AuthCard';
import {LiveWorkspaceProvider} from '../../workspaces/live/WorkspaceContext';
import {CreateLiveWorkspacePage,LiveWorkspacePage} from '../../workspaces/live/WorkspacePages';

export function LiveRoutes() {
  return <Routes>
    <Route element={<PublicLayout/>}>
      <Route path="/" element={<HomePage/>}/><Route path="/product" element={<ProductPage/>}/>
      <Route path="/features" element={<FeaturesPage/>}/><Route path="/solutions" element={<SolutionsPage/>}/>
      <Route path="/pricing" element={<PricingPage/>}/><Route path="/security" element={<SecurityPage/>}/>
      <Route path="/contact" element={<ContactPage/>}/><Route path="/privacy" element={<PrivacyPage/>}/><Route path="/terms" element={<TermsPage/>}/>
    </Route>
    <Route element={<AccountLayout/>}>
      <Route element={<SessionGuard anonymous/>}>
        <Route path="/login" element={<CredentialsPage mode="login"/>}/><Route path="/signup" element={<CredentialsPage mode="signup"/>}/>
      </Route>
      <Route element={<SessionGuard open/>}>
        <Route path="/forgot-password" element={<CredentialsPage mode="forgot"/>}/><Route path="/reset-password" element={<CredentialsPage mode="reset"/>}/>
      </Route>
      <Route element={<SessionGuard/>}>
        <Route path="/account" element={<AccountPage/>}/><Route path="/verify-email" element={<VerificationPage/>}/>
        <Route path="/onboarding/workspace" element={<CreateLiveWorkspacePage/>}/><Route path="/workspaces/:workspaceId" element={<LiveWorkspacePage/>}/>
        {['onboarding','my-work','projects','teams','issues','dependencies','cycles','milestones','roadmap','inbox','insights','settings'].map(path=><Route key={path} path={`/${path}/*`} element={<Navigate to="/account" replace/>}/>)}
      </Route>
      <Route path="/invite/:token" element={<AuthCard appearance="application" title="Workspace invitations" subtitle="Workspace invitations are not connected yet. No access has been granted."><Link to="/account" className="text-accent">Go to your account</Link></AuthCard>}/>
    </Route>
    <Route element={<PublicLayout/>}><Route path="*" element={<PublicNotFoundPage/>}/></Route>
  </Routes>;
}
export function LiveRouter(){return <LiveWorkspaceProvider><BrowserRouter><LiveRoutes/></BrowserRouter></LiveWorkspaceProvider>;}
