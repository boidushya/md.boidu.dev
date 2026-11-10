# Refresh design (2026-11-11)

Give md.boidu.dev a fresher, more polished feel and fix small UX gaps, without changing how the app is used. Layout, control positions and keyboard shortcuts stay the same. No new steps are added to any flow.

## Constraints

- Ease of use is retained: same structure (sidebar, toolbar, editor/split/preview), same shortcuts, no relocated controls.
- Visual direction: refine the current look. Same fonts (Switzer, JetBrains Mono), sharper surfaces and motion.
- No test suite exists, so verification is `npm run check` plus manual browser checks.

## Foundations

### Tokens (`src/app.css`)

- Motion: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`, durations 150/200/250ms. No `transition: all` anywhere; name the properties.
- Palette in OKLCH, same neutral feel, light and dark.
- `--shadow-border` (layered transparent ring) and `--shadow-pop` (dialogs, toasts). Keep `border: 1px solid transparent` under rings for forced-colors mode.
- Concentric radii for nested surfaces (segmented toggle: outer = inner + padding).
- Global: `text-wrap: balance` on headings, `pretty` on prose, `tabular-nums` on counts and dates, `:not(:disabled):active { scale: 0.96 }` on buttons (150ms ease-out), hover styles under `@media (hover: hover)`, `prefers-reduced-motion` guard.

### Theme (`src/lib/stores/theme.svelte.ts`, `src/app.html`)

- Preference is `system | light | dark`. With nothing stored, follow `prefers-color-scheme` live. The toggle flips to the opposite of the resolved theme and stores it.
- Suppress transitions for one frame on theme switch.
- `<Toaster theme>` follows the resolved theme.
- Syntax highlighting colors become CSS variables with a dark palette.

### Clipboard and share (`src/lib/share/clipboard.ts`)

- Single owner for copying. Accepts a string or a promise of a string.
- Uses `new ClipboardItem({ 'text/plain': promise })` started inside the user gesture, so Safari keeps user activation across the share upload. Falls back to `writeText`. On failure, a toast shows the URL with a manual copy action.
- On touch devices with `navigator.share`, sharing opens the native share sheet.
- Every copy in the app (share, re-copy from sidebar, viewer copy markdown) routes through it.

### Overlay scrollbars (`src/lib/actions/scroll.ts`)

- Add `overlayscrollbars` (vanilla). A Svelte action `use:scroll` with `autoHide: 'leave'` and themed handle colors.
- Applied to preview, project list, shares list, viewer.
- CodeMirror: initialize on the editor root with `elements.viewport` set to `view.scrollDOM`, so CodeMirror keeps its own scroller.
- Scroll sync keeps reading from the real viewport element.

### Dialogs

- Native `<dialog>` with `showModal()` for New Project and Help: focus trap, Esc, focus return, `::backdrop`.
- Enter: scale 0.96 to 1 with opacity, 200ms `--ease-out`. Exit: 150ms. `@starting-style` plus `transition-behavior: allow-discrete`.
- Project delete: no `confirm()`. Delete immediately with an Undo toast that restores the record.

## Surfaces and layout

- Toolbar and sidebar dividers via `--shadow-border`. Icon buttons 32px visual, 40px hit area.
- View toggle: active pill slides with `transform` on pointer clicks; keyboard switches (Cmd 1/2/3) are instant.
- Sidebar slides with `transform` at fixed width, so text never squashes. Main column reflows.
- Save status sits in a fixed-width slot and fades.
- Theme icon cross-fade (scale 0.25 to 1, blur 4px to 0, 300ms).
- Project list re-sorts by `updatedAt` after save. Help dialog lists Cmd S. Platform detection without `navigator.platform`.
- Editor selection color from a token.

## Mobile (below 720px)

- Split is not offered; the toggle shows Editor and Preview. Split returns at wider widths.
- Sidebar is an overlay drawer with a scrim (tap or Esc closes).
- Viewer header wraps; actions collapse to icons.

## Viewer (`/s/[id]`)

- Header actions: theme toggle, Copy markdown, Download `.md`, Fork.
- Print styles: hide chrome, prose at full width.
- Skeleton while loading; error card with an Open editor link.

## Extras

- Word count and reading time in the toolbar right group, muted `tabular-nums`, derived from `content`.
- Drop a `.md`, `.markdown` or `.txt` file onto the editor app to create a project named from the first heading or the filename. Overlay while dragging.

## Verification

- `npm run check` clean.
- Browser pass: both themes, mobile width, dark viewer, share in Chrome and Safari (WebKit), dialog focus behavior, file drop.
