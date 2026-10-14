import {teamJsonSchemas} from '@unblok/contracts';
export function teamOpenApi(){
 const ref=(name:string)=>({$ref:'#/components/schemas/'+name});
 const response=(name:string,status='200')=>({[status]:{description:'Bounded server-authorized Team response',content:{'application/json':{schema:ref(name)}}}});
 const errors=Object.fromEntries(['400','401','403','404','409','412','413','428','429','503'].map(status=>[status,{description:'Generic existing error envelope; authorization before resource/precondition disclosure'}]));
 const operation=(id:string,name:string,status='200')=>({operationId:id,security:[{cookieSession:[]}],responses:{...response(name,status),...errors}});
 const parameter=(name:string)=>({in:'path',name,required:true,schema:{type:'string',format:'uuid'}});
 const headers=[{in:'header',name:'Idempotency-Key',required:true,schema:{type:'string',format:'uuid'}},{in:'header',name:'X-CSRF-Token',required:true,schema:{type:'string',pattern:'^[A-Za-z0-9_-]{43}$'}}];
 const body=(name:string)=>({required:true,content:{'application/json':{schema:ref(name)}}});
 return {openapi:'3.1.0',info:{title:'Unblok Team foundation',version:'1'},paths:{
 '/api/v1/workspaces/{workspaceId}/teams':{parameters:[parameter('workspaceId')],get:{...operation('listTeams','TeamPage'),parameters:[{in:'query',name:'limit',schema:{type:'integer',minimum:1,maximum:100,default:50}},{in:'query',name:'status',schema:{type:'string',enum:['ACTIVE','ARCHIVED','ALL'],default:'ACTIVE'}},{in:'query',name:'after',schema:{type:'string',minLength:1,maxLength:2048}}]},post:{...operation('createTeam','TeamDetail','201'),parameters:headers,requestBody:body('TeamCreated')}},
 '/api/v1/workspaces/{workspaceId}/teams/{teamId}':{parameters:[parameter('workspaceId'),parameter('teamId')],get:operation('detailTeam','TeamDetail'),patch:{...operation('updateTeam','TeamDetail'),parameters:[...headers,{in:'header',name:'If-Match',required:true,schema:{type:'string',pattern:'^"team-[1-9][0-9]{0,18}"$'}}],requestBody:body('TeamPatch')}}},components:{securitySchemes:{cookieSession:{type:'apiKey',in:'cookie',name:'__Host-unblok.sid',description:'Production cookie; localhost unblok.sid.dev. Fresh primary authority required.'}},schemas:teamJsonSchemas()}};
}
if(import.meta.main)await Bun.write('docs/backend/evidence/BE-TEAM-01-openapi.json',JSON.stringify(teamOpenApi(),null,2)+'\n');
