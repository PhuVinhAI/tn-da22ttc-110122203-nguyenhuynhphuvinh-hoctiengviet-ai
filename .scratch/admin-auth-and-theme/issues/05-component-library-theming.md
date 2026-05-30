Status: ready-for-agent

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Re-theme all shadcn components to match mobile's flat design and add missing components. This ensures visual consistency across the entire admin app.

**Re-theme existing components** (~20 components already installed): Apply mobile theme tokens and remove all shadows. Update default variants for button, card, dialog, dropdown, popover, and any other components that use `shadow-*` classes. Components should use flat colors with 1px borders for separation (matching mobile's `elevation: 0` style).

**Add missing components**: Install and theme shadcn components that mobile has but admin lacks: avatar, progress, slider, tooltip, sheet, and equivalents for other mobile widgets. All new components should follow flat design from the start.

## Acceptance criteria

- [ ] All existing shadcn components are re-themed with mobile tokens
- [ ] No component variants use `shadow-*` classes (all removed)
- [ ] Cards, dialogs, inputs use 1px borders in `border` or `input` color
- [ ] Button, card, dialog, dropdown, popover variants are updated to flat style
- [ ] Missing components are added: avatar, progress, slider, tooltip, sheet
- [ ] All components respect CSS variables and switch correctly with theme toggle
- [ ] Visual inspection: components match mobile's flat appearance (no gradients, no blur, no shadows)
- [ ] Test page or Storybook shows all components themed correctly in both light and dark modes

## Blocked by

- `.scratch/admin-auth-and-theme/issues/02-mobile-theme-port.md` (need theme tokens defined first)
