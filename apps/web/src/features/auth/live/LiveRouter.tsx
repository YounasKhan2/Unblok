import {TeamsProvider} from '../../teams/live/TeamsContext';
import {TeamDirectoryPage,LiveTeamHubPage} from '../../teams/live/TeamsPages';
import React from 'react';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
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
import {MembersProvider} from '../../workspaces/live/MembersContext';
import {MembersPage} from '../../workspaces/live/MembersPage';
import {InvitationPage} from '../../workspaces/live/InvitationPage';
import {LiveWorkspaceProvider} from '../../workspaces/live/WorkspaceContext';
import {CreateLiveWorkspacePage,LiveWorkspacePage} from '../../workspaces/live/WorkspacePages';

export function LiveRoutes() {
  return <TeamsProvider><MembersProvider><Routes>
    <Route element={<PublicLayout/>}>
      <Route path="/" element={<HomePage/>}/><Route path="/product" element={<ProductPage/>}/>
      <Route path="/features" element={<FeaturesPage/>}/><Route path="/solutions" element={<SolutionsPage/>}/>
      <Route path="/pricing" element={<PricingPage/>}/><Route path="/security" element={<SecurityPage/>}/>
      <Route path="/contact" element={<ContactPage/>}/><Route path="/privacy" element={<PrivacyPage/>}/><Route path="/terms" element={<TermsPage/>}/>
    </Route>
    <Route element={<AccountLayout/>}>
      <Route element={<SessionGuard anonymous/>}>
        <Route path="/login" element={<CredentialsPage key="login" mode="login"/>}/><Route path="/signup" element={<CredentialsPage key="signup" mode="signup"/>}/>
      </Route>
      <Route element={<SessionGuard open/>}>
        <Route path="/forgot-password" element={<CredentialsPage key="forgot" mode="forgot"/>}/><Route path="/reset-password" element={<CredentialsPage key="reset" mode="reset"/>}/>
      </Route>
      <Route element={<SessionGuard/>}>
        <Route path="/account" element={<AccountPage/>}/><Route path="/verify-email" element={<VerificationPage/>}/>
        <Route path="/workspaces/:workspaceId/teams" element={<TeamDirectoryPage/>}/><Route path="/workspaces/:workspaceId/teams/:teamId" element={<LiveTeamHubPage/>}/>
        <Route path="/workspaces/:workspaceId/members" element={<MembersPage/>}/><Route path="/onboarding/workspace" element={<CreateLiveWorkspacePage/>}/><Route path="/workspaces/:workspaceId" element={<LiveWorkspacePage/>}/>
        {['onboarding','my-work','projects','teams','issues','dependencies','cycles','milestones','roadmap','inbox','insights','settings'].map(path=><Route key={path} path={`/${path}/*`} element={<Navigate to="/account" replace/>}/>)}
      </Route>
      <Route path="/invite" element={<InvitationPage/>}/><Route path="/invite/:token" element={<Navigate to="/invite" replace/>}/>
    </Route>
    <Route element={<PublicLayout/>}><Route path="*" element={<PublicNotFoundPage/>}/></Route>
  </Routes></MembersProvider></TeamsProvider>;
}
export function LiveRouter(){return <LiveWorkspaceProvider><BrowserRouter><LiveRoutes/></BrowserRouter></LiveWorkspaceProvider>;}
