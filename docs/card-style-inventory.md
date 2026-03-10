# 卡片样式盘点（用于统一改造）

> 目标：梳理当前项目“所有主要卡片样式来源 + 使用区域 + 局部覆盖点”，便于后续按优先级统一。

## 1) 当前卡片样式来源（Style Sources）

### A. 全局统一卡片规则（新）
- 文件：`src/assets/styles/components/cards.scss`
- 覆盖对象：
  - 容器：`.dashboard-card`、`.base-card`、`.profile-card`
  - 结构：`.card-header/.card-title/.card-body`、`.base-card-header/.base-card-title/.base-card-body`
- 关键能力：统一背景、边框、圆角、阴影、header/body padding、移动端半径与间距。

### B. 卡片设计 token（全局变量）
- 文件：`src/assets/styles/base/variables.scss`
- 关键 token：`--app-card-*`
  - `--app-card-bg`
  - `--app-card-border-color`
  - `--app-card-radius` / `--app-card-radius-mobile`
  - `--app-card-shadow`
  - `--app-card-header-padding` / `--app-card-header-padding-mobile`
  - `--app-card-body-padding` / `--app-card-body-padding-mobile`
  - `--app-card-title-size` / `--app-card-title-weight`

### C. 组件级卡片
1. `BaseCard`（结构化基础卡片）
   - 文件：`src/components/base/BaseCard.vue`
   - 特点：完全依赖 `--app-card-*` token，适合作为标准业务卡片容器。

2. `InfoCard`（信息型卡片）
   - 文件：`src/components/common/InfoCard.vue`
   - 特点：自带 `--info-card-*` 局部变量，视觉接近但并不完全等价于 `BaseCard`/`.dashboard-card`。

3. `profile-card`（个人中心卡片）
   - 文件：`src/components/profile/AccountInfoCard.vue`、`src/components/profile/SecurityCard.vue`
   - 特点：容器 class 为 `.profile-card`，已被全局 `cards.scss` 统一接管基础外观。

---

## 2) 各业务区域用了什么卡片样式（按页面）

## 2.1 使用 `BaseCard` 的区域（结构最统一）
- `src/views/more/MoreOptions.vue`
- `src/views/security/SecuritySettings.vue`

结论：这类页面优先级最低，已具备较好一致性。

## 2.2 使用 `InfoCard` 的区域（信息卡风格）
- `src/views/dashboard/Dashboard.vue`（如 no-plan/info 类场景）
- `src/views/more/MoreOptions.vue`
- `src/views/profile/MyCenter.vue`

结论：`InfoCard` 是一条并行卡片体系，如你希望“全站一套卡片”，需决定是否将 `InfoCard` token 与 `--app-card-*` 对齐。

## 2.3 使用 `.dashboard-card` 的区域（最广泛）
- `src/views/dashboard/Dashboard.vue`
- `src/views/docs/DocsPage.vue`
- `src/views/invite/Invite.vue`
- `src/views/more/MoreOptions.vue`
- `src/views/orders/OrderList.vue`
- `src/views/profile/UserProfile.vue`
- `src/views/servers/NodeList.vue`
- `src/views/shop/Payment.vue`
- `src/views/shop/Shop.vue`
- `src/views/ticket/TicketList.vue`
- `src/views/ticket/MobileTicketList.vue`
- `src/views/trafficLog/TrafficLog.vue`
- `src/views/wallet/WalletDeposit.vue`

结论：`.dashboard-card` 是当前最核心卡片基类，但大量页面仍有 scoped 覆盖导致“看起来不完全一致”。

---

## 3) 仍有局部覆盖（不统一）的重点热点

以下文件中存在针对 `.dashboard-card` / `.card-header` / `.card-body` / `.card-title` 的局部样式覆盖，属于后续统一改造的主要成本点：

- Dashboard：`src/views/dashboard/Dashboard.vue`
- Invite（覆盖最重）：`src/views/invite/Invite.vue`
- Docs：`src/views/docs/DocsPage.vue`
- Orders：`src/views/orders/OrderList.vue`
- Profile：`src/views/profile/UserProfile.vue`
- Servers：`src/views/servers/NodeList.vue`
- Shop：`src/views/shop/Payment.vue`、`src/views/shop/Shop.vue`、`src/views/shop/OrderConfirm.vue`
- Ticket：`src/views/ticket/TicketList.vue`、`src/views/ticket/MobileTicketList.vue`
- TrafficLog：`src/views/trafficLog/TrafficLog.vue`
- Wallet：`src/views/wallet/WalletDeposit.vue`

补充：`src/views/errors/BrowserRestricted.vue`、`src/components/common/ImportConfigCard.vue` 也定义了 `card-header/card-body` 结构，但不一定挂在 `.dashboard-card` 体系下，建议纳入第二批统一。

---

## 4) 建议的改造分层（你可直接按此执行）

### Phase A（先收敛视觉基线）
1. 把“是否允许页面覆写卡片外壳（bg/border/radius/shadow）”定为规范：
   - 默认不允许；
   - 仅允许改 `--app-card-*` token；
   - 特例页面通过变体类（如 `.card-variant-xxx`）实现。
2. 先处理覆盖最多页面：`Invite`、`Dashboard`、`Shop`。

### Phase B（统一结构层）
1. 把散落的 `.dashboard-card + .card-header/.card-body` 逐步迁移到 `BaseCard` 插槽结构。
2. 将“只展示信息”的场景评估是否用 `InfoCard`，否则统一成 `BaseCard`。

### Phase C（统一 token 层）
1. `InfoCard` 内的 `--info-card-*` 与 `--app-card-*` 建立映射关系（至少在 default variant）。
2. 补充卡片变体 token：
   - `--app-card-bg-elevated`
   - `--app-card-border-strong`
   - `--app-card-shadow-hover`
   - `--app-card-header-bg`

---

## 5) 快速检索命令（后续你自己持续盘点可复用）

```bash
# 1) 找到所有 dashboard-card 使用点
rg -n "\.dashboard-card\s*\{" src/views --glob '*.vue'

# 2) 找到所有 card 结构覆写点
rg -n "\.card-header\s*\{|\.card-body\s*\{|\.card-title\s*\{" src/views --glob '*.vue'

# 3) 找到 BaseCard / InfoCard 的使用页
rg -l "BaseCard|InfoCard|profile-card|base-card" src/views src/components | sort
```
