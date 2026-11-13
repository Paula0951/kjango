# UI/UX Review — 평일 업무 달력 (app.html v8)

Screenshots are in this directory (Playwright, headless Chromium, clock frozen at 2026-11-13 10:00). Contrast is WCAG 2.x, measured on `--bg #100904` unless noted.
Shots: `01-main-1440.png`, `01b-main-full.png`, `02-hover-day.png`, `03-today-closeup.png`, `04-focus-tab17.png`, `04b-focus-tab23.png`, `05-detail.png`, `06-day-modal.png`, `07-all-months.png`, `08-settings-{days,links,style,wp,data}.png`, `09-wallpaper.png`, `10-filter-drawer.png`, `11-quickadd-tip.png`, `12-main-1280x720.png`, `13-narrow-400.png`, `13b-narrow-400-full.png`, `14-narrow-detail.png`. Raw data: `taborder.txt`, `modal-tab.txt`.

Overall verdict: the system is visually coherent but too uniform to work with. Every item looks the same apart from "urgent", today is close to invisible, hover looks the same as today, and keyboard use is broken in several places. The user's three complaints are all valid and have measurable causes.

---

## P0: broken, or the user's main complaints

### P0-1. The `# @ !` token buttons throw an error and do nothing (JS bug)
- Evidence: `pageerror: "b is not defined"` when clicking `.tok`. After the click, `#qa` is still `""`.
- Cause: line 881, `case 'ins': … b.dataset.t`. The variable is `t`.
- Fix: `i.value = v + (v && !/\s$/.test(v) ? ' ' : '') + t.dataset.t;`
- DESIGN §7.2 says "syntax is taught by icons". At the moment those icons do nothing, so the only way to learn the syntax is the ⓘ tooltip.

### P0-2. Hovering a cell gives it the same color as today
- Evidence: hover `--out` = `#1c1109`, `--today-bg` = `#1e1309`, a ratio of **1.017:1** between them. In `03-today-closeup.png` the hovered 16th cell looks the same as the 13th. The today tint itself is **1.08:1** against the canvas, so it is effectively invisible.
- Fix: give today and hover different kinds of treatment, not just two dark browns (spec below).

### P0-3. Today does not stand out, and at common window sizes it can be off screen
- Evidence: the only today markers are a 1.5px ring and a 10px `TODAY` label (`03-today-closeup.png`). In the 1440×900 viewport, 3 of 5 weeks show above the sticky quick-add (grid bottom 1099px, quick-add top 795px). In the 1280×720 viewport only **1 full week** shows, and the today row is cut off by the quick-add bar (`12-main-1280x720.png`). On a laptop the person has to scroll every day to see today.
- Fix: see the Today spec. Also fit the month into the viewport. Shrink the hero when `max-height:900px` (title `clamp(40px,6vh,64px)`, stats inline). Move the "예시" banner into the rail. Set `.grid{grid-auto-rows:minmax(96px,1fr);height:calc(100dvh - var(--hero-h) - var(--qa-h) - 40px)}` so all 4–6 weeks fit. Put NEXT UP below the fold or beside the grid at ≥1600px.

### P0-4. Items cannot be told apart: tag colors are all tan
- Evidence: `tagColor = hsl(18 + hue%38, 38%, 58%)`, so every tag gets a hue between 18° and 56°. Measured dot colors are `#bd866b`, `#bdaf6b` and `#bda36b`, which are three tans. The dots are 6px, so they are below what the eye can tell apart. Status (할 일 / 진행 중) is not shown at all in cells. In the day modal (`06-day-modal.png`), "진행 중", "할 일" and "완료" are identical outline pills. Overdue items look the same as future ones.
- Fix: the palette and encoding below. The colors should mean something the user chose, not come from a hash.

