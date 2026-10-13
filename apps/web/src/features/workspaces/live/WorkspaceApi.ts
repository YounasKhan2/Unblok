import {createWorkspaceSchema,workspacePageSchema,workspaceDetailSchema,workspaceSelfSchema,workspaceCreatedSchema} from '@unblok/contracts';
import {AuthApi} from '../../auth/api/authApi';
export type WorkspacePage=ReturnType<typeof workspacePageSchema.parse>;
export type WorkspaceDetail=ReturnType<typeof workspaceDetailSchema.parse>;
export type WorkspaceInput=ReturnType<typeof createWorkspaceSchema.parse>;
export class WorkspaceApi {
  constructor(private readonly auth:AuthApi){}
  list(signal:AbortSignal,after?:string){return this.auth.workspaceRead('?limit=20&sort=workspace_asc'+(after?'&after='+encodeURIComponent(after):''),workspacePageSchema,signal).then(page=>{
    if(page.items.length>20||page.page.hasMore!==!!page.page.nextCursor)throw new Error('Invalid workspace page');return page;
  });}
  async context(id:string,signal:AbortSignal){
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))throw new Error('Invalid workspace selection');
    const [detail,self]=await Promise.all([this.auth.workspaceRead('/'+id,workspaceDetailSchema,signal),this.auth.workspaceRead('/'+id+'/me',workspaceSelfSchema,signal)]);
    if(detail.workspace.id!==id||detail.self.workspaceId!==id||self.workspaceId!==id||detail.workspace.membershipRole!==self.role||JSON.stringify(detail.self)!==JSON.stringify(self)||detail.workspace.status!==self.workspaceStatus)throw new Error('Workspace changed; select it again.');
    return {workspace:detail.workspace,self};
  }
  create(body:WorkspaceInput,key:string,signal:AbortSignal){return this.auth.workspaceCreate(workspaceCreatedSchema,createWorkspaceSchema.parse(body),key,signal).then(result=>{
    if(result.workspace.id!==result.initialAdministrator.workspaceId||result.workspace.name!==body.name||result.workspace.slug!==body.slug||result.workspace.status!=='ACTIVE'||result.workspace.membershipRole!=='ADMIN'||result.initialAdministrator.role!=='ADMIN'||result.initialAdministrator.workspaceStatus!=='ACTIVE')throw new Error('Unconfirmed workspace response');return result;
  });}
}
