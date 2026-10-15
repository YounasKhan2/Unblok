import React from 'react';
import {signupSchema,loginSchema,passwordRecoveryRequestSchema,passwordRecoveryConfirmSchema} from '@unblok/contracts';
import {AuthContext,type AuthContextType} from '../context/AuthBindings';
import {useSession} from '../session/SessionContext';
import type {AuthAdapter} from '../types';
function unsupported():never{throw new Error('This prototype operation is not available in authenticated live mode.');}
export function LiveAuthBindings({children}:{children:React.ReactNode}){
 const {store,user,status,pending,sessionExpired}=useSession();
 const login=async(input:{email:string;password:string})=>{await store.login(loginSchema.parse(input));return {success:true};};
 const signup=async(input:{name:string;email:string;password:string})=>{await store.submit(()=>store.api.signup(signupSchema.parse(input)));return {success:true};};
 const adapter:AuthAdapter={login,signup,
 requestPasswordReset:async(email)=>{await store.submit(()=>store.api.requestRecovery(passwordRecoveryRequestSchema.parse({email}).email));return {success:true,message:'Request received. Email delivery is not guaranteed.'};},
 resetPassword:async({email,token,newPassword})=>{await store.reset(passwordRecoveryConfirmSchema.parse({email,token,password:newPassword}));return {success:true};},
 validateInvitation:unsupported,acceptInvitation:unsupported};
 const value:AuthContextType={mode:'live',status:status==='authenticated'?'authenticated':sessionExpired?'sessionExpired':'guest',user:user?{...user,email:user.email??''}:null,membership:null,isLoading:pending,login,signup,adapter,
 logout:()=>{void store.logout();},expireSession:unsupported,restoreSession:unsupported,setGuest:unsupported,switchReviewerUser:unsupported};
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
