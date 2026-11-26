# MY CALENDAR — Design System

> 은은한 빛이 도는 따뜻한 암실 위의 평일(월–금) 달력. 구조는 실선 헤어라인과 면(elevation)이 만들고, 점선은 그리드 바깥 "스티치" 하나와 잠깐의 상태(끌기·선택·포커스)에만 남는다.
> Base: ORYZO AI style reference (warm-dark editorial) → adapted for a dense, daily-use tool.

**Theme:** dark only (`color-scheme: dark`) · **Target:** Windows 11 / Chrome, offline intranet · **Deliverable:** one self-contained HTML (+ wallpaper PNG)

---

## 1. Principles

1. **Hierarchy before decoration.** Every filled/outlined/dimmed treatment means exactly one thing (see §3). Never reuse a treatment for a second meaning.
2. **Structure = solid hairlines + fills.** Inner lines are 1px solid hairlines, panels are separated by elevation (fill), not lines (§4). The **only** dashed structural element is the grid's 2px outer stitch; otherwise dashes are reserved for transient states (drop target, selection, drag ghost, keyboard focus) and for the 참고-weight token shapes.
3. **Say less in the UI.** Placeholders are short; explanations live behind an info icon (§7).
4. **Warm, never pure — and not too bright.** Text `#e8d9c5` on walnut `#1a140f` (≈13.2:1; the old 17.3:1 cream-on-black caused halation). No `#fff` / `#000`. A soft ambient light sits behind everything (§2.1).
5. **Ember is rare.** The ember family (`--ember`, `--hol-fg`, `--over`) is for holidays, overdue (`D+n`) and errors only — never buttons, selection, links or the today marker.
6. **Today is cool.** `--now` slate blue is the only cool hue and means "now" — nothing else may use it.

## 2. Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#1a140f` | Canvas, elevation 0 (warm near-black) |
| `--raise` | `#211a14` | **Elevation 1**: drawers (filter, detail), modals, sticky table heads |
| `--glass` | fg 4% over *transparent* (≈ `#211a14` on bg) | Elevation 1, translucent: grid & week-timetable surface, empty state (the ambient light shows through). Rail uses fg 3% |
| `--hover` | `#2a211a` | **Elevation 2**: hover fill (cells, rows, nav items, picker) |
| `--surface` | `#3d3025` | **Elevation 3**: selected / pressed fill (picker month, nav active, `.sbtn.on`, segments), tooltips, toast |
| `--fg` | `#e8d9c5` | Primary text (≈13.2:1 on bg), active borders |
| `--now` | `#8ebbd8` | **Today only**: top bar of today's cell, today's day number, today's weekday header, `오늘` button text, current month in the rail picker, active nav bar |
| `--ember` | `#dc5000` | Ember (decorative borders, errors). Never buttons |
| `--hol-fg` | `#ec7a3c` | Holiday text |
| `--over` | `#f0661a` | Overdue text (`D+n`, 지연) |
| `--hol-bg` | `#2a1b12` | Holiday cell fill |
| `--muted` | fg 70% on bg | Secondary text, done items, out-of-month chips |
| `--faint` | fg 54% on bg | Tertiary: hints, past day numbers, disabled months, nav icons. **Not for item text** |
| `--strong` | fg 50% on bg | Strike-through, out-of-month day numbers |
| `--line` | fg 13% on bg | **Hairline**: 1px solid inner lines (cells, list rows, panel headers) |
| `--frame` | fg 24% on bg | **Frame**: 1px solid outer containers (modal, mini grids, banners, token buttons) and the grid's dashed stitch |
| `--today-bg` | `transparent` | Today cell tint (user-adjustable; default none) |
| `--high-bg` / `--high-fg` | `#e3cfb3` / `--bg` | Urgent pill (one step below fg so it is no longer the brightest block) |
| `--shadow` | `#000` | Shadow color of floating surfaces, mixed in at use: drawers 35%, modals 45% (v17; was hardcoded `rgb(0 0 0/…)`) |
| `--scrim` | `--bg` 84% over transparent | Modal backdrop (`.ov`); follows a custom 배경 (v17) |
| `--focus-tint` | `--surface` 35% on bg | Focused input background |
| `--out` | `--surface` 30% on bg | (legacy) subtle row fill |
| `--chip-h` | `--surface` 78% + fg | Primary button hover |

When the user picks a custom 배경 (`S.style.bg`, presets), `applyStyle()` re-derives `--raise` (fg 4%) and `--hover` (fg 8%) from it so the elevation steps stay in the preset's hue.

### 2.1 Ambient light (`--amb`)

The canvas is not flat: `body{background:var(--amb),var(--bg);background-attachment:fixed}` where `--amb` =
1. a 160px SVG `feTurbulence` noise tile at 2.5% white (dither, prevents banding in the 8-bit gradients),
2. a warm glow top-left — `radial-gradient(ellipse 80% 75% at 6% -10%, rgb(243 201 139/.05), …/.024 45%, transparent 78%)`,
3. a cool counter-glow bottom-right — `radial-gradient(ellipse 65% 60% at 100% 104%, rgb(142 187 216/.05), …/.018 45%, transparent 75%)`.

Surfaces are translucent (`--glass`) so the light reads as *behind* the calendar; cells stay legible. Sticky bars (`.qa`, `.actbar`) paint the same fixed `--amb` so they never show a seam. Floating panels/modals are opaque `--raise`. Worst-case fg contrast over the brightest glow + rail glass ≈ 11.0:1 (8×8-px block average, 1440×900). The 배경화면 feature is a PNG *export* (not an in-app background), so the glow is always the in-app default; a custom 배경 color keeps the glow on top of it.

Removed in v10 (were unused): `--chip`, `--accent`, `--accent-soft`, `--ok`, `--win`, `--warn` (use `--ember`). The modal scrim (`--scrim`) is `--bg` at 84%, never pure black.

### Category colors (the only chroma besides holidays)

Each dimension uses its own channel: **priority = fill/weight**, **status = glyph** (○ 할 일 · ◐ 진행 중 · ✓ 완료+strike), **category = chip area**: a 12% tint of the tag color + a 2px left bar in the tag color (+ the 9px dot; 11px ring on urgent pills). Max **4 hues + neutral**, equalized in lightness; distinct under deuteranopia/protanopia/tritanopia.

| Token | Hex | Name |
|---|---|---|
| `--c1` | `#9cc48a` | 세이지 |
| `--c2` | `#dcb75e` | 머스터드 |
| `--c3` | `#b9a6ea` | 라일락 |
| `--c4` | `#e59bb2` | 로즈 |
| `--c0` | `#c9b79f` | 샌드 (no tag) |

**Tag color assignment (v16).** The old name hash (`hue(t)%4`) sent 8 of 10 common Korean tags to 세이지. Now: the first time a tag is seen (`assignTags()`, run on load and in every `save()`, items in due-date order), it gets the **least-used of c1–c4 among tags currently in use (ties → lowest index)**, and the choice is persisted in `S.tagAuto` (normalized on load; travels with the JSON backup; renamed/deleted with the tag). A user-chosen color (`S.tagColors`, set by clicking the dot in the filter drawer or in Settings › 태그) always wins and counts toward "used"; "자동으로" removes it and falls back to the stored auto color. 8 tags → each hue twice. Color is never the only cue: tag text, status glyph and priority pill carry the same information. The wallpaper draws the same hexes.

