# Feature Specification: Asset 360

<!--
  This is your app's living product spec. Edit it directly or ask your coding
  agent to collaborate with you on it.
-->

Source: `App-Brief.md`. Data model details checked against Cognite Docs (core data model and process industries data model reference pages).

## User Scenarios & Testing

### User Stories

1. As an Operations Analyst, I want to search for a specific piece of equipment and instantly see its connected time series data, recent work orders, and related documents in one unified view, so that I can quickly understand its status without switching between five different systems.

**Persona:** Operations Analyst or Reliability Engineer at an industrial facility. Desk-based, occasionally in the control room, on a desktop or laptop with a large monitor. Investigates equipment flagged by shift reports or alarms (e.g. PUMP-101) and briefs the maintenance team.

### Acceptance Scenarios

- Given the app is open, when the analyst types an equipment tag (e.g. "PUMP-101") into the asset search, then after a short pause matching assets are listed with name and description, in the order CDF ranks them. Only assets matching every typed word are shown.
- Given a list of search results, when the analyst selects an asset, then one page shows the asset's header, its time series chart, and tabs for activities (work orders) and files.
- Given an asset has several time series, when the analyst picks another from the time series picker, then the chart switches to it.
- Given an asset detail page, when it loads, then recent activities (work orders) for the asset are listed, most recent first.
- Given an asset detail page, when it loads, then a chart of one of the asset's numeric time series shows the 24 hours up to that series' latest datapoint, and says which date it ends at.
- Given the files tab, when the analyst opens an uploaded image, then it is shown inline on the same page, and the preview can be closed.
- Given the files tab, when the analyst opens an uploaded PDF or any other non-image file, then the preview offers an "Open in new tab" action that opens the file in a new browser tab. Files that are not uploaded cannot be opened and are marked as such.
- Given an image cannot be drawn inline, then the preview says so and still offers "Open in new tab".
- Given an asset with no linked time series, work orders or files, then the matching section shows an empty state that names what is missing.
- Given a search with no matches, then the app shows a "no results" state.
- Given any section fails to load, then only that section shows an error with a retry. The other sections still render.
- Given the analyst reloads the page or opens a shared link, then the same search query, selected asset, selected time series, active tab and open file are restored. Malformed saved state is ignored.
- Given the time series chart is showing, then it does not refetch on its own; the analyst presses Refresh to fetch the data again. If a refresh fails, the last good chart stays on screen.

## Requirements

### Functional Requirements

