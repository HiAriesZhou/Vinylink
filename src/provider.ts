import { type MusicLink, parseMusicLink } from './links';
export interface Capability {
  mode: 'visible-embed' | 'unavailable'; metadata: 'official-player' | 'page-only';
  externalControl: false; stateEvents: false; login: 'optional-for-full-playback' | 'not-applicable'; reason: string;
}
export function capability(link: MusicLink): Capability {
  const base={externalControl:false,stateEvents:false} as const;
  if(link.kind!=='track')return {...base,mode:'unavailable',metadata:'page-only',login:'not-applicable',reason:link.kind==='short'?'短链未解析，保留原链接':link.kind==='album'?'专辑暂不支持播放':link.kind==='playlist'?'歌单暂不支持播放':'暂不支持此链接类型'};
  if(link.provider==='spotify')return {...base,mode:'unavailable',metadata:'page-only',login:'not-applicable',reason:'Spotify 暂不播放：第三方页面嵌入条款待确认'};
  return {...base,mode:'visible-embed',metadata:'official-player',login:'optional-for-full-playback',reason:'展开官方播放器试听；可用性与时长以平台为准'};
}
export function embedURL(link: MusicLink): string {
  const checked=parseMusicLink(link.url);
  if(!checked || checked.provider!=='apple' || checked.kind!=='track' || checked.key!==link.key)throw new Error('Unsupported embed');
  const u=new URL(checked.url);u.hostname='embed.music.apple.com';
  // Only retain the song selector. Original source link retains other parameters.
  const song=u.searchParams.get('i');u.search='';if(song)u.searchParams.set('i',song);
  return u.href;
}
