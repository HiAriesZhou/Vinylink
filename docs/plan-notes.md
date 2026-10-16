# 实施记录
2026-10-16。初始仓库只有 LICENSE / .gitignore；无适用 AGENTS.md，工作树干净。使用本地 feat/mvp 分支，不 push，不访问账号。

顺序：官方依据 → 隔离 MV3 playback spike → Apple 可见 Embed 端到端 → 生命周期、排序、协调 → Spotify 合规能力 → 单元/浏览器测试、构建、中文交付。

视觉：X 时间线中的安静工具组件，72px 横排、48px 静态 CSS 黑胶、继承页面字体与实测背景色；原生 Shadow DOM CSS。内容顺序：标题、来源、明确的展开入口。无法取得真实播放事件时没有旋转动画或伪播放状态。
