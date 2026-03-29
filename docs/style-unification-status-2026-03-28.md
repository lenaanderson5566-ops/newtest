# 文字样式统一状态检查（2026-03-28）

## 检查范围
- 路由入口页：`src/router/index.js` 中引用的 26 个 `src/views/**/*.vue` 页面。
- 全量视图页：`src/views/**/*.vue`。

## 自动检查项
1. 是否使用统一页面骨架：`page-shell` / `page-inner`。
2. 是否存在 `font-size: ... !important`。
3. 是否存在硬编码 `font-size: Npx`。
4. 是否使用 typography 占位符：`@extend %typo-*`（仅做覆盖率观察）。

## 结果概览
- 路由页总数：26
- 已接入 `page-shell`：20
- 未接入 `page-shell`：6
- 全量视图中 `font-size !important`：0
- 全量视图中 `font-size: Npx`：0

## 未接入统一页面骨架的路由页（仍待统一）
1. `src/views/landing/LandingPage.vue`
2. `src/views/landing/CustomLandingPage.vue`
3. `src/views/errors/ApiValidation.vue`
4. `src/views/errors/BrowserRestricted.vue`
5. `src/views/errors/NotFound.vue`
6. `src/views/layout/MainBoard.vue`（布局容器，通常作为骨架宿主，可按需豁免）

## 已统一但尚未大量使用 `%typo-*` 的业务页（建议后续收口）
以下页面已经接入 `page-shell/page-inner`，但组件内部仍以局部样式为主，`@extend %typo-*` 使用较少或为 0：
- `AnnouncementList.vue`
- `Billing.vue`
- `GiftCardRedeem.vue`
- `Invite.vue`
- `OrderList.vue`
- `ConfigManagement.vue`
- `SecuritySettings.vue`
- `TicketList.vue`
- `MobileTicketList.vue`
- `TrafficLog.vue`
- `DocDetail.vue`

## 本次结论
- **“字号硬编码/强覆盖”层面已经基本统一完成**（未发现 `font-size !important` 与 `font-size: Npx`）。
- **“页面骨架统一”层面仍有 6 个入口/错误类页面未接入 `page-shell`。**
- 建议下一步优先把 Landing 与错误页切换到统一骨架，再逐步提升 `%typo-*` 覆盖率。
