import type Redis from 'ioredis';
import { createHmac } from 'node:crypto';
import { withDeadline } from '@unblok/backend-runtime';
import { AuthUnavailableError } from '@unblok/database';
import { RedisRateLimiter } from '../../../security';
export class TeamLimits {
  private readonly limits:Record<string,RedisRateLimiter>;
  constructor(redis:Redis,private readonly secret:string,namespace:string){
    this.limits={createActor:new RedisRateLimiter(redis,5,3600000,namespace+'teams:create:actor:'),createWorkspace:new RedisRateLimiter(redis,10,3600000,namespace+'teams:create:workspace:'),
      updateActor:new RedisRateLimiter(redis,20,60000,namespace+'teams:update:actor:'),updateWorkspace:new RedisRateLimiter(redis,60,60000,namespace+'teams:update:workspace:'),
      readActor:new RedisRateLimiter(redis,60,60000,namespace+'teams:read:actor:'),readWorkspace:new RedisRateLimiter(redis,300,60000,namespace+'teams:read:workspace:')};
  }
  async consume(action:'create'|'update'|'read',actor:string,workspace:string){
    const hash=(value:string)=>createHmac('sha256',this.secret).update('team-admission:'+value).digest('hex');
    try{const results=await withDeadline(Promise.all([this.limits[action+'Actor']!.consume(hash(actor)),this.limits[action+'Workspace']!.consume(hash(workspace))]),750);return {allowed:results.every(r=>r.allowed),retryAfter:Math.max(...results.map(r=>r.retryAfter))};}catch{throw new AuthUnavailableError();}
  }
}
