# 交付摘要

2026-10-16，本地 `feat/mvp`。已实现、测试、构建可安装 MV3 扩展；未 push、未发布、未操作账号。

**交付状态：可安装的降级原型；原始完整 MVP 未完成。**

- Apple：可见官方播放器试听在真实 MV3 扩展页及实际构建扩展的合成 X 宿主中验证，真实 playing/timeupdate/ended，实测该曲目约 90 秒。未验证完整播放。自定义紧凑卡片没有外部播放/暂停和实时旋转，默认缺失可靠元数据时显示平台/内容类型；歌手/封面在官方播放器内展示。
- Spotify：识别链接与内容类型，无播放；官方 Widget 第三方页面条款阻塞，不绕过。没有请求元数据或试听音源。
- 工程：TypeScript、Shadow DOM、首链接固定选择、引用排除、视口增量扫描、节点复用和卸载清理、单 iframe 协调、可逆预览隐藏、失效清理；无运行时第三方依赖、无后端/账号/音频缓存。
- 验证：`pnpm typecheck` 通过；`pnpm test` 43/43；`pnpm build` 通过；`pnpm smoke` 全部断言通过；真实媒体事件见 `artifacts/spike.json` 和 `artifacts/real-integration.json`。
- 阻塞：真实 X 返回 403，未验证登录态 DOM 与 CSP，不能宣称真实时间线端到端通过。短链网络解析、默认完整元数据、定制播放状态未实现。

安装目录：[dist](../dist/)；压缩包：[x-music-card.zip](../artifacts/x-music-card.zip)。源码 `src/`，测试 `tests/`，合成页面 `fixtures/`，主题/窄屏/真实播放截图 `artifacts/`。

Aries 只需加载 `dist/`，刷新登录 X，检查 Apple 展开后的声音/进度、A/B 切换及卸载停止，并按 [最少人工步骤](manual-smoke.md) 覆盖真实页面。无需交出凭证；若要后续开放 Spotify，具体需要平台确认“用户安装扩展后，在 X 本地注入可见 Widget”是否获许可。Apple 同类扩展增强用途也应在发布前确认。本轮不引入 MusicKit 凭证或后端。

完整执行报告：`/workspace/eng-tasks/tasks/TASK-20261016-x-music-card/EXEC-RESULT.md`。可行性、官方依据与核查日期：[feasibility.md](feasibility.md)。

遵循工作期间新增的 `STEER-architecture.md`：播放器 UI 不依赖 X DOM/chrome API，首链接逻辑仅在 X 适配层。已保存本地实现提交，未 push。
