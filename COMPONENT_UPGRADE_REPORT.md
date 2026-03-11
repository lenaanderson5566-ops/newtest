# 组件升级/替换检查报告

检查时间：2026-03-11

## 结论摘要

1. **建议升级（低风险）**
   - `@stagewise-plugins/vue`：`0.5.2 -> 0.6.3`
   - `@stagewise/toolbar-vue`：`0.5.2 -> 0.6.3`

2. **建议评估替换（中风险，分阶段）**
   - `vuex` 建议逐步迁移到 `pinia`（Vue 3 生态主流状态管理方案）。

3. **建议规划替换（中高风险，需专项）**
   - 构建体系从 `Vue CLI`（`@vue/cli-service`）迁移到 `Vite`。

---

## 依据

- `npm outdated --long` 输出仅发现 `stagewise` 两个包有可升级版本。
- 当前项目依赖中包含 `vuex@4.1.0`、`@vue/cli-service@5.0.9`，均可运行，但在 Vue 3 新项目实践里通常分别使用 Pinia 与 Vite。

---

## 具体建议

### A. 立即处理：stagewise 工具链小版本升级

- 升级目标：
  - `@stagewise-plugins/vue` `^0.5.2` -> `^0.6.3`
  - `@stagewise/toolbar-vue` `^0.5.2` -> `^0.6.3`
- 风险评估：低（开发工具依赖，非业务运行核心）。
- 注意事项：本环境执行 `npm install` 时出现 `workspace:*` 协议兼容问题，建议在你们标准包管理器环境（pnpm / yarn / npm 配置一致）下落地升级并回归。

### B. 中期处理：Vuex -> Pinia

- 原因：
  - Vue 3 官方生态更倾向 Pinia；
  - 类型推导、模块组织、组合式 API 配合体验通常更优。
- 建议路径：
  1) 新模块先用 Pinia；
  2) 保留 Vuex 与 Pinia 并行一段时间；
  3) 按页面逐步迁移旧模块；
  4) 最后移除 Vuex。

### C. 长期规划：Vue CLI -> Vite

- 原因：
  - 开发启动、HMR、构建速度通常更优；
  - 社区插件生态重心已转向 Vite。
- 风险点：
  - 现有 webpack 定制（如 obfuscator、loader、别名）需要迁移；
  - 环境变量与静态资源处理方式差异。
- 建议：单独开迁移分支，优先保证构建等价与路由/国际化/样式链路稳定。

