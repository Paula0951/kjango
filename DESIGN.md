# MY CALENDAR — Design System

> 따뜻한 암실 위의 평일(월–금) 달력. 크림색 글자가 유일한 장식이고, 구조는 점선 "스티치"가 만든다.
> Base: ORYZO AI style reference (warm-dark editorial) → adapted for a dense, daily-use tool.

**Theme:** dark only (`color-scheme: dark`) · **Target:** Windows 11 / Chrome, offline intranet · **Deliverable:** one self-contained HTML (+ wallpaper PNG)

---

## 1. Principles

1. **Hierarchy before decoration.** Every filled/outlined/dimmed treatment means exactly one thing (see §3). Never reuse a treatment for a second meaning.
2. **Structure is drawn with stitches.** Dashed lines, two weights (§4). No shadows, no solid dividers.
3. **Say less in the UI.** Placeholders are short; explanations live behind an info icon (§7).
4. **Warm, never pure.** Text is cream `#ffedd7`, canvas is walnut `#100904`. No `#fff` / `#000`.
5. **Ember is rare.** Orange is only for holidays and errors.

## 2. Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#100904` | Canvas (warm near-black) |
| `--fg` | `#ffedd7` | Primary text, active borders |
| `--surface` | `#382416` | Bark: selected-state fill, tooltips (the only elevated solid) |
| `--ember` | `#dc5000` | Ember (decorative borders). Never buttons |
| `--hol-fg` / `--over` | `#f0661a` | Holiday & overdue **text** (6.2:1 on bg; `#dc5000` failed AA on the holiday cell) |
| `--muted` | fg 66% on bg | Secondary text, done items, out-of-month chips |
| `--faint` | fg 52% on bg (5.1:1) | Tertiary: hints, idle icon borders. **Not for item text** |
| `--hover` | `#241710` | Cell hover fill (never equals today tint) |
| `--line` | fg 26% on bg | **Hairline** dashed separators |
| `--strong` | fg 58% on bg | **Stitch** dashed separators, strike-through, out-of-month day numbers |
| `--hol-bg` | `#2c1304` | Holiday cell fill |
| `--today-bg` | `#2a1a0c` | Today cell tint (background only, no fill on the number) |

### Category colors (the only chroma besides holidays)

Each dimension uses its own channel: **priority = fill/weight**, **status = glyph** (○ 할 일 · ◐ 진행 중 · ✓ 완료+strike), **category = colored dot** (9px; 11px ring on urgent pills). Max **4 hues + neutral**; contrast on `#100904` ≥ 8:1, distinct under deuteranopia/protanopia/tritanopia.

| Token | Hex | Name |
|---|---|---|
| `--c1` | `#a3c47a` | 세이지 |
| `--c2` | `#e6c95c` | 머스터드 |
| `--c3` | `#c3a0e8` | 라일락 |
| `--c4` | `#e08fb6` | 로즈 |
| `--c0` | `#cdb79a` | 샌드 (no tag) |

A tag's color is auto-picked from its name, and can be changed by clicking its dot in the filter drawer (stored in `S.tagColors`). Color is never the only cue: tag text, status glyph and priority pill carry the same information. The wallpaper draws the same hexes.

Custom date colors and user presets (월넛·그래파이트·포레스트·미드나이트) override these via `STYLE_VARS`.

## 3. Visibility hierarchy (item & date states)

Rule: **solid cream fill is reserved for "urgent" only.** Everything else uses outline, text weight or dimming.

| Level | State | Treatment |
|---|---|---|
| 1 | **Urgent** (중요도 높음, not done) | Cream-filled pill, bg-colored text, `!` prefix. Always shown in the cell |
| 2 | **Active** | Cream text, tag dot |
| 3 | **Done** | `--muted` text + 1.5px `--strong` strike-through + `✓` prefix (the ✓ is not struck) |
| 4 | **Out-of-month** | Day number `--strong`; chips/“+N개 더” `--muted` |