**Tag weight (value, not kind).** Hue says *which* tag; weight says *how much it matters*. Palette stays at 4 hues + neutral (more hues would fail the deuteranopia/tritanopia distinctness and AA rules); the extra dimension is shape:

| Weight | Treatment (chips) | Cell dot | Default for names containing |
|---|---|---|---|
| 강조 | 26% tag-color fill + solid full-color outline + bold | filled dot with a 1.5px ring | 제출 마감 보고 본부 긴급 중요 필수 결재 감사 기한 독촉 승인 필독 |
| 보통 | outline only (62% tag color) | filled dot | everything else |
| 참고 | dashed outline, `--muted` text | hollow dot | 참고 참조 메모 공유 공지 안내 열람 |

Weights are inferred from the keyword lists (Settings › 태그 › 자동 기준 말, `S.kw`) and overridden per tag (`S.tagWeights`; filter drawer pill cycles 강조→보통→참고, Settings shows 자동 vs 직접 지정 with a reset). Inside the input mirror the bold is dropped (caret alignment) — fill + solid outline carry it. Cell dots come from `tagDot(item)` (primary tag = first strong, else first non-reference).

Custom date colors and user presets (월넛·그래파이트·포레스트·미드나이트) override these via `STYLE_VARS`.

## 3. Visibility hierarchy (item & date states)

Rule: **solid cream fill is reserved for "urgent" only.** Everything else uses outline, text weight or dimming.

| Level | State | Treatment |
|---|---|---|
| 1 | **Urgent** (중요도 높음, not done) | `--high-bg` (`#e3cfb3`) pill, dark text, `!` prefix. Always shown in the cell. Urgent **range bars** are *not* filled: fg 16% fill + 1px fg outline (3px end cap) |
| 2 | **Active** | Cream text, tag dot |
| 3 | **Done** | `--muted` text + 1.5px `--strong` strike-through + `✓` prefix (the ✓ is not struck) |
| 4 | **Out-of-month** | Day number `--strong`; chips/“+N개 더” `--muted`. An urgent pill keeps its `--high-bg`/`--high-fg` colors and is dimmed with `opacity:.72` (text ≈6.7:1 on the pill; v17 — `--muted` text on the cream pill was 1.7:1). Urgent range bars keep `--fg` text (≈8.8:1) |

