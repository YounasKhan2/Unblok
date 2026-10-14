import {teamManagementJsonSchemas,teamJsonSchemas} from '@unblok/contracts';
export function teamManagementOpenApi(){
 const base='/api/v1/workspaces/{workspaceId}/teams/{teamId}',ref=(name:string)=>({$ref:'#/components/schemas/'+name}),response=(name:string)=>({description:'Bounded current-authorized response',content:{'application/json':{schema:ref(name)}}}),path=(name:string)=>({in:'path',name,required:true,schema:{type:'string',format:'uuid'}}),parameters=[path('workspaceId'),path('teamId')];
 const headers=[{in:'header',name:'Idempotency-Key',required:true,schema:{type:'string',format:'uuid'}},{in:'header',name:'X-CSRF-Token',required:true,schema:{type:'string',pattern:'^[A-Za-z0-9_-]{43}$'}},{in:'header',name:'If-Match',required:true,schema:{type:'string',pattern:'^"team-[1-9][0-9]{0,18}"$'}}];
 const errors=Object.fromEntries(['400','401','403','404','409','412','413','428','429','503'].map(code=>[code,{description:'Existing generic error envelope; current scope precedes domain disclosure'}]));
 const op=(operationId:string,schema:string,body?:string,created=false)=>({operationId,security:[{cookieSession:[]}],responses:{200:response(schema),...(created?{201:response(schema)}:{}),...errors},...(body!==undefined?{parameters:headers,...(body?{requestBody:{required:true,content:{'application/json':{schema:ref(body)}}}}:{})}:{})});
 return {openapi:'3.1.0',info:{title:'Unblok BE-TEAM-02 management',version:'1'},paths:{
 [base+'/memberships']:{parameters,get:{...op('listTeamMembers','TeamMemberPage'),parameters:[{in:'query',name:'limit',schema:{type:'integer',minimum:1,maximum:100,default:20}},{in:'query',name:'status',schema:{type:'string',enum:['ACTIVE','SUSPENDED','INVITED','ALL'],default:'ALL'}},{in:'query',name:'after',schema:{type:'string',maxLength:2048}}]},post:op('addTeamMember','TeamMemberMutation','TeamMemberAdd',true)},
 [base+'/memberships/{membershipId}']:{parameters:[...parameters,path('membershipId')],patch:op('updateTeamRole','TeamMemberMutation','TeamMemberRole'),delete:op('removeTeamMember','TeamMemberMutation','')},
 [base+'/ownership-transfer-requests']:{parameters,post:op('requestTeamTransfer','TransferRecorded','TransferRequest',true)},
 [base+'/ownership-transfer-requests/{requestId}']:{parameters:[...parameters,path('requestId')],get:op('detailTeamTransfer','TransferDetail')},
 [base+'/ownership-transfer-requests/{requestId}/accept']:{parameters:[...parameters,path('requestId')],post:op('acceptTeamTransfer','TransferAccepted','Empty')},
 [base+'/ownership-transfer-requests/{requestId}/reject']:{parameters:[...parameters,path('requestId')],post:op('rejectTeamTransfer','TransferRejected','Empty')},
 [base+'/archive']:{parameters,post:op('archiveTeam','TeamDetail','Empty')},[base+'/restore']:{parameters,post:op('restoreTeam','TeamDetail','Empty')}
 },components:{securitySchemes:{cookieSession:{type:'apiKey',in:'cookie',name:'__Host-unblok.sid',description:'Development unblok.sid.dev; live primary fences and Origin/CSRF required'}},schemas:{...teamManagementJsonSchemas(),TeamDetail:teamJsonSchemas().TeamDetail,Empty:{type:'object',additionalProperties:false}}}};
}
if(import.meta.main)await Bun.write('docs/backend/evidence/be-team-02/contracts.json',JSON.stringify(teamManagementOpenApi(),null,2)+'\n');
