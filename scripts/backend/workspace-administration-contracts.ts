import {workspaceAdministrationJsonSchemas,workspaceInvitationJsonSchemas} from '@unblok/contracts';
export function workspaceAdministrationOpenApi(){
 const ref=(name:string)=>({$ref:'#/components/schemas/'+name});
 const response=(name:string,status:number,bytes:number)=>({security:[{cookieSession:[]}],'x-response-byte-limit':bytes,responses:{[status]:{description:'Authorized private projection or neutral acknowledgment; never evidence of a membership grant or external email delivery',content:{'application/json':{schema:ref(name)}}},401:{description:'Authentication required'},404:{description:'Concealed scope/authority denial'},409:{description:'Semantic/serialization conflict or stale cursor'},429:{description:'Rate exceeded; Retry-After'},503:{description:'Unavailable or unknown outcome; no automatic retry'}}});
 const parameter=(name:string)=>({in:'path',name,required:true,schema:{type:'string',format:'uuid'}}),ws=parameter('workspaceId'),member=parameter('membershipId'),inv=parameter('invitationId');
 const query=(name:string,schema:object)=>({in:'query',name,schema});
 const paging=[query('limit',{type:'integer',minimum:1,maximum:100,default:20}),query('after',{type:'string',maxLength:4096})];
 const body=(name:string)=>({required:true,content:{'application/json':{schema:ref(name)}}});
 const mutation=(name:string|undefined,match:boolean)=>({...response('InvitationAccepted',202,65536),parameters:[{in:'header',name:'Idempotency-Key',required:true,schema:{type:'string',format:'uuid'}},{in:'header',name:'X-CSRF-Token',required:true,schema:{type:'string',pattern:'^[A-Za-z0-9_-]{43}$'}},{in:'header',name:'Origin',required:true,schema:{type:'string'}},...(match?[{in:'header',name:'If-Match',required:true,schema:{type:'string',pattern:'^"[1-9][0-9]{0,18}"$'}}]:[])],...(name?{requestBody:body(name)}:{}),'x-precondition-errors':match?[428,412]:[]});
 const root='/api/v1/workspaces/{workspaceId}/administration';
 return {openapi:'3.1.0',info:{title:'Unblok Workspace administration additive contracts',version:'2'},paths:{
  [root+'/memberships']:{parameters:[ws],get:{...response('AdministrationMemberPage',200,1048576),parameters:[...paging,query('status',{enum:['ALL','ACTIVE','INVITED','SUSPENDED','REMOVED'],default:'ALL'}),query('role',{enum:['ADMIN','MEMBER','OBSERVER']}),query('search',{type:'string',maxLength:120}),query('teamId',{type:'string',format:'uuid'})]}},
  [root+'/memberships/{membershipId}']:{parameters:[ws,member],patch:mutation('AdministrationRole',true),delete:mutation(undefined,true)},
  [root+'/memberships/{membershipId}/teams']:{parameters:[ws,member],get:{...response('AdministrationTeamPage',200,65536),parameters:paging}},
  [root+'/eligible-teams']:{parameters:[ws],get:{...response('AdministrationTeamPage',200,65536),parameters:paging}},
  [root+'/invitations']:{parameters:[ws],get:{...response('AdministrationInvitationPage',200,2097152),parameters:[...paging,query('status',{enum:['PENDING','EXPIRED','REVOKED','ACCEPTED','SUPERSEDED','INVALIDATED']}),query('search',{type:'string',maxLength:120})]},post:mutation('AdministrationInvite',false)},
  [root+'/invitations/{invitationId}']:{parameters:[ws,inv],get:response('AdministrationInvitation',200,32768)},
  [root+'/invitations/{invitationId}/resend']:{parameters:[ws,inv],post:mutation('EmptyAdministration',true)},
  [root+'/invitations/{invitationId}/revoke']:{parameters:[ws,inv],post:mutation('EmptyAdministration',true)},
  '/api/v1/workspace-invitations/preview':{post:{...response('AdministrationPreview',200,32768),requestBody:body('InvitationAccept'),parameters:[{in:'header',name:'X-CSRF-Token',required:true,schema:{type:'string',pattern:'^[A-Za-z0-9_-]{43}$'}},{in:'header',name:'Origin',required:true,schema:{type:'string'}}]}},
 },components:{securitySchemes:{cookieSession:{type:'apiKey',in:'cookie',name:'__Host-unblok.sid',description:'Existing production cookie; localhost unblok.sid.dev. Verified scoped ADMIN for private administration, or verified matching recipient plus authentic proof for recipient preview.'}},schemas:{...workspaceAdministrationJsonSchemas(),...workspaceInvitationJsonSchemas(),EmptyAdministration:{type:'object',additionalProperties:false,properties:{}}}}};
}
if(import.meta.main)await Bun.write('docs/backend/evidence/BE-01B-openapi.json',JSON.stringify(workspaceAdministrationOpenApi(),null,2)+'\n');
