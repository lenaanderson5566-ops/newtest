# Visual Regression Checklist

## Scope (Phase 14 baseline)
- Dashboard
- DocDetail
- Billing
- MoreOptions
- MyCenter
- SecuritySettings
- CustomerService

## Key checkpoints
1. Top bar / auth toolbar height, spacing, and safe-area behavior.
2. Core card/list row spacing and radius consistency.
3. `eztheme-btn` default / hover / focus visual state consistency.
4. Modal footer button alignment and disabled-state opacity consistency.
5. Mobile breakpoint (<=768px) container gutter and sticky elements behavior.

## Capture matrix
- Desktop: 1440x900
- Tablet: 1024x768
- Mobile: 390x844

## Acceptance
- No unexpected spacing/radius/color/transition drift against baseline screenshots.
- Any intentional visual updates must be accompanied by token/document updates in the same PR.

## Threshold governance
- Default global pixel-diff threshold: **0.30%**
- Warning threshold: **0.30% ~ 0.80%** (manual review required)
- Failure threshold: **> 0.80%** (must block until reviewed/fixed)
- High-risk routes/components may define stricter local thresholds in follow-up phases.
