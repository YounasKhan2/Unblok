export interface MailpitMessage { ID:string; Subject:string; Text:string; To:Array<{Address:string}> }
export class ReadOnlyMailpit {
  constructor(origin?:string);
  readonly origin:string;
  messages():Promise<{messages:MailpitMessage[]}>;
  message(id:string):Promise<MailpitMessage>;
  snapshot():Promise<string[]>;
  assertPreserved(ids:string[]):Promise<{checked:number;missing:number}>;
}
export class DisposableMailpit {
  start():Promise<void>;
  url(path:string):string;
  messages():Promise<{messages:MailpitMessage[]}>;
  message(id:string):Promise<MailpitMessage>;
  assertSentinels():Promise<void>;
  deleteOwned(ids:string[]):Promise<void>;
  close():Promise<void>;
}
