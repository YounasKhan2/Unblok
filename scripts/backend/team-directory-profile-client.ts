// Disposable profiling client; credentials arrive on stdin and never enter output.
const input = JSON.parse(await Bun.stdin.text()) as {url:string;origin:string;cookie:string;concurrency:number;samples:number;detailed:boolean};
const results:{status:number;ms:number;bytes:number;items:number}[]=[];
for(let offset=0;offset<input.samples;offset+=input.concurrency){
 results.push(...await Promise.all(Array.from({length:Math.min(input.concurrency,input.samples-offset)},async(_,n)=>{
  const start=performance.now();
  const r=await fetch(input.url,{headers:{origin:input.origin,cookie:input.cookie,'x-profile-id':String(offset+n),'x-profile-detail':input.detailed?'1':'0'}});
  const text=await r.text(),data=JSON.parse(text);
  return {status:r.status,ms:performance.now()-start,bytes:Buffer.byteLength(text),items:Array.isArray(data.items)?data.items.length:0};
 })));
}
process.stdout.write(JSON.stringify(results));
export {};
