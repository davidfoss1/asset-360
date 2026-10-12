# Design Review — Asset 360 — round 1

Reviewed commit `a93251a6259fc5d8fe15491b55d06c59e64fe3ba`, branch `feat/asset-360-investigation-workspace`. Scores were proposed from probes of the repo and a build, then confirmed or overridden by the owner (David Foss). Q4 and Q7 were first confirmed at 3, then re-scored after the fixes listed below.

## User and tasks

- **Primary user:** Operations Analyst or Reliability Engineer at an industrial facility, working at a desk on a desktop or laptop with a large monitor, investigating a flagged asset. The brief records this as an assumption, with no user interviews (`App-Brief.md`).
- **Tasks evaluated:**
  1. Find an asset by tag and confirm it is the right one.
  2. Check the asset's time series: values and trend.
  3. Review recent activities and open a related file (manual or P&ID).
- **Context:** desktop-first; success is all of it on one page in under 10 minutes (down from 1-2 hours).

## Task walkthrough findings

The owner used the app in Fusion with the `publicdatacdm` project throughout the build and reported what they found; each finding below was fixed afterwards. No timing was recorded.

- **Task 1 — find the asset.** Walked. Findings, all fixed: the search hint "Showing the first matches only" appeared when all results were shown; a typed search stayed in the box after closing and reopening; the dropdown with the search box was centred under the wide button instead of aligned with it.
- **Task 2 — time series.** Walked. Findings, all fixed: the Refresh button gave no feedback at all (it now spins, shows when the data was updated, and says if a refresh failed); the time axis labels fell on odd minutes such as 05:46 (now round times, a label every 4 hours, with the date at midnight). **Not walkable:** switching series, because no asset in the project has several time series.
- **Task 3 — activities and files.** Walked for activities. Findings, all fixed: sorting a date column gave alphabetical order (Dec before Sep) with undated rows jumping between top and bottom; the activities table was uneven, with dates cut off; the empty state sat tight against the tabs; names and descriptions could not be read in full (rows now open a detail view, with its Back button at the top right); the table was not responsive and scrolled sideways in a narrow card (it now drops columns to fit). **Not walkable:** opening a file, because no asset in the project has files. The inline image preview, opening a PDF in a new tab, and the signed-URL host under `img-src` are therefore **unverified against real data**.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 4 | 13 production files import Aura; 0 hard-coded colours and 0 lint messages, including `aura/no-overriding-styles`. A few hand-set heading and text classes, and the asset search is a Popover plus Command composition because Aura's Combobox cannot search the server. | Use Aura typography for headings and text; give the Files table explicit column widths (TanStack's 150px default stretches its last column). |
| Q2 Navigation & hierarchy | 4 | One page in a clear order: title, search, asset header, time series, then tabs. No problems reported in the walkthrough. No breadcrumb or other location cue beyond the asset header. | Consider a visible sense of which asset is open when scrolled, and spacing between the tabs and their content. |
| Q3 Labels & language | 5 | 0 vague labels; actions read "Load more", "Back to activities", "Refresh", "Open <file>", "Try again". Every input, grid and picker has a label. | None. |
| Q4 Feedback & validation | 4 | Skeleton, error with Retry and empty state in every section; Refresh shows progress, the update time and a failed-refresh message, keeping the last good chart; Load more shows loading and failure; error boundaries contain render errors; the search hint appears only when results may be cut off. Read-only, so there are no forms to validate. Still silent: the 500 activities and 1000 time series caps. | Say when a cap is reached. |
| Q5 Clickability | 5 | 0 `onClick` on non-buttons. Activity rows are clickable and keyboard-operable with a hint line above them; file rows have an explicit Open button. Hover and focus styles come from Aura. | None. |
| Q6 Error prevention | 5 | The app is read-only (FR-009) and has no destructive actions, so this scores 5 by default. | None. |
| Q7 Responsive | 4 | Desktop-first per the brief. The activities table now measures itself and shows five, three or two columns at about 1300, 820 and 520px (checked in a browser at those widths), with dates on one line each time. The rest of the page reflows. The Files table is still fixed at about 750px and was not checked narrower. | Make the Files table responsive the same way; check the whole page at narrow widths. |
| Q8 Empty states | 4 | Every section has one, with spacing added after the owner flagged it, and the Files one was seen. Most give a title only, with no next step, and "No time series for this asset" sat visibly off to the side in browser screenshots. | Add a next step to each empty state; fix the time series empty state alignment. |
| Q9 Performance | 4 | 329 KB gzipped for the JavaScript and 24 KB for the CSS; grids are virtualised, every list has a limit, nothing polls and requests are capped at 4 at a time. No code-splitting, and the activities Load more refetches the whole list. | Split the bundle (1.07 MB before compression); page activities without refetching. |
| Q10 Accessibility | 4 | The one `<img>` has `alt`; icons are `aria-hidden` next to text labels; grids, the chart, the pickers and the preview are labelled; loading and refresh results are announced through live regions; focus styles come from Aura. **Text contrast was not checked and no axe scan was run.** | Run axe in the running app and fix any contrast findings. |

## Summary

- Average score: 4.3
- Quality level: Good — launch with minor fixes

Meets the `flows-external-app-submit` gate (4.3 ≥ 3.8).

## Must Fix (any score < 3)

- None.

## Should Fix (any score 3 – 3.7)

- None.

## Nice to Fix (any score 3.8 – 4.4)

- Q10: run an axe scan in the running app, and fix any contrast findings. Contrast is unchecked.
- Q8: add a next step to each empty state, and fix the alignment of the time series empty state.
- Q7: make the Files table responsive the same way as the activities table, and check the full page at narrow widths.
- Q9: split the 1.07 MB bundle, and avoid refetching all activities on Load more.
- Q4: say when the 500-activity and 1000-time-series caps are reached.
- Q1: use Aura typography instead of hand-set text classes; size the Files table columns.
- Q2: add spacing between the tabs and their content, and a clearer sense of the open asset.

## Known gaps in this review

- **Not walkable with the project's data:** opening files (none are linked to any asset) and switching time series (none has several). The file preview and the CSP `img-src` rule have never run against real data.
- **Not measured:** colour contrast, and any layout below the widths listed under Q7.
- The Fusion walkthrough was done by one person, incrementally during the build, and no task timing was recorded.