Date markers (never a cream fill, so they can't be confused with urgent pills):

- **Today** — 2px dashed cream frame around the whole cell + 2px ring on the (bold) day number + 11px `TODAY` + `#2a1a0c` tint + the weekday header (e.g. FRI 금) underlined. Earlier days of the month are dimmed (`past`: number `--strong`, chips 78%) so today is the brightest place on the screen.
- **Holiday** — ember day number + ember label + `--hol-bg` cell.
- **Custom day** — user color label (optional full-cell tint).

Selected controls (filter row `.sbtn.on`, segmented buttons `.seg .on`) use **Bark fill + 1px cream border** (+ `✓` on segments) — a selected control must not look like an urgent item.

Minimum legibility: any item text ≥ `--muted` (≈ 66%). `--faint` is only for non-essential hints.

### Interaction states

- **Hover (day cell)**: `--hover` fill, 1px dashed `--strong` inner outline, contents lift 2px, `+` fades in. No scaling (it would break the shared dashed lines). Motion only under `prefers-reduced-motion: no-preference`.
- **Focus**: 2px dashed cream outline (inset on cells so it coexists with the today frame).
- **Keyboard**: cells are a roving-tabindex grid — arrows move day/week, Enter opens the day, PageUp/PageDown change month, Esc closes. Modals make the page `inert`, trap Tab, and restore focus on close.
- **A11y**: `aria-current="date"` on today, descriptive `aria-label` per cell, `aria-pressed` on toggles, toast is `aria-live`, ⓘ hit area ≥ 24px.

## 4. Separators — two weights ("stitches")

| Tier | Style | Where |
|---|---|---|
| **Hairline** | `1px dashed var(--line)` | Between calendar cells, list rows (`.nrow`, `.drow`, `.lk`, `.srow`, `.trow`), inner lines |
| **Stitch** | `2px dashed var(--strong)` | Left rail edge, calendar grid outer frame, NEXT UP top, quick-add top, drawer edges & header/footer (`.dh`, `.dfoot`), modal border + header (`.mh`) + tabs, section headings (`.sec`), mobile rail bottom |
| None | — | Everything else. Depth comes from spacing, not lines |

Never thicker than 2px; never solid; never a shadow. The wallpaper mirrors this: hairline grid + a 2px (scaled) dashed outer frame.

## 5. Typography

- Stack: `Pretendard, Malgun Gothic, 맑은 고딕, Apple SD Gothic Neo, Noto Sans KR, system-ui` (no web fonts — offline).
- Weight 500 everywhere. Latin micro-labels (`MON`, `NEXT UP`, `TODAY`) uppercase with 0.14–0.18em tracking, 10–11px.
- Korean content stays sentence-case (uppercase doesn't exist; don't fake it).
- Month title: uppercase English, ~92px (wallpaper) / hero (app). Day numbers 20px tabular. Body 14px (`--fs`, user-adjustable).
- Left-aligned text throughout.

## 6. Components

- **Rail** (176px, slim): brand, month list (2 rows of year groups), 4 text tools at the bottom. No icons+labels clutter; right edge = stitch.
- **Hero**: big month, stats (항목/중요/완료), ghost pill nav (prev/오늘/next), underline search (`검색`).
- **Grid**: 5 columns, outer stitch frame, hairline inner lines. Cell = day number row (`.ch`) + notes + chips + "+N개 더".
- **Buttons**: ghost pill (1px cream border, 22px radius) default; filled Bark only for selected state. Radii: 12 cards/modals, 999 pills, 0 inputs.
- **Inputs**: underline only (1px cream). Focus → dashed underline.
- **Drawers**: filter (left of content, next to rail) and item detail (right, Slack-like). Stitch edges.
- **Modals**: day / all-months / settings (tabs). 2px dashed border.
- **Token buttons** `# @ !`: 28px dashed-outline circles that insert syntax into the quick-add field.
- **Info icon `.ti`**: 22px circle `ⓘ`; hover/focus shows a Bark tooltip (`white-space: pre-line`, 12.5px). `.r` variant anchors right to avoid clipping at panel/modal edges.

## 7. Text-input & copy rules (anti-wordiness)

1. **Placeholder = a noun, ≤ 4 words.** `항목 추가` · `검색` · `메모` · `하위 항목` · `경로 또는 링크`.
2. **Syntax is taught by icons, not sentences.** Quick-add shows `#` `@` `!` token buttons and one `ⓘ`.
3. **Details go in the tooltip**, one idea per line (date formats, #/@/!, document paste/drag, preview-page limitation).
4. **Hint line under inputs is empty until typing**, then shows only the parse result (`→ 11/20(금) · #보고 · @나 · 중요도 높음`).
5. **Empty states ≤ 2 words** (`항목 없음`). Banners one line (`예시 15개  지우기`).
6. Settings `p.help` ≤ one short phrase + `ⓘ` when more is needed. No paragraph-length helper text in the main flow.

## 8. Ember rules

Allowed: holiday date/label, holiday badge border, error hints. Not allowed: buttons, selected states, links, today marker.

## 9. Wallpaper (canvas PNG, default 1920×1080)

Dark canvas; uppercase English month; `MON–FRI` header; hairline dashed grid + 2px dashed outer frame; urgent = cream pill; done = `mute` + strike (not `faint`); today is **not** marked (static image); holiday cells ember @ 16% fill; placement right/center/full to clear desktop icons; bottom 10% reserved for the taskbar.

## 10. Do / Don't

**Do** — keep one cream-filled thing per meaning; use outline for "you are here"; use `✓` + strike together for done; put help behind `ⓘ`.
**Don't** — fill the date and the urgent item with the same cream; dim item text below `--muted`; use solid lines; write sentences in placeholders; use ember on interactive controls.

## 11. Deviations from the ORYZO reference

- System Korean font stack instead of Halyard Display (offline, no installs).
- A slim left rail is allowed (reference: no sidebar) — user-approved, kept text-only and minimal.
- Korean labels; Latin uppercase only for micro-labels.
- Added a second line weight (2px stitch) and Bark-filled selected state; both stay within the reference's "nothing thicker than 2px / Bark is the one elevated solid" limits.
- Photos were tried and removed (not part of the system).

## 12. Changelog

**v9 (UI/UX review round)** — Opus review findings applied: color-coded categories + status glyphs; stronger today (frame, tinted cell, header, past-day dimming); hover/focus states; keyboard grid + modal focus trap; `--faint` 42→52%, holiday text `#f0661a`; fixed broken `# @ !` buttons; done items no longer show the cream 높음 badge; narrow-screen urgent pill; wallpaper shows tag dots, ✓ for done. Known open: detail panel still overlays THU/FRI; overdue not shown on the calendar.

**v8**
1. **Separators** — introduced the two-tier system; major sections now 2px `--strong` stitches, hairline raised to 26% for legibility.
2. **Hierarchy & visibility** — done items: `--muted` + thick strike + `✓` (was `--faint`, hard to read). Today: outline ring + `TODAY` (was cream fill, identical to urgent pill / adjacent items). Selected controls: Bark fill + border. Out-of-month dimming raised.
3. **Less wording** — short placeholders, `# @ !` token buttons, `ⓘ` tooltips for quick-add, importance, document links, day modal and settings help; hints empty until typing.

**v7** — ORYZO restyle, slim rail, photos removed.
