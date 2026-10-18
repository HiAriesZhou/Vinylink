import { chromium } from 'playwright';
import { mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const dir=resolve('artifacts/spike-extension'); await mkdir(dir,{recursive:true});
await writeFile(dir+'/manifest.json',JSON.stringify({manifest_version:3,name:'XMC playback spike',version:'0.0.1',background:{service_worker:'worker.js'}}));
await writeFile(dir+'/worker.js','chrome.runtime.onInstalled.addListener(()=>{});');
await writeFile(dir+'/spike.html','<!doctype html><title>Playback spike</title><iframe width="660" height="175" allow="autoplay; encrypted-media" src="https://embed.music.apple.com/us/song/1651516417"></iframe>');
const profile=await mkdtemp('/tmp/vinylink-spike-'),logs=[]; let context;
try {
 context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,args:[`--disable-extensions-except=${dir}`,`--load-extension=${dir}`]});
 logs.push({browser:context.browser()?.version(),date:new Date().toISOString(),environment:'fresh MV3 extension page, no login, no security bypass flags'});
 const worker=context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');const page=await context.newPage();
 page.on('console',m=>logs.push({console:m.text()}));page.on('requestfailed',r=>logs.push({failed:r.url(),error:r.failure()}));
 await page.goto(`chrome-extension://${new URL(worker.url()).host}/spike.html`);
 const f=page.frameLocator('iframe');await f.getByRole('button',{name:/^play$/i}).waitFor({timeout:30000});
 const frame=page.frames().find(f=>f.url().startsWith('https://embed.music.apple.com'));
 await frame.evaluate(()=>{window.__events=[];for(const e of ['playing','pause','timeupdate','ended','error'])document.addEventListener(e,event=>{const a=event.target;if(a instanceof HTMLMediaElement && (e!=='timeupdate'||window.__events.filter(x=>x.event==='timeupdate').length<5))window.__events.push({event:e,time:a.currentTime,paused:a.paused,duration:a.duration});},true);});
 const snapshot=async label=>{logs.push({label,buttons:await frame.getByRole('button').allTextContents(),metadata:await frame.locator('img').evaluateAll(xs=>xs.map(x=>({alt:x.alt,loaded:x.complete&&x.naturalWidth>0}))),media:await frame.evaluate(()=>({events:window.__events,media:[...document.querySelectorAll('audio,video')].map(a=>({time:a.currentTime,paused:a.paused,duration:a.duration,ended:a.ended}))}))});};
 await snapshot('before user play');await f.getByRole('button',{name:/^play$/i}).click();await page.waitForTimeout(8000);await snapshot('8 seconds after user play');
 await page.screenshot({path:'artifacts/spike.png'});
 await page.waitForTimeout(95000);await snapshot('after preview duration');await page.screenshot({path:'artifacts/spike-ended.png'});
 const xp=await context.newPage();await xp.goto('https://x.com',{timeout:20000}).catch(e=>logs.push({xError:e.message}));logs.push({xTitle:await xp.title(),xArticles:await xp.locator('article[data-testid="tweet"]').count(),xText:(await xp.locator('body').innerText().catch(()=>'' )).slice(0,600)});
} catch(e){logs.push({error:e.message});} finally {if(context)await context.close();await rm(profile,{recursive:true,force:true});await writeFile('artifacts/spike.json',JSON.stringify(logs,null,2));console.log(JSON.stringify(logs,null,2));}
