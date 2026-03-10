# UI Migration Progress

## Overall phases
- [x] Phase 1: Layout/token baseline
- [~] Phase 2: Shell standardization and reusable layout primitives (进行中，约 90%)
- [x] Phase 3: Base component unification (已完成)
- [~] Phase 4: P0 page migration (overview/profile/billing/support)（进行中，约 90%）
- [ ] Phase 5: P1/P2 page migration and cleanup

## This iteration
- 启动 Phase 3：新增 `BaseCard` / `BaseListRow` / `BaseSettingsRow` 三个基础组件并接入个人中心页面。
- 将安全设置页（SecuritySettings）迁移到 BaseCard/BaseListRow 结构，减少重复卡片与行样式。
- 将 Billing 页面 Tab 结构迁移到 `BaseTabs`，统一分段导航样式实现。
- UserProfile 的提醒设置区块已迁移到 BaseCard/BaseSettingsRow，减少页面内重复 settings-row 样式。
- MoreOptions 页面迁移到 BaseCard/BaseListRow 列表模式，统一“更多入口”样式与交互。
- 启动 Phase 4：支持中心入口页（CustomerService）完成移动端壳层与间距稳定化改造。
- Billing 页面完成粘性分段导航与移动端安全区重排优化。
- Dashboard 页面完成移动端容器与网格重排优化。
- CustomerService 页面完成移动端头部触达区与底部安全区统一优化。
- UserProfile 页面完成移动端容器安全区与表单触达区统一优化。
- MyCenter 页面完成移动端容器安全区与摘要卡片单列重排优化。
- SecuritySettings 页面完成移动端容器安全区与弹窗表单触达区优化。
- Billing 页面容器与粘性导航偏移改为统一 token 驱动，减少页面硬编码。
- 将 App 壳层顶部导航从 `App.vue` 拆分为 `AppTopBar` / `AuthTopToolbar`，降低根组件复杂度。
- Added reusable layout container component (`AppContainer`) for unified content width/padding behavior.
- Integrated `AppContainer` into `MainBoard` to reduce page-level container ownership.
- Continued tokenization of app-shell styles in `App.vue` (header text color, toolbar layer, toolbar hover/active visual tokens, logo radius).
- Fixed page-header rendering guard to use shell-computed `hasPageHeader`.
- App 壳层关键样式常量（header/toolbar/mobile density）进一步 token 化，降低页面级硬编码。
- AppTopBar/AuthTopToolbar 样式下沉到布局组件，进一步降低 `App.vue` 壳层样式耦合。

## Next
1. Introduce base shell components for topbar/sidebar/bottom-nav responsibilities.
2. Replace remaining shell hardcoded values in `App.vue` and high-traffic screens.
3. 持续推进 Phase 4：优先完成概览/财务/支持中心的移动端重排与视觉统一。
