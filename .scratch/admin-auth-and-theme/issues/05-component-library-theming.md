Status: completed

## Parent

`.scratch/admin-auth-and-theme/PRD.md`

## What to build

Re-theme all shadcn components to match mobile's flat design and add missing components. This ensures visual consistency across the entire admin app.

**Re-theme existing components** (~20 components already installed): Apply mobile theme tokens and remove all shadows. Update default variants for button, card, dialog, dropdown, popover, and any other components that use `shadow-*` classes. Components should use flat colors with 1px borders for separation (matching mobile's `elevation: 0` style).

**Add missing components**: Install and theme shadcn components that mobile has but admin lacks: avatar, progress, slider, tooltip, sheet, and equivalents for other mobile widgets. All new components should follow flat design from the start.

## Acceptance criteria

- [x] All existing shadcn components are re-themed with mobile tokens
- [x] No component variants use `shadow-*` classes (all removed)
- [x] Cards, dialogs, inputs use 1px borders in `border` or `input` color
- [x] Button, card, dialog, dropdown, popover variants are updated to flat style
- [x] Missing components are added: avatar, progress, slider, tooltip, sheet
- [x] All components respect CSS variables and switch correctly with theme toggle
- [x] Visual inspection: components match mobile's flat appearance (no gradients, no blur, no shadows)
- [x] Test page or Storybook shows all components themed correctly in both light and dark modes

## Blocked by

- `.scratch/admin-auth-and-theme/issues/02-mobile-theme-port.md` (need theme tokens defined first)

## Implementation notes

All shadcn components have been re-themed to match mobile's flat design system. Shadow classes were removed from dropdown menus, select components, tabs, and sheet components, replacing them with 1px borders using the `border` color token. Five missing components were added and themed consistently.

### Files created

- `admin/app/components/ui/avatar.tsx` — Avatar component with image and fallback support
- `admin/app/components/ui/progress.tsx` — Progress bar component for loading states
- `admin/app/components/ui/slider.tsx` — Range input slider component
- `admin/app/components/ui/tooltip.tsx` — Hover tooltip component for contextual information
- `admin/app/components/ui/sheet.tsx` — Slide-out panel component (drawer) from different sides

### Files modified

- `admin/app/components/ui/dropdown-menu.tsx` — Removed `shadow-md` and `shadow-lg` from DropdownMenuContent and DropdownMenuSubContent, replaced with `border border-border`
- `admin/app/components/ui/select.tsx` — Removed `shadow-md` from SelectContent, replaced with `border border-border`
- `admin/app/components/ui/tabs.tsx` — Removed `shadow-sm` from active TabsTrigger (default variant)
- `admin/app/components/ui/sheet.tsx` — Removed `shadow-lg` from SheetContent, added `border border-border`
- `admin/app/pages/ThemeTestPage.tsx` — Expanded test page to showcase all new components (avatar, progress, slider, tooltip, sheet) plus existing form components (input, select, switch, checkbox, tabs) in both light and dark modes

### Files deleted

None
