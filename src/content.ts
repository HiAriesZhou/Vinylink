import { startTimeline } from './lifecycle';
import { config } from './config';
const stop=startTimeline();
let failures=0;
const timer=setInterval(()=>{
  try {
    if(!chrome.runtime.id)throw new Error('Extension invalidated');
    chrome.runtime.sendMessage({type:'vinylink:health'},response=>{
      if(chrome.runtime.lastError || response?.ok!==true){if(++failures>=2){clearInterval(timer);stop();}}else failures=0;
    });
  }catch{clearInterval(timer);stop();}
},config.healthIntervalMs);
window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
