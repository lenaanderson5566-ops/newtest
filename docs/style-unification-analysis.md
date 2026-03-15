# 视图与全局样式统一分析（views + src/assets/styles）

## 目标
建立一套“可复用、低冲突、低维护成本”的页面样式骨架，避免每个视图重复定义 `*-container + *-inner + card`，并减少 `!important` 覆盖链。

---

## 一、现状问题（按优先级）

### P0：容器层级重复，导致边距/宽度控制分散
当前多个页面都在重复定义：
- 外层容器：`padding` / `padding-bottom`
- 内层容器：`max-width + margin: 0 auto`
- 卡片层：`background + border + shadow + margin-bottom`

典型重复：
- Billing：`.billing-container/.billing-inner`【src/views/account/billing/Billing.vue】
- WalletDeposit：`.deposit-container/.deposit-inner/.dashboard-card`【src/views/account/wallet/WalletDeposit.vue】
- Payment：`.payment-container/.payment-inner/.section-wrapper/.dashboard-card`【src/views/account/commerce/Payment.vue】
- Dashboard：`.dashboard-container/.dashboard-inner/.dashboard-card`【src/views/overview/Dashboard.vue】

**影响**：统一改“贴边/宽度/间距”时，需要改很多页面，且容易出现“某页还留空”的回归。

### P0：同类卡片样式散落在各页面，设计 token 没有收口
例如卡片基础样式（圆角、边框、阴影、内边距、hover）在多个页面重复出现，数值接近但不完全一致：
- Payment 的 `.dashboard-card` 与 `.section-wrapper`【src/views/account/commerce/Payment.vue】
- WalletDeposit 的 `.dashboard-card`【src/views/account/wallet/WalletDeposit.vue】
- Dashboard 的 `.dashboard-card`【src/views/overview/Dashboard.vue】

**影响**：视觉不统一，后续调优会出现“修一个页面、破另一个页面”。

### P1：`index.scss` 使用较多强选择器 + `!important`，可维护性下降
当前 `index.scss` 已承担了很多“跨页面纠偏”逻辑（特别是 payment/order 行高、对齐、gap），依赖范围限定和 `!important`：
- `line-height` 全局覆盖【src/assets/styles/index.scss】
- `margin-bottom` 统一覆盖【src/assets/styles/index.scss】
- payment 行内细节覆盖（多段）【src/assets/styles/index.scss】

**影响**：短期见效快，长期会导致“谁优先级更高”的维护成本增加，且 scoped 样式和全局样式互相拉扯。

### P1：断点策略不统一
有的页面使用 `768`、有的 `992`、有的 `1200`，同一“容器行为”在不同页面触发点不同。

**影响**：同宽度下页面视觉节奏不一致（尤其平板）。

### P2：命名体系混用（功能语义 + 样式语义混杂）
如 `.dashboard-card` 在非 dashboard 页也被复用，`.section-wrapper` 与 `.dashboard-card` 职责重叠。

**影响**：语义模糊，后续抽离组件或主题化困难。

---

## 二、哪些可以“直接合并”

### 1) 可合并为统一“页面骨架（layout primitives）”
建议新增（放在 `src/assets/styles/layouts/`）：
- `.page-shell`：只负责最外层边缘间距（如 2px）+ 底部安全区
- `.page-inner`：统一 `max-width` + `margin: 0 auto`
- `.page-stack`：统一纵向模块间距（替代分散的 `margin-bottom`）

然后把下面页面逐步替换为这三个原语：
- Overview / Region / Start / My / Billing / Wallet / Payment / OrderConfirm

### 2) 可合并为统一“卡片原语（surface primitives）”
建议新增：
- `.ui-card`
- `.ui-card--compact`
- `.ui-card__title`
- `.ui-card__body`

把重复定义的这组属性统一：
- `background-color`
- `border`
- `border-radius`
- `box-shadow`
- `padding`
- `hover border/shadow`

### 3) 可合并为统一“信息行原语（info rows）”
Payment/OrderConfirm 使用大量 `info-row/label/value`，建议抽为：
- `.info-list`
- `.info-row`
- `.info-label`
- `.info-value`
- 修饰符：`--discount --highlight --final`

这样能减少 `index.scss` 对具体页面类名（`.payment-container .right-column ...`）的耦合。

---

## 三、哪些应保留“页面私有”

以下不建议全局合并，应保留 scoped：
1. **业务强语义组件**：如 Payment 二维码弹窗、OrderConfirm 待处理订单弹窗。
2. **页面专属布局结构**：如 Dashboard 的复杂网格、图表区域。
3. **极少复用的交互动效**：只在单页使用的动画或状态过渡。

原则：
- **结构与节奏全局化**（壳层、卡片、间距、字体层级）
- **业务特性局部化**（专属模块、专属状态）

---

## 四、建议的落地顺序（低风险）

### Phase 1（先统一骨架，不动业务）
1. 新增 `layout primitives` + `card primitives`。
2. 先改 4 个核心页（Overview/Region/Start/My）使用统一骨架。
3. 删除这些页中的重复 `container/inner/card` 样式。

### Phase 2（统一 commerce 视觉）
1. Payment + OrderConfirm 切换到统一 `ui-card + info-row`。
2. 把 `index.scss` 中面向 `.payment-container` 的强耦合规则减半。

### Phase 3（全局收口 + 清理）
1. 合并 Billing/Wallet/OrderList/Invite 容器样式。
2. 移除无效/重复规则与不必要 `!important`。
3. 建立“禁止新增 page-level container 私有 spacing”的约定。

---

## 五、量化验收标准（建议）

1. **容器统一**：主业务页只保留一套 `page-shell/page-inner`。
2. **卡片统一**：80% 以上卡片使用 `ui-card` 原语。
3. **强覆盖下降**：`index.scss` 的 `!important` 数量降低 40%+。
4. **断点统一**：仅保留 3 个核心断点（例如 1200 / 992 / 768）。
5. **视觉一致性**：同级页面左右边缘误差 ≤ 2px，卡片纵向节奏一致。

---

## 六、你当前项目里“最值得先动”的文件

1. `src/assets/styles/index.scss`
   - 建议拆分为：tokens / layout-primitives / commerce-primitives。
2. `src/views/account/commerce/Payment.vue`
   - 卡片与 info-row 重复最多，最适合作为原语改造样板。
3. `src/views/account/wallet/WalletDeposit.vue`
   - `dashboard-card` 重复定义典型。
4. `src/views/account/billing/Billing.vue`
   - 容器定义清晰，适合作为 `page-shell/page-inner` 的迁移模板。
5. `src/views/overview/Dashboard.vue`
   - 保留专属网格，但外层容器与卡片基类应接入全局原语。

---

## 结论
你目前的样式体系已经在“全局统一”方向上迈出了一步，但还处于“通过覆盖统一”的阶段。下一步应从“覆盖式统一”升级为“原语式统一”：
- 用少量稳定原语承接 80% 页面样式。
- 把业务页从“自带容器和卡片系统”变为“消费统一系统”。

这样可以在不牺牲灵活性的前提下，得到真正一致的视图效果，并显著降低后续迭代成本。