### P0-5. Keyboard: days cannot be focused, there are 81 tab stops, and modals do not trap focus
- Evidence: `.cell` has `tabIndex -1` and no role (`taborder.txt`). To reach Nov 13 you press Tab about 30 times through hidden "+" buttons, and there are 81 focusable elements on the main view. Tab inside the day modal leaves the dialog after one stop and walks the rail and page behind it (`modal-tab.txt`: `IN .ti` → `OUT BODY` → `OUT .mrow …`). Focus is lost after almost every action: clicking a chip leaves `activeElement=BODY`, Esc from the detail panel leaves it on `BODY`, and every `renderMain()` or `renderDetail()` runs `innerHTML` and destroys the focused node (for example, pressing 상태 / 중요도 buttons drops focus).
- Fix:
  - Grid: `role="grid"` → rows → `.cell role="gridcell" tabindex` with a roving tabindex: only today, or the last focused cell, has `0`; the rest have `-1`. ←/→/↑/↓ move by a day or a week. Home/End go to Mon/Fri. PgUp/PgDn change month. Enter opens the day modal, `N` or `+` focuses add, and Tab goes into that cell's chips. Make the `.add` buttons `tabindex=-1`, since keyboard users get Enter on the cell.
  - Move month change off bare ←/→ (lines 978–979), which currently fight grid navigation. Use PgUp/PgDn or Alt+←/→.
  - Modal: on open, save `document.activeElement`. Make `.app` `inert` while the overlay is open, trap Tab within `#modal`, and restore focus on close.
  - Detail panel: give it `role="complementary" aria-label="항목 상세"`, focus `#d-title` on open, and on close return focus to the chip with the same `data-id`.
  - After re-renders, restore focus by `data-act` + `data-id`/`data-v` (a small `keepFocus(fn)` wrapper).

### P0-6. At narrow width (400px) the urgent pill is an empty cream blob
- Evidence: `13-narrow-400.png`. The "! 분기 보고서" pill on the 13th shows no text, done items show only "✓", and only 2 weeks are visible.
- Fix: below 640px, switch to an agenda/list per week, or at least `.chip.high{min-width:0;padding:2px 6px}` with `.chip .t` keeping one character, and hide `.clip` below 640px. Narrow width is less important for this desktop user, but it currently renders garbage.

---

## P1

### P1-1. Text contrast
| Token | Hex | on bg | on today `#1e1309` | on hol `#2c1304` | on Bark `#382416` |
|---|---|---|---|---|---|
| `--fg` | #ffedd7 | 17.26 | 15.92 | — | 12.81 |
| `--muted` 66% | #ae9f8f | **7.67** ✓ | 7.08 | 6.79 | 5.69 |
| `--strong` 58% | #9b8d7e | 6.12 ✓ | 5.65 | 5.41 | 4.54 |
| `--faint` 42% | #74695d | **3.69 ✗ text** | 3.40 | 3.26 | **2.74 ✗** |
| `--line` 26% | #4e443b | 2.08 (decorative) | 1.92 | 1.84 | 1.55 |
| `--ember` | #dc5000 | 4.88 | — | **4.32 ✗** (holiday label at 12px) | — |

- `--faint` is used for text in `.eyebrow span` ("MON – FRI"), `.fl span` (link count "2개", checklist "1/3"), and the idle borders of `.ti`, `.tok` and `.seg`. Those idle borders are at 3.69, which passes the 3:1 non-text rule on bg but not on Bark. Fix: change the text uses to `--muted`. Raise `--faint` to **52% → #8c8072 (5.12:1)**. That still reads as tertiary next to muted.
- Holiday labels are ember on `--hol-bg` at **4.32:1**, below AA. Fix: `--hol-fg:#f0661a` gives **6.23** on bg and **5.51** on hol-bg. Keep `#dc5000` for the 16% wallpaper fill only.
- `--line` at 2.08:1 is acceptable for a decorative grid. Do not use it as the only boundary of an interactive target. The `.clip` idle border uses `--line`, so the button is nearly invisible; use `--faint`.

### P1-2. Focus indicator is too thin, and some controls have none
- `:focus-visible{outline:1px dashed}`: a 1px dashed ring on small 22–28px circles is barely visible (`04b-focus-tab23.png`, the "+" in the 6th cell). `.fi:focus` and `.qa-box input` use `outline:0` with only a solid-to-dashed underline change, which is hard to see. `.ttl` shows its focus underline only on hover or focus, with no ring.
- Fix: `:focus-visible{outline:2px dashed var(--fg);outline-offset:3px}`, which stays within the 2px maximum. For inputs: `border-bottom:2px dashed var(--fg)` plus `background:color-mix(in srgb,var(--surface) 35%,transparent)`.

