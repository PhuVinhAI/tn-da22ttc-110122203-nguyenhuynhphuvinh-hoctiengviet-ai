Status: ready-for-agent

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Port the exact mobile theme tokens to admin's `app/styles/globals.css` to achieve visual consistency across both apps. This includes colors, typography, radius scale, and enforces flat design (no shadows).

Copy exact hex values from `mobile/lib/core/theme/app_theme.dart`:
- Primary #6366F1 (dark #818CF8), secondary #8B5CF6 (dark #A78BFA), accent #06B6D4 (dark #22D3EE)
- Background, foreground, card, muted, border, input colors for both light and dark modes
- Add semantic tokens mobile has but admin lacks: success, warning, info (+ foreground variants)
- Replace Geist font with Inter
- Port radius scale from mobile (sm≈6, md≈10, lg≈14, xl≈20 → convert to rem)
- Remove all shadow token definitions

## Acceptance criteria

- [ ] `globals.css` defines all color tokens matching mobile's exact hex values for light mode
- [ ] `globals.css` defines all color tokens matching mobile's exact hex values for dark mode
- [ ] Semantic tokens (success, warning, info + foregrounds) are added
- [ ] Font family is Inter (not Geist)
- [ ] Radius scale matches mobile's values converted to rem
- [ ] No shadow tokens are defined in CSS variables
- [ ] Visual inspection: a test page with tokens applied matches mobile's appearance

## Blocked by

None - can start immediately
