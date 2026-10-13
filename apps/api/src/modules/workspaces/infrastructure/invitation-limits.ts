import type Redis from 'ioredis';
import {createHmac} from 'node:crypto';
import {withDeadline} from '@unblok/backend-runtime';
import {AuthUnavailableError} from '@unblok/database';
import {RedisRateLimiter} from '../../../security';
export class InvitationLimits {
 private readonly actor:RedisRateLimiter;private readonly workspace:RedisRateLimiter;private readonly issueIp:RedisRateLimiter;private readonly recipient:RedisRateLimiter;private readonly acceptIp:RedisRateLimiter;
 constructor(redis:Redis,private readonly secret:string,namespace:string){
  this.actor=new RedisRateLimiter(redis,5,3600000,namespace+'invitation-issue:');this.workspace=new RedisRateLimiter(redis,10,3600000,namespace+'invitation-workspace:');this.issueIp=new RedisRateLimiter(redis,30,3600000,namespace+'invitation-issue-ip:');this.recipient=new RedisRateLimiter(redis,10,900000,namespace+'invitation-accept:');this.acceptIp=new RedisRateLimiter(redis,30,900000,namespace+'invitation-accept-ip:');
 }
 async consume(action:'issue'|'accept',actor:string,ip:string,workspace?:string){
  const hash=(value:string)=>createHmac('sha256',this.secret).update('invitation-rate-v1:'+value).digest('hex');
  try{const tasks=action==='issue'?[this.actor.consume(hash(actor)),this.workspace.consume(hash(workspace??'')),this.issueIp.consume(hash(ip))]:[this.recipient.consume(hash(actor)),this.acceptIp.consume(hash(ip))];const results=await withDeadline(Promise.all(tasks),750);return {allowed:results.every(r=>r.allowed),retryAfter:Math.max(...results.map(r=>r.retryAfter))};}catch{throw new AuthUnavailableError();}
 }
}
