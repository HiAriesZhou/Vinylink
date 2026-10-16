import { POST, HOST, identity, bodyOf, selectFirst, hidePreview } from './posts';
import { createCard, type Card } from './card';
import { capability } from './provider';
import { PlaybackCoordinator } from './coordinator';
import { config } from './config';
interface Binding {signature:string;card:Card;restore:()=>void;body:HTMLElement;preview?:HTMLElement}
export function startTimeline(root:Document=document):()=>void {
  const coordinator=new PlaybackCoordinator(),bindings=new Map<HTMLElement,Binding>(),observed=new Set<HTMLElement>(),near=new WeakSet<HTMLElement>(),pending=new Set<HTMLElement>();
  let stopped=false,scheduled=false;
  const clear=(post:HTMLElement)=>{const b=bindings.get(post);if(b){b.card.dispose();b.restore();bindings.delete(post);}};
  const scan=(post:HTMLElement)=>{
    if(!post.isConnected){clear(post);return;}
    if(post.parentElement?.closest(POST) || post.closest('[data-testid="quoteTweet"], [data-testid="quotedTweet"]')){clear(post);return;}
    if(!near.has(post))return;
    if(location.pathname.startsWith('/messages') || post.closest('[role="dialog"]')){clear(post);return;}
    const id=identity(post),selection=selectFirst(post),body=bodyOf(post);
    if(!id || !selection || !body){clear(post);return;}
    const signature=JSON.stringify([id,selection.link.key,selection.link.url,selection.title]);
    const current=bindings.get(post);
    if(current?.signature===signature && current.card.host.isConnected && current.body===body && current.preview===selection.preview){current.card.theme();return;}
    clear(post);
    const card=createCard(selection,coordinator);body.after(card.host);card.theme();
    const restore=capability(selection.link).mode==='visible-embed'?hidePreview(selection.preview):()=>{};
    bindings.set(post,{signature,card,restore,body,preview:selection.preview});
  };
  const flush=()=>{scheduled=false;if(stopped)return;for(const post of pending)scan(post);pending.clear();};
  const queue=(post:HTMLElement)=>{pending.add(post);if(!scheduled){scheduled=true;queueMicrotask(flush);}};
  const io=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){const post=entry.target as HTMLElement;near.add(post);queue(post);}}},{rootMargin:config.nearViewport});
  const discover=(node:Element)=>{
    const posts=node.matches(POST)?[node]:[...node.querySelectorAll(POST)];
    for(const item of posts){const post=item as HTMLElement;if(!observed.has(post)){observed.add(post);io.observe(post);}else queue(post);}
  };
  const mo=new MutationObserver(records=>{
    if(stopped)return;
    let removed=false;
    for(const record of records) {
      const target=record.target instanceof Element?record.target:record.target.parentElement;
      if(!target || target.closest(HOST))continue;
      // Own additions/removals have no bearing on X content.
      if(record.type==='childList' && [...record.addedNodes,...record.removedNodes].every(n=>n instanceof Element && n.matches(HOST)))continue;
      const post=target.closest<HTMLElement>(POST);if(post)queue(post);
      for(const added of record.addedNodes)if(added instanceof Element)discover(added);
      if(record.removedNodes.length)removed=true;
    }
    if(removed)for(const post of observed)if(!post.isConnected){clear(post);io.unobserve(post);observed.delete(post);pending.delete(post);}
  });
  mo.observe(root.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['href','title','data-expanded-url','datetime']});
  const themeObserver=new MutationObserver(()=>{for(const b of bindings.values())b.card.theme();});
  themeObserver.observe(root.documentElement,{attributes:true,attributeFilter:['style','class']});themeObserver.observe(root.body,{attributes:true,attributeFilter:['style','class']});
  discover(root.body);
  const stop=()=>{if(stopped)return;stopped=true;coordinator.stop();mo.disconnect();themeObserver.disconnect();io.disconnect();for(const post of bindings.keys())clear(post);pending.clear();observed.clear();window.removeEventListener('pagehide',stop);};
  window.addEventListener('pagehide',stop,{once:true});
  return stop;
}
