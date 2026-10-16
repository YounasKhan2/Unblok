import type {WorkspacePage,WorkspaceDetail} from './WorkspaceApi';
import type {WorkspaceMenuItem} from '../../../app/shell/ShellBindings';
/** Discovery projects ACTIVE memberships; menu rows are not authorization grants.
 * Keep a freshly validated selection visible even when outside the bounded page.
 */
export function workspaceMenuItems(page:WorkspacePage|null,context:WorkspaceDetail|null):WorkspaceMenuItem[]{
 const selected=context?{workspace:context.workspace,membership:{role:context.self.role,status:context.self.membershipStatus}}:null;
 const items=(page?.items??[]).map(row=>selected&&row.id===selected.workspace.id?selected:{workspace:row,membership:{role:row.membershipRole,status:'ACTIVE'}});
 if(selected&&!items.some(item=>item.workspace.id===selected.workspace.id))items.push(selected);
 return items;
}
