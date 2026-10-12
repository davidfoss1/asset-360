# File inventory: Asset 360, round 3

Reviewed commit `3c89a3ada1512b7525b1b568d550995fc2bb200f`, branch `feat/asset-360-investigation-workspace`.

Scope: every `.ts` / `.tsx` under `src/` except `*.test.*` and `*.d.ts`: 47 files, of which 5 are test helpers in `src/__mocks__/` and 1 is `src/main.tsx` (bootstrap). The other 41 are production modules. There are 37 test files. Config: `vitest.config.ts`, `vite.config.ts`. No `jest.config.*`.

Read depth: each file was checked by the hunt searches in `review-findings.md`. Files marked **read** were opened for this review; the rest were covered by the searches and by the coverage report, not opened line by line. This is a gap in the process, recorded under "Limits" in the report.

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| src/App.tsx | 115 | ok | ok | context + ErrorBoundary (last resort) | App.test.tsx | read |
| src/main.tsx | 24 | bootstrap | ok | QueryClient defaults | exempt | bootstrap only |
| src/__mocks__/nodes.ts | 30 | test helper | ok | factories | n/a | test helper in src tree (counted in coverage) |
| src/__mocks__/stubChartSize.ts | 30 | test helper | ok | stubs | n/a | test helper |
| src/__mocks__/stubLayout.ts | 14 | test helper | ok | stubs | n/a | test helper |
| src/__mocks__/taskRunner.ts | 14 | test helper | ok | fake runners | n/a | test helper |
| src/__mocks__/viewModelWrapper.tsx | 63 | test helper | ok | context wrapper | n/a | 38% lines covered; counted in coverage |
| src/components/ErrorBoundary.tsx | 44 | class component | ok | resetKey | ErrorBoundary.test.tsx | read |
| src/components/LoadMore.tsx | 25 | presentational | ok | props | LoadMore.test.tsx | |
| src/components/SectionState.tsx | 53 | presentational | ok | props | SectionState.test.tsx | |
| src/config/model.ts | 28 | constants | ok | | model.test.ts | |
| src/deps/AppDepsContext.ts | 18 | context | ok | DI | none | trivial context object |
| src/deps/AppDepsProvider.tsx | 21 | provider | ok | DI | useAppDeps.test.tsx | |
| src/deps/createAppDeps.ts | 32 | composition root | ok | MAX_CONCURRENT_REQUESTS = 4 | createAppDeps.test.ts | read |
| src/deps/useAppDeps.ts | 9 | hook | ok | context read | useAppDeps.test.tsx | |
| src/features/activities/ActivitiesSection.tsx | 87 | view | ok | | ActivitiesSection.test.tsx | |
| src/features/activities/ActivityDetail.tsx | 47 | view | ok | | ActivityDetail.test.tsx | |
| src/features/activities/activityColumns.ts | 58 | pure | ok | | activityColumns.test.ts | |
| src/features/activities/useActivitiesViewModel.ts | 69 | ViewModel | ok | useInfiniteQuery, growing limit | useActivitiesViewModel.test.tsx | read |
| src/features/asset/AssetHeader.tsx | 31 | view | ok | | AssetHeader.test.tsx | |
| src/features/asset/useAssetViewModel.ts | 31 | ViewModel | ok | useQuery | useAssetViewModel.test.tsx | |
| src/features/files/FilePreview.tsx | 42 | view | ok | | FilePreview.test.tsx | |
| src/features/files/FilesSection.tsx | 85 | view | ok | | FilesSection.test.tsx | |
| src/features/files/previewKind.ts | 14 | pure | ok | | previewKind.test.ts | |
| src/features/files/useFilePreviewViewModel.ts | 41 | ViewModel | ok | useQuery, staleTime | useFilePreviewViewModel.test.tsx | |
| src/features/files/useFilesViewModel.ts | 61 | ViewModel | ok | useInfiniteQuery, cursor | useFilesViewModel.test.tsx | |
| src/features/search/AssetSearch.tsx | 116 | view | ok | Popover + Command | AssetSearch.test.tsx | useEffect has cleanup |
| src/features/search/useSearchViewModel.ts | 42 | ViewModel | ok | useQuery | useSearchViewModel.test.tsx | |
| src/features/timeseries/TimeSeriesChart.tsx | 46 | view | ok | | TimeSeriesChart.test.tsx | |
| src/features/timeseries/TimeSeriesSection.tsx | 107 | view | ok | | TimeSeriesSection.test.tsx | |
| src/features/timeseries/summarize.ts | 19 | pure | ok | | summarize.test.ts | |
| src/features/timeseries/timeTicks.ts | 53 | pure | ok | | timeTicks.test.ts | |
| src/features/timeseries/useTimeSeriesViewModel.ts | 104 | ViewModel | ok | two useQuery | useTimeSeriesViewModel.test.tsx | |
| src/features/workspace/AssetWorkspace.tsx | 67 | view | ok | ErrorBoundary per section | AssetWorkspace.test.tsx | read |
| src/lib/format.ts | 18 | pure | ok | | format.test.ts | |
| src/lib/loadStatus.ts | 18 | pure | ok | | loadStatus.test.ts | |
| src/lib/properties.ts | 35 | pure | ok | | properties.test.ts | |
| src/lib/taskRunner.ts | 32 | pure factory | ok | queue, cap | taskRunner.test.ts | read |
| src/lib/useElementWidth.ts | 23 | hook | ok | ResizeObserver with cleanup | useElementWidth.test.tsx | useEffect has cleanup |
| src/services/AssetService.ts | 125 | service | ok | interface + class, `run` injected | AssetService.test.ts | read |
| src/services/DatapointsService.ts | 68 | service | ok | interface + class, `run` injected | DatapointsService.test.ts | |
| src/services/FileDownloadService.ts | 30 | service | ok | interface + class, `run` injected | FileDownloadService.test.ts | |
| src/services/RelatedDataService.ts | 200 | service | ok | interface + class, `run` injected | RelatedDataService.test.ts | read; largest file, not a component |
| src/state/AppStateContext.ts | 21 | context | ok | | none | trivial context object |
| src/state/AppStateProvider.tsx | 50 | provider | `update` builds from last render's state | host sync | AppStateProvider.test.tsx | read; see Nice N1 |
| src/state/appState.ts | 52 | pure | ok | serialise / parse | appState.test.ts | |
| src/state/useAppState.ts | 9 | hook | ok | context read | covered by provider tests | |

Component size: the largest `.tsx` production file is `src/features/search/AssetSearch.tsx` at 116 lines, under the 150-line bar. `RelatedDataService.ts` (200 lines) is a service, not a component, so the component-size bar does not apply to it.

Test pairing: 37 test files. Production files without a same-named test are `AppDepsContext.ts`, `AppStateContext.ts` (context objects with no logic), `main.tsx` (exempt), and `useAppState.ts` (covered by provider tests). View models are tested by `*.test.tsx` beside `*.ts`, so they are paired by hand here.
