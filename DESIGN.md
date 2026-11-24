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
| `--focus-tint` | `--surface` 35% on bg (`#1e120a`) | Focused input background (fg 16:1, placeholder 7.1:1) |
| `--out` | `--surface` 30% on bg | Row hover in lists (NEXT UP, day modal) |
| `--chip-h` | `--surface` 78% + fg | Primary button hover |

Removed in v10 (were unused): `--chip`, `--accent`, `--accent-soft`, `--ok`, `--win`, `--warn` (use `--ember`). The modal scrim is `--bg` at 84%, never pure black.

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
- **Custom day** — user color label (optional full-cell tint). New days default to `--c3`.
- **Overdue** (not done, due < today) — `D+n` label in `--over` beside the chip, never dimmed by `past`; `지연 D+n` badge in the day modal; hero stat `지연 N` (all months, number in `--over`). Text always accompanies the color.

Selected controls (filter row `.sbtn.on`, segmented buttons `.seg .on`) use **Bark fill + 1px cream border** (+ `✓` on segments) — a selected control must not look like an urgent item.

Minimum legibility: any item text ≥ `--muted` (≈ 66%). `--faint` is only for non-essential hints.

### Interaction states

- **Hover (day cell)**: `--hover` fill, 1px dashed `--strong` inner outline, contents lift 2px, `+` fades in. No scaling (it would break the shared dashed lines). Motion only under `prefers-reduced-motion: no-preference`.
- **Focus**: 2px dashed cream outline (inset on cells so it coexists with the today frame).
- **Input focus**: `2px dashed --fg` underline + `--focus-tint` (textarea: 2px dashed frame; quick-add box via `:focus-within`).
- **Keyboard**: cells are a roving-tabindex grid — arrows move day/week, Enter opens the day, PageUp/PageDown or Alt+←/→ change month (bare arrows never change month), Esc closes. Modals make the page `inert`, trap Tab, and restore focus on close; settings opens on its selected tab.
- **Focus restore**: re-renders restore focus by `id`/`data-*`. Opening an item focuses its title; closing the panel returns to the opener (chip / NEXT UP row), else the item's chip, else its day cell.
- **A11y**: `aria-current="date"` on today, descriptive `aria-label` per cell and chip (title, 중요, status, 기한 지남), `aria-pressed` on toggles, toast is `aria-live`. ⓘ is `aria-describedby` → `<span role="tooltip">`; Esc on a focused/hovered ⓘ hides only the tooltip. Settings tabs are `tablist/tab/tabpanel` with ←/→/Home/End. Hit areas ≥ 24px (`::before{inset:-5px}` on 22px icons; checklist checkbox 18px by the spacing exception).

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
- **Hero**: big month, today line (`오늘 · 11월 13일 (금) · 3건 (중요 1)`, a dashed-underline button that jumps to and focuses the today cell), stats (항목/중요/완료/지연), ghost pill nav (prev/오늘/next), underline search (`검색`). At `max-height:780px` it compacts (no eyebrow, smaller title, controls in one row) along with the banner and quick-add.
- **Grid**: 5 columns, outer stitch frame, hairline inner lines. Rows `minmax(96px,auto)`; the grid's min-height fills the viewport above quick-add, and the today cell is scrolled to center on load. Cell = day number row (`.ch`) + notes + chips + "+N개 더".
- **Buttons**: ghost pill (1px cream border, 22px radius) default; filled Bark only for selected state. Radii: 12 cards/modals, 999 pills, 0 inputs.
- **Inputs**: underline only (1px cream). Focus → dashed underline.
- **Drawers**: filter (left of content, next to rail) and item detail (right, Slack-like). Stitch edges (`2px dashed --strong`). At ≥1280px the detail panel is a third grid column (`clamp(340px,24vw,440px)`) so the calendar reflows instead of being covered; below that it overlays.
- **Modals**: day / all-months / settings (tabs). 2px dashed border.
- **Token buttons** `# @ !` + calendar icon (+ `⤢` 자세히 + send): 28px dashed-outline circles that insert syntax into the quick-add field. The date token inserts the next weekday as `/MM-DD` and advances one weekday per click (a range is typed by hand: `/11-12~12-25`).
- **Token highlight (`.qin` + `.mir`)**: the quick-add and day-modal inputs have transparent text over a same-font mirror layer (same box, padding and font; tokens get no horizontal padding, so the caret never drifts). Recognized tokens become pills: tag = its category color (16% fill + 60% outline), assignee = dashed outline, priority high = the urgent cream pill / low = muted dashed, date = Bark fill + stitch outline, invalid date = `--over` dashed. The hint line (`#qa-hint`) shows the same kinds as chips (`.hc`), plus dashed suggestion chips for existing `#`/`@` words while typing one.
- **Composer (modal `compose`)**: 항목 추가 popup for details. Opens by dropping files on the quick-add bar, the `⤢` button, or Shift+Enter in the bar (typed text is parsed into fields). Fields: title, 시작일/기한, tag chips (+ suggestions), assignee chips, 중요도 segmented, memo, document links. Enter in title or Ctrl+Enter saves, Esc cancels (bar text is kept). Several files become one item with all links; `파일별로` saves one item per file.
- **Drop targets**: while dragging a file, the cell / detail panel / day modal / quick-add bar / composer under the pointer shows a centered `여기에 놓기` pill (bg fill, 1px dashed cream).
- **Info icon `.ti`**: 22px circle `ⓘ` (32px hit area); hover/focus shows a Bark tooltip (`white-space: pre-line`, 12.5px) rendered as a real `role=tooltip` element. `.r` variant anchors right to avoid clipping at panel/modal edges.

