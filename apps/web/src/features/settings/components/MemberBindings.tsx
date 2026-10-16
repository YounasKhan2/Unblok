import {createContext,useContext,type ReactNode} from 'react';
import type {User,Team,UserRole} from '../../../types';
import type {InviteMemberInput,PendingInvitation} from '../types';
export type MemberView=User&{status?:string;moreTeams?:boolean};
export type InvitationView=Omit<PendingInvitation,'status'>&{status:string;delivery?:string};
export interface MemberBindings {
 live?:boolean;users:MemberView[];teams:Pick<Team,'id'|'name'|'key'>[];eligibleTeams?:Pick<Team,'id'|'name'|'key'>[];invitations:InvitationView[];currentUser:{id:string};
 updateUserRole:(id:string,role:UserRole)=>unknown;canDemoteUser?:(id:string)=>boolean;inviteMember:(input:InviteMemberInput)=>unknown;resendInvitation:(id:string)=>unknown;revokeInvitation:(id:string)=>unknown;
 authorized?:boolean;retryInvite?:()=>Promise<boolean>;retryRemoval?:(id:string)=>Promise<boolean>;pendingRemoval?:string;
 canMutate?:boolean;busy?:boolean;error?:string;notice?:string;loading?:boolean;activeCount?:number;pendingCount?:number;
 filter?:(search:string,role:string,team:string,status:string)=>void;footer?:ReactNode;invitationFooter?:ReactNode;teamFooter?:ReactNode;feedback?:ReactNode;
 removeMember?:(id:string)=>Promise<boolean>;moreTeams?:(id:string)=>void;
}
export const MemberBindingsContext=createContext<MemberBindings|null>(null);
export function useMemberBindings(){const value=useContext(MemberBindingsContext);if(!value)throw Error('Member bindings required');return value;}
