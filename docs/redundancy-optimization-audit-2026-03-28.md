# 版本更迭冗余代码审计（2026-03-28）

## 本次结论（TL;DR）
1. **已修复 1 个明确的版本迁移冗余**：`ResourcePreloader` 仍预加载旧的 `UserProfile.vue`，但路由主入口实际已切换到 `MyCenter.vue`，已统一替换，避免预加载错误页面资源。  
2. **仍存在可优化项（建议分批做）**：依赖层面可能存在“历史遗留依赖未清理”、预加载配置重复较多、样式层仍有跨层覆盖链。

---

## 已完成修复

### A. 预加载目标与路由真实入口不一致（已修复）
- 路由当前 `Profile` 主入口已是 `MyCenter.vue`。
- `ResourcePreloader` 中历史上多处仍指向 `UserProfile.vue`，会造成预加载偏差与额外包体开销。
- 本次已将这些预加载项统一改为 `MyCenter.vue`。

---

## 仍建议优化的点（未在本次直接改动）

### 1) 依赖清理（高优先级）
`package.json` 中存在若干看起来像历史迁移残留的依赖，建议做一次 `depcheck + 人工确认`：
- `@vue/compat`
- `@vue/runtime-core`
- `@vue/runtime-dom`
- `@vue/shared`
- `core-js`
- `tailwindcss`
- `@stagewise-plugins/vue` / `@stagewise/toolbar-vue`

> 说明：这些依赖是否最终可删，必须结合构建链、运行时注入、私有脚本再确认。

### 2) ResourcePreloader 配置重复（中优先级）
- 当前 `componentsConfig.route` 下多路由重复声明同一组件（如 Dashboard/Profile/Shop 等）
- 可抽成：`commonPreloadSets + routeDiff` 结构，减少配置复制和未来维护成本。

### 3) 样式覆盖链（中优先级）
- 虽然 typography 已在推进统一，但部分页面仍有“全局规则 + scoped 局部规则”叠加。
- 建议下一步继续收口到 `token + primitive`，减少页面特化选择器数量。

---

## 建议执行顺序
1. 先做依赖审计：`depcheck` + 构建校验 + 手工回归（登录、支付、图表、语言切换）。
2. 再做 `ResourcePreloader` 配置去重重构（不改行为只改结构）。
3. 最后做样式覆盖链清理（按页面分批，避免大面积视觉回归）。

