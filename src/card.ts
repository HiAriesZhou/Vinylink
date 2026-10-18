import css from './card.css';
import { capability, embedURL } from './provider';
import { PlaybackCoordinator } from './coordinator';
import { config, type ViewState } from './config';
import { HOST } from './config';
import type { MusicLink } from './links';
export interface CardInput {link:MusicLink;title?:string}
function el<K extends keyof HTMLElementTagNameMap>(tag:K,cls?:string,text?:string):HTMLElementTagNameMap[K]{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
export interface Card {host:HTMLElement;dispose:()=>void;theme:()=>void}
export function createCard(selection:CardInput,coordinator:PlaybackCoordinator):Card {
  const {link}=selection,cap=capability(link),host=el(HOST as 'div');
  const shadow=host.attachShadow({mode:'open'}),style=el('style');style.textContent=css;
  const box=el('section','card'),row=el('div','row'),record=el('div','record'),copy=el('div','copy'),actions=el('div','actions'),details=el('div','details'),status=el('p','status'),player=el('div','player');
  record.setAttribute('aria-hidden','true');box.setAttribute('aria-label','Vinylink');
  const provider=link.provider==='apple'?'Apple Music':'Spotify';
  const kinds={track:'单曲',album:'专辑',playlist:'歌单',short:'短链',unsupported:'未支持类型'};
  const title=el('p','title',selection.title || `${provider} · ${kinds[link.kind]}`);title.title=title.textContent || '';
  const sourceRow=el('div','source',provider+' · ');copy.append(title,sourceRow);row.append(record,copy,actions);
  const source=el('a',undefined,'在原平台打开');source.href=link.url;source.target='_blank';source.rel='noopener noreferrer';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');sourceRow.append(source);details.append(status);box.append(row,details,player);shadow.append(style,box);
  let disposed=false,open=false;
  const setState=(state:ViewState,message:string)=>{if(disposed)return;host.dataset.state=state;status.textContent=message;details.hidden=state==='ready';};
  const button=el('button',undefined,'展开');button.type='button';button.title=cap.reason;button.setAttribute('aria-label','展开 Apple Music 官方播放器');button.setAttribute('aria-expanded','false');
  setState(cap.mode==='unavailable'?'unavailable':'ready',cap.reason);
  if(cap.mode==='visible-embed') {
    actions.append(button);
    button.addEventListener('click',()=>{
      if(open){coordinator.close(host);return;}
      coordinator.open(host,isCurrent=>{
        open=true;button.textContent='关闭';button.setAttribute('aria-expanded','true');button.setAttribute('aria-label','关闭播放器并停止播放');
        setState('loading','正在加载官方播放器…');
        const frame=el('iframe');frame.title='Apple Music 官方播放器';frame.allow='autoplay; encrypted-media';frame.referrerPolicy='no-referrer';
        let timer:ReturnType<typeof setTimeout>;
        const failed=()=>{if(!isCurrent() || disposed)return;coordinator.close(host);setState('error','播放器加载失败。可重新展开；若仍为空白，请在原平台检查地区或登录限制。');};
        frame.addEventListener('load',()=>{if(!isCurrent() || disposed)return;clearTimeout(timer);setState('awaiting-user-action','请在官方播放器内点击播放。空白或无法试听时，可关闭后重试或在原平台查看。');});
        frame.addEventListener('error',failed);
        frame.src=embedURL(link);player.append(frame);timer=setTimeout(failed,config.embedTimeoutMs);
        return ()=>{clearTimeout(timer);frame.remove();open=false;button.textContent='展开';button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','展开 Apple Music 官方播放器');setState('ready',cap.reason);};
      });
    });
  }
  // Prevent bubbling into X post navigation, without cancelling native links/keys.
  for(const event of ['click','dblclick','pointerdown','keydown','keyup'])host.addEventListener(event,e=>e.stopPropagation());
  const theme=()=>{
    const parent=host.parentElement;if(!parent)return;
    host.style.setProperty('--vinylink-fg',getComputedStyle(parent).color);
    for(let p:HTMLElement|null=parent;p;p=p.parentElement){const bg=getComputedStyle(p).backgroundColor;if(bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'){host.style.setProperty('--vinylink-bg',bg);break;}}
    host.style.setProperty('--vinylink-border','color-mix(in srgb, currentColor 24%, transparent)');
  };
  return {host,theme,dispose:()=>{coordinator.close(host);disposed=true;host.remove();}};
}
