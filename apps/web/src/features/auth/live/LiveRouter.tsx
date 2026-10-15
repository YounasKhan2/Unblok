import {IssueUnavailable} from '../../issues/components/IssueUnavailable';
import {WorkspaceSettingsPageFrame} from '../../../pages/settings/WorkspaceSettingsPageFrame';
import {IntegrationsSettingsPageFrame} from '../../../pages/settings/IntegrationsSettingsPageFrame';
import {InsightsPageFrame} from '../../../pages/insights/InsightsPageFrame';
import {DependenciesPageFrame} from '../../../pages/dependencies/DependenciesPageFrame';
import {RoadmapPageFrame} from '../../../pages/roadmap/RoadmapPageFrame';
import {MilestonesPageFrame} from '../../../pages/milestones/MilestonesPageFrame';
import {CyclesPageFrame} from '../../../pages/cycles/CyclesPageFrame';
import {InboxPageFrame} from '../../../pages/inbox/InboxPageFrame';
import {ProjectsDirectoryPageFrame} from '../../../pages/projects/ProjectsDirectoryPageFrame';
import {MyWorkPageFrame} from '../../../pages/my-work/MyWorkPageFrame';
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
import {AuthLayout} from '../../../app/layouts/AuthLayout';
import {LiveAuthBindings} from './LiveAuthBindings';
import {LoginPage} from '../../../pages/auth/LoginPage';
import {SignupPage} from '../../../pages/auth/SignupPage';
import {ForgotPasswordPage} from '../../../pages/auth/ForgotPasswordPage';
import {ResetPasswordPage} from '../../../pages/auth/ResetPasswordPage';
import {CreateWorkspacePage} from '../../../pages/onboarding/CreateWorkspacePage';
import {LiveShellBoundary,LiveCreationBinding,OpenLiveWorkspace} from '../../../app/shell/LiveShellBindings';
import {SettingsLayout} from '../../settings/components/SettingsLayout';
import {PreferencesSettingsPage} from '../../../pages/settings/PreferencesSettingsPage';
import {SessionGuard} from './SessionGuard';
import {AccountPage} from './AccountPage';
import {VerificationPage} from './VerificationPage';
import {MembersProvider} from '../../workspaces/live/MembersContext';
import {MembersPage} from '../../workspaces/live/MembersPage';
import {InvitationPage} from '../../workspaces/live/InvitationPage';
import {LiveWorkspaceProvider,useLiveWorkspace} from '../../workspaces/live/WorkspaceContext';

export function LiveRoutes() {
  return <LiveAuthBindings><TeamsProvider><MembersProvider><Routes>
    <Route element={<PublicLayout/>}>
      <Route path="/" element={<HomePage/>}/><Route path="/product" element={<ProductPage/>}/>
      <Route path="/features" element={<FeaturesPage/>}/><Route path="/solutions" element={<SolutionsPage/>}/>
      <Route path="/pricing" element={<PricingPage/>}/><Route path="/security" element={<SecurityPage/>}/>
      <Route path="/contact" element={<ContactPage/>}/><Route path="/privacy" element={<PrivacyPage/>}/><Route path="/terms" element={<TermsPage/>}/>
    </Route>
    <Route element={<AuthLayout/>}>
      <Route element={<SessionGuard anonymous/>}>
        <Route path="/login" element={<LoginPage/>}/><Route path="/signup" element={<SignupPage/>}/>
      </Route>
      <Route element={<SessionGuard open/>}>
        <Route path="/forgot-password" element={<ForgotPasswordPage/>}/><Route path="/reset-password" element={<ResetPasswordPage/>}/>
      </Route>
      <Route element={<SessionGuard/>}>
        <Route path="/account" element={<AccountPage/>}/><Route path="/verify-email" element={<VerificationPage/>}/>
        <Route path="/onboarding/workspace" element={<LiveCreationBinding><CreateWorkspacePage/></LiveCreationBinding>}/>
        <Route path="/workspaces/:workspaceId" element={<OpenLiveWorkspace/>}/>
        <Route path="/onboarding" element={<Navigate to="/account" replace/>}/>

      </Route>
      <Route path="/invite" element={<InvitationPage/>}/><Route path="/invite/:token" element={<Navigate to="/invite" replace/>}/>
    </Route>
    <Route element={<SessionGuard/>}><Route element={<LiveShellBoundary/>}>
      <Route path="/my-work/*" element={<MyWorkPageFrame unavailable/>}/>
      <Route path="/projects/*" element={<ProjectsDirectoryPageFrame unavailable/>}/>
      <Route path="/issues/*" element={<IssueUnavailable unavailable/>}/>
      <Route path="/inbox/*" element={<InboxPageFrame unavailable/>}/>
      <Route path="/cycles/*" element={<CyclesPageFrame unavailable/>}/>
      <Route path="/milestones/*" element={<MilestonesPageFrame unavailable/>}/>
      <Route path="/roadmap/*" element={<RoadmapPageFrame unavailable/>}/>
      <Route path="/dependencies/*" element={<DependenciesPageFrame unavailable/>}/>
      <Route path="/insights/*" element={<InsightsPageFrame unavailable/>}/>
      <Route path="/teams" element={<LiveTeamDirectoryRedirect/>}/>
      <Route path="/teams/*" element={<LiveTeamDirectoryRedirect/>}/>
      <Route path="/workspaces/:workspaceId/teams" element={<TeamDirectoryPage/>}/>
      <Route path="/workspaces/:workspaceId/teams/:teamId" element={<LiveTeamHubPage/>}/>
      <Route path="/workspaces/:workspaceId/members" element={<MembersPage/>}/>
      <Route path="/settings" element={<SettingsLayout/>}>
        <Route index element={<Navigate to="preferences" replace/>}/>
        <Route path="preferences" element={<PreferencesSettingsPage/>}/>
        <Route path="members" element={<LiveMembersRedirect/>}/>
        <Route path="teams" element={<LiveTeamDirectoryRedirect/>}/>
        <Route path="workspace" element={<WorkspaceSettingsPageFrame unavailable/>}/>
        <Route path="integrations" element={<IntegrationsSettingsPageFrame unavailable/>}/>
        <Route path="*" element={<WorkspaceSettingsPageFrame unavailable/>}/>
      </Route>
    </Route></Route>
    <Route element={<PublicLayout/>}><Route path="*" element={<PublicNotFoundPage/>}/></Route>
  </Routes></MembersProvider></TeamsProvider></LiveAuthBindings>;
}
export function LiveRouter(){return <LiveWorkspaceProvider><BrowserRouter><LiveRoutes/></BrowserRouter></LiveWorkspaceProvider>;}

function LiveTeamDirectoryRedirect(){const w=useLiveWorkspace();return w.context?<Navigate to={'/workspaces/'+w.context.workspace.id+'/teams'} replace/>:null;}
function LiveMembersRedirect(){const w=useLiveWorkspace();return w.context?<Navigate to={'/workspaces/'+w.context.workspace.id+'/members'} replace/>:null;}
