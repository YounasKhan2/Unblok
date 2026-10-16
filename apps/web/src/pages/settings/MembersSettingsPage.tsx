import {useSettings} from '../../features/settings/context/SettingsContext';
import {useProject} from '../../context/ProjectContext';
import {MemberBindingsContext} from '../../features/settings/components/MemberBindings';
import {MembersSettingsPageFrame} from './MembersSettingsPageFrame';
export function MembersSettingsPage(){const settings=useSettings(),project=useProject();return <MemberBindingsContext.Provider value={{...settings,users:project.users,teams:project.teams}}><MembersSettingsPageFrame/></MemberBindingsContext.Provider>;}