### P1-3. Target sizes (WCAG 2.5.8 requires 24px minimum)
- `.ti` is **22×22** (and appears 6–8 times), and checklist delete `ib` is **22×22**. Both fail. `.add` and `.clip` are 26 and `.tok` is 28, which pass but are small for daily mouse use.
- Fix: keep the visible circle at 22px but give a 32px hit area with `.ti{position:relative}.ti::before{content:"";position:absolute;inset:-5px}`. (Note that `::after` is already used by the tooltip.) Use 28px minimum for checklist delete.

### P1-4. Tooltips are not accessible
- `data-tip` is rendered only through CSS `::after`, and the button's accessible name is just "도움말", so screen readers never get the content. Esc does not dismiss the tooltip; it closes the whole modal (WCAG 1.4.13).
- Fix: render a real `<span role="tooltip" id>` and use `aria-describedby`. On Esc while a `.ti` is focused, hide the tooltip and stop propagation.

### P1-5. Missing ARIA and other semantics
- `#toast` has no `role="status" aria-live="polite"`, so every confirmation ("추가했어요" and so on) is silent.
- Settings tabs have `role=tab` but no `tabpanel`, no `aria-controls`, no ←/→ handling, and every tab is a separate Tab stop.
- `.seg` buttons need `aria-pressed`. Use a `radiogroup` for 상태 and 중요도.
- The chip accessible name is only the title. Add `aria-label="분기 보고서, 중요, 진행 중, 11월 13일"`.
- `.cell.tnow` needs `aria-current="date"`.
- `.mrow.on` needs `aria-current="page"`.
- The filter button needs `aria-expanded`.
- Day-modal `#day-add` has no `aria-label`. It has a placeholder only.

### P1-6. The detail drawer covers the calendar, including today
- Evidence: `05-detail.png`. The 470px panel covers THU/FRI, including the selected item, so its `.chip.sel` outline cannot be seen. The panel's edge is `border-left:1px solid var(--line)`, which **breaks DESIGN §4** (drawer edges must be a 2px stitch, never solid).
- Fix: at ≥1280px, make it a grid column (`.app.detail-open{grid-template-columns:176px 1fr 420px}`) so the calendar reflows instead of being covered. Change the edge to `border-left:2px dashed var(--strong)`.

### P1-7. Day-modal badges break the hierarchy
- `drow` shows the cream-filled `높음` badge even when the item is **done** (line 608 has no `status!=='done'` check). DESIGN §3 reserves cream fill for urgent and not-done items.
- The status badges are identical outlines (`06-day-modal.png`). Use the status glyphs below.

### P1-8. Discoverability
- Paste-on-hovered-cell (Ctrl+V), drag-drop to cells or the panel, and the quick-add date syntax (`11/20`, `20일`, `내일`) are documented only in a settings tab and an ⓘ. There is no date token button, only `#`, `@` and `!`.
- Fix:
  - On `dragover`, show a label inside the cell: `::after{content:"여기에 놓기"}`.
  - On a hovered cell with no items, show a faint `Ctrl+V 문서` hint. Stay within §7 by keeping it 2 words.
  - Add a 4th token `📅`/`날짜` that inserts `내일` or the hovered date.
  - Show the parse hint (`→ 11/13(금) · @나`) as soon as the field is focused, not only after typing.
  - In NEXT UP's empty state, link to the syntax.

### P1-9. Overdue is not shown anywhere on the calendar
Only the detail panel colors D+N. Past-due, not-done items in cells look like everything else. Proposal: add a `--late` token (below) as a 2px left tick and `D+3` meta text on the chip, plus a 지난 항목 count in the hero stats.

---

## P2

