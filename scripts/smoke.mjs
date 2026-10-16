import { chromium } from 'playwright';
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp('/tmp/xmc-smoke-'),dir=resolve('dist'),log=[];
const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,viewport:{width:860,height:1000},args:[`--disable-extensions-except=${dir}`,`--load-extension=${dir}`]});
try {
 await context.route('https://x.com/**',async route=>route.fulfill({contentType:'text/html',body:await readFile('fixtures/timeline.html','utf8')}));
 // This mock tests lifecycle only, not provider feasibility. Use a short local WAV.
 const wav=Buffer.alloc(44+16000);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);for(let n=0;n<8000;n++)wav.writeInt16LE(Math.sin(n*440/8000*Math.PI*2)*1000,44+n*2);
 await context.route('https://embed.music.apple.com/**',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html><body style="font:14px Arial;background:#fafafa;color:#111"><strong>MOCK official-player surface</strong><p>Local audio, not Apple playback evidence</p><audio controls src="data:audio/wav;base64,${wav.toString('base64')}"></audio></body></html>`}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('https://x.com/home');await page.locator('x-music-card').nth(2).waitFor();
 assert.equal(await page.locator('x-music-card').count(),3);log.push('Actual unpacked MV3 extension injected 3 cards into routed X fixture');
 for(const theme of ['light','dark','dim']){await page.evaluate(t=>{document.body.dataset.theme=t;document.body.style.backgroundColor={light:'#fff',dark:'#000',dim:'#15202b'}[t];document.body.style.color=t==='light'?'#0f1419':'#e7e9ea';},theme);await page.waitForTimeout(80);await page.screenshot({path:`artifacts/${theme}.png`});}
 await page.setViewportSize({width:320,height:1050});await page.emulateMedia({reducedMotion:'reduce'});await page.screenshot({path:'artifacts/narrow.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);log.push('Light/dark/dim and 320px: no horizontal overflow');
 const cards=page.locator('x-music-card');await cards.nth(0).getByRole('button').focus();assert.equal(await cards.nth(0).getByRole('button').evaluate(b=>b.getRootNode().activeElement===b),true);await page.keyboard.press('Enter');await cards.nth(0).locator('iframe').waitFor();
 await cards.nth(0).frameLocator('iframe').locator('audio').waitFor();const first=await (await cards.nth(0).locator('iframe').elementHandle()).contentFrame();await first.locator('audio').evaluate(a=>a.play());await page.waitForTimeout(200);assert.equal(await first.locator('audio').evaluate(a=>a.paused),false);
 await cards.nth(2).getByRole('button').click();assert.equal(first.isDetached(),true);assert.equal(await page.locator('x-music-card iframe').count(),1);log.push('Switching removes the actually playing mock media browsing context before the next iframe');
 await cards.nth(0).getByRole('button').click();await cards.nth(2).getByRole('button').click();assert.equal(await page.locator('x-music-card iframe').count(),1);
 await page.locator('article').nth(2).evaluate(p=>p.remove());await page.waitForTimeout(100);assert.equal(await page.locator('x-music-card iframe').count(),0);log.push('Rapid switches and unmount leave zero stale player frames');
 await page.locator('article').nth(0).evaluate(p=>{p.querySelector('time').closest('a').href='https://x.com/fixture/status/999';p.querySelector('[data-testid="tweetText"] a').href='https://music.apple.com/us/album/test/123';});await page.waitForTimeout(100);assert.equal(await cards.nth(0).getByRole('button').count(),0);log.push('Reused post with album does not retain old track controls');
 await page.screenshot({path:'artifacts/unsupported.png'});
 assert.deepEqual(errors,[]);log.push('No page JS errors');
 const worker=context.serviceWorkers()[0];await worker.evaluate(()=>chrome.runtime.reload()).catch(()=>{});await page.waitForTimeout(12000);assert.equal(await page.locator('x-music-card').count(),0);assert.equal(await page.locator('[data-testid="card.wrapper"]').first().evaluate(e=>e.style.display),'');log.push('Extension reload invalidates old content context: cards removed, native preview restored');
 console.log(log.join('\n'));
} finally {await writeFile('artifacts/smoke.json',JSON.stringify(log,null,2));await context.close();await rm(profile,{recursive:true,force:true});}
