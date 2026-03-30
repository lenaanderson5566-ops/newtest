# Spacing Audit Report (After Nearest Matching)

## Baseline
- Source token scale from `src/assets/styles/base/variables.scss` `$spacers`: `0, 4, 8, 16, 24, 48, 64(px)`.
- Scope: all spacing declarations in `.vue/.scss/.css` under `src/`.

## Result
- Total spacing declarations: **1520**.
- Numeric-evaluable: **1209**.
- Matched to existing scale: **1196** (98.9%).
- Unmatched: **13** (1.1%).

## Remaining Unmatched Values
| value | count |
|---|---:|
| `calc(2px + 64px)` | 5 |
| `var(--page-edge-gap, 2px)` | 2 |
| `calc(var(--app-top-bar-height, 56px) + var(--page-content-top-gap, 8px))` | 1 |
| `calc(var(--left-nav-occupy, 220px) + var(--left-nav-gap, 10px))` | 1 |
| `var(--page-edge-gap, 2px) !important` | 1 |
| `0 0 calc(2px + env(safe-area-inset-bottom, 0px))` | 1 |
| `calc(2px + 56px)` | 1 |
| `var(--page-content-bottom-gap, 12px)` | 1 |

## Remaining Unmatched Files
| file | count |
|---|---:|
| `src/App.vue` | 5 |
| `src/views/account/orders/OrderList.vue` | 2 |
| `src/views/layout/MainBoard.vue` | 1 |
| `src/views/region/NodeList.vue` | 1 |
| `src/views/start/DocsPage.vue` | 1 |
| `src/views/start/DocDetail.vue` | 1 |
| `src/views/start/QuickStartPage.vue` | 1 |
| `src/views/account/commerce/OrderConfirm.vue` | 1 |
