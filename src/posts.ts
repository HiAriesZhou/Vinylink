import { linkFromAnchor, type MusicLink } from './links';
export const POST='article[data-testid="tweet"]';
export const HOST='x-music-card';
export function belongs(el: Element, post: Element): boolean {
  if(el.closest(POST)!==post || el.closest(HOST))return false;
  // X quote cards use role=link + tabindex; nested articles also fail above.
  for(let p: Element|null=el.parentElement;p && p!==post;p=p.parentElement) {
    if(p.matches('[data-testid="quoteTweet"], [data-testid="quotedTweet"], [role="link"][tabindex], blockquote'))return false;
  }
  return true;
}
export function bodyOf(post: Element): HTMLElement | undefined {
  return [...post.querySelectorAll<HTMLElement>('[data-testid="tweetText"]')].find(e=>belongs(e,post));
}
export function identity(post: Element): string {
  for(const time of post.querySelectorAll('time')) {
    if(!belongs(time,post))continue;
    const a=time.closest('a');if(!a)continue;
    try {const u=new URL(a.href);if(['x.com','twitter.com'].includes(u.hostname) && /^\/[^/]+\/status\/\d+$/.test(u.pathname))return u.pathname;}catch{}
  }
  // Missing identity is fail-closed: transient/unknown DOM is not enhanced.
  return '';
}
export interface Selection { link: MusicLink; anchor: HTMLAnchorElement; preview?: HTMLElement; title?: string }
export function selectFirst(post: Element): Selection | null {
  const body=bodyOf(post);
  const previews=[...post.querySelectorAll<HTMLElement>('[data-testid="card.wrapper"]')].filter(e=>belongs(e,post));
  const entries: Selection[]=[];
  const add=(a: HTMLAnchorElement,preview?:HTMLElement)=>{if(!belongs(a,post))return;const link=linkFromAnchor(a);if(link)entries.push({link,anchor:a,preview});};
  body?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a=>add(a));
  for(const preview of previews)preview.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a=>add(a,preview));
  const first=entries[0];if(!first)return null;
  const matching=entries.find(e=>e.preview && e.link.key===first.link.key);
  if(matching) {
    first.preview=matching.preview;
    // Only a semantically named title, never infer artist/title by splitting prose.
    const title=matching.preview?.querySelector<HTMLElement>('[data-testid="card.title"]')?.textContent?.trim();
    if(title)first.title=title.slice(0,500);
  }
  return first;
}
export function hidePreview(preview?: HTMLElement): ()=>void {
  if(!preview)return ()=>{};
  const value=preview.style.getPropertyValue('display'),priority=preview.style.getPropertyPriority('display');
  preview.style.setProperty('display','none','important');
  return ()=>{if(preview.style.getPropertyValue('display')==='none' && preview.style.getPropertyPriority('display')==='important'){if(value)preview.style.setProperty('display',value,priority);else preview.style.removeProperty('display');}};
}
