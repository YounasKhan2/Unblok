import React from 'react';
export function AuthField({label,id,error,...props}:React.InputHTMLAttributes<HTMLInputElement>&{label:string;id:string;error?:string}) {
  return <div className="space-y-1.5"><label htmlFor={id} className="block text-xs font-semibold">{label}</label>
    <input {...props} id={id} aria-invalid={!!error} aria-describedby={error?id+'-error':undefined}
      className="w-full rounded-lg border border-border bg-surface-base px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"/>
    {error&&<p id={id+'-error'} role="alert" className="text-xs text-danger">{error}</p>}
  </div>;
}
