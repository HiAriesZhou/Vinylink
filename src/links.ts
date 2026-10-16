export type Provider = 'apple' | 'spotify';
export type Kind = 'track' | 'album' | 'playlist' | 'unsupported' | 'short';
export interface MusicLink { provider: Provider; kind: Kind; url: string; key: string; id?: string; country?: string }
const tracking = new Set(['si','utm_source','utm_medium','utm_campaign','utm_content','utm_term','at','ct','itsct','itscg','app']);
export function safeURL(raw: string): URL | null {
  if (raw.length > 2048 || /[\s…]/u.test(raw)) return null;
  try { const u = new URL(raw); return u.protocol === 'https:' && !u.username && !u.password && !u.port ? u : null; } catch { return null; }
}
export function parseMusicLink(raw: string): MusicLink | null {
  const u = safeURL(raw); if (!u) return null;
  let provider: Provider;
  if (['music.apple.com','apple.co'].includes(u.hostname)) provider='apple';
  else if (['open.spotify.com','spotify.link','spoti.fi'].includes(u.hostname)) provider='spotify';
  else return null;
  u.hash=''; for(const k of [...u.searchParams.keys()]) if(tracking.has(k))u.searchParams.delete(k);
  if(['apple.co','spotify.link','spoti.fi'].includes(u.hostname))return {provider,kind:'short',url:u.href,key:u.href};
  let kind: Kind='unsupported', id: string|undefined, country: string|undefined;
  const parts=u.pathname.split('/').filter(Boolean);
  if(provider==='apple') {
    country=parts[0]; const type=parts[1], last=parts.at(-1);
    if(/^[a-z]{2}$/i.test(country || '') && parts.length>=3) {
      if(type==='album' && /^\d+$/.test(last || '')) {kind='album'; id=last; const song=u.searchParams.get('i'); if(song && /^\d+$/.test(song)){kind='track';id=song;} else if(song!==null) kind='unsupported';}
      if(type==='song' && /^\d+$/.test(last || '')) {kind='track';id=last;}
      if(type==='playlist' && /^pl\.[\w-]+$/.test(last || '')){kind='playlist';id=last;}
    }
  } else {
    if(/^intl-[a-z]{2}(?:-[a-z]{2})?$/i.test(parts[0] || '')) parts.shift();
    if(parts.length===2 && /^[A-Za-z0-9]{22}$/.test(parts[1])) { id=parts[1]; kind=({track:'track',album:'album',playlist:'playlist'} as Record<string,Kind>)[parts[0]] || 'unsupported'; }
  }
  return {provider,kind,id,country,url:u.href,key:id?`${provider}:${country || ''}:${kind}:${id}`:u.href};
}
/** Only complete URL attributes, never truncated visible text. */
export function linkFromAnchor(a: HTMLAnchorElement): MusicLink | null {
  const href=safeURL(a.href); if(!href)return null;
  const direct=parseMusicLink(href.href); if(direct)return direct;
  if(href.hostname!=='t.co')return null;
  for(const raw of [a.getAttribute('data-expanded-url'),a.getAttribute('title')]) {
    if(raw){const link=parseMusicLink(raw);if(link)return link;}
  }
  return null;
}