## 7. Text-input & copy rules (anti-wordiness)

1. **Placeholder = a noun, ≤ 4 words.** `항목 추가` · `검색` · `메모` · `하위 항목` · `경로 또는 링크`.
2. **Syntax is taught by icons, not sentences.** Quick-add shows `#` `@` `!` token buttons and one `ⓘ`. Dates: `/11-20`, `/11-12~12-25`, `/2026-11-12` (year omitted = this year, but before the calendar range = next year; end before start = error); older `11/20 · 20일 · 내일` still work.
3. **Details go in the tooltip**, one idea per line (date formats, #/@/!, document paste/drag, preview-page limitation).
4. **Hint line under quick-add appears on focus** with the default target (`→ 11월 13일 (금) · @나`), then shows only the parse result as chips while typing (`→ [11/20(금)] [#보고] [@나] [중요도 높음]`); empty again on blur.
5. **Empty states ≤ 2 words** (`항목 없음`, `마감 없음`, `분류 없음 ⓘ`). Banners one line (`예시 15개  지우기`). Toasts are one short clause (`경로 복사됨 · Win+R에 붙여넣기`).
6. Settings `p.help` ≤ one short phrase + `ⓘ` when more is needed. No paragraph-length helper text in the main flow.

## 8. Ember rules

Allowed: holiday date/label, holiday badge border, error hints. Not allowed: buttons, selected states, links, today marker.

## 9. Wallpaper (canvas PNG, default 1920×1080)

Dark canvas; uppercase English month; `MON–FRI` header; hairline dashed grid (fg 26%, same as `--line`) + 2px dashed outer frame; urgent = cream pill; done = `mute` (fg 66%, same as `--muted`) + strike + `✓`; tag dots read the `--c0…c4` tokens; out-of-month days at 58% (= `--strong`, 6.1:1); today is **not** marked (static image); holiday cells ember @ 16% fill; placement right/center/full to clear desktop icons; bottom 10% reserved for the taskbar.

## 10. Do / Don't

**Do** — keep one cream-filled thing per meaning; use outline for "you are here"; use `✓` + strike together for done; put help behind `ⓘ`.
**Don't** — fill the date and the urgent item with the same cream; dim item text below `--muted`; use solid lines; write sentences in placeholders; use ember on interactive controls.

## 11. Deviations from the ORYZO reference

- System Korean font stack instead of Halyard Display (offline, no installs).
- A slim left rail is allowed (reference: no sidebar) — user-approved, kept text-only and minimal.
- Korean labels; Latin uppercase only for micro-labels.
- Added a second line weight (2px stitch) and Bark-filled selected state; both stay within the reference's "nothing thicker than 2px / Bark is the one elevated solid" limits.
- Photos were tried and removed (not part of the system).

## 12. Attendance calendar (출석 달력)

Same file, same tokens; a second module (`#att`, 2nd `<script>`) with its own storage key `attend-cal-v1`. The rail's **행정 / 출석** radio pair switches modes (remembered in `cal-mode`; `?mode=att` opens it directly). Admin handlers return early while `body[data-mode=att]`.

**Range** 2026.12 – 2027.12 (the admin calendar now runs 2026.11 – 2027.12). Legal holidays live once in `window.KR_HOLIDAYS`; each calendar keeps its own on/off list.

**Rules**
- 훈련소정일수 = weekday, not a holiday, not covered by a "수업 없음" 특이사항, within the student's 입학–수료 dates. 6 periods/day (45 min, lunch 12–13), editable times.
- 특이사항 = {from, to?, kind, name, track | all, periods[] | whole day}. Kinds are user-managed; `noClass` decides whether they remove class days/periods (방학·개별학습·자체 휴업일 on, 행사·특강 off).
- Attendance is recorded **per day** (default 출석, no row stored). 지각·조퇴·결과 store the missed periods. If attended periods < 50% of that day's periods → the day counts as 결석 ("50%미만 결석").
- 지각+조퇴+결과 (non-converted) 3 → 결석 1일, computed **per calendar month**, summed for longer ranges.
- 출석일 = 소정일 − (유고 + 무단 + 50%미만 + 환산). Rates < 80% use `--c4`.
- 통학/기숙 per day: 기숙사 입소일 set → 기숙 from that date; otherwise 통학 = N means 기숙 for the whole period. 취성패 Y → 훈련참여수당 0원 (export note). 환산결석 days are taken off 통학/기숙 출석일 too (from the month's last 지각·조퇴·결과 days, by that day's status), so 통학 + 기숙 = 출석일.
- Imported backups are validated (`normA`): ids `[A-Za-z0-9_-]`, dates `YYYY-MM-DD`, periods 1–6, hex colors; references to missing tracks/students are dropped.
- Analysis and export count only up to today by default ("오늘까지만"), so future default-출석 days don't inflate rates. Lecturer hours include planned periods.

**Views** month (per 직종 or 전체) · 주 시간표 (drag a rectangle of period cells, Ctrl+click to add; action bar assigns/clears 외부강사 or 특이사항) · day modal (period grid with the same drag selection + per-student status pills).

**Colors** absence badges `--c4`, partial `--c2`, "출석 n" dot `--c1`; class-less cells Bark 18–22%; holidays keep the ember rule. Selected period cell = Bark fill + 1px cream outline (same as other selected controls).

**xlsx** written in-page (STORE zip + SpreadsheetML, inline strings, fixed style table) — no library, works offline. Sheets: 일별 교시 출결표 (per month, lecturer row per 직종), 일별 요약, 월별 통계, 누적 통계, 월별 출석률, 외부강사 달력 (per month + 강사별 시수), 강사 월별 시수, 수당 기초자료, 학생부·강사 명단·수업일 명부. Verify with `node tools/verify-attendance.js <dir>` and `node tools/verify-attendance-fixes.js`.

## 13. Changelog

**v11 (출석 달력)** — 행정/출석 mode switch; 2027.12 range + 2027 H2 holidays; attendance module (학생부·직종·외부강사·수업일 명부·교시 시간), month/week/day views with drag period selection, 50%/3회 rules, analysis modal, offline xlsx export, JSON backup; rail month list tightened to fit 14 months.

**v10 (review follow-up)** — one commit per item on `feat/review-fixes`:
1. Detail panel is a grid column at ≥1280px (calendar reflows; THU/FRI and today stay visible); edge is now a 2px stitch.
2. Overdue on the calendar: `D+n` in `--over` (6.2:1), not dimmed, `지연 N` hero stat, `지연` badge in the day modal, chip `aria-label`.
3. Viewport fit: grid fills the space above quick-add, rows `minmax(96px,auto)`, compact hero/banner/quick-add at ≤780px height (1280×720: hero 185→102px), today cell centered on load, hero today line.
4. Focus management: title on open, opener/chip/cell on close, focus kept across re-renders, all-months `+N개 더` jumps then opens the day, month change on Alt+←/→ / PgUp/PgDn.
5. Tooltips are `role=tooltip` + `aria-describedby`; Esc closes only the tooltip; ≥24px hit areas.
6. Settings tabs: `tablist/tab/tabpanel`, arrow keys, no longer clipped (27.8→50.5px row).
7. Discoverability: `여기에 놓기` drop label, date token button, parse hint on focus.
8. P2: ≤2-word empty states, short toasts, help paragraphs → phrase + ⓘ, custom-day default `--c3`, unused tokens removed, `--fs` fallback 14, wallpaper alphas match the app.
9. Input focus: 2px dashed underline + `--focus-tint`.

**v9 (UI/UX review round)** — Opus review findings applied: color-coded categories + status glyphs; stronger today (frame, tinted cell, header, past-day dimming); hover/focus states; keyboard grid + modal focus trap; `--faint` 42→52%, holiday text `#f0661a`; fixed broken `# @ !` buttons; done items no longer show the cream 높음 badge; narrow-screen urgent pill; wallpaper shows tag dots, ✓ for done. (Open items from v9 — detail overlay, overdue on the calendar — closed in v10.)

**v8**
1. **Separators** — introduced the two-tier system; major sections now 2px `--strong` stitches, hairline raised to 26% for legibility.
2. **Hierarchy & visibility** — done items: `--muted` + thick strike + `✓` (was `--faint`, hard to read). Today: outline ring + `TODAY` (was cream fill, identical to urgent pill / adjacent items). Selected controls: Bark fill + border. Out-of-month dimming raised.
3. **Less wording** — short placeholders, `# @ !` token buttons, `ⓘ` tooltips for quick-add, importance, document links, day modal and settings help; hints empty until typing.

**v7** — ORYZO restyle, slim rail, photos removed.