- FR-001: System MUST let the user search assets by tag, name and description (full-text search over `CogniteAsset`) as type-ahead with a short debounce, keeping CDF's result order. The search box opens empty: closing the list (click away, Escape or choosing an asset) discards what was typed and the saved query, while the button keeps showing the selected asset's name. Because the SDK search request has no `operator` field, the app MUST itself drop results that do not contain every typed word (case-insensitive), so behaviour is the same before and after the API's default operator changes from `OR` to `AND` in November 2026. The API returns at most 50 results and the SDK's search cannot page, so when it returns that many and every one of them matches all the typed words, the list MUST say the results may be cut short and ask the user to refine the search. When the app's own filter dropped some of the 50, the list MUST NOT say it, because the API ranks by relevance and the full matches have then already run out (an assumption: unverified against real data).
- FR-002: System MUST show an asset detail view for the selected asset, with name, description, parent, and asset class and type when present.
- FR-003: System MUST list time series related to the selected asset and chart the selected time series (`numeric` type; `state` and `string` types are shown as latest value only). The chart window is the 24 hours ending at the series' latest datapoint, not at the current time, because the target project's data is historical. The UI MUST state where the window ends. For live series the latest datapoint is about now, so behaviour is unchanged. The picker lists all of the asset's time series, following cursors up to 1000, because it cannot load more on demand. The chart's time axis always covers the whole 24-hour window and is labelled with at most seven round clock times in the browser's timezone (every 4 hours for the 24-hour window, e.g. 4:00 PM, 8:00 PM), never an odd minute, with the mark at midnight shown as the date (e.g. "Sep 2") so the day change is visible.
- FR-004: System MUST show the unit of each time series (`unit`, falling back to `sourceUnit`).
- FR-005: System MUST list the selected asset's recent activities (`CogniteActivity`, used as the work-order equivalent in the core data model) with name, description and scheduled and actual start and end times, ordered most recent first (by start time, then scheduled start time, undated last). The API does the ordering, so the first rows are always the newest. The table shows 25 and a "Load more" button adds 25 at a time, up to 500, by asking the API again for a larger limit (DMS cannot page a custom sort without a cursorable index, and the target project has none). The table fits the width it is given and the date columns always show a date and time on one line: with room it shows Name, Description, Scheduled start, Started and Ended (Name and Description share what the dates leave); below about 990px it drops Description and Scheduled start; below about 600px it keeps only Name and Started. Long names and descriptions are cut off in the table, and opening an activity shows every field whatever the width. Clicking a row (or pressing Enter on it) replaces the table with the activity in full: complete name and description, and scheduled and actual start and end. A "Back to activities" button returns to the table. An activity restored from a link is shown once it is among the loaded rows. The date columns sort by time, with undated activities last in both directions.
- FR-006: System MUST list files related to the selected asset in a table, with an explicit Open button per row (keyboard accessible). Files load 50 at a time with a cursor behind a "Load more" button; a file restored from a link is opened once its page has loaded. Opening an uploaded file shows images inline and offers an "Open in new tab" action for every file; PDFs and other types open only in a new browser tab, because the app's Content Security Policy (`frame-src 'self'`, `object-src 'none'`) does not allow framing them. The download link is a short-lived signed URL fetched with `files.getDownloadUrls` by instance id, and `manifest.json` allows `https://*.cognitedata.com` for `img-src` so inline images can load.
- FR-007: System MUST show loading, empty and error states independently for each section (asset header, time series, activities, files), with a retry on errors. A failure to load more rows MUST keep the rows already shown and say so. A crash while rendering one section MUST NOT blank the page: each section has an error boundary with a "Try again" action that also resets when another asset is selected, and one more around the whole app is the last resort.
- FR-008: System MUST sync the search query, selected asset, selected time series, open file, open activity and active tab to the host with `syncInternalState`, and restore them from `initialState` on load, tolerating malformed state field by field.
- FR-009: System MUST be read-only. It does not write to CDF.
- FR-010: System MUST get auth, base URL and project from the host (`connectToHostApp`, `CogniteSdkProvider`) and MUST NOT hardcode them.
- FR-011: System MUST query only standard Cognite Core Data Model views in the `cdf_cdm` space (no `cdf_idm` or custom views).
- FR-012: System MUST NOT poll. The charted series is fetched when selected and again only when the analyst presses Refresh, and the last good data MUST stay on screen if a refresh fails. Refresh MUST give feedback: the button shows it is refreshing and is disabled meanwhile, a status line says when the data was last updated (to the minute), and if a refresh fails it says so and when the shown data is from.
- FR-013: System MUST build its UI from Aura components: type-ahead asset search from Aura's Popover and Command (Aura's Combobox only filters a fixed list on the client), Combobox for the time series picker, DataGrid tables, Tabs, the Aura chart, Badge, Button, EmptyState, Skeleton and Alert.
- FR-014: System MUST NOT have more than 4 CDF requests in flight at once. A selection fans out to about eight requests, so all services share one queue that runs the rest as slots free up, in the order they were requested.

### Out of scope for v1

- Writing or editing any CDF data.
- Alarm or shift-report ingestion. The analyst arrives with a tag already in hand.
- Mobile layouts.

## Success Criteria

- SC-001: An analyst can search an equipment tag, view its time series, and open a related file on one page in under 10 minutes total, down from 1-2 hours today. Measured in UAT with timed walk-throughs.
- SC-002: The search, asset selection, chart and file open path completes without leaving the asset detail page (zero navigations to other apps).

## Clarifications

Still open, because nothing has run against live `publicdatacdm` data yet:

- Does the target project (`publicdatacdm`, per `app.json`) populate `CogniteActivity`, `CogniteTimeSeries` and `CogniteFile` with instances linked to assets? The views follow the Cognite-documented core data model and must be confirmed against the project.
- `CogniteActivity` has no status, priority or type property (those belong to `CogniteMaintenanceOrder` in `cdf_idm`). Are name, description and start and end times enough for the analyst's "recent work orders" need, or should the app later read the process industries view?
- Are time series datapoints retrievable for data-modeling time series by `instanceId` in this project? Confirm the datapoints and file download calls use instance ids, not legacy numeric ids.
- ~~"Live" time series~~ Resolved: the chart is anchored to each series' latest datapoint (the project holds static demo data) and refreshes only when the analyst presses Refresh, with no polling.
- Activities are sorted by the API on `startTime` then `scheduledStartTime` (descending, nulls last). Unverified against real data: that DMS accepts this sort without a cursorable index (it sorts in memory), and how it performs for an asset with hundreds of activities. Activities that never started sort after all started ones, so a future scheduled activity is no longer at the top as it was with the old local sort. "Load more" stops at 500.
- Files page with a cursor and no sort; the order is whatever DMS returns. A saved open file that is not on a loaded page is not shown until Load more reaches it.
- Time series stop at 1000 per asset, and asset search at 50 results; both are silent past those caps except for the search hint.
- The limit of 4 concurrent requests is a guess at a safe value; there is still no 429 or `Retry-After` handling beyond react-query's default retries.
- `CogniteUnit.symbol` is assumed from the docs' nested-filter table, and has not been seen in real data.
- Inline image preview depends on the signed download URL being served from a host under `https://*.cognitedata.com` (allowed in `img-src` via `manifest.json`). If a project serves files from another host, the image falls back to "Open in new tab" and that host would need adding to `img-src`. Not yet tried in Fusion.
- The main JavaScript bundle is about 1.06 MB (328 kB gzipped). Not yet investigated.
- The brief's story says "five different systems", but the problem names three (SAP, historian, SharePoint). Reconcile.

