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
- Given the files tab, when the analyst opens an uploaded file (manual or P&ID), then a preview opens on the same page, and can be closed. Files that are not uploaded cannot be opened and are marked as such.
- Given an asset with no linked time series, work orders or files, then the matching section shows an empty state that names what is missing.
- Given a search with no matches, then the app shows a "no results" state.
- Given any section fails to load, then only that section shows an error with a retry. The other sections still render.
- Given the analyst reloads the page or opens a shared link, then the same search query, selected asset, selected time series, active tab and open file are restored. Malformed saved state is ignored.
- Given the time series data refreshes automatically and a refresh fails, then the last good chart stays on screen.

## Requirements

### Functional Requirements

- FR-001: System MUST let the user search assets by tag, name and description (full-text search over `CogniteAsset`) as type-ahead with a short debounce, keeping CDF's result order. Because the SDK search request has no `operator` field, the app MUST itself drop results that do not contain every typed word (case-insensitive), so behaviour is the same before and after the API's default operator changes from `OR` to `AND` in November 2026.
- FR-002: System MUST show an asset detail view for the selected asset, with name, description, parent, and asset class and type when present.
- FR-003: System MUST list time series related to the selected asset and chart the selected time series (`numeric` type; `state` and `string` types are shown as latest value only). The chart window is the 24 hours ending at the series' latest datapoint, not at the current time, because the target project's data is historical. The UI MUST state where the window ends. For live series the latest datapoint is about now, so behaviour is unchanged.
- FR-004: System MUST show the unit of each time series (`unit`, falling back to `sourceUnit`).
- FR-005: System MUST list the selected asset's recent activities (`CogniteActivity`, used as the work-order equivalent in the core data model) with name, description and scheduled and actual start and end times, ordered most recent first.
- FR-006: System MUST list files related to the selected asset in a table and open a selected, uploaded file in an in-app preview, with an explicit Open button per row (keyboard accessible).
- FR-007: System MUST show loading, empty and error states independently for each section (asset header, time series, activities, files), with a retry on errors.
- FR-008: System MUST sync the search query, selected asset, selected time series, open file and active tab to the host with `syncInternalState`, and restore them from `initialState` on load, tolerating malformed state field by field.
- FR-009: System MUST be read-only. It does not write to CDF.
- FR-010: System MUST get auth, base URL and project from the host (`connectToHostApp`, `CogniteSdkProvider`) and MUST NOT hardcode them.
- FR-011: System MUST query only standard Cognite Core Data Model views in the `cdf_cdm` space (no `cdf_idm` or custom views).
- FR-012: System MUST refresh the charted series every 30 seconds while the page is visible, and keep the last good data if a refresh fails.
- FR-013: System MUST build its UI from Aura components: type-ahead asset search from Aura's Popover and Command (Aura's Combobox only filters a fixed list on the client), Combobox for the time series picker, DataGrid tables, Tabs, the Aura chart, Badge, Button, EmptyState, Skeleton and Alert.

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
- ~~"Live" time series~~ Resolved: the chart is anchored to each series' latest datapoint (the project holds static demo data), and it still re-fetches every 30 seconds while the page is visible, which only changes anything for live series.
- Lists read one page of up to 100 items with no pagination. Activities are sorted newest first locally, so "most recent 25" means the most recent 25 of the first 100 returned. Asset search takes 50 results before the local AND filter. Confirm against real data, and add server-side sorting or paging if needed.
- `CogniteUnit.symbol` is assumed from the docs' nested-filter table, and has not been seen in real data.
- Does the app CSP (`manifest.json` has `network: []`) allow file download and preview URLs? Not yet tried in Fusion.
- The vendored file viewer (`src/cognite-file-viewer/`) is excluded from lint and test coverage. The review rules list only tests, type declarations, `main.tsx` and generated code as allowed coverage exclusions, so a reviewer may disagree. Own-code line coverage is 95%; with the viewer counted it would be 38%.
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
| `cdf_cdm.CogniteFile:v1` | Document list and viewer | `name`, `description`, `mimeType`, `directory`, `isUploaded`, `category`, `assets` (direct relation list to the asset) |
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