- **Settings tabs are clipped**: the tab labels sit on the 2px stitch (`08-settings-*.png`). `.tabs` is a scroll container in a column flexbox and gets shrunk. Fix: `.tabs{flex-shrink:0}`. Same for `.mh`.
- **Copy length breaks §7**:
  - Empty-state sentences "3주 안에 마감되는 항목이 없어요.", "#분류를 붙이면 여기에 모여요.", and "아직 없어요." should be ≤2 words.
  - The Settings 백업 and 문서 연결 tabs have paragraph-length `p.help` text, which §7.6 forbids. Move the detail behind ⓘ.
  - Toasts run up to 50 characters ("오피스에서 여는 중이에요. 안 열리면 Win+R → …").
- **Off-system values**: the custom-day color input defaults to `#7c4dff` (purple) and has `border-radius:6px` (line 635), against the 0 radius for inputs. The search input focus uses `outline` instead of the §5 dashed underline. Unused tokens: `--chip`, `--accent-soft`, `--ok`. `applyStyle` falls back to 13px but `DEF_STYLE` is 14.
- **`prefers-reduced-motion`** only removes transitions, and there are no transitions yet. If you add the lift (below), gate it with `@media (prefers-reduced-motion:no-preference)`.
- **The cell layout jumps on hover**: the `.add` button appears via `opacity` (no transition) with no other feedback, so the hover response is easy to miss.
- **Wallpaper** (`09-wallpaper.png`):
  - Done items lose the `✓` and the strike runs through the `·` bullet.
  - There is no tag color.
  - Out-of-month days at `globalAlpha .38` give `#6a5f53`, about 3.3:1, which is OK for dates. Mute is `.62`, while the app uses `.66`, so it is inconsistent.
  - Today is not marked (by design), but the user wants today emphasis. Offer an optional "이번 주 강조" (week-of-generation band) in the wallpaper instead.
- **Arrow-key month navigation** fires while a chip or button is focused and silently resets `selDay`.
- **"+N개 더"** in the all-months view has `data-act="day"` (only the first `data-act="day"` is replaced, by the cell). It opens the day modal without changing `ui.mi`, which is inconsistent with clicking the cell.
- **Information density**: the hero (about 290px) plus a 96px title takes about 32% of a 900px screen, so a daily-use tool spends its best space on branding. NEXT UP repeats grid items and sits below the fold.

---

## Recommended palette (warm-dark compatible, on `#100904`)

Encode three dimensions with three different channels so they never compete:

| Dimension | Channel | Values |
|---|---|---|
| **Priority** | fill / weight (unchanged, per DESIGN) | 높음 = cream pill; 보통 = cream text; 낮음 = `--muted` text + `↓` |
| **Status** | glyph prefix (shape, CVD-safe) | 할 일 `○` · 진행 중 `◐` · 완료 `✓` + strike |
| **Category (tag)** | 3px left bar / 8px dot in a user-assigned hue | 4 hues + neutral, below |
| **Overdue** | `--late` text for `D+n` and a 2px left tick | below |

Category hues: 4 hues plus a neutral. I searched an 11-candidate set for the best 4-hue combination by minimum ΔE across normal, deuteranopia, protanopia and tritanopia simulation. The result has **minimum ΔE ≈ 21**; a 6-hue set dropped to about 2 under deuteranopia, which is why the palette is capped at 4.

| Token | Hex | on bg | on today `#2a1a0c` | on hol-bg | cream pill text `#100904` on it |
|---|---|---|---|---|---|
| `--c1` 세이지 | `#a3c47a` | 10.10 | 8.58 | 8.93 | 10.10 |
| `--c2` 머스터드 | `#e6c95c` | 12.11 | 10.29 | 10.71 | 12.11 |
| `--c3` 라일락 | `#c3a0e8` | 8.95 | 7.60 | 7.92 | 8.95 |
| `--c4` 로즈 | `#e08fb6` | 8.26 | 7.01 | 7.30 | 8.26 |
| `--c0` 샌드 (기타/없음) | `#cdb79a` | 10.19 | 8.66 | 9.01 | — |
| `--late` (overdue) | `#f0661a` (shared with `--hol-fg`, see note) | 6.23 | — | 5.51 | — |

