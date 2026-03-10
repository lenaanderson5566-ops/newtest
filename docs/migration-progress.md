# UI Migration Progress

## Overall phases
- [x] Phase 1: Layout/token baseline
- [~] Phase 2: Shell standardization and reusable layout primitives (进行中，约 70%)
- [ ] Phase 3: Base component unification
- [ ] Phase 4: P0 page migration (overview/profile/billing/support)
- [ ] Phase 5: P1/P2 page migration and cleanup

## This iteration
- 将 App 壳层顶部导航从 `App.vue` 拆分为 `AppTopBar` / `AuthTopToolbar`，降低根组件复杂度。
- Added reusable layout container component (`AppContainer`) for unified content width/padding behavior.
- Integrated `AppContainer` into `MainBoard` to reduce page-level container ownership.
- Continued tokenization of app-shell styles in `App.vue` (header text color, toolbar layer, toolbar hover/active visual tokens, logo radius).
- Fixed page-header rendering guard to use shell-computed `hasPageHeader`.

## Next
1. Introduce base shell components for topbar/sidebar/bottom-nav responsibilities.
2. Replace remaining shell hardcoded values in `App.vue` and high-traffic screens.
3. Start component-level migration with `Card`, `ListRow`, and `SettingsRow`.
