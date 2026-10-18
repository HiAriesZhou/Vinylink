// No URL fetch, content cache, or music credentials. Only a liveness response.
chrome.runtime.onMessage.addListener((message:unknown,sender,respond)=>{
  if(sender.id!==chrome.runtime.id || !sender.tab || sender.frameId!==0 || !sender.url)return;
  try {const u=new URL(sender.url);if(u.protocol!=='https:' || !['x.com','twitter.com'].includes(u.hostname))return;}catch{return;}
  if(typeof message==='object' && message!==null && Object.keys(message).length===1 && (message as {type?:unknown}).type==='vinylink:health')respond({ok:true});
});
