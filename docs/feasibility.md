# Playback spike 与能力边界

核查日期：2026-10-16。此文区分官方说明、实现选择与实际验证；HTTP 200 和 iframe load 均不是播放证据。

## 官方依据

- [Apple MusicKit](https://developer.apple.com/musickit/)：自定义目录与播放能力；完整播放涉及用户授权、订阅。开发者 token 依赖开发者配置与安全签名，不可把私钥放进扩展。[Developer tokens](https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens)。本任务无凭证、不引入后端，故未实现 MusicKit。
- [Apple Marketing Tools](https://artists.apple.com/support/1117-apple-music-marketing-tools)：可见嵌入播放器展示曲目；官方说明未登录可试听，登录会员可完整播放。本项目不承诺所有曲目/地区可用，不据此给所有卡片标注固定时长。
- [iTunes Search API 与 Legal](https://performance-partners.apple.com/search-api)：音频、封面用于推广，有邻近商店 badge、试听来源标注及禁止独立娱乐使用等限制；不能把试听 URL 当免费音源。因此不用此接口做时间线自定义试听，也不缓存其元数据或封面。
- [Spotify Embeds](https://developer.spotify.com/documentation/embeds)、[iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api)：有 play/pause、ready、playback_started、playback_update 等公开能力，但浏览器用户激活仍可能必要，不能从普通 iframe 推导可控。
- [Spotify Widget Terms](https://developer.spotify.com/documentation/embeds/terms)：III.1.a 限于开发者控制的页面，明确限制非其控制的第三方页面；IV 限制修改/遮挡 Widget、缓存及内容改造。X 不受本项目控制，故不将 Widget 注入 X。需要 Spotify 明确确认浏览器本地增强是否可获许可；不通过扩展页面套壳规避。
- [Spotify Design](https://developer.spotify.com/documentation/design)：封面不得裁切、动画化或覆盖，元数据应准确，来源标志有要求。本版不请求 Spotify 内容，只识别原始链接与内容类型。
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started)：需要授权 token、Premium 及应用配置。本任务不接入账号或 SDK，不跨平台匹配音源。
- [Chrome 跨域请求](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)：content script 与扩展上下文权限不同，host 权限不解除页面嵌入限制。
- [Chrome MV3 安全](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security)：逻辑本地打包，不注入远程 SDK、eval 或任意 URL fetch 代理。

## 方案矩阵

| 来源/方案 | 元数据 | 播放 | 外部控制/真实状态 | 本版决定 |
|---|---|---|---|---|
| Apple 可见 Embed | 官方 iframe 内曲名、歌手、原始封面；插件不抽取 | 官方试听/会员完整播放，实际可用性待 spike | 未找到适用的公开控制/状态契约 | 用户展开后显示完整官方控件；不伪造播放状态 |
| Apple MusicKit | API，需要开发者配置 | 授权会员播放 | SDK 能力，未集成验证 | 无凭证，暂不接入 |
| iTunes 试听 | lookup 可提供，但不能保证有 preview | 受推广用途约束 | HTMLMediaElement 可控，不代表用途合规 | 不采用 |
| Spotify Embed | 官方 Widget | 技术上提供播放 | 官方 API 有控制与事件 | 第三方页面条款阻塞，不在 X 使用 |
| Spotify 自定义 SDK | API/授权 | Premium + token | SDK 事件 | 无账号集成，暂不采用 |

## 重大体验降级

Apple 默认卡片是展开入口，不是伪装播放按钮。展开后官方可见播放器负责播放/暂停、真实曲目详情、时长、登录/地区/不可用提示。没有真实状态事件，所以黑胶静止；插件状态为 ready/loading/awaiting-user-action/error/unavailable，绝不把 iframe load 说成 playing。关闭或切换会销毁 iframe，不能保留暂停进度。仅维持一个活跃 iframe，避免不能外部暂停的多实例同时播放。

自定义标题优先使用明确对应的 X 原生预览标题，否则标注“Apple Music · 单曲”等内容类型，不把 URL slug 猜成真实歌名、不编造歌手。完整曲名歌手封面只在 Apple 官方播放器内显示；这不满足原目标的默认紧凑卡片元数据完整性。

Spotify 卡片没有三角播放按钮，显示条款限制。纯专辑/歌单/未知类型保留第一链接并说明不支持，绝不偷偷选择第二首。

## 安全与缓存选择

本版无音乐 API 请求、无媒体 URL 提取、无持久缓存、无音乐 host_permissions、无 cookies/storage 权限。第三方 iframe 自行请求平台资源并受其隐私条款约束；仅用户展开才加载。后台只处理扩展存活探测，用于失效清理。短链若 DOM 不提供完整可信展开地址，保留原链接；已识别的平台短链占住首项并说明未解析，不执行任意重定向网络请求。

Apple 官方文档允许网页嵌入，但没有专门确认第三方网页的扩展增强场景；公开发布前仍需确认其适用条款。可见 Embed 是按任务要求采取的最小降级，不等于整个原目标已经验收。

## 真实验证

运行环境、测试链接、结果与证据在完成 spike 后追加。测试使用全新 /tmp profile，未读取用户浏览器目录。不得以 mock 测试替代真实音频进度。

### 已执行结果（2026-10-16）

环境：Linux，Node 20.19.2，pnpm 9.12.0，Playwright 1.64.1，Chrome for Testing 156.0.8078.4 headless；全新 `/tmp/xmc-*` profile，MV3 service worker 确认加载。未使用关闭 CSP/站点隔离/自动播放限制的参数，未登录任何音乐账号。

1. 初始曲目 `https://music.apple.com/us/album/anti-hero/1649434004?i=1649434284` 出现 404、无媒体，无播放证据；保留 `artifacts/spike-first.json`，没有把它当成功。
2. 改用官方搜索确认的 `https://music.apple.com/us/song/1651516417`（Anti-Hero / Taylor Swift）。在真实 MV3 扩展页内嵌官方播放器，官方控件准确显示名称/歌手，封面 `naturalWidth > 0`。用户式 click 后实际媒体 `playing`、`timeupdate`；8 秒采样进度 7.863903 秒，实际 duration 90.000998 秒。自然结束触发 `pause`、`ended`，均为 90.000998 秒；之后官方提示订阅/登录，媒体暂停并重置。**试听已验证，完整播放未验证。** 证据：[spike.json](../artifacts/spike.json)、[开始截图](../artifacts/spike.png)、[结束截图](../artifacts/spike-ended.png)。官方说明的 30 秒与该曲目实测不同，因此 UI 不硬编码试听时长。
3. 另一次点击官方暂停后，媒体确实 paused=true，时间约 7.85 秒；恢复按钮被官方 upsell 覆盖，正常点击超时。没有 force click、关闭安全设置或绕过订阅。证据：[spike-upsell.json](../artifacts/spike-upsell.json)。恢复播放不是已验证能力。
4. 最终构建的 MV3 content script，在路由到合成 X DOM 的 `https://x.com/home` 页面中，嵌入真实 Apple（非 mock）：得到 playing 事件和 3.837259 秒进度；切换到第二卡片后旧 frame detached=true，页面仅一个播放器。证据：[real-integration.json](../artifacts/real-integration.json)、[截图](../artifacts/real-integration.png)。**此测试不是实际 X 响应/CSP 证明**。
5. 真实 `https://x.com` 返回 HTTP 403，零 tweet article，不能检查登录后 DOM、实际 URL 字段、原生预览结构、CSP。此限制未通过放宽权限规避。第三方 Apple iframe 受实际宿主 frame-src / Apple frame-ancestors 和浏览器媒体策略共同约束；host_permissions 不能证明可加载。真实 X 验收保留为阻塞项。
6. Spotify 未在 X 测试 iframe，也未请求 oEmbed/封面，因为第三方页面条款先阻塞该方案；无登录/凭证，因此 SDK 完整播放未验证。其真实音乐播放不是本次完成项。

测试脚本通过 Playwright 调试权限读取 frame 的 DOM/媒体事件，仅用于验证，产品代码不跨域读取 iframe 内部状态，不依赖这些调试能力实现 UI。

### 自动化范围与缺口

43 项单元/DOM 测试通过；真实 MV3 合成页面冒烟通过，覆盖主题、320px、键盘、单实例、快速切换、复用、卸载、重载与预览恢复。mock 的本地 WAV 播放只证明媒体容器生命周期，不证明平台播放授权。元数据无异步网络请求，首项在任何 iframe 加载前同步决定，因而不存在第二条元数据先返回而抢占首项的路径；旧 frame load 回调另有 generation 检查。

未验证：真实 X 各路由、X 实际 quote/链接 DOM 和 CSP；其他 Chrome 版本/地区；Apple 其他曲目的可用性、订阅完整播放和 upsell 后续播；Spotify 全部真实播放能力。专辑/歌单/短链未解析是明确的产品范围降级，默认卡片歌名/歌手/封面不完整也是未完成项。

验收底线第 3 项：**真实 MV3 和构建扩展合成宿主中的 Apple 卡片内试听成立；真实 X 中的端到端第 3 项尚未成立。** 因此整体交付不能称为完整 MVP。需 Aries 完成 [最小人工冒烟](manual-smoke.md)；若 X CSP 禁止 Embed，应保持阻塞，不改写 CSP。
