import React,{useEffect,useRef} from 'react';
/** Announce a completed action or error and move focus to its recovery guidance. */
export function AuthFeedback({message,error=false}:{message:string;error?:boolean}) {
  const ref=useRef<HTMLParagraphElement>(null);
  useEffect(()=>{if(message)ref.current?.focus();},[message]);
  return <p ref={ref} tabIndex={-1} role={error?'alert':'status'} className={error?'text-sm text-danger':'text-sm text-text-secondary'}>{message}</p>;
}
