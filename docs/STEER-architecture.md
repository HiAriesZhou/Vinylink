# Steering update (immediate)

Aries added architecture constraints mid-run. Apply them to remaining work without expanding MVP scope:

1. MVP still X-only — no blog adapter, no multi-site framework, no public npm package.
2. Separate modules: link parse / player UI / X integration / extension host.
3. Shared player must NOT import X DOM or chrome.* APIs.
4. “first music link per post” is X-adapter only, not core player.
5. One repo, one Chrome extension artifact for this delivery.
6. Defer extracting shared package until blog is a real second consumer; re-verify fetch/playback per environment later.

If code already mixes layers, refactor lightly toward this split before finishing EXEC-RESULT.md. Do not restart from scratch if MVP path works — just clear boundaries.
