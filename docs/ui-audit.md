# UI Audit Baseline

## Scope
This baseline tracks global layout/style consistency issues before phased migration.

## Problem taxonomy

### 1) Layout architecture issues
- App-level top bar, header layer, and content shell offsets are partially hard-coded in `App.vue` and page-level wrappers.
- Sidebar offset, content width, and header alignment are coupled to media queries in app shell styles.
- Some pages still own their own container width and spacing behavior.

### 2) Design token issues
- Mixed usage of semantic CSS variables and literal values (color, shadows, spacing, radius) across shell/component styles.
- Breakpoint behavior is spread across files without a single source of truth.

### 3) Component consistency issues
- Card/list/settings patterns exist in multiple visual variants with different paddings, radii, and header rules.
- Global toolbar controls and action buttons rely on local style values.

### 4) Page implementation issues
- High-traffic pages (overview/profile/billing/support) have inconsistent mobile density and section rhythm.
- Mobile behavior includes inherited desktop structures in some routes.

## Initial migration priorities
1. Layout shell variables and container policy.
2. Token source-of-truth for spacing, radii, surfaces, layers, breakpoints.
3. Base components (button/card/list/settings row/input/switch/tab/topbar/sidebar).
4. P0 pages first: dashboard/profile/billing/support.
