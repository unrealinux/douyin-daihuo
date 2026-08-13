---
name: douyin-ui-craft
description: Raises the Douyin ecommerce helper UI from functional admin to a dense, dark, Douyin-native product. Use when editing src/app pages, src/components, Tailwind classes, layout, cards, modals, empty states, or when the user asks for UI polish, visual hierarchy, or frontend craft.
---

# Douyin UI craft

Local dark tool. Goal: one glance shows **what it is** and **the next action**. Not a SaaS marketing site, not a generic gray admin.

## Hierarchy (required)

Per screen, pick **one** primary action. Everything else is secondary/ghost/danger.

Type scale (Chinese UI):

| Role | Class |
|------|--------|
| Page title | `text-2xl font-semibold tracking-tight text-fg` |
| Page subtitle | `mt-1 text-sm text-fg-2` |
| Card title | `text-[15px] font-medium text-fg` |
| Meta / numbers | `tnum text-xs text-fg-2` |
| Body | `text-sm text-white/80` |

Do not make every label `font-bold`. Do not put three equal ghost buttons on a card.

## Surfaces

- Page: `bg-page`. Cards: `bg-surface border-white/5`.
- Accent (`#fe2c55`) only on primary buttons, active nav, and selected state.
- Cyan only for outbound/in-flow links, never as a second brand color on buttons.
- One overlay system: `Modal` from `@/components/Modal`. Never copy-paste `fixed inset-0 z-50` in pages.

## Motion

- 150ms opacity/border/brightness only.
- No bounce, no layout jump, no decorative animation.
- Loading = `Skeleton`, not spinner-on-every-button unless the action is in-flight.

## Cards

Product / asset / script cards:

1. Identity (name + status badge)
2. 2–3 metrics max (`tnum`)
3. **One** primary CTA; edit/delete recede

Empty states use `EmptyState` with one CTA. Errors use `ErrorBanner`.

## Anti-patterns

- Stacking 4+ header buttons with equal visual weight
- Native file input as the only upload UI without a drop/label surface
- `prompt()` / `alert()`
- Hardcoded `#fe2c55` / `#ff6b81` when `accent` token exists (gradients on primary button are allowed as the single exception)
- New overlay markup instead of `Modal`
- Changing API contracts while "just polishing UI"

## Workflow

1. Identify the page's single job and primary CTA.
2. Reuse `PageHeader`, `Card`, `Button`, `Modal`, `EmptyState`, `Toast`.
3. Tighten type + spacing before adding new chrome.
4. Keep data fetching and mutations unchanged unless the UI cannot work otherwise.