Date markers (never a cream fill, so they can't be confused with urgent pills):

- **Today** — **one signal**: a 3px `--now` bar on the top edge of the cell (`.cell.tnow{box-shadow:inset 0 3px 0 var(--now)}`, also on holiday-today), plus the day number in `--now` weight 600 (no ring, no box). No frame, no `TODAY` word, no tint, no dashed underline; the weekday header (e.g. THU 목) is `--now` 600. Same in the attendance month grid, the week timetable header (`.wh.tdy`), the composer mini calendar (2px bar) and the all-months modal. Past days only dim the **day number** (`--faint`); their chips and range bars stay at full opacity.
- **Holiday** — ember day number + ember label + `--hol-bg` cell.
- **Custom day** — user color label (optional full-cell tint). New days default to `--c3`.
- **Special class** (출석 달력 특별 수업) — per-subject user color (defaults: 직업기초·훈련지원 `#a3c47a`, 보건·소방재난예방·노동인권 `#e6c95c`, 사회성훈련 `#8fb8e8`, 물리&작업 `#c3a0e8`, 특수체육 `#e08fb6`; editable in settings) bold 11px label (`.sp`) in week/day cells; month cell shows each name in its color on one ellipsized line. Not a tag color.
- **Calendar-settings note** (달력 설정 · 방학/휴업일, 업무 달력) — muted small text in the weekday cell, no fill, never ember.
- **Overdue** (a *task* that is not done, due < today — `needsDone(i)`; 일정·참고 items never go overdue) — `D+n` label in `--over` beside the chip, never dimmed by `past`; `지연 D+n` badge in the day modal; hero stat `지연 N` (all months, number in `--over`). Text always accompanies the color.

**Completion model.** `needsDone(i)`: explicit `item.kind` (`task` | `event`) wins; otherwise the item's tags decide (`S.tagDone` on/off per tag, else 일정 keywords such as 회의·행사·휴가·참고 → event; no tag = task). Tasks get a real checkbox (`.cb`, `role=checkbox`, 20px + 3px hit pad) in day-modal and NEXT UP rows; events get a neutral `◇` and a 일정 badge, never `D+n`, never in the 지연 stat. Done keeps §3 level 3 (muted + strike; the checked box replaces the `✓` prefix on task rows).

Selected controls (filter row `.sbtn.on`, segmented buttons `.seg .on`) use **Bark fill + 1px cream border** (+ `✓` on segments) — a selected control must not look like an urgent item.

Minimum legibility: any item text ≥ `--muted` (≈ 66%). `--faint` is only for non-essential hints.

### Interaction states

- **Hover (day cell)**: `--hover` fill only (no outline), contents lift 2px, `+` fades in. Motion only under `prefers-reduced-motion: no-preference`.
- **Focus**: 2px dashed cream outline (transient state; inset on cells).
- **Input focus**: `2px dashed --fg` underline + `--focus-tint` (textarea: 2px dashed frame; quick-add box via `:focus-within`).
- **Keyboard**: cells are a roving-tabindex grid — arrows move day/week, Enter opens the day, PageUp/PageDown (v17: from any focus, in both calendars — not while typing in an input/textarea/select, with a modal open or with a modifier held) or Alt+←/→ change month (bare arrows never change month), Esc closes. Modals make the page `inert`, trap Tab, and restore focus on close; settings opens on its selected tab.
- **Focus restore**: re-renders restore focus by `id`/`data-*`. Opening an item focuses its title; closing the panel returns to the opener (chip / NEXT UP row), else the item's chip, else its day cell.
- **A11y**: `#nav-filter` carries `aria-expanded` (+ `aria-controls="side"`), kept in sync by a MutationObserver on `#app` whatever closes the filter drawer; the 업무/출석 switch is a `radiogroup` with roving tabindex (only the checked radio is tabbable, ←/↑/→/↓ switch the calendar and move focus to the new calendar's radio; v17). `aria-current="date"` on today, descriptive `aria-label` per cell and chip (title, 중요, status, 기한 지남), `aria-pressed` on toggles, toast is `aria-live`. ⓘ is `aria-describedby` → `<span role="tooltip">`; Esc on a focused/hovered ⓘ hides only the tooltip. Settings tabs are `tablist/tab/tabpanel` with ←/→/Home/End. Hit areas ≥ 24px (`::before{inset:-5px}` on 22px icons; checklist checkbox 18px by the spacing exception).

## 4. Separators — solid hairlines, fills, one stitch

| Tier | Style | Where |
|---|---|---|
| **Hairline** | `1px solid var(--line)` (fg 13%) | Between calendar cells (month, week timetable, day panel), list rows (`.nrow`, `.drow`, `.lk`, `.srow`, `.trow`, `.lrow`, `.trw`, `.synf`, `.atbl td`), NEXT UP top, quick-add / action-bar top, drawer & modal header/footer (`.dh`, `.dfoot`, `.mh`, `.tabs`), section headings (`.sec`) |
| **Frame** | `1px solid var(--frame)` (fg 24%), radius 10–12 | Modal border, all-months mini grids, day-panel grid, mini calendar, banners, token buttons, `+N개 더`, textarea |
| **Stitch** | `2px dashed var(--frame)`, radius 10 | **Only** the main calendar grid's outer border (`.grid`, both calendars) and the attendance week timetable (`.wk`) — the one dashed structural element ("테두리만 점선") |
| **Fill** | elevation steps (§2) | Rail (glass), drawers/modals (`--raise` + soft shadow), hover, selected. Panels are separated by fill, not lines |

Dashes otherwise appear only in transient states: drop target (`.cdrop`, `.drop` + `여기에 놓기` pill), range selection (`.rsel`), selected chip/bar (`.sel`), drag ghost (`.cghost`), keyboard focus / input focus, invalid input — and in the token shape language of §6 (참고 weight, other assignees, far dates). Measured at rest (1440×900, both calendars): the only dashed length on screen is the grid stitch (≈3,550px; was ≈17,300px). The wallpaper keeps its own hairline grid + dashed frame.

## 5. Typography

- Stack: `Pretendard, Malgun Gothic, 맑은 고딕, Apple SD Gothic Neo, Noto Sans KR, system-ui` (no web fonts — offline).
- Body weight **400**. 500 for titles and day numbers (`.mtitle`, `h2`/`h3`, `.dnum`, stat numbers, brand); 600 for emphasis (today number, selected month, bold tag weight, `!`). No 700.
- Latin/Korean micro-labels (`MON`, `NEXT UP`, `FILTER`, rail eyebrows) ≥ 12px, uppercase where Latin, tracking 0.1em (was 0.14–0.18em at 10–11px).
- Korean content stays sentence-case (uppercase doesn't exist; don't fake it).
- Month title: uppercase English, ~92px (wallpaper) / hero (app). Day numbers 20px tabular. Body 14px (`--fs`, user-adjustable).
- Left-aligned text throughout.

## 6. Components

- **Rail** (grid column 176px; the rail's glass fill bleeds to the page's left edge: `margin-left:-28px`, padding `30px 16px 22px 28px` → 160px content). Top → bottom: brand (13px, .12em, 500) · 업무/출석 switch · **year month-picker** · nav list · bottom nav (`margin-top:auto`). No right border — the fill is the edge (plus a 1px fg-6% inset shadow).
- **Month picker** (`window.MonthPicker(el,{months,sel,go,dot,dotLabel})`, one renderer shared by both calendars): header row 28px high — `‹` 28×28 icon button (radius 8, 14px chevron) · year label 13px/600 tabular · `›`; steps only between years that have months in range (disabled at the ends). Below, a 4×3 grid (`gap:4px`, cells ≈37×32px, radius 8) of `1월`…`12월` at 12px. States: enabled `--fg`; **selected** (shown month) `--surface` fill + weight 600 + `aria-current="true"`; **this month** `--now` text (both when selected); **out of range** (업무 before 2026-11, 출석 before 2026-12, after 2028-01) `disabled` + `--faint` at 55% opacity, not focusable; hover `--hover`. A 4px dot (`currentColor` 50%, 3px from the bottom) = density hint: work calendar → open (not done) items due that month; attendance → an active 방학·휴업일 (`KR_FIXED`) touches the month. The stepper year follows the shown month whenever it changes (‹ › in the hero, PgUp/PgDn, Alt+←/→, 오늘, clicking a month, week navigation in 주 시간표). Keyboard: the grid is one Tab stop (roving `tabindex`), ←/→ move between enabled months and roll over to the previous/next year, ↑/↓ move by a row, Home/End, PgUp/PgDn step the year, Enter/Space opens (focus stays on the month).
- **Nav list** (`nav.tools`): eyebrows 12px/.1em `--faint` (업무: `보기`; 출석: `관리`, `기록`), rows full-width, `min-height:34px`, padding `7px 10px`, radius 8, gap 10px, 16px stroke icon (`--faint`) + 13px label (`--muted`, .02em). Hover `--hover` fill + fg. Active (filter drawer open, `.tool.on`) `--surface` fill + fg + `--now` icon + a 2px `--now` bar at the left (top/bottom inset 8px). Order — 업무: 필터 · 다가오는 마감 · 전체보기 │ bottom: 배경화면 · 설정. 출석: 학생부 · 외부강사 · 수업일 설정 · 출결 분석 · 엑셀 내보내기 │ bottom: 백업. Icons (sprite): `i-filter`, `i-clock`, `i-expand`, `i-img`, `i-gear`, `i-users`, `i-user`, `i-calchk`, `i-chart`, `i-table`, `i-archive`.
- **Rail ≤900px**: a top bar (glass fill, full bleed), picker and eyebrows hidden, nav items in one wrapping row without icons (padding 6px 7px); months via ‹ › in the hero.
- **Hero** (one compact band): `‹ NOVEMBER › [오늘]` on the left (the month arrows sit beside the title they change; aria-labels and PgUp/PgDn · Alt+←/→ unchanged), a sub line under it (`2026 · 11월` · today link · filter / 예시 notices inline, no separate banner), and stats + underline search on the right. No eyebrow. Same structure in the attendance calendar. At `max-height:780px` the title/padding shrink further.
- **Grid**: 5 columns, outer stitch frame, hairline inner lines. `fitGrid()` sizes the grid to the viewport above quick-add (min 84px/row) and rows are equal (`1fr`), so the whole month shows without page scroll at 1280×720 and up; cells clip. `fitChips()` then shows as many chips as the cell height allows (urgent/active first, never fewer than one) plus `+N개 더`; settings can cap it (`previewCap`, 0 = auto). ≤640px keeps page scroll and a 3-chip cap. No forced scroll on load (only if today is off-screen). NEXT UP sits below the fold (rail `다가오는 마감` scrolls to it); quick-add stays sticky at the bottom. Cell = day number row (`.ch`) + notes + chips + "+N개 더". Urgent pills use the full cell width (`!` directly before the title; the ◐ status glyph takes the pill's text color).
- **Date-range bars** (items with `start < due`): drawn per week row as horizontal bars across the weekday cells, in lanes at the top of the chip area (`.rl` > `.rb`, one segment per cell; the same lane number sits at the same y in every cell of a week, and weekends are skipped). The title sits on the first segment of each week and overflows across the following segments (earlier columns have a higher z-index; cells clip vertically only, `clip-path:inset(0 -100vw)`). `◂`/`▸` mark continuation across weeks, the due end has a 3px tag-colored end cap, and an overdue range shows `D+n` at its end. Styling follows chips: tag color fill (26%) + outline; urgent = fg 16% fill + 1px fg outline with `!` (no cream fill); done = muted solid `--frame` outline + strike + `✓`; doing = `◐`. `fitChips()` first picks, per week, how many lanes fit while still leaving one normal chip in every cell (min 1 lane); hidden bars are counted in the cell's `+N개 더`. Range items are no longer chips on their due day. The first segment is a focusable button (`aria-label` carries `기간 M/D~M/D`); the day modal lists ranges covering that day with `기간 M/D~M/D`; the all-months modal and the wallpaper (max 2 lanes) draw them too.
- **Chip density**: `D+n` sits inside the chip at its right edge (inside the urgent pill after a hairline), the attachment is a small clip glyph in the chip (hidden when overdue) and the real clip button appears only on hover/focus (always on touch), so the title keeps the cell width.
- **Completion checkbox** (`needsDone(item)`; `kind:'event'` has none): tasks show a 14px tag-colored box (26px hit area, `role=checkbox`, half-filled = 진행 중, `aria-checked=mixed`) in place of the tag dot; click toggles done/todo without opening the item. Hidden at ≤640px.
- **Range drag**: press on an empty part of a day cell and drag (mouse/pen) across days or weeks; selected cells get Bark fill + dashed cream outline; release opens the composer via `composeRange(start,due)`. Keyboard: Shift+arrows extend, Enter opens the composer, Esc cancels. A plain click still opens the day modal.
- **Buttons**: ghost pill (1px cream border, 22px radius) default; filled `--surface` only for selected state. The hero `오늘` button uses `--now` text and a `--now` 55% border. Radii: 12 modals, 10 grids/panels/banners, 8 nav rows/picker/textarea, 999 pills, 0 underline inputs.
- **Inputs**: underline only (1px cream). Focus → dashed underline.
- **Drawers**: filter (left of content, next to rail) and item detail (right, Slack-like). `--raise` fill + soft shadow, no edge line; filter rows (`.sbtn`) are 8px-radius rows with `--hover` hover and `--surface` + 2px `--now` inset bar when on. At ≥1280px the detail panel is a third grid column (`clamp(340px,24vw,440px)`) so the calendar reflows instead of being covered; below that it overlays.
- **Modals**: day / all-months / settings (tabs). `--raise` fill, 1px `--frame` border, radius 12, soft shadow; tabs underline the active tab with 2px solid fg.
- **Settings › 달력 설정 (editable 방학·휴업일, shared by both calendars)**: one user list stored under `fixed-sched-v1` (`window.KR_FIXED`, live array edited in place; `window.KR_FX` = `html/click/edit/imp/list`). Defaults come from `FX_DEF` (table in `FIXED-2027.md`: 동계 방학 (26–27) 2026-12-21–2027-01-08 · 하계 방학 2027-07-19–08-20 · 동계 방학 (27–28) 2027-12-20–2028-01-14 · 공단 창립기념일 2027-09-01 — the years in the two 동계 names keep them apart in the list; only the *defaults* carry them, a user's saved names are never rewritten). Same tab in the attendance calendar under 수업일 설정. UI: an **add form** (이름 · 종류 방학/휴업일 · 시작 · 끝, end empty = one day, max 50) above a **list** where each row has an on/off checkbox, editable 이름, 종류 select, 시작/끝 date inputs (limited to 2026.11–2028.01), `평일 N일`, and a two-step 삭제 (`삭제` → `삭제 확인`/취소); a **기본값** block restores `FX_DEF` with the same two-step confirm. Edits apply on change and re-render both calendars (`fxSubs`). Rules: 끝 before 시작 is refused; an invalid/out-of-range date reverts the field with an inline message; **moving 시작 past 끝 shifts 끝 by the same length** (clamped to the range end) instead of failing. Effects: attendance — no class for all 직종 on weekdays inside an enabled item (holiday wins; 방학 and 휴업일 map to the `vac`/`closed` kinds); 업무 — a small muted note in the weekday cell (weekdays only). The list travels with both JSON backups as `fixed`; import accepts the legacy per-calendar `disabledFixed` list too (`fxImport`), and the same legacy list is migrated once on first load (v14's `disabledFixed` no longer exists as live state).
- **Quick-add on phones (≤640px, v17)**: the row wraps — the input takes its own full line (min 200px; 306px at 390, 276px at 360) and the `# @ ! 📅 ⓘ ⤢` buttons plus send sit on a second line (send pushed right). Before, seven fixed-width buttons squeezed the input to ~5px.
- **Token buttons** `# @ !` + calendar icon (+ `⤢` 자세히 + send): 28px solid `--frame`-outline circles that insert syntax into the quick-add field. The date token inserts the next weekday as `/MM-DD` and advances one weekday per click (a range is typed by hand: `/11-12~12-25`).
- **Token highlight (`.qin` + `.mir`)**: the quick-add and day-modal inputs have transparent text over a same-font mirror layer (same box, padding and font; tokens get no horizontal padding or weight change, so the caret never drifts). Kind is told by the prefix (`#` `@` `!` `/`), value by shape: tag by weight (see §2), assignee `@나` = Bark fill + solid outline, others dashed; priority high = the urgent cream pill (bare `!` counts, see §7) / low = muted dashed; date by proximity to today — overdue `--over` dashed (hint chip adds `D+n`), today/tomorrow/in-range Bark + cream outline (+ `오늘`/`내일`/`진행`), within 7 days solid stitch, later muted dashed; invalid date = `--over` dashed + wavy underline. The `!` token button toggles high (inserts `! ` at the start, `aria-pressed` + Bark when on). The hint line (`#qa-hint`) shows the same kinds as chips (`.hc`), plus dashed suggestion chips for existing `#`/`@` words while typing one.
- **Composer (modal `compose`)**: 항목 추가 popup for details. Opens by dropping files on the quick-add bar, the `⤢` button, or Shift+Enter in the bar (typed text is parsed into fields). Fields: title, 시작일/기한 (+ an inline Mon–Fri month calendar: drag a range, click = one day, Shift+click extends, arrows/Space/Enter/Shift+arrows/PageUp·Down by keyboard; kept in sync with the date fields), tag chips (+ suggestions), assignee chips, 중요도 segmented, 완료 체크 segmented (자동 · 필요 · 일정·참고), memo, document links. Entry point `openComposer({title,start,due,tags,who,pr,kind,memo,links,text})`. The detail panel uses the same chip editor (`edHTML('d',…)`): space becomes `_`, Enter/comma commits, Backspace on empty removes the last chip, × removes, focus-out commits. Enter in title or Ctrl+Enter saves, Esc cancels (bar text is kept). Several files become one item with all links; `파일별로` saves one item per file.
- **Drop targets**: while dragging a file, the cell / detail panel / day modal / quick-add bar / composer under the pointer shows a centered `여기에 놓기` pill (bg fill, 1px dashed cream).
- **Info icon `.ti`**: 22px circle `ⓘ` (32px hit area); hover/focus shows a Bark tooltip (`white-space: pre-line`, 12.5px) rendered as a real `role=tooltip` element. v17: the hidden tooltip is `display:none` (an invisible-but-laid-out absolute box widened the page and made a horizontal scrollbar at 901–1114px; `aria-describedby` still resolves), and `placeTip()` flips it to the other side (`.fl`) on mouseover/focus when it would leave the viewport. `.r` variant anchors right to avoid clipping at panel/modal edges.

## 7. Text-input & copy rules (anti-wordiness)

1. **Placeholder = a noun, ≤ 4 words.** `항목 추가` · `검색` · `메모` · `하위 항목` · `경로 또는 링크`.
2. **Syntax is taught by icons, not sentences.** Quick-add shows `#` `@` `!` token buttons and one `ⓘ`. Dates: `/11-20`, `/11-12~12-25`, `/2026-11-12` (year omitted = this year, but before the calendar range = next year; end before start = error); older `11/20 · 20일 · 내일` still work.
3. **Details go in the tooltip**, one idea per line (date formats, #/@/!, document paste/drag, preview-page limitation).
4. **Hint line under quick-add appears on focus** with the default target (`→ 11월 13일 (금) · @나`), then shows only the parse result as chips while typing (`→ [11/20(금)] [#보고] [@나] [중요도 높음]`); empty again on blur.
5. **Syntax is configurable, `#` `@` are not.** Settings › 입력 sets the date symbol (default `/`), priority symbol (`!`), high/low/normal words, accepted date formats (연-월-일, 월-일, 월 일, 일, 오늘·내일·모레, 요일 after the symbol: `/금`, `/다음주금`) and the date display format. Symbols are one character, may not be `#`/`@`, letters/digits/`~ . - _ ,`, or equal each other; invalid input shows an inline error and is not applied. Tags/assignees end at whitespace — use `_` for several words (`#본부_제출`); typing a space in a chip input inserts `_`.
5b. **Bare `!` = high.** A standalone `!`/`!!` anywhere, or a `!` glued to the very start (`!교육 증명서`, the `!` is stripped), means high; `!높음 !중요 !high !낮음 !low !보통` keep working; `와!` mid-title stays text.
6. **Empty states ≤ 2 words** (`항목 없음`, `마감 없음`, `분류 없음 ⓘ`). Banners one line (`예시 15개  지우기`). Toasts are one short clause (`경로 복사됨 · Win+R에 붙여넣기`).
7. Settings `p.help` ≤ one short phrase + `ⓘ` when more is needed. No paragraph-length helper text in the main flow.

## 8. Ember rules

Ember family = `--ember` (borders, errors), `--hol-fg` (holiday text) and `--over` (overdue). Allowed: holiday date/label, holiday badge border, overdue `D+n` / 지연, error hints. Not allowed: buttons, selected states, links, today marker.

## 9. Wallpaper (canvas PNG, default 1920×1080)

The PNG is drawn by `drawWallpaper()` with **its own palette** — it deliberately does not mirror the app tokens one-to-one, so the numbers below are the wallpaper's, not `--line`/`--muted`/`--strong`:

- **Canvas** `#100904` by default (a notch darker than the app's `--bg #1a140f`, so the image sits back behind desktop icons; user-selectable in Settings › 배경화면, not tied to the theme). Ink `#ffedd7` (`#1d1c1f` on a light canvas), `mute` = ink 66%, hairline = ink 26%.
- Uppercase English month; `MON–FRI` header; hairline dashed grid (ink 26%) + 2px dashed outer frame (ink 55%); out-of-month days drawn at 58% opacity; today is **not** marked (static image); holiday / custom-off cells tinted at 16% of their color (default `#f0661a`); placement right/center/full to clear desktop icons; bottom 10% reserved for the taskbar.
- **Urgent items**: cream pill (`ink` fill, canvas-colored text, `!` prefix). **Urgent range bars follow the app's v16 outline style** (v17): ink 16% fill + 1px ink border + 3px ink end cap, ink text — no cream fill.
- **Done**: `mute` text + strike + `✓`; done range bars are hollow with a *solid* 1px hairline outline (no dashes, as in the app) and a `mute` end cap.
- **Normal range bars**: tag color at 30% fill + 3px end cap (wallpaper-specific). Tag dots read `--c0…c4` at draw time; fallbacks (`WPC_FALLBACK`) equal the current token values; an item with no tag gets `--c0` like in the app.

## 10. Do / Don't

**Do** — keep one filled thing per meaning; mark today with the single `--now` bar; separate panels by fill; use `✓` + strike together for done; put help behind `ⓘ`.
**Don't** — fill the date and the urgent item with the same cream; stack several today signals; dim item text below `--muted`; add dashed structural lines (only the grid stitch); use `--now` for anything but "now"; write sentences in placeholders; use ember on interactive controls.

## 11. Deviations from the ORYZO reference

- System Korean font stack instead of Halyard Display (offline, no installs).
- A slim left rail is allowed (reference: no sidebar) — user-approved; since v16 it holds a compact year month-picker and an icon nav list.
- Korean labels; Latin uppercase only for micro-labels.
- v16 replaced the all-dashed stitch system with solid hairlines + elevation fills (eye-strain review: shimmer from ~17,300px of dashes); one 2px dashed stitch remains on the grid as the brand's signature.
- Photos were tried and removed (not part of the system).

## 12. Attendance calendar (출석 달력)

Same file, same tokens; a second module (`#att`, 2nd `<script>`) with its own storage key `attend-cal-v1`. The rail's **업무 / 출석** radio pair switches modes (remembered in `cal-mode`; `?mode=att` opens it directly). Admin handlers return early while `body[data-mode=att]`.

**Range** 2026.12 – 2028.01 (the 업무 calendar runs 2026.11 – 2028.01). Legal holidays live once in `window.KR_HOLIDAYS`; each calendar keeps its own on/off list.

**Rules**
- 훈련소정일수 = weekday, not a holiday, not covered by a "수업 없음" 특이사항, within the student's 입학–수료 dates. 6 periods/day (45 min, lunch 12–13), editable times.
- 특이사항 = {from, to?, kind, name, track | all, periods[] | whole day}. Kinds are user-managed; `noClass` decides whether they remove class days/periods (방학·개별학습·자체 휴업일 on, 행사·특강 off).
- Attendance is recorded **per day** (default 출석, no row stored). 지각·조퇴·결과 store the missed periods. If attended periods < 50% of that day's periods the app does **not** convert it: an alertdialog (`#apop`) asks 무단결석으로 / 유고결석으로 / 그대로 두기 (Esc = 그대로). A kept day shows a `--c2` "⚠ 50% 미만 · 처리하기" line in the day modal, ⚠ on the calendar badge, and counts in `low` (50%↓ column).
- 지각+조퇴+결과 (non-converted) 3 → 결석 1일, computed **per calendar month**, summed for longer ranges.
- 단위기간 = the calendar month, from the later of 입학일 and the day after 타 국비 종료일 (`govEnd`). Days before it are still recorded but are left out of 소정일 and the rate. 방학 and other 수업 없음 days are already left out of 소정일.
- 출석인정일수 = 소정일 − 결석 계, where 결석 계 = 무단 + 환산 (지각·조퇴·결과 3회 = 1일, per month). 유고결석 counts as attended. 실출석일수 = 소정일 − (유고 + 무단): 지각·조퇴·결과 days count, even when converted. 출석률 = 출석인정일수 ÷ 소정일. Rates < 80% (`RATE_MIN`) use `--c4`.
- 80% 판정 (`unitRisk`, per month): 남은 날은 출석으로 가정 → 최대 출석률, 허용 결석 = 출석인정 − ceil(소정 × 0.8). 미달 (`--c4`) = 끝난 달 < 80% or 남은 날 다 나와도 < 80%; 위험 (`--c2`) = 결석 1–2일 더 → 미달. Shown as a hero stat (opens 출결 분석 for that month), a table at the top of 출결 분석, a badge in the day modal, and 80% 판정 + 0원 in 수당 기초자료.
- 통학/기숙 per day: `commute` = status at 입학, `moves` = [{d, t:'C'|'D'}] changes (legacy `dorm` → a D move). `cd` = 통학 실출석일 (교통비), `dd` = 기숙 실출석일, cd + dd = 실출석.
- **훈련수당** (`payStu`, per month) = 훈련참여수당 + 교통비, not computed for 취성패 (rate still shown). Rate < 80% → 훈련참여수당 0; 교통비 is paid regardless (통학 실출석 × fare, max `fareCap` 50,000 per 단위기간). 단위기간 (`unitInfo`) = first–last class day the student attends that month; partial if 방학 (kind `vac` or name contains 방학, incl. fixed schedule), 입학, 수료 or 타 국비 cuts in → 일할 = min(cap, 실출석 × day), else 정액. Per-student-month override `A.unitType['YYYY-MM|sid']` = full/pro. Amounts `A.pay` {full 200000, day 10000, cap 200000, fare 2500, fareCap 50000} editable in 수당 금액. Ongoing months: counts to today, money = projection (남은 날 출석).
- **학생별 view** (`au.view='stu'`): summary strip (명·미달·위험·지급·합계) + one row per student (판정, 단위기간, 소정/인정/실출석 to date, rate bar with 80% tick + 최대, 유고·무단·지·조·결·환산, 방식, money). Name opens the **student card** (`mStu`): 재적 dates, 통학·기숙 change list, per-month table with 방식 select.
- Dates outside the attendance range (before `AMIN` 2026-12-01 or after `AMAX` 2028-01-31 — e.g. the 11/30 spill-over cell/column of December 2026, 2028-02-01…) are *outside* (v17): `sched()` returns `oor` with no class periods, so they are dimmed (`.cell.oor`, `.wh.oor`, `.pc.oor`), have no `수업 N교시` label, are not clickable/selectable (week-timetable period cells are `disabled`; drag/row/column selection skips them) and never count in stats, hours or exports.
- Imported backups are validated (`normA`): ids `[A-Za-z0-9_-]`, dates `YYYY-MM-DD`, periods 1–6, hex colors; references to missing tracks/students are dropped; non-array fields become empty lists and duplicate ids are dropped. The work-calendar `normalize()` does the same (v17): `tags`/`assignees` string → `[string]`, anything else → `[]`; checklist/links entries are coerced; items without an id, a title or a valid `YYYY-MM-DD` due are dropped; user-keyed maps (`tagColors`, `tagAuto`, `tagWeights`, `tagDone`) are prototype-less (`Object.create(null)`) so tags named `constructor`, `valueOf`, `toString` or `__proto__` behave like any other name.
- Analysis and export count only up to today by default ("오늘까지만"), so future default-출석 days don't inflate rates. Lecturer hours include planned periods.

**Views** month (per 직종 or 전체) · 주 시간표 (drag a rectangle of period cells, Ctrl+click to add; action bar assigns/clears 외부강사 or 특이사항) · day modal (period grid with the same drag selection + per-student status pills).

**Colors** absence badges `--c4`, partial `--c2`, "출석 n" dot `--c1`; class-less cells/periods are *darker* than the glass (bg 45% over the surface); holidays keep the ember rule. Special-class subject colors (`A.subjects[].color`) are user data and are never overridden by the theme. Selected period cell = Bark fill + 1px cream outline (same as other selected controls).

**xlsx** written in-page (STORE zip + SpreadsheetML, inline strings, fixed style table) — no library, works offline. Sheets: 일별 교시 출결표 (per month, lecturer row per 직종), 일별 요약, 월별 통계, 누적 통계, 월별 출석률, 외부강사 달력 (per month + 강사별 시수), 강사 월별 시수, 수당 기초자료, 학생부·강사 명단·수업일 명부. Verify with `node tools/verify-attendance.js <dir>`, `node tools/verify-attendance-fixes.js` and `node tools/verify-attendance-rate.js` (rates, 훈련수당, popup).

## 13. TODO

- **라이트 테마 (light blue-grey) — 추후.** Not in v16. Starting point = the review's "paper" preset tokens, but the user wants a **light blue-grey** direction rather than warm paper: bg ≈ `#eef1f5`, surfaces cool grey (raise ≈ `#e4e8ee`, hover ≈ `#dbe0e7`, surface ≈ `#cfd6df`), fg ≈ `#1f2630`, `--now` deeper blue ≈ `#2f6690`; line/frame as fg 13%/24% mixes; category hues re-tuned for ≥4.5:1 on the light bg; ambient light becomes a faint cool sky glow; holiday ember darkened for AA. Ship as a `[data-theme=light]` / preset, keep `color-scheme` in sync.

## 14. Changelog

**v19 (훈련수당 계산)** — 50% 미만 auto-결석 replaced by a confirm popup; 실출석 keeps 지각·조퇴·결과 days; 학생별 view + student card; 훈련참여수당 정액/일할 + 교통비 calculator with 80% gate; 통학·기숙 change history; xlsx sheet 훈련수당 계산.

**v18 (출석률 기준)** — 유고결석 = 출석 인정; 출석인정일수·실출석일수 split; 학생별 타 국비 종료일 (단위기간 시작); 80% 미달·위험 판정 in hero, 출결 분석, day modal and xlsx.

**v17 (audit fix batch · 업무 달력 rename)**
1. **Rename:** the two calendars are **업무 달력** and **출석 달력** (was 행정 / 출석). The rail switch reads `업무 / 출석`; every UI string, toast, tooltip and doc says 업무. Internal ids are unchanged (`data-mode="admin"`, stored `cal-mode`, `#app`). Tag names such as `행정` in user data/sample data are not touched.
2. **Phones:** quick-add wraps at ≤640px — input on its own line (≥200px at 390/360), buttons below (§6).
3. **Contrast:** urgent pills in out-of-month cells keep their colors and fade with `opacity:.72` instead of getting `--muted` text (was 1.7:1); out-of-month urgent range bars keep `--fg` text.
4. **Tooltips:** hidden `.tt` is `display:none` (no phantom overflow → no horizontal scroll at 901–1114px in either calendar); shown tooltips flip sides to stay in the viewport (`.fl`).
5. **No clipped chips:** `fitChips()` may fold bars and chips down to zero (`+N개 더` only) when even one doesn't fit, instead of stopping at one and clipping ~11px at 900×700 / 1024×600.
6. **Long names:** tag/assignee chips (`.hc > .hn`), filter rows, hint chips and Settings › 태그 truncate with an ellipsis (+ `title` with the full name) and `min-width:0` parents, so 삭제 and the panel edge stay visible.
7. **Robust data:** user-keyed maps are prototype-less; tags named `constructor`/`valueOf`/`toString`/`__proto__` get colors and counts. `normalize()`/`normA()` coerce non-array fields (string → `[string]`, else `[]`) and drop items without id/title/due; ids are made safe and unique.
8. **출결 분석 before the school year:** shows `학기 시작 전 (2026.12.01부터 집계)` instead of an inverted range.
9. **PageUp/PageDown** change the month from any focus in the 업무 달력 too (same rule as 출석: not in inputs, not with a modal open, no modifier).
10. **학생부** 직종 select is as wide as the longest 직종 name (`--tw`), so `제과제빵` is no longer cut to `제과저`.
11. **Attendance range edge:** dates before 2026-12-01 / after 2028-01-31 (11/30 spill-over, week column, 2028-02-01…) are dimmed *outside* cells: no `수업 N교시`, not clickable/selectable, not counted.
12. **A11y:** `#nav-filter` `aria-expanded`; 업무/출석 switch is a roving-tabindex radiogroup with arrow keys (both calendars).
13. **Wallpaper bars** follow the app's v16 bar style (urgent = ink 16% fill + 1px ink border, done = solid hollow outline); wallpaper palette documented in §9.
14. **Copy/consistency:** attendance ‹ › titles `이전/다음 달 (PageUp/PageDown)` (`주` in 주 시간표); out-of-range toasts unified (`오늘은 달력 범위 밖이에요 (범위)` / `달력 범위 밖이에요 (범위)`); `FX_DEF` names `동계 방학 (26–27)` / `(27–28)` (defaults only); disabled month-picker stepper `.55`; principles re-ordered; ember family defined as `--ember`/`--hol-fg`/`--over`.
15. **Cleanup:** new tokens `--shadow`, `--scrim`; dead `.stat{gap:14px}`, unused icons (`i-stack`, `i-set`, `i-s`, `i-menu`, `i-save`), `curRange`, `gomonth` cases and `data-op` removed; palette fallbacks (`WPC_FALLBACK`, color-picker defaults) = current tokens; `KC`/`SJC` seeds and the legacy wallpaper migration keep their old values on purpose (commented).
Tests: `node tools/verify-audit-fixes.js` (items 2–12, each a PASS line); `verify-rail.js` now seeds with a `localStorage` marker (the old `sessionStorage` marker was lost on reload in ~1 of 4 runs).

**v16 (eye-strain overhaul · rail picker · ambient light)**
1. **Contrast & palette:** fg `#e8d9c5` on bg `#1a140f` (17.3 → ≈13.2:1), muted/faint 70/54%, elevation steps `#1a140f` / `#211a14` / `#2a211a` / `#3d3025`, equalized category hues (c1 `#9cc48a`, c2 `#dcb75e`, c3 `#b9a6ea`, c4 `#e59bb2`, c0 `#c9b79f`), holiday `#2a1b12` / `#ec7a3c`.
2. **Today = one signal:** 3px `--now` (`#8ebbd8`) top bar + `--now` day number; removed frame, ring, `TODAY` label, tint and the dashed weekday underline (both calendars, week timetable, mini calendar). Past days dim only the number. Hover = fill only.
3. **Tag colors evenly spread:** least-used assignment persisted in `S.tagAuto` (replaces the name hash); user colors (`S.tagColors`) still win. Chips carry the tag color as a 12% tint + 2px left bar (`--tc` on `.chipw`).
4. **Lines:** structure is solid (hairline `--line` 13%, frame `--frame` 24%); the grid's 2px dashed outer stitch is the only structural dash; drawers/modals/rail separate by fill. Done range bars lost their dashes.
5. **Urgent:** range bars are outlined (fg 16% fill + fg border) instead of cream-filled; pills use `--high-bg:#e3cfb3`.
6. **Type:** body 400, labels ≥12px with .1em tracking, no 700.
7. **Ambient light** (`--amb`, §2.1): warm top-left + cool bottom-right radial glows with a noise dither, fixed; rail/grid are translucent glass.
8. **Rail:** the 14–15-row month list became a shared year month-picker (`window.MonthPicker`) with roving-tabindex keyboard nav and density dots; tools became an icon nav list with eyebrows, settings/backup pinned to the bottom.
Tests: `node tools/verify-rail.js` (picker sync & range limits in both calendars, keyboard, today signal, dashed audit, tag color assignment); all earlier `tools/verify-*.js` unchanged and passing.

**v15 (chip drag)**
1. **Drag a chip or range bar to another day** (work-calendar month grid, mouse/pen; touch = long-press 400ms). Click without moving still opens the detail; checkbox is unaffected.
   - While dragging: small ghost (surface fill, dashed border, no shadow), target cell gets a dashed outline (`.cdrop`), body `cdrag` = `grabbing`. Esc, window blur or releasing outside the grid cancels with no change.
   - Move = same calendar-day delta (grabbed cell → target cell) for `start` and `due`. A landing on Sat/Sun snaps: due Sat→Fri, Sun→Mon; start Sat/Sun→Mon; start never after due. Out-of-range targets are refused.
   - Toast `N월 N일로 옮김 · 되돌리기` (6s, underline button, no color).
2. **Keyboard:** Alt+←/→ on a focused chip or bar moves it one weekday; the detail panel date fields remain the full alternative.

**v14 (fixed schedule · special classes)**
1. **2027 달력 설정 defaults** (방학·휴업일; `window.KR_FIXED`, source `FIXED-2027.md`): 동계 방학 26.12.21–27.1.8, 하계 방학 27.7.19–8.20, 동계 방학 27.12.20–28.1.14, 공단 창립기념일 27.9.1.
   - Attendance calendar: no class for all 직종 (holiday takes precedence).
   - Work calendar: muted small note in weekday cells (no ember).
   - v14 turned items off with a per-calendar `disabledFixed` list. That list is gone as live state: since the editable 설정 › 달력 설정 tab (see §6) everything lives in the shared `fixed-sched-v1` list, and old `disabledFixed` values are migrated once on first load / backup import.
2. **Both calendars extended to 2028.01**, with 2028-01-01 신정 added.
3. **출석 달력 특별 수업 (세부과목):** 기본 8과목 (보건·소방재난예방·노동인권·물리&작업·직업기초·훈련지원·특수체육·사회성훈련). Set per 직종 and date, by 교시 or whole day; separate from 강사.
   - Week/day cells: small bold label in the subject's color (`.sp`, inline style). Month cell: 특별 과목명 (each in its color) on one line (ellipsis).
   - Settings › 수업일 설정 › 특별 수업 tab; Excel 특별 수업 sheet.

**v13 (tags · completion · ranges)**
1. **Bare `!` means high priority.** `! 교육 증명서 제출` and `!교육…` at the start of the text both set high. A `!` glued to a word mid-title stays plain text. The `!` button toggles a leading `! `.
2. **Tags have no spaces.** Use `_` for multi-word tags. In chip editors (composer and detail), typing a space inserts `_`, and Enter or a comma commits the tag.
3. **Values look different, not just kinds:**
   - **Tag weight:** 강조 (tinted fill, solid outline, bold), 보통 (outline) and 참고 (dashed, muted), on top of the tag color. Defaults come from keyword lists and can be overridden in Settings › 태그.
   - **People:** `@나` is filled; other people are dashed.
   - **Dates:** shown by proximity (지남 / 오늘·내일 / 이번 주 / 이후).
   - **Calendar cells:** the checkbox ring or dash shows the tag weight.
4. **Settings › 태그** has per-tag color, weight, 완료 체크, rename (renaming to an existing tag merges) and delete, plus editable keyword lists.
5. **Settings › 입력** has the date and priority symbols, the priority words, the accepted date formats (incl. `/금`, `/다음주금`) and the display format. `#` and `@` are reserved and cannot be reassigned.
6. **Completion:** each item has `kind` task|event, decided by `needsDone()` (explicit kind → tag setting → 일정 keywords).
   - **Tasks:** show a checkbox on cells, range bars, day-modal and NEXT UP rows.
   - **Events:** have no checkbox and are never overdue or counted as 지연.
7. **Ranges:**
   - **On the grid:** `start~due` items draw as per-week lane bars across the grid, with ◂/▸ continuation, an end cap and `D+n`. They also appear in the day modal, the all-months modal and the wallpaper.
   - **Drag-select:** press and drag on empty grid cells (or Shift+arrows, then Enter) to open the composer with that range. The composer has a weekday mini calendar for range picking.
8. **Chip density:** `D+n` sits inside the chip, and the attachment button appears only on hover or focus.

9. **Small fixes:** the `TODAY` word hides when the cell header is under 120px (the circled number already marks today, so it no longer shows as `T…` beside the detail panel) *(v16에서 제거 — the word no longer exists)*. Holiday and custom-day labels carry a `title` for when they are cut off. Settings › 입력 symbols apply as you type, without needing to leave the field.

Tests: `tools/verify-{,quickadd-,ranges-,tokens-,settings-}*.js` (see each file header).

**v12 (on-device feedback)**
1. **Month arrows beside the title** (`‹ NOVEMBER › [오늘]`), in both the 업무 and 출석 calendars. A control sits next to the thing it changes.
2. **Proportions:** the hero is one compact band, and the 예시/필터 notices moved into the sub line. The grid fills the viewport with equal `1fr` rows, and no page scroll is forced on load. `fitChips()` shows as many chips as fit the cell height, and `+N개 더` moves next to the day number so it doesn't take up a chip row. Setting `previewCap` (default 자동). NEXT UP is below the fold, reached via the rail link `다가오는 마감`. The urgent pill can use the full cell width.
3. **Quick-add:**
   - Inline tokens (`#` `@` `!` `/date`) are highlighted as pills inside the input, using a mirror layer.
   - The hint line shows the parse result as chips.
   - New `/` date syntax: `/2026-11-12`, `/11-12`, `/11-12~12-25` (a range sets `start` and `due`).
   - Dropping files on the bar, the `⤢` button, or Shift+Enter opens a composer popup (title, 시작일/기한, tag and assignee chips with suggestions, 중요도, 메모, links). Verify with `node tools/verify-quickadd.js <dir>`.

**v11 (출석 달력)** — 업무/출석 mode switch; 2027.12 range + 2027 H2 holidays; attendance module (학생부·직종·외부강사·수업일 명부·교시 시간), month/week/day views with drag period selection, 50%/3회 rules, analysis modal, offline xlsx export, JSON backup; rail month list tightened to fit 14 months.

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

## 13. 보기 필터 · 쉬는 날 · 미리 알림 (v18)

- **보기 필터 (전체 / 업무 / 출석)**: 레일의 라디오 3개 (`cal-mode` = `all|admin|att`, 처음 쓰면 전체). 업무 = 업무 달력, 출석 = 출석 달력(기존 화면), **전체 = 업무 달력 칸 위에 출석 한 줄(`.al`)**: `수업 N교시`·출결 배지·수업 없음 이유 칩. 줄을 누르면 출석 날 모달(`#aov`), 칸의 나머지는 업무 날 모달. 전체에선 레일에 `출석` 묶음(학생부·출결 분석·엑셀·달력·날짜 설정). 보던 달은 세 보기가 공유(출석 범위 밖이면 2026.12).
- **저장소**: (백업은 위 '모든 데이터 백업' 참고) `weekday-cal-v1`(업무) · `attend-cal-v1`(출석)은 그대로, 공유 키 `fixed-sched-v1`(방학·휴업일) · `hol-off-v1`(끈 법정 공휴일, 두 달력 공용). 업무 달력은 출석 데이터를 직접 읽지 않고 `window.KR_ATT.dayLine/openDay/open` 만 쓴다. 공휴일을 바꾸면 출석 캐시(`SC`)도 비운다. 하나로 합치지 않은 이유: 동기 로드, 각각의 검증(`normalize`/`normA`), 칸 하나 토글에 전체를 다시 쓰지 않으려고.
- **쉬는 날은 회색**: 공휴일·방학·개별학습·휴업일·지정일(칸 칠하기)은 모두 같은 어두운 면(`--hol-bg` = 배경 55%)과 흐린 날짜 숫자. 이유는 **칩**(`.rchip`: 지정 색 점 + 테두리, 글자는 `--muted`)으로 보이고, 방학·휴업일의 색은 출석의 종류 색을 따른다. 주황(ember)은 지연·오류만.
- **미리 알림**: 항목마다 `rem`(기한 N일 전, 0=당일). 그날 한 번만 카드(`#rem`)로 알리고 `확인`하거나 완료하면 끝. 칸 최소 높이는 176px(전체 보기는 +24px).
- **세그먼트 컨트롤**: 보기 4개 이하·짧은 `<select>`는 자동으로 `.seg.sc`로 바뀐다(원래 select는 숨김, 같은 change 이벤트).
- **모든 데이터 백업 (v2)**: 업무 설정 › 백업·데이터 와 출석 백업 창이 같은 파일 `달력-백업-YYYY-MM-DD.json` = `{format:'mycal',v:2,saved,work,att,shared:{fixed,holOff}}` 을 내보내고, 불러오기는 v2 · 예전 업무(`items`) · 예전 출석(`students`) 백업을 모두 받는다. 파일을 읽으면(`window.KR_BACKUP.parse`, 쓰기 없음) `normalize`·`normA`·`normFixed` 로 전부 검증하고, 고르기(업무 / 출석 / 공통 설정 체크박스, 파일에 든 것만 켜짐) 뒤 `apply` 가 네 키(`weekday-cal-v1`·`attend-cal-v1`·`fixed-sched-v1`·`hol-off-v1`)를 한꺼번에 쓴다. 하나라도 `setItem` 이 실패하면 예전 문자열로 되돌리고 오류만 보인다. 예전 파일의 `disabledHol`(비어 있지 않을 때)은 끈 공휴일로 복원, `fixed`/`disabledFixed` 는 `KR_FX.parse`. 8MB 넘는 파일은 거부. 검증: `node tools/verify-backup.js`.
- 남은 일: 업무 지정일의 '수업 없음' 반영, 배경화면에 출석 줄 넣기.
