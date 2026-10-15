const {execFileSync}=require('node:child_process');
const {randomUUID}=require('node:crypto');
const image='axllent/mailpit@sha256:6abc8e633df15eaf785cfcf38bae48e66f64beecdc03121e249d0f9ec15f0707';
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']}).trim();
async function json(url,options){
  const response=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(3000)});
  if(!response.ok)throw new Error('Mailpit request failed: '+response.status);
  return response.json();
}
class ReadOnlyMailpit {
  constructor(origin='http://127.0.0.1:8025'){
    const url=new URL(origin);
    if(url.origin!==origin||url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.username||url.password)throw new Error('Expected exact loopback Mailpit origin');
    this.origin=origin;
  }
  async messages(){
    const items=new Map();let start=0;
    for(;;){const page=await json(this.origin+'/api/v1/messages?limit=500&start='+start);for(const m of page.messages)items.set(m.ID,m);start+=page.messages.length;if(start>=page.total)break;if(!page.messages.length)throw new Error('Incomplete Mailpit preservation inventory');}
    return {messages:[...items.values()]};
  }
  message(id){if(!/^[A-Za-z0-9_-]{1,100}$/.test(id))throw new Error('Invalid message ID');return json(this.origin+'/api/v1/message/'+id);}
  async snapshot(){return (await this.messages()).messages.map(m=>m.ID);}
  async assertPreserved(ids){const current=new Set(await this.snapshot());const missing=ids.filter(id=>!current.has(id));if(missing.length)throw new Error('Mailpit preservation failed: '+missing.length+' preexisting messages missing');return {checked:ids.length,missing:0};}
}
class DisposableMailpit {
  #run=randomUUID();#reader;#container;#sentinels=[];
  async start(){
    if(this.#container)throw new Error('Capture already started');
    const name='unblok-mail-test-'+this.#run;
    docker('run','--rm','-d','--name',name,'--label','unblok.mail-test.run='+this.#run,'-p','127.0.0.1::8025',image);
    this.#container=name;
    try{
      const binding=docker('port',name,'8025/tcp');if(!/^127\.0\.0\.1:\d+$/.test(binding)||binding.endsWith(':8025'))throw new Error('Capture must use its own ephemeral loopback port');
      this.#reader=new ReadOnlyMailpit('http://'+binding);
      let ready=false;for(let i=0;i<50;i++){try{await this.#reader.messages();ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}
      if(!ready)throw new Error('Disposable Mailpit not ready');
      for(let i=0;i<2;i++){
        const subject='preservation-sentinel-'+this.#run+'-'+i;
        const response=await fetch(this.url('/api/v1/send'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({From:{Email:'sentinel@example.test'},To:[{Email:'sentinel-'+i+'@example.test'}],Subject:subject,Text:subject}),redirect:'error',signal:AbortSignal.timeout(3000)});
        if(!response.ok)throw new Error('Sentinel issuance failed');
        const found=(await this.messages()).messages.find(m=>m.Subject===subject);if(!found)throw new Error('Sentinel not captured');this.#sentinels.push({id:found.ID,subject});
      }
    }catch(error){await this.close();throw error;}
  }
  url(path){if(!this.#reader||!path.startsWith('/api/v1/')||path.includes('://'))throw new Error('Owned capture not started or invalid path');return this.#reader.origin+path;}
  messages(){if(!this.#reader)throw new Error('Owned capture not started');return this.#reader.messages();}
  message(id){if(!this.#reader)throw new Error('Owned capture not started');return this.#reader.message(id);}
  async assertSentinels(){
    if(this.#sentinels.length!==2)throw new Error('Sentinel setup incomplete');
    for(const s of this.#sentinels){let message;try{message=await this.message(s.id);}catch{throw new Error('Mailpit sentinel missing');}if(message.Subject!==s.subject||message.Text.trim()!==s.subject)throw new Error('Mailpit sentinel changed');}
  }
  async deleteOwned(ids){
    await this.assertSentinels();
    if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(id)))throw new Error('Invalid owned mail IDs');
    const unique=[...new Set(ids)];if(!unique.length)return; // Never transmit empty deletion: Mailpit interprets it as delete-all.
    for(const id of unique){if(this.#sentinels.some(s=>s.id===id))throw new Error('Refusing sentinel deletion');await this.message(id);}
    const response=await fetch(this.url('/api/v1/messages'),{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({IDs:unique}),redirect:'error',signal:AbortSignal.timeout(3000)});
    if(!response.ok)throw new Error('Owned mail cleanup failed');
    await this.assertSentinels();
  }
  async close(){
    if(!this.#container)return;
    try{if(this.#sentinels.length)await this.assertSentinels();}
    finally{const name=this.#container;const label=docker('inspect','--format','{{index .Config.Labels "unblok.mail-test.run"}}',name);if(label!==this.#run)throw new Error('Capture ownership mismatch');docker('stop','--time','2',name);this.#container=undefined;}
  }
}
module.exports={DisposableMailpit,ReadOnlyMailpit};