## Assumptions

- The analyst already knows the equipment tag when they open the app.
- Equipment is represented as `CogniteAsset` (functional location or tag). `CogniteEquipment` is not searched separately in v1.
- Users have `datamodelinstances` read access. The docs list this as the only ACL needed to read `CogniteFile` in the core data model. Reading datapoints may need `timeseries:read` as well; confirm.
- No user interviews yet. The need is an informed assumption (see `App-Brief.md`, `userEvidence`).
- Tier 1 (Monitoring & reporting), so read-only is acceptable.
- The demo project's time series are historical, so charts anchor to each series' latest datapoint (see FR-003).

---

## Data Models & CDF Integration *(mandatory)*

Reads only. All identifiers go in one `config/model.ts`, per the Flows architecture best practices, not scattered as literals.

### Existing views

Format: `<space>.<view>:<version>`.

| View | Used for | Properties read |
| --- | --- | --- |
| `cdf_cdm.CogniteAsset:v1` | Search and detail | `name`, `description`, `tags`, `aliases`, `parent`, `assetClass`, `type`, `path`. Reverse relations `timeSeries`, `files` and `activities` can drive the related lists. |
| `cdf_cdm.CogniteTimeSeries:v1` | Time series list and chart | `name`, `description`, `type` (`numeric`, `string`, `state`), `isStep`, `unit`, `sourceUnit`, `assets` (direct relation list to the asset) |
| `cdf_cdm.CogniteFile:v1` | Document list and preview | `name`, `description`, `mimeType`, `directory`, `isUploaded`, `category`, `assets` (direct relation list to the asset) |
| `cdf_cdm.CogniteAssetClass:v1`, `cdf_cdm.CogniteAssetType:v1` | Asset header | `name`, to show the asset's class and type |
| `cdf_cdm.CogniteUnit:v1` | Time series units | `symbol` (falling back to `name`), resolved in one batched lookup per list |
| `cdf_cdm.CogniteActivity:v1` | Activities (work-order equivalent) | `name`, `description`, `assets` (direct relation list to the asset), `equipment`, `timeSeries`, plus `CogniteSchedulable` fields: `startTime`, `endTime`, `scheduledStartTime`, `scheduledEndTime` |

Notes from the docs:

- `CogniteAsset.timeSeries`, `CogniteAsset.files` and `CogniteAsset.activities` are reverse direct relations of `CogniteTimeSeries.assets`, `CogniteFile.assets` and `CogniteActivity.assets`.
- `CogniteActivity` is the core-model concept for work done over a period. The maintenance order view (`cdf_idm.CogniteMaintenanceOrder`) implements it and adds `mainAsset`, `type`, `status` and `priority`, but it is outside `cdf_cdm` and not used in v1.
- Search supports nested filtering on `assets.path` for activities, time series and files. This lets the app include descendants of a selected asset in a later version.
- The default search operator changes from `OR` to `AND` in November 2026. The SDK's search request cannot set it, so the app filters results to those containing every typed word (FR-001).
- `CogniteFile` access control uses the `datamodelinstances` ACL.
- Queries for a selected asset's related data use the `cdf_cdm` views only, keeping the app portable across projects that follow the standard core data model.

### New views

None. The app is read-only and creates no data model.

### Spaces

- `cdf_cdm`: Cognite core data model system space (asset, asset class and type, unit, activity, time series, file views). The only space whose views the app queries.
- Instance data lives in the project's own instance spaces. Their names are not known yet (see Clarifications). The app queries by view, so instance spaces do not need to be hardcoded.
