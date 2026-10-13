import {workspaceInvitationJsonSchemas} from '@unblok/contracts';
export function workspaceInvitationOpenApi(){
 const response=(name:string,status:number,budget:number)=>({security:[{cookieSession:[]}],responses:{[status]:{description:'Bounded server-authorized response; accepted is not a membership grant',content:{'application/json':{schema:{$ref:'#/components/schemas/'+name}}}}},'x-response-byte-limit':budget});
 const mutation=(name:string)=>({...response('InvitationAccepted',202,65536),parameters:[{in:'header',name:'Idempotency-Key',required:true,schema:{type:'string',format:'uuid'}},{in:'header',name:'X-CSRF-Token',required:true,schema:{type:'string',pattern:'^[A-Za-z0-9_-]{43}$'}},{in:'header',name:'Origin',required:true,schema:{type:'string'}}],requestBody:{required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/'+name}}}}});
 const scope={in:'path',name:'workspaceId',required:true,schema:{type:'string',format:'uuid'}};
 return {openapi:'3.1.0',info:{title:'Unblok Workspace memberships and invitations',version:'1'},paths:{
 '/api/v1/workspaces/{workspaceId}/memberships':{parameters:[scope],get:{...response('MembershipPage',200,131072),parameters:[{in:'query',name:'limit',schema:{type:'integer',minimum:1,maximum:100,default:50}},{in:'query',name:'sort',schema:{type:'string',enum:['joined_asc','joined_desc'],default:'joined_asc'}},{in:'query',name:'status',schema:{type:'string',enum:['ACTIVE','INVITED','SUSPENDED','ALL'],default:'ALL'}},{in:'query',name:'after',schema:{type:'string',minLength:1,maxLength:2048}}]}},
 '/api/v1/workspaces/{workspaceId}/invitations':{parameters:[scope],post:mutation('InvitationRequest')},
 '/api/v1/workspace-invitations/accept':{post:mutation('InvitationAccept')}},components:{securitySchemes:{cookieSession:{type:'apiKey',in:'cookie',name:'__Host-unblok.sid',description:'Production cookie. Localhost uses unblok.sid.dev; fresh primary/session authority mandatory.'}},schemas:workspaceInvitationJsonSchemas()}};
}
if(import.meta.main)await Bun.write('docs/backend/evidence/BE-WS-02-openapi.json',JSON.stringify(workspaceInvitationOpenApi(),null,2)+'\n');
