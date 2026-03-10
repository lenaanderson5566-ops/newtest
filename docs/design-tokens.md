# Design Tokens Governance

## Token layers

- **Core tokens**: spacing, radius, font scale, shadows, breakpoints.
- **Semantic tokens**: surface/background/text/border/brand/status/layer.
- **Layout tokens**: sidebar width, content max width, shell max width, gutters, safe-area offsets.

## Current source files
- `src/assets/styles/mobile-tokens.scss`
- `src/assets/styles/layout-tokens.scss`

## Rules
1. Prefer semantic variables in component/page styles.
2. Do not introduce new literal hex/rgb/radius/shadow values in page styles when token exists.
3. Keep breakpoint values centralized in token files.
4. Layering (`z-index`) must use layout tokens.

## Near-term next steps
- Move remaining shell literal values to semantic tokens.
- Add lint/check rule for style hardcoding hotspots.
- Expand token coverage to form/list/card/state colors.