Rules:
- Keep hues away from ember. Every category hue is at least 62 ΔE from `#dc5000`.
- Color is never the only cue: the tag text (`#보고`) is in the day modal, the detail panel and the chip tooltip, and status uses glyphs.
- Assign a tag's color in Filter → 분류 (click the dot, pick 1 of 5) and store it in `S.tagColors`. Untagged items use `--c0`.
- Use at most 4 named hues, because more is not CVD-separable.
- Chip rendering: `.chip{border-left:3px solid var(--tc);padding-left:8px}`. A solid 3px bar inside the chip is a mark, not a separator. If you want to stay literal to "never solid", use an 8px dot instead of 6px. Urgent pills keep the cream fill and add a 3px inner left bar in `--tc` (box-shadow inset is not a shadow visually; or use `background:linear-gradient(90deg,var(--tc) 0 4px,var(--fg) 4px)`).
- Wallpaper: draw the dot as `arc(r = 4*s)` and the bar as `fillRect(w = 3*s)` with the same hexes. All hues are ≥ 8:1 on the wallpaper bg, so they survive JPEG-ish recompression and Windows "Fill" scaling. Done items keep the hue at 45% alpha.
- `--late` and holidays: overdue reusing ember would break §8. Either accept ember for "overdue" (it is error-like, which §8 allows) or use the mustard with a `D+n` text label. I recommend ember `#f0661a`, text only, because "late" is an error state.

## Today spec
1. Cell tint `--today-bg:#2a1a0c` (1.18:1 vs bg, up from 1.08) **plus** `outline:2px dashed var(--fg); outline-offset:-3px` (stitch weight, cream, so "you are here" uses an outline per §3 and §10).
2. Day number: keep the 1.5px ring and raise it to 2px. The `TODAY` label goes to 11px with letter-spacing .16em, in `--fg`.
3. Column header: `.dow span.now{color:var(--fg);text-decoration:underline dashed;text-underline-offset:6px}` (FRI 금).
4. **Dim the past**: in the current month, days before today get `.cell.past .dnum{color:var(--strong)}` and `.cell.past .chip:not(.high){opacity:.75}`. Contrast stays ≥ 5.7, which is above the `--muted` floor. This makes today stand out more than any added decoration.
5. Hero: add a line under the title, `오늘 · 11월 13일 (금) · 3건 (중요 1)`, as a clickable button that focuses the today cell.
6. On load, scroll so the today row is visible, and give it `aria-current="date"`.

## Hover / focus / active spec
| State | Treatment |
|---|---|
| Cell hover | `background:color-mix(in srgb,var(--surface) 22%,var(--bg))` (`#241710`, 1.13:1). Hover must **never** use the today tint. Add an inner `outline:1px dashed var(--strong); outline-offset:-5px`. Content lift: `.cell:hover > *{transform:translateY(-2px)}`. Do not scale the cell, because scaling breaks the shared dashed grid lines. Show `.add` with `opacity` and a 120ms transition. |
| Cell focus-visible | Same as hover, plus `outline:2px dashed var(--fg); outline-offset:-6px` (inside the today frame, so both can show). |
| Cell active / pressed | `transform:none; background:var(--surface)` for 80ms. |
| Chip hover | Keep the dashed underline. Add `background:color-mix(in srgb,var(--surface) 40%,transparent)` and `border-radius:6px`. |
| Pill / ghost hover | Bark fill (existing) plus `transform:translateY(-1px)`. |
| Motion | Wrap all transforms and transitions in `@media (prefers-reduced-motion:no-preference){…}`. Under `reduce`, the states use color and outline only. |

## Implementation order (about 1 day)
1. P0-1 token bug (one line).
2. Today and hover tokens.
3. Tag palette, status glyphs and `S.tagColors`.
4. Roving-tabindex grid, focus trap, focus restore and live toast.
5. Viewport-fit grid.
6. Contrast token changes (`--faint` 52%, `--hol-fg #f0661a`).
7. Detail as a column with a stitch edge.
8. P2 copy and cleanup.
