# UI Migration Progress

## Overall phases
- [x] Phase 1: Layout/token baseline
- [~] Phase 2: Shell standardization and reusable layout primitives (进行中，约 90%)
- [x] Phase 3: Base component unification (已完成)
- [~] Phase 4: P0 page migration (overview/profile/billing/support)（已完成，100%）
- [~] Phase 5: P1/P2 page migration and cleanup（已完成，100%）
- [~] Phase 6: Dashboard/long-tail visual consistency and cleanup（已完成，100%）
- [~] Phase 7: Performance and cleanup hardening（已完成，100%）
- [~] Phase 8: Dashboard style modularization and override retirement（已完成，100%）
- [~] Phase 9: Dashboard override retirement and scoped-style restoration（已完成，100%）
- [~] Phase 10: Dashboard override down-migration to scoped/component boundaries（已完成，100%）
- [~] Phase 11: Cross-page style de-dup and token baseline hardening（已完成，100%）

## This iteration
- Phase 11 收口完成：no-plan 跨页面共享样式完成语义 token 化并对齐 Dashboard scoped 常量。
- 启动 Phase 11：Dashboard scoped 弹层/按钮硬编码常量继续 token 化，统一 footer gap/禁用态/危险阴影等语义变量。
- Phase 10 收口完成：Dashboard 全局 overrides 文件已清退，相关样式已回归 Dashboard scoped 作用域。
- Phase 10 持续推进：traffic-package-modal override 已从全局模块清退，回归 Dashboard scoped 样式维护。
- 启动 Phase 10：将 eztheme-btn override 从全局模块下沉回 Dashboard scoped :deep 作用域。
- Phase 9 收口完成：Dashboard overrides（风险卡片/按钮/流量包弹层）历史 `!important` 已完成清退。
- 启动 Phase 9：风险态卡片兜底样式首批移除 `!important`，验证在模块化后依赖常规层叠优先级仍可稳定生效。
- Phase 8 收口完成：Dashboard 全局兜底样式按风险卡片/按钮/弹层拆分为独立模块，并补齐对应语义 token，完成首轮结构化清理。
- 启动 Phase 7：Dashboard 内联流量包弹层与全局兜底块尺寸/间距语义对齐，减少双套样式漂移风险。
- Phase 7 收口完成：Dashboard 风险态卡片与全局按钮兜底样式语义 token 化，历史硬编码颜色/圆角常量进一步清退。
- 启动 Phase 6：Dashboard 统计卡片状态色/过期态与流量包弹层关键样式完成首批 token 化（覆盖阴影、边框、遮罩、按钮底色）。
- Phase 6 持续推进：Dashboard 弹层层级/反色文本与软色渐变背景进一步 token 化，减少重复 rgba 常量。
- Phase 6 持续推进：Dashboard 大量交互动效时长/easing 完成语义 token 化，降低页面内 transition 硬编码。
- Phase 6 持续推进：Dashboard 流量包弹层尺寸/间距/圆角常量完成 token 化，进一步为去除 !important 做准备。
- Phase 6 收口完成：Dashboard 主题浅色层级、风险态色块与内联弹层常量完成集中 token 化，长尾视觉一致性清理完成。
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
- MoreOptions 页面容器与卡片间距完成 token 化，统一移动端安全区留白。
- MainBoard 背景装饰与容器高度关键常量完成 token 化，减少壳层散落样式。
- Dashboard 页面容器/gap/宽度改为全局 token 驱动，完成 P0 页面迁移收口。
- 启动 Phase 5：Dashboard 语义色板与卡片阴影抽离为全局 token，减少页面内品牌色硬编码。
- Phase 5 持续推进：AuthTopToolbar 与 NProgress 偏移/层级常量完成 token 化。
- Phase 5 持续推进：Dashboard 卡片圆角与移动端概览间距进一步语义 token 化。
- Phase 5 持续推进：NProgress spinner 边框与动画时长常量完成 token 化。
- Phase 5 持续推进：App 全局滚动条尺寸/圆角常量完成 token 化。
- Phase 5 持续推进：App 过渡动画与滚动条透明度常量完成 token 化。
- Phase 5 持续推进：语言渐隐起始透明度与全局滚动行为完成 token 化。
- Phase 5 持续推进：过渡 easing 与滚动条轨道背景常量完成 token 化。
- Phase 5 收口完成：TopBar 交互过渡与 NProgress 运行参数（easing/speed/minimum）完成 token 驱动。
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
3. 启动 Phase 12：逐步统一 Dashboard/DocDetail 的弹层与卡片语义 token 命名并补充可视回归。
