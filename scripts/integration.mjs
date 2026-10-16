// Real provider in the built extension, hosted on routed X DOM. Not live X/CSP proof.
import { chromium } from 'playwright';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const profile=await mkdtemp('/tmp/xmc-real-'),dir=resolve('dist'),log=[];let context;
try{
 context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,viewport:{width:860,height:1000},args:[`--disable-extensions-except=${dir}`,`--load-extension=${dir}`]});
 await context.route('https://x.com/**',async r=>r.fulfill({contentType:'text/html',body:await readFile('fixtures/timeline.html','utf8')}));
 const page=await context.newPage();await page.goto('https://x.com/home');const card=page.locator('x-music-card').first();await card.getByRole('button').click();const player=card.frameLocator('iframe');await player.getByRole('button',{name:/^play$/i}).waitFor({timeout:30000});
 const frame=await (await card.locator('iframe').elementHandle()).contentFrame();
 await frame.evaluate(()=>{window.__events=[];for(const e of ['playing','pause','ended','error'])document.addEventListener(e,event=>{const a=event.target;if(a instanceof HTMLMediaElement)window.__events.push({event:e,time:a.currentTime,paused:a.paused,duration:a.duration});},true);});
 await player.getByRole('button',{name:/^play$/i}).click();await page.waitForTimeout(4000);
 log.push({context:'built MV3 content script + routed X fixture + real Apple embed; no real X CSP',date:new Date().toISOString(),buttons:await frame.getByRole('button').allTextContents(),media:await frame.evaluate(()=>({events:window.__events,media:[...document.querySelectorAll('audio')].map(a=>({time:a.currentTime,paused:a.paused,duration:a.duration}))}))});
 await page.screenshot({path:'artifacts/real-integration.png'});
 await page.locator('x-music-card').nth(2).getByRole('button').click();log.push({oldFrameDetached:frame.isDetached(),liveFrames:await page.locator('x-music-card iframe').count()});
}catch(e){log.push({error:e.message});}finally{await writeFile('artifacts/real-integration.json',JSON.stringify(log,null,2));console.log(JSON.stringify(log,null,2));await context?.close();await rm(profile,{recursive:true,force:true});}
