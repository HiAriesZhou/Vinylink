# X Music Card

在本机 X 时间线中识别 Apple Music / Spotify 链接的 Manifest V3 扩展。**当前交付是可安装的降级原型，不是原需求全部验收通过的完整 MVP。**

Apple 单曲可展开可见的官方播放器，试听与登录/地区限制由 Apple 决定。默认卡片不伪装成自定义播放按钮。Spotify 当前只识别链接与内容类型，因第三方页面 Widget 条款限制而不提供播放。详细依据、真实证据与未完成项见 [feasibility](docs/feasibility.md) 和 [交付摘要](docs/DELIVERY.md)。

## 安装

1. 打开 Chrome `chrome://extensions`，开启“开发者模式”。
2. “加载已解压的扩展程序”，选择本项目 `dist/`，不要选仓库根目录。也可先解压 `artifacts/x-music-card.zip` 后选择解压目录。
3. 刷新已有 X 页面。进入包含音乐链接的 post；点“展开”，再点击官方播放器中的播放按钮。
4. 点另一张 Apple 卡片的“展开”会销毁前一个播放器；关闭后重开会从新播放器开始，不能保存暂停进度。

卸载、禁用或重载扩展后，旧页面通常在 5–10 秒内移除卡片并恢复原生预览；刷新 X 可立即恢复。扩展只能协调自身的播放器，不控制 X 视频、其他扩展、其他标签页或音乐网站的音频。

## 开发与构建

需要 Node.js 20+、pnpm 9、Python 3（仅用于 ZIP 打包）。无运行时第三方依赖。

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

构建产物为 `dist/` 与 `artifacts/x-music-card.zip`。本地隔离浏览器测试：

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/xmc-browsers pnpm exec playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/xmc-browsers pnpm smoke
PLAYWRIGHT_BROWSERS_PATH=/tmp/xmc-browsers pnpm spike
PLAYWRIGHT_BROWSERS_PATH=/tmp/xmc-browsers node scripts/integration.mjs
```

`smoke` 完全使用合成 X DOM 和本地 WAV mock，测试实际 MV3 加载、布局和生命周期。`spike` 使用真实 Apple 官方 Embed、全新 profile、不登录，约需两分钟，输出真实状态证据；网络或平台限制可能使它失败，不能据脚本退出码宣称成功，检查 JSON 中的 events/time/错误。`integration` 使用真实 Apple 与合成 X DOM，仍不证明真实 X CSP 可用。所有临时 profile 均自动删除，不读取用户 Chrome 目录。

此受限机器安装依赖使用：`XDG_DATA_HOME=/tmp/xmc-data XDG_CACHE_HOME=/tmp/xmc-cache pnpm install --store-dir /tmp/xmc-pnpm-store`。外网与 Chromium 启动通过平台审批运行，未关闭浏览器安全设置。

## 模块

- `links.ts`：精确域名/路径、歌曲定位、内容分类、保守追踪参数清理。
- `posts.ts` / `lifecycle.ts`：正文与原生预览归属、首链接顺序、增量扫描、临近视口、身份/目标/节点复用、可逆隐藏。
- `provider.ts`：元数据与播放能力声明，不暴露不存在的控制接口。
- `card.ts` / `card.css`：Shadow DOM、静态黑胶、键盘、完整标题、页面实际主题。
- `coordinator.ts`：同步销毁旧 iframe，generation 防止旧加载结果改变状态。
- `background.ts`：严格限制的存活探测，无网络代理或内容缓存。
- `config.ts`：加载超时与健康检查配置。

## 权限与隐私

只在 `https://x.com/*`、`https://twitter.com/*` 注入 content script；主框架运行，私信路由和 dialog 不增强。不申请 `<all_urls>`、storage、cookies、tabs、webRequest 或音乐 API host 权限。没有统计、后端、账号系统或远程扩展代码。不读取登录令牌，不收集或发送推文正文/浏览历史，不下载音频。

展开 Apple 播放器时，浏览器会直接连接 Apple 官方服务及其资源域名，Apple 可能按其政策使用 Cookie/网络信息。扩展自身不读取这些信息；iframe 设置 `no-referrer`。来源链接由用户正常打开。无元数据、封面、音频持久缓存；平台 iframe 自身行为由平台控制。

## 已知限制

- 真实 X 在本机返回 403，无法检查登录态实际 DOM、选择器和 CSP。见 [人工冒烟清单](docs/manual-smoke.md)。不能保证当前 X 页面已可用。
- 没有 Apple 公开控制/状态契约，播放/暂停/结束与进度只显示在官方控件里；静态黑胶不会假装正在播放。iframe `load` 仅意味着导航完成，可能仍是空白/错误页，提示会明确告知。
- 默认卡片只有能可靠从原生预览读取的标题，否则显示平台/类型。歌手与封面由官方播放器展示。并未实现默认自定义卡片全部元数据、外部播放/暂停、旋转唱片。
- 纯专辑、歌单、其他类型保留第一项并说明不支持；不会替换成第二首。未知链接不猜测。
- 不对普通 t.co 逐个联网；只使用完整 `title` / `data-expanded-url`（如存在）。截断文本不当成 URL。平台短链保留并说明未解析，当前未实现网络短链解析。
- 引用排除依赖 DOM 启发式；未知结构宁可不增强。`card.title` 只是保守可选字段，不假设真实 X 一定提供。
- 只保证插件自身最多一个活跃 iframe；真实 Apple 停止在合成 X 的测试与手工检查中验证，不宣称可控制平台外播放。
- Native iframe 不可见跨域内部错误，15 秒超时只覆盖未收到 load 的情况；地区、登录、曲目不可用在官方播放器中处理。加载失败不自动循环重试。
- Spotify 启用播放前需要明确解决 Widget 第三方页面条款；Apple 扩展增强场景适用条款仍需确认。无发布、push 或商店操作。
